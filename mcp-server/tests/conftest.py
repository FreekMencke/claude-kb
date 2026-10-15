"""Fixtures: the server with a fake GitHub, and a fake git-sync checkout.

GitHub has two parts here: the token endpoint FastMCP's proxy calls from /auth/callback (FakeGitHubTokenEndpoint,
returned from the provider's `_create_upstream_oauth_client`, which FastMCP documents as the override point), and
the REST API the token verifier calls (a MockTransport behind the provider's `http_client`). Everything else, from
/register to /mcp, runs through the real routes in-process.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator, Iterator
from pathlib import Path

import httpx2
import pytest
from cryptography.fernet import Fernet

import server

OWNER_ID = "1001"
# GitHub accounts by the code GitHub would send to /auth/callback
USERS = {
    "owner-code": {"id": 1001, "login": "owner"},
    "stranger-code": {"id": 2002, "login": "stranger"},
    # Someone who took the owner's login: only the numeric ID counts
    "impostor-code": {"id": 3003, "login": "owner"},
}
TOKENS = {f"gho_{code}": user for code, user in USERS.items()}

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


class FakeGitHubTokenEndpoint:
    """github.com/login/oauth/access_token, as FastMCP's upstream client sees it."""

    def __init__(self) -> None:
        self.requests: list[dict] = []

    async def fetch_token(self, url: str, **params) -> dict:
        self.requests.append({"url": url, **params})
        if params.get("code") not in USERS:
            return {"error": "bad_verification_code"}
        # A GitHub OAuth App's token: no expiry, no refresh token
        return {"access_token": f"gho_{params['code']}", "token_type": "bearer", "scope": "read:user"}

    async def refresh_token(self, *args, **kwargs) -> dict:
        raise AssertionError("GitHub OAuth App tokens have no refresh token")

    async def aclose(self) -> None:
        pass


def github_api(request: httpx2.Request) -> httpx2.Response:
    user = TOKENS.get(request.headers.get("authorization", "").removeprefix("Bearer "))
    if user is None:
        return httpx2.Response(401, json={"message": "Bad credentials"})
    if request.url.path == "/user":
        return httpx2.Response(200, json=user)
    if request.url.path == "/user/repos":
        return httpx2.Response(200, json=[], headers={"X-OAuth-Scopes": "read:user"})
    return httpx2.Response(404)


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
def settings(tmp_path: Path, kb_root: Path) -> server.Settings:
    return server.Settings.from_env(
        {
            "GITHUB_CLIENT_ID": "github-client-id",
            "GITHUB_CLIENT_SECRET": "github-client-secret",
            "JWT_SIGNING_KEY": "a" * 64,
            "STORAGE_ENCRYPTION_KEY": Fernet.generate_key().decode(),
            "ALLOWED_GITHUB_ID": OWNER_ID,
            "KB_LINK": str(kb_root / "kb"),
            "STATE_DIR": str(tmp_path / "state"),
        }
    )


@pytest.fixture
def github() -> FakeGitHubTokenEndpoint:
    return FakeGitHubTokenEndpoint()


@pytest.fixture
def auth(settings: server.Settings, github: FakeGitHubTokenEndpoint) -> Iterator[server.OwnerOnlyGitHubProvider]:
    provider = server.build_auth(settings, http_client=httpx2.AsyncClient(transport=httpx2.MockTransport(github_api)))
    provider._create_upstream_oauth_client = lambda: github
    yield provider


@pytest.fixture
def state(settings: server.Settings) -> server.KbState:
    kb = server.KbState(settings.kb_link)
    kb.refresh()
    return kb


@pytest.fixture
async def client(state: server.KbState, auth: server.OwnerOnlyGitHubProvider) -> AsyncIterator[httpx2.AsyncClient]:
    app = server.create_app(state, auth)
    async with app.router.lifespan_context(app):
        async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app), base_url=server.PUBLIC_URL) as c:
            yield c


def sse_json(response: httpx2.Response) -> dict:
    """The JSON-RPC message in a Streamable HTTP response, sent as JSON or as one SSE event."""
    if response.headers.get("content-type", "").startswith("application/json"):
        return response.json()
    data = [line.removeprefix("data: ") for line in response.text.splitlines() if line.startswith("data: ")]
    return json.loads(data[-1])
