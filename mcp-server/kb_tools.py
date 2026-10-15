"""The text the MCP tools return, built from a kb_index.Index (FreekMencke/claude-kb#112).

Plain text with entry IDs everywhere, so an answer can cite them, and a `corpus: <commit>` line last. Results land in
the caller's context, so they're capped and say what was cut. A bad argument raises ToolError, which FastMCP returns
as `isError: true` with the message; the message says what to pass instead.
"""

from __future__ import annotations

import difflib
import re
from datetime import UTC, date, datetime

from fastmcp.exceptions import ToolError

from kb_index import INDEX_TOPIC, Entry, Index, normal_id

TYPES = ("fact", "pattern", "recommendation", "anti-pattern", "tool", "comparison")
SEARCH_LIMIT = (1, 20)
GET_IDS = (1, 10)
# kb_search's 8 hits come to about 3 KB; this only bites at a high limit with long titles
SEARCH_MAX_CHARS = 8_000
# About 10,000 tokens, where Claude Code starts warning about large MCP output (its hard cap is 25,000). Ten of the
# longest entries came to 28,000 characters on 2026-10-15.
GET_MAX_CHARS = 40_000
# INDEX.md's "treat an entry last verified more than 60 days ago as a lead to re-check"
STALE_DAYS = 60
SEPARATOR = "\n\n---\n\n"
ID_SHAPE = re.compile(r"[A-Za-z]+-\d+")

INSTRUCTIONS = (
    "claude-kb is a knowledge base on using Claude and Claude Code efficiently. Search with kb_search, then kb_get the"
    " 1 to 4 best IDs for the full entries. Cite entry IDs (such as MCP-017) in answers. Check an entry last verified"
    f" more than {STALE_DAYS} days ago against its sources before relying on it."
)


def _loaded(index: Index | None) -> Index:
    if index is None:
        raise ToolError("The knowledge base hasn't loaded yet: try again in a minute.")
    return index


def _corpus(index: Index) -> str:
    return f"corpus: {index.commit}"


def _topic_list(index: Index) -> str:
    prefixes = {e.topic: e.id.split("-")[0] for e in index.entries.values()}
    return "\n".join(f"- {t} ({prefixes.get(t, '?')}): {title}" for t, title in index.topics.items())


def _resolve_topic(index: Index, topic: str | None) -> str | None:
    if topic is None or not topic.strip():
        return None
    if (name := index.topic(topic)) is None:
        raise ToolError(f"Unknown topic {topic!r}. Pass one of these names or prefixes:\n{_topic_list(index)}")
    return name


def _age(entry: Entry, today: date) -> str:
    try:
        days = (today - date.fromisoformat(entry.last_verified)).days
    except ValueError:
        return ""
    return f", {days} days ago: check its sources" if days > STALE_DAYS else ""


def _hit_line(entry: Entry, today: date) -> str:
    merged = f", merged into {', '.join(entry.merged_into)}" if entry.merged_into else ""
    return (
        f"{entry.id}: {entry.title} ({entry.type}, {entry.confidence}, last verified {entry.last_verified}"
        f"{_age(entry, today)}{merged})"
    )


def search(
    index: Index | None, query: str, topic: str | None = None, type: str | None = None, limit: int = 8
) -> str:
    index = _loaded(index)
    if not query or not query.strip():
        raise ToolError("Pass a query: some words, a phrase, or entry IDs such as MCP-017.")
    if not SEARCH_LIMIT[0] <= limit <= SEARCH_LIMIT[1]:
        raise ToolError(f"Pass a limit from {SEARCH_LIMIT[0]} to {SEARCH_LIMIT[1]} (default 8).")
    if type is not None and type.strip() and type.strip() not in TYPES:
        raise ToolError(f"Unknown type {type!r}. Pass one of: {', '.join(TYPES)}; or leave it out.")
    topic = _resolve_topic(index, topic)
    hits = index.search(query, topic=topic, type=(type or "").strip() or None, limit=limit)
    if not hits:
        where = f" in topic {topic}" if topic else ""
        return (
            f"No entries match {query!r}{where}. Try other words, or kb_quick_answers for a topic's most-asked"
            f" questions. Topics:\n{_topic_list(index)}\n\n{_corpus(index)}"
        )
    today = datetime.now(UTC).date()
    blocks = [(h.entry.id, f"{_hit_line(h.entry, today)}\n{h.entry.summary}") for h in hits]
    kept = _fit(blocks, SEARCH_MAX_CHARS, "\n\n", "hits", "lower the limit or narrow the query")
    return "\n\n".join(kept + [_corpus(index)])


def get(index: Index | None, ids: list[str]) -> str:
    index = _loaded(index)
    ids = [i.strip() for i in ids if i and i.strip()]
    if not GET_IDS[0] <= len(ids) <= GET_IDS[1]:
        raise ToolError(f"Pass {GET_IDS[0]} to {GET_IDS[1]} entry IDs, such as [\"MCP-017\"]; got {len(ids)}.")
    found = index.get(ids)
    known = {e.id for e in found}
    # A merged entry is a pointer: add the entries it points to, after everything asked for
    targets = [t for e in found for t in index.get(list(e.merged_into)) if t.id not in known]
    entries = list(dict.fromkeys(found + targets))
    missing = [i for i in ids if not index.get([i])]
    notes = [_unknown(index, i) for i in missing]
    if not entries:
        raise ToolError("\n".join(notes))
    blocks = _fit([(e.id, e.body) for e in entries], GET_MAX_CHARS, SEPARATOR, "entries", "kb_get them separately")
    return SEPARATOR.join(blocks) + "\n\n" + "\n".join(notes + [_corpus(index)])


def _unknown(index: Index, asked: str) -> str:
    """A line for an ID that isn't in the KB, naming the nearest IDs (or, for words, the best search hits)."""
    if ID_SHAPE.fullmatch(asked):
        close = difflib.get_close_matches(normal_id(asked), index.entries.keys(), n=3, cutoff=0.6)
        nearest = [index.entries[i] for i in close]
    else:
        nearest = [h.entry for h in index.search(asked, limit=3)]
    if not nearest:
        return f"{asked}: no such entry. kb_search finds entries by words."
    return f"{asked}: no such entry. Closest: " + "; ".join(f"{e.id} ({e.title})" for e in nearest)


def quick_answers(index: Index | None, topic: str | None = None) -> str:
    index = _loaded(index)
    name = _resolve_topic(index, topic)
    if name is None:
        table = index.quick_answers.get(INDEX_TOPIC, "")
        return (
            f"# Quick answers across the knowledge base\n\n{table}\n\n"
            f"Each topic has its own (pass topic):\n{_topic_list(index)}\n\n{_corpus(index)}"
        )
    parts = [f"# {index.topics[name]}: Quick answers\n\n{index.quick_answers.get(name, '(none)')}"]
    if recs := index.recommendations.get(name):
        parts.append(f"## Recommendations for our setup (these go stale faster than the facts)\n\n{recs}")
    return "\n\n".join(parts + [_corpus(index)])


def _fit(blocks: list[tuple[str, str]], max_chars: int, joiner: str, what: str, advice: str) -> list[str]:
    """As many whole (ID, text) blocks as fit in max_chars, then a line naming the IDs cut: never a silent cut."""
    kept: list[str] = []
    size = 0
    for _, text in blocks:
        size += len(text) + len(joiner)
        if kept and size > max_chars:
            break
        kept.append(text)
    if cut := [eid for eid, _ in blocks[len(kept):]]:
        kept.append(f"({len(cut)} more {what} cut to keep this result small: {', '.join(cut)}; {advice}.)")
    return kept
