"""kb_index: parsing a checkout into entries, and searching them, on fixture files and on this repo."""

from __future__ import annotations

import re
from pathlib import Path

import check_kb
import pytest

import kb_index

REPO = Path(__file__).resolve().parents[2]

ALPHA = """# Alpha things (ALP)

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| How do widgets rotate? | Clockwise. | ALP-001 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| ALP-001 | Widgets rotate clockwise | fact | widgets, rotation |
| ALP-002 | Gadget pricing | recommendation | gadgets, pricing-model |
| ALP-003 | Old widget notes (merged into ALP-001) | fact | widgets |

## [ALP-001] Widgets rotate clockwise
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-15
- Sources: [Widget docs](https://example.com/widgets)
- Related: ALP-002, BET-001

A widget always turns clockwise when seen from above. The spindle sets the direction.

Second paragraph about gearing.

### A subheading inside the entry

Still part of ALP-001.

## [ALP-002] Gadget pricing
- Type: recommendation
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: [Gadget blog](https://example.com/gadgets)
- Related: none

Gadgets cost more in winter (bid-ask spread).

## [ALP-003] Old widget notes
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Widget docs](https://example.com/widgets)
- Related: ALP-001

Merged into ALP-001 (kb-alpha.md) on 2026-10-12. Widgets widgets widgets.

## Recommendations for our setup

1. Buy gadgets in summer (ALP-002).

## Open questions

- Do widgets rotate on the moon?
"""

BETA = """# Beta (BET)

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| BET-001 | Widget storage | fact | widgets |

## [BET-001] Widget storage
- Type: fact
- Applies to: general
- Confidence: unverified
- Last verified: 2026-10-15
- Sources: [Storage](https://example.com/storage)
- Related: ALP-001

Store widgets dry.
"""

EMPTY = """# Empty (EMP)

## Quick answers

Nothing yet.
"""

INDEX = """# Index

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Where do widgets go? | Somewhere dry. | BET-001 |

## Conflicts
"""


@pytest.fixture
def index(tmp_path: Path) -> kb_index.Index:
    root = tmp_path / "0123abc"
    (root / "topics").mkdir(parents=True)
    for name, text in {"kb-alpha.md": ALPHA, "kb-beta.md": BETA, "kb-empty.md": EMPTY}.items():
        (root / "topics" / name).write_text(text, encoding="utf-8")
    (root / "INDEX.md").write_text(INDEX, encoding="utf-8")
    return kb_index.load(root)


@pytest.fixture(scope="module")
def repo() -> kb_index.Index:
    return kb_index.load(REPO, commit="worktree")


def ids(hits: list[kb_index.Hit]) -> list[str]:
    return [h.entry.id for h in hits]


# Fixture files


def test_parses_every_field(index: kb_index.Index) -> None:
    e = index.entries["ALP-001"]
    assert (e.title, e.topic, e.file) == ("Widgets rotate clockwise", "alpha", "topics/kb-alpha.md")
    assert (e.type, e.applies_to, e.confidence) == ("fact", "Claude Code", "official-docs")
    assert e.last_verified == "2026-10-15"
    assert e.sources == "[Widget docs](https://example.com/widgets)"
    assert e.related == ("ALP-002", "BET-001")
    assert e.tags == ("widgets", "rotation")
    assert e.merged_into == ()
    assert e.summary == "A widget always turns clockwise when seen from above. The spindle sets the direction."
    assert e.body.startswith("## [ALP-001] Widgets rotate clockwise\n- Type: fact")
    assert e.body.endswith("Still part of ALP-001.")
    assert index.entries["ALP-002"].related == ()


def test_merged_entry_keeps_its_pointer_and_is_found_by_id_only(index: kb_index.Index) -> None:
    merged = index.entries["ALP-003"]
    assert merged.merged_into == ("ALP-001",)
    assert merged.summary.startswith("Merged into ALP-001")
    assert "ALP-003" not in ids(index.search("old widget notes"))
    assert ids(index.search("ALP-003"))[0] == "ALP-003"


def test_file_with_no_entries_and_index_md(index: kb_index.Index) -> None:
    assert set(index.entries) == {"ALP-001", "ALP-002", "ALP-003", "BET-001"}
    assert index.topics == {"alpha": "Alpha things", "beta": "Beta", "empty": "Empty"}
    assert index.quick_answers["empty"] == "Nothing yet."
    assert "beta" not in index.quick_answers
    assert "| Where do widgets go? |" in index.quick_answers[kb_index.INDEX_TOPIC]
    assert "Conflicts" not in index.quick_answers[kb_index.INDEX_TOPIC]
    assert index.recommendations == {"alpha": "1. Buy gadgets in summer (ALP-002)."}


def test_commit_and_build_time(index: kb_index.Index) -> None:
    assert index.commit == "0123abc"
    assert index.build_seconds >= 0
    assert index.built_at.tzinfo is not None


def test_long_summary_is_cut_at_a_sentence() -> None:
    sentence = "This sentence has exactly fifty characters in it.. "
    summary = kb_index._summary(sentence * 10)
    assert len(summary) <= kb_index.SUMMARY_CHARS
    assert summary.endswith(".")
    assert kb_index._summary("word " * 100).endswith(" …")


def test_get_any_case_in_order_without_repeats(index: kb_index.Index) -> None:
    got = index.get(["bet-001", "ALP-001", "BET-001", "NOPE-1"])
    assert [e.id for e in got] == ["BET-001", "ALP-001"]


def test_ids_come_first_then_words(index: kb_index.Index) -> None:
    hits = index.search("BET-001 gadget")
    assert ids(hits)[:2] == ["BET-001", "ALP-002"]
    assert [h.by_id for h in hits[:2]] == [True, False]


def test_stemming_and_tags(index: kb_index.Index) -> None:
    assert ids(index.search("rotating"))[0] == "ALP-001"
    assert ids(index.search("pricing-model"))[0] == "ALP-002"


def test_filters(index: kb_index.Index) -> None:
    assert ids(index.search("widgets", topic="beta")) == ["BET-001"]
    assert ids(index.search("widgets", topic="BET")) == ["BET-001"]
    assert ids(index.search("widgets", topic="kb-beta.md")) == ["BET-001"]
    assert ids(index.search("widgets", topic="nope")) == []
    assert ids(index.search("widgets gadgets", type="recommendation")) == ["ALP-002"]
    assert ids(index.search("ALP-001", topic="beta")) == []


@pytest.mark.parametrize("query", ['(', '-', '"', 'widget (spindle', 'bid-ask "spread', "AND OR NOT", "NEAR(", "col:x"])
def test_fts5_syntax_in_a_query_never_raises(index: kb_index.Index, query: str) -> None:
    index.search(query)


def test_stopwords_only_finds_nothing(index: kb_index.Index) -> None:
    assert index.search("what is the") == []


# This repo


def test_repo_entry_count_matches_check_kb(repo: kb_index.Index) -> None:
    counted = [eid for f in (REPO / "topics").glob("kb-*.md") for eid, _ in check_kb.entries(f.read_text("utf-8"))]
    assert len(repo.entries) == len(counted) == len(set(counted))
    assert len(counted) >= 566  # on 2026-10-15
    assert set(repo.topics) == {f.stem.removeprefix("kb-") for f in (REPO / "topics").glob("kb-*.md")}
    assert kb_index.INDEX_TOPIC in repo.quick_answers


def test_repo_every_entry_has_its_fields(repo: kb_index.Index) -> None:
    for e in repo.entries.values():
        assert e.title and e.type and e.confidence and e.summary and e.tags, e.id
        assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", e.last_verified), e.id


@pytest.mark.parametrize(
    ("query", "first"),
    [
        ("MCP-017", ["MCP-017"]),
        ("mcp-017", ["MCP-017"]),
        ("MCP-017, tok-005 SKILL-005", ["MCP-017", "TOK-005", "SKILL-005"]),
        ("Installation scopes and which definition wins", ["MCP-001"]),
        ("headers-helper", ["MCP-007"]),
    ],
)
def test_repo_search_first_hits(repo: kb_index.Index, query: str, first: list[str]) -> None:
    assert ids(repo.search(query))[: len(first)] == first


def test_repo_search_topic_filter(repo: kb_index.Index) -> None:
    hits = repo.search("hooks permissions (deny) -- settings", topic="mcp")
    assert hits and all(h.entry.topic == "mcp" for h in hits)


# Ten questions from INDEX.md's Quick answers, each with an entry its row cites. Anthropic's mcp-builder skill asks
# for ten such evaluation questions.
QUESTIONS = [
    ("Which model should a reviewer use?", "ORCH-030"),
    ("Subagents, agent view, agent teams or workflows?", "ORCH-001"),
    ("How big is the fixed overhead, and how do I see what fills my context?", "TOK-002"),
    ("How many research subagents, and what should they return?", "TOK-099"),
    ("What loads at launch, what loads later, and what survives `/compact`?", "MEM-003"),
    ("Skill, CLAUDE.md, hook, subagent or MCP?", "SKILL-021"),
    ("Can a hook pull `main` before Claude Code makes a worktree?", "SESS-036"),
    ("How do I write a hook that blocks something, and what does it cost?", "HOOK-013"),
    ("Is a read-only MCP server enough to keep an agent read-only on AWS or Kubernetes?", "INFRA-004"),
    ("What must my server do to work as a claude.ai custom connector?", "MCP-029"),
]


@pytest.mark.parametrize(("question", "cited"), QUESTIONS)
def test_repo_quick_answer_questions_in_top_5(repo: kb_index.Index, question: str, cited: str) -> None:
    assert cited in ids(repo.search(question, limit=5))


def test_repo_most_quick_answer_questions_find_a_cited_entry(repo: kb_index.Index) -> None:
    """Every Quick-answer row in the repo: at least 75% find one of their cited entries in the top 5 (82% on
    2026-10-15, 208 of 253). A drop means a search change made ranking worse."""
    rows = [
        (cells[0], set(re.findall(r"[A-Z]+-\d+", cells[-1])))
        for text in repo.quick_answers.values()
        for line in text.splitlines()
        if len(cells := [c.strip() for c in line.strip("|").split("|")]) >= 3 and re.match(r"[A-Z]+-\d+", cells[-1])
    ]
    found = sum(bool(cited & set(ids(repo.search(q, limit=5)))) for q, cited in rows)
    assert len(rows) >= 200
    assert found / len(rows) >= 0.75, f"{found} of {len(rows)}"
