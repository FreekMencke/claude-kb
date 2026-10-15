"""kb_status's contract and the background index of the git-sync checkout."""

from __future__ import annotations

from pathlib import Path

import pytest
from conftest import COMMIT, TOPIC, sse_json
from test_auth import call, owner_token

import server


def test_counts_entries_in_the_linked_commit(state: server.KbState) -> None:
    assert state.commit == COMMIT
    assert state.entries == 2
    assert state.built_at is not None
    assert state.status_text().startswith(f"Commit: {COMMIT}\nEntries: 2\nIndex built: ")


def test_follows_the_link_to_a_new_commit(state: server.KbState, kb_root: Path) -> None:
    new = "fedcba9876543210fedcba9876543210fedcba98"
    topics = kb_root / ".worktrees" / new / "topics"
    topics.mkdir(parents=True)
    (topics / "kb-test.md").write_text(TOPIC + "\n## [TST-003] Third\n- Type: fact\n", encoding="utf-8")
    # git-sync swaps the link atomically: a new link renamed over the old one
    (kb_root / "kb.new").symlink_to(Path(".worktrees") / new)
    (kb_root / "kb.new").replace(kb_root / "kb")
    state.refresh()
    assert (state.commit, state.entries) == (new, 3)


def test_unchanged_commit_is_not_reindexed(state: server.KbState) -> None:
    built_at = state.built_at
    state.refresh()
    assert state.built_at == built_at


def test_before_the_first_sync(tmp_path: Path) -> None:
    state = server.KbState(tmp_path / "git" / "kb")
    state.refresh()
    assert state.commit is None
    assert "git-sync" in state.status_text()


def test_allowed_github_id_must_be_numeric() -> None:
    env = {
        "GITHUB_CLIENT_ID": "id",
        "GITHUB_CLIENT_SECRET": "secret",
        "JWT_SIGNING_KEY": "key",
        "STORAGE_ENCRYPTION_KEY": "key",
        "ALLOWED_GITHUB_ID": "owner",
    }
    with pytest.raises(SystemExit, match="numeric"):
        server.Settings.from_env(env)
    with pytest.raises(SystemExit, match="JWT_SIGNING_KEY"):
        server.Settings.from_env({**env, "JWT_SIGNING_KEY": ""})


@pytest.mark.anyio
async def test_kb_status_contract(client) -> None:
    token = await owner_token(client)
    response = await call(client, token["access_token"], "tools/list")
    [tool] = sse_json(response)["result"]["tools"]
    assert tool["name"] == "kb_status"
    assert tool["title"] == "Knowledge base status"
    assert tool["annotations"]["readOnlyHint"] is True
    assert tool["annotations"]["destructiveHint"] is False
    # Text content only: no outputSchema, and no root-level anyOf/oneOf/allOf in the input schema
    assert "outputSchema" not in tool
    assert not {"anyOf", "oneOf", "allOf"} & tool["inputSchema"].keys()


@pytest.mark.anyio
async def test_server_info_lists_same_origin_icons(client) -> None:
    token = await owner_token(client)
    params = {"protocolVersion": "2025-11-25", "capabilities": {}, "clientInfo": {"name": "test", "version": "0"}}
    response = await call(client, token["access_token"], "initialize", params)
    icons = sse_json(response)["result"]["serverInfo"]["icons"]
    assert [icon["mimeType"] for icon in icons] == ["image/png", "image/svg+xml"]
    # The spec asks clients to fetch icons only over HTTPS from the server's own origin
    assert all(icon["src"].startswith(f"{server.PUBLIC_URL}/") for icon in icons)
    for icon in icons:
        served = await client.get(icon["src"])
        assert served.status_code == 200
        assert served.headers["content-type"].startswith(icon["mimeType"])


@pytest.mark.anyio
@pytest.mark.parametrize("path", ["/icon.png", "/icon.svg", "/favicon.ico"])
async def test_icons_need_no_token(client, path: str) -> None:
    response = await client.get(path)
    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    if path != "/icon.svg":
        assert response.content.startswith(b"\x89PNG\r\n\x1a\n")
