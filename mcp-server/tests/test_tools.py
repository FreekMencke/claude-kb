"""The four tools through FastMCP's in-memory client, on this repo's index: results, errors and size caps."""

from __future__ import annotations

import dataclasses
import re
from datetime import date
from pathlib import Path

import pytest
from fastmcp import Client

import kb_index
import kb_tools
import server

REPO = Path(__file__).resolve().parents[2]
COMMIT = "testcommit"
CORPUS = f"corpus: {COMMIT}"


@pytest.fixture(scope="module")
def index() -> kb_index.Index:
    return kb_index.load(REPO, commit=COMMIT)


@pytest.fixture
async def mcp(index: kb_index.Index):
    state = server.KbState(REPO)
    state.index = index
    async with Client(server.create_mcp(state)) as client:
        yield client


async def call(mcp: Client, tool: str, **args) -> tuple[str, bool]:
    result = await mcp.call_tool(tool, args, raise_on_error=False)
    [content] = result.content
    return content.text, result.is_error


def hit_ids(text: str) -> list[str]:
    types = "|".join(kb_tools.TYPES)
    return re.findall(rf"^([A-Z]+-\d{{3}}): .* \((?:{types}), ", text, re.M)


@pytest.mark.anyio
async def test_tools_list(mcp: Client) -> None:
    tools = {t.name: t for t in await mcp.list_tools()}
    assert list(tools) == ["kb_search", "kb_get", "kb_quick_answers", "kb_status"]
    for tool in tools.values():
        assert tool.title and tool.description
        assert tool.annotations.read_only_hint is True
        assert tool.annotations.destructive_hint is False
        assert tool.output_schema is None
    assert "kb_get the 1 to 4 best IDs" in tools["kb_search"].description
    assert "60 days" in tools["kb_search"].description


# kb_search


@pytest.mark.anyio
async def test_search_by_id(mcp: Client) -> None:
    text, error = await call(mcp, "kb_search", query="mcp-017")
    assert not error
    assert text.startswith("MCP-017: CLI, skill or MCP server? (comparison, official-docs, last verified ")
    assert text.endswith(CORPUS)


@pytest.mark.anyio
async def test_search_phrase_and_topic(mcp: Client) -> None:
    text, _ = await call(mcp, "kb_search", query="Installation scopes and which definition wins")
    assert hit_ids(text)[0] == "MCP-001"
    text, _ = await call(mcp, "kb_search", query="hooks (deny) -- settings", topic="MCP", limit=5)
    ids = hit_ids(text)
    assert len(ids) == 5 and all(i.startswith("MCP-") for i in ids)


@pytest.mark.anyio
async def test_search_no_hits_lists_topics(mcp: Client) -> None:
    text, error = await call(mcp, "kb_search", query="zzqqxx")
    assert not error
    assert text.startswith("No entries match 'zzqqxx'")
    assert "- mcp (MCP): " in text and text.endswith(CORPUS)


@pytest.mark.anyio
@pytest.mark.parametrize(
    ("args", "message"),
    [
        ({"query": ""}, "Pass a query"),
        ({"query": "   "}, "Pass a query"),
        ({"query": "hooks", "limit": 0}, "Pass a limit from 1 to 20"),
        ({"query": "hooks", "limit": 21}, "Pass a limit from 1 to 20"),
        ({"query": "hooks", "topic": "nope"}, "Unknown topic 'nope'"),
        ({"query": "hooks", "type": "opinion"}, "Unknown type 'opinion'"),
    ],
)
async def test_search_bad_arguments(mcp: Client, args: dict, message: str) -> None:
    text, error = await call(mcp, "kb_search", **args)
    assert error
    assert message in text


@pytest.mark.anyio
@pytest.mark.parametrize(
    "query",
    ["subagent model effort", "prompt caching", "mcp server oauth connector", "hooks", "skills description trigger"],
)
async def test_search_stays_under_4_kb(mcp: Client, query: str) -> None:
    text, _ = await call(mcp, "kb_search", query=query)
    assert len(hit_ids(text)) == 8
    assert len(text.encode()) < 4096


def test_stale_entries_say_so(index: kb_index.Index) -> None:
    entry = index.entries["MCP-017"]
    today = date(2026, 12, 31)
    assert "check its sources" not in kb_tools._hit_line(dataclasses.replace(entry, last_verified="2026-11-15"), today)
    old = kb_tools._hit_line(dataclasses.replace(entry, last_verified="2026-10-01"), today)
    assert "last verified 2026-10-01, 91 days ago: check its sources" in old


# kb_get


@pytest.mark.anyio
async def test_get_one(mcp: Client, index: kb_index.Index) -> None:
    text, error = await call(mcp, "kb_get", ids=["MCP-17"])
    assert not error
    assert text == f"{index.entries['MCP-017'].body}\n\n{CORPUS}"


@pytest.mark.anyio
async def test_get_merged_brings_its_target(mcp: Client) -> None:
    text, _ = await call(mcp, "kb_get", ids=["SKILL-005"])
    blocks = text.split(kb_tools.SEPARATOR)
    assert [b.split("]", 1)[0] for b in blocks] == ["## [SKILL-005", "## [TOK-005"]


@pytest.mark.anyio
async def test_get_unknown_next_to_known(mcp: Client) -> None:
    text, error = await call(mcp, "kb_get", ids=["MCP-017", "MCP-999", "webfetch"])
    assert not error
    assert text.startswith("## [MCP-017]")
    assert "\nMCP-999: no such entry. Closest: MCP-" in text
    assert "\nwebfetch: no such entry. Closest: TOK-" in text
    assert text.endswith(CORPUS)


@pytest.mark.anyio
async def test_get_only_unknown_is_an_error(mcp: Client) -> None:
    text, error = await call(mcp, "kb_get", ids=["MCP-999"])
    assert error
    assert text.startswith("MCP-999: no such entry. Closest: ")


@pytest.mark.anyio
@pytest.mark.parametrize("ids", [[], [""], [f"MCP-{n:03d}" for n in range(1, 12)]])
async def test_get_wrong_number_of_ids(mcp: Client, ids: list[str]) -> None:
    text, error = await call(mcp, "kb_get", ids=ids)
    assert error
    assert 'Pass 1 to 10 entry IDs, such as ["MCP-017"]' in text


@pytest.mark.anyio
async def test_get_ten_longest_stays_under_claude_codes_cap(mcp: Client, index: kb_index.Index) -> None:
    longest = sorted(index.entries.values(), key=lambda e: -len(e.body))[:10]
    text, _ = await call(mcp, "kb_get", ids=[e.id for e in longest])
    assert all(f"## [{e.id}]" in text for e in longest)
    # 25,000 tokens is Claude Code's default cap; a token is about 4 characters of English, so this is generous
    assert len(text) < 25_000 * 3


@pytest.mark.anyio
async def test_get_says_what_it_cut(mcp: Client, index: kb_index.Index, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(kb_tools, "GET_MAX_CHARS", 3_000)
    ids = ["MCP-001", "MCP-002", "MCP-003"]
    text, error = await call(mcp, "kb_get", ids=ids)
    assert not error
    assert text.startswith("## [MCP-001]")
    assert "more entries cut to keep this result small: " in text
    assert "MCP-003; kb_get them separately.)" in text


# kb_quick_answers and kb_status


@pytest.mark.anyio
async def test_quick_answers_across_the_kb(mcp: Client) -> None:
    text, error = await call(mcp, "kb_quick_answers")
    assert not error
    assert text.startswith("# Quick answers across the knowledge base\n\n")
    assert "| Which model should a reviewer use? |" in text
    assert "- mcp (MCP): " in text and text.endswith(CORPUS)


@pytest.mark.anyio
async def test_quick_answers_for_a_topic(mcp: Client) -> None:
    text, _ = await call(mcp, "kb_quick_answers", topic="MCP")
    assert text.startswith("# MCP servers")
    assert "## Recommendations for our setup (these go stale faster than the facts)" in text
    text, error = await call(mcp, "kb_quick_answers", topic="kb-nope.md")
    assert error and "Unknown topic" in text


@pytest.mark.anyio
async def test_before_the_first_sync(tmp_path: Path) -> None:
    async with Client(server.create_mcp(server.KbState(tmp_path / "kb"))) as client:
        for tool, args in [("kb_search", {"query": "x"}), ("kb_get", {"ids": ["MCP-017"]}), ("kb_quick_answers", {})]:
            text, error = await call(client, tool, **args)
            assert error and "hasn't loaded yet" in text
        text, error = await call(client, "kb_status")
        assert not error and "No checkout yet" in text
