"""Fixtures: the server over HTTP in-process, and a fake git-sync checkout."""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from pathlib import Path

import httpx2
import pytest

import server

MCP_HEADERS = {"Accept": "application/json, text/event-stream", "Content-Type": "application/json"}

COMMIT = "0123456789abcdef0123456789abcdef01234567"
TOPIC = """# Topic

## [TST-001] First
- Type: fact

Body.

## [TST-002] Second
- Type: fact

Body.

## Recommendations for our setup
"""


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
def kb_root(tmp_path: Path) -> Path:
    """git-sync's --root: the checkout in .worktrees/<hash>, and the `kb` link pointing at it."""
    root = tmp_path / "git"
    topics = root / ".worktrees" / COMMIT / "topics"
    topics.mkdir(parents=True)
    (topics / "kb-test.md").write_text(TOPIC, encoding="utf-8")
    (root / "kb").symlink_to(Path(".worktrees") / COMMIT)
    return root


@pytest.fixture
def state(kb_root: Path) -> server.KbState:
    kb = server.KbState(kb_root / "kb")
    kb.refresh()
    return kb


@pytest.fixture
async def client(state: server.KbState) -> AsyncIterator[httpx2.AsyncClient]:
    app = server.create_app(state)
    async with app.router.lifespan_context(app):
        async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app), base_url=server.PUBLIC_URL) as c:
            yield c


def sse_json(response: httpx2.Response) -> dict:
    """The JSON-RPC message in a Streamable HTTP response, sent as JSON or as one SSE event."""
    if response.headers.get("content-type", "").startswith("application/json"):
        return response.json()
    data = [line.removeprefix("data: ") for line in response.text.splitlines() if line.startswith("data: ")]
    return json.loads(data[-1])


async def call(client: httpx2.AsyncClient, method: str, params: dict | None = None) -> httpx2.Response:
    """One JSON-RPC request to /mcp, without a token: the server has no sign-in."""
    return await client.post(
        "/mcp", headers=MCP_HEADERS, json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params or {}}
    )
