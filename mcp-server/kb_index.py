"""The knowledge base as an immutable, searchable index: entries parsed by check_kb.py, searched with SQLite FTS5.

`load(root)` reads `root/topics/kb-*.md` and `root/INDEX.md` from a checkout and returns an `Index`. Nothing changes an
Index after it's built: the server builds a new one in a background thread when git-sync moves to a new commit and
swaps it in, so a request never waits on a build (FreekMencke/claude-kb#111).

Search is the standard library's sqlite3 with FTS5 and bm25(), in memory: no search package. Python's sqlite3 has
FTS5 in the python:3.13 image and in Ubuntu's Python.
"""

from __future__ import annotations

import re
import sqlite3
import sys
import threading
import time
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

# In the image, check_kb.py sits next to this file; in the repo it's in ../scripts. One parser for the checker that CI
# runs and for the server, so they can't drift.
sys.path.append(str(Path(__file__).resolve().parent.parent / "scripts"))
import check_kb  # noqa: E402

INDEX_TOPIC = "index"
# Column weights for bm25(), in the FTS table's column order: id, title, tags, body. Tuned on tests/test_kb_index.py's
# Quick-answer questions; on 2026-10-15, 208 of all 253 Quick-answer questions found a cited entry in the top 5.
WEIGHTS = (10.0, 3.0, 2.0, 1.0)
SUMMARY_CHARS = 300
ID_IN_QUERY = re.compile(r"\b([A-Za-z]+-\d+)\b")
WORD = re.compile(r"\w+")
# Question words that match nearly every entry; left out so an OR query ranks on the words that carry meaning
STOPWORDS = frozenset(
    "a an and are as at be by can do does for from how i in is it its my of on or should so that the this to was what"
    " when where which who why will with you your".split()
)


@dataclass(frozen=True)
class Entry:
    id: str
    title: str
    topic: str
    file: str
    type: str
    applies_to: str
    confidence: str
    last_verified: str
    sources: str
    related: tuple[str, ...]
    tags: tuple[str, ...]
    # The IDs a merged entry points to; empty for every other entry
    merged_into: tuple[str, ...]
    summary: str
    body: str


@dataclass(frozen=True)
class Hit:
    entry: Entry
    # True when the query named this entry's ID
    by_id: bool


@dataclass(frozen=True, eq=False)
class Index:
    commit: str
    built_at: datetime
    build_seconds: float
    entries: dict[str, Entry]
    # Topic file titles by topic ("mcp" for topics/kb-mcp.md)
    topics: dict[str, str]
    # The "Quick answers" section by topic, INDEX_TOPIC for INDEX.md's
    quick_answers: dict[str, str]
    recommendations: dict[str, str]
    _db: sqlite3.Connection
    _lock: threading.Lock

    def get(self, ids: list[str]) -> list[Entry]:
        """The entries with these IDs, in the order asked, skipping unknown ones and repeats. Any case, and the
        number padded to three digits: "mcp-17" is MCP-017."""
        found = (self.entries.get(normal_id(i)) for i in dict.fromkeys(ids))
        return list(dict.fromkeys(e for e in found if e))

    def topic(self, name: str) -> str | None:
        """The topic for "mcp", "kb-mcp", "kb-mcp.md" or the prefix "MCP"; None for anything else."""
        name = name.strip().lower().removesuffix(".md").removeprefix("topics/").removeprefix("kb-")
        if name in self.topics:
            return name
        prefix = name.upper()
        return next((e.topic for e in self.entries.values() if e.id.startswith(prefix + "-")), None)

    def search(self, query: str, topic: str | None = None, type: str | None = None, limit: int = 8) -> list[Hit]:
        """Entries for a query, best first: entries whose IDs the query names, then entries matching any of its words,
        ranked by bm25() (an entry matching more of them ranks higher). Merged entries are found by ID only. `topic`
        and `type` filter every result; an unknown topic matches nothing."""
        wanted_topic = self.topic(topic) if topic else None
        if topic and wanted_topic is None:
            return []

        def keep(e: Entry) -> bool:
            return (wanted_topic is None or e.topic == wanted_topic) and (type is None or e.type == type)

        hits = {e.id: Hit(e, by_id=True) for e in self.get(ID_IN_QUERY.findall(query)) if keep(e)}
        # OR, not FTS5's implicit AND: a question's words rarely all appear in the entry that answers it. Matching
        # all words first and then any word ranked worse on the Quick-answer questions.
        if len(hits) < limit and (phrases := _phrases(query)):
            for eid in self._match(" OR ".join(phrases), wanted_topic, type, limit + len(hits)):
                hits.setdefault(eid, Hit(self.entries[eid], by_id=False))
        return list(hits.values())[:limit]

    def _match(self, match: str, topic: str | None, type: str | None, limit: int) -> list[str]:
        sql = (
            "SELECT id FROM fts WHERE fts MATCH ? AND (? IS NULL OR topic = ?) AND (? IS NULL OR type = ?)"
            f" ORDER BY bm25(fts, {', '.join(map(str, WEIGHTS))}) LIMIT ?"
        )
        # One connection shared by the request threads; sqlite3 objects aren't safe to use from two at once
        with self._lock:
            return [row[0] for row in self._db.execute(sql, (match, topic, topic, type, type, limit))]


def normal_id(eid: str) -> str:
    m = re.fullmatch(r"\s*([A-Za-z]+)-(\d+)\s*", eid)
    return f"{m.group(1).upper()}-{int(m.group(2)):03d}" if m else eid.strip().upper()


def _phrases(query: str) -> list[str]:
    """Each whitespace-separated part of the query as a quoted FTS5 phrase of its words, so `(`, `-` or `"` in a
    query never reach MATCH as syntax: "mcp-json" becomes the phrase "mcp json". Lone stopwords are dropped."""
    phrases = []
    for part in query.split():
        words = [w.lower() for w in WORD.findall(part)]
        if words and not (len(words) == 1 and words[0] in STOPWORDS):
            phrases.append('"' + " ".join(words) + '"')
    return list(dict.fromkeys(phrases))


def _field(body: str, name: str) -> str:
    m = re.search(r"^- " + re.escape(name) + r":[ \t]*(.*)$", body, re.M)
    return m.group(1).strip() if m else ""


def _prose(body: str) -> str:
    """The entry without its heading and metadata lines."""
    return check_kb.META_LINE.sub("", body.split("\n", 1)[1] if "\n" in body else "").strip()


def _summary(prose: str) -> str:
    """The first paragraph (with the next ones while it's under a third of SUMMARY_CHARS, so a lead-in such as
    "Default TTLs:" keeps its list), cut at the last sentence end within SUMMARY_CHARS, or at a word with an
    ellipsis."""
    para = ""
    for part in prose.split("\n\n"):
        para = f"{para} {' '.join(part.split())}".strip()
        if len(para) >= SUMMARY_CHARS // 3:
            break
    if len(para) <= SUMMARY_CHARS:
        return para
    cut = para[:SUMMARY_CHARS]
    end = max(cut.rfind(". "), cut.rfind(". "))
    return cut[: end + 1] if end > SUMMARY_CHARS // 3 else cut.rsplit(" ", 1)[0] + " …"


def _merged_into(index_title: str) -> tuple[str, ...]:
    m = check_kb.MERGED_SUFFIX.search(index_title)
    return tuple(re.findall(r"[A-Z]+-\d+", m.group(0))) if m else ()


def load(root: Path, commit: str | None = None) -> Index:
    """Parse and index the checkout at `root`. `commit` defaults to the directory's name, which is the commit hash for
    a git-sync worktree."""
    started = time.perf_counter()
    entries: dict[str, Entry] = {}
    topics: dict[str, str] = {}
    quick_answers: dict[str, str] = {}
    recommendations: dict[str, str] = {}
    db = sqlite3.connect(":memory:", check_same_thread=False)
    # Porter stemming, so "reviewers" finds "reviewer"; topic and type are filters, not searched
    db.execute(
        "CREATE VIRTUAL TABLE fts USING fts5(id, title, tags, body, topic UNINDEXED, type UNINDEXED,"
        " tokenize = 'porter unicode61')"
    )
    for path in sorted((root / "topics").glob("kb-*.md")):
        text = path.read_text(encoding="utf-8")
        topic = path.stem.removeprefix("kb-")
        topics[topic] = re.sub(r" \([A-Z]+\)$", "", text.split("\n", 1)[0].lstrip("# ").strip())
        for name, store in (("Quick answers", quick_answers), ("Recommendations for our setup", recommendations)):
            if (body := check_kb.section(text, name)) is not None:
                store[topic] = body.strip()
        listed = {eid: (title, tags) for eid, title, _, tags in check_kb.index_table(text)}
        titles = {m.group(1): m.group(2).strip() for m in check_kb.HEADING.finditer(text)}
        for eid, body in check_kb.entries(text):
            index_title, tag_text = listed.get(eid, ("", ""))
            prose = _prose(body)
            entry = Entry(
                id=eid,
                title=titles.get(eid, ""),
                topic=topic,
                file=f"topics/{path.name}",
                type=_field(body, "Type"),
                applies_to=_field(body, "Applies to"),
                confidence=_field(body, "Confidence"),
                last_verified=_field(body, "Last verified"),
                sources=_field(body, "Sources"),
                related=tuple(re.findall(r"[A-Z]+-\d+", _field(body, "Related"))),
                tags=tuple(t.strip() for t in tag_text.split(",") if t.strip()),
                merged_into=_merged_into(index_title),
                summary=_summary(prose),
                body=body.strip(),
            )
            entries[eid] = entry
            # A merged entry is a pointer: found by its ID, never in place of the entry it points to
            if not entry.merged_into:
                db.execute(
                    "INSERT INTO fts VALUES (?, ?, ?, ?, ?, ?)",
                    (eid, entry.title, " ".join(entry.tags), prose, topic, entry.type),
                )
    index_md = root / "INDEX.md"
    if index_md.exists() and (body := check_kb.section(index_md.read_text(encoding="utf-8"), "Quick answers")):
        quick_answers[INDEX_TOPIC] = body.strip()
    db.commit()
    return Index(
        commit=commit or root.name,
        built_at=datetime.now(UTC),
        build_seconds=time.perf_counter() - started,
        entries=entries,
        topics=topics,
        quick_answers=quick_answers,
        recommendations=recommendations,
        _db=db,
        _lock=threading.Lock(),
    )
