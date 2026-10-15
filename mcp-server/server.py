"""claude-kb's remote MCP server: the knowledge base as tools, for claude.ai and Claude Code.

Tools (FreekMencke/claude-kb#112, text built in kb_tools.py): `kb_search`, `kb_get`, `kb_quick_answers` and
`kb_status`, all read-only. Sign-in is FastMCP's GitHubProvider, an OAuth proxy: this server is the authorization
server Claude sees and GitHub is the upstream login. Only the GitHub account whose numeric ID is ALLOWED_GITHUB_ID
gets a grant (`OwnerOnlyGitHubProvider`).

The KB itself is a git-sync checkout of main on a shared volume (KB_LINK), never part of the image. A background task
re-reads it when the link's target, the synced commit, changes, so no request waits on it.

Run: `python server.py` (production, settings from the environment, see README.md) or `python server.py --local`
(no sign-in, 127.0.0.1 only, for the MCP Inspector).
"""

from __future__ import annotations

import argparse
import asyncio
import contextlib
import logging
import os
from collections.abc import AsyncIterator, Mapping
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Annotated
from urllib.parse import parse_qs, urlparse

import mcp_types
import uvicorn
from cryptography.fernet import Fernet
from fastmcp import FastMCP
from fastmcp.server.auth.auth import AccessToken
from fastmcp.server.auth.oauth_proxy.ui import create_error_html
from fastmcp.server.auth.providers.github import GitHubProvider
from key_value.aio.stores.filetree import (
    FileTreeStore,
    FileTreeV1CollectionSanitizationStrategy,
    FileTreeV1KeySanitizationStrategy,
)
from key_value.aio.wrappers.encryption import FernetEncryptionWrapper
from pydantic import Field
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.requests import Request
from starlette.responses import FileResponse, HTMLResponse, PlainTextResponse, Response
from starlette.routing import Route

import kb_index
import kb_tools
import logs
import metrics

HERE = Path(__file__).resolve().parent
# In the image, assets/ sits next to this file; in the repo it's ../assets
ASSETS = HERE / "assets" if (HERE / "assets").is_dir() else HERE.parent / "assets"

logger = logging.getLogger("claude_kb_mcp")

PUBLIC_URL = "https://claude-kb.freekmencke.com"
MCP_PATH = "/mcp"
# The logo, served by this server: the MCP spec asks clients to fetch icons only from the server's own origin, over
# HTTPS and without credentials. Its rounded green background suits light and dark themes alike. The PNG is also
# /favicon.ico: how claude.ai picks a custom connector's icon isn't documented.
ICON_FILES = {
    "/icon.png": ("logo.png", "image/png"),
    "/icon.svg": ("logo.svg", "image/svg+xml"),
    "/favicon.ico": ("logo.png", "image/png"),
}
ICONS = [
    mcp_types.Icon(src=f"{PUBLIC_URL}/icon.png", mime_type="image/png", sizes=["512x512"]),
    mcp_types.Icon(src=f"{PUBLIC_URL}/icon.svg", mime_type="image/svg+xml", sizes=["any"]),
]
# Where Claude sends the browser back after sign-in: claude.ai and claude.com for hosted Claude, the loopback
# callback on any port for Claude Code (a loopback pattern without a port matches every port, RFC 8252 §7.3).
ALLOWED_CLIENT_REDIRECT_URIS = [
    "https://claude.ai/api/mcp/auth_callback",
    "https://claude.com/api/mcp/auth_callback",
    "http://localhost/callback",
    "http://127.0.0.1/callback",
]
# Enough to read the account's numeric ID; FastMCP's default, "user", could also write the profile.
GITHUB_SCOPES = ["read:user"]
# Every MCP request checks the GitHub token behind the FastMCP one (two GitHub API calls). Caching the result for a
# few minutes keeps a burst of tool calls from waiting on GitHub each time.
TOKEN_CACHE_SECONDS = 300
# How often to check whether git-sync (every 60 s) has moved the link to a new commit: a readlink, so cheap
REFRESH_SECONDS = 10


@dataclass(frozen=True)
class Settings:
    public_url: str
    kb_link: Path
    state_dir: Path
    github_client_id: str
    github_client_secret: str
    jwt_signing_key: str
    storage_encryption_key: str
    allowed_github_id: str

    @classmethod
    def from_env(cls, env: Mapping[str, str]) -> Settings:
        required = [
            "GITHUB_CLIENT_ID",
            "GITHUB_CLIENT_SECRET",
            "JWT_SIGNING_KEY",
            "STORAGE_ENCRYPTION_KEY",
            "ALLOWED_GITHUB_ID",
        ]
        missing = [name for name in required if not env.get(name)]
        if missing:
            raise SystemExit(f"Missing environment variables: {', '.join(missing)}")
        if not env["ALLOWED_GITHUB_ID"].isdigit():
            raise SystemExit("ALLOWED_GITHUB_ID must be the numeric GitHub user ID, not the login")
        return cls(
            public_url=env.get("PUBLIC_URL", PUBLIC_URL).rstrip("/"),
            kb_link=Path(env.get("KB_LINK", "/git/kb")),
            state_dir=Path(env.get("STATE_DIR", "/state")),
            github_client_id=env["GITHUB_CLIENT_ID"],
            github_client_secret=env["GITHUB_CLIENT_SECRET"],
            jwt_signing_key=env["JWT_SIGNING_KEY"],
            storage_encryption_key=env["STORAGE_ENCRYPTION_KEY"],
            allowed_github_id=env["ALLOWED_GITHUB_ID"],
        )


class OwnerOnlyGitHubProvider(GitHubProvider):
    """GitHubProvider that grants nothing to any GitHub account but one, matched by numeric ID.

    FastMCP 4.1.0 has no public hook between GitHub's callback and the authorization code it hands the client, so the
    first check overrides the private `_handle_idp_callback`: after FastMCP has exchanged GitHub's code, it looks up
    who signed in and, for anyone else, drops the code and answers 403, so a stranger never gets a token. The second
    check, on every request (`load_access_token`, public), rejects any token whose GitHub account isn't the owner's,
    in case a FastMCP upgrade changes the private one. tests/test_auth.py covers both.
    """

    def __init__(self, *, allowed_github_id: str, **kwargs):
        super().__init__(**kwargs)
        self._allowed_github_id = allowed_github_id

    async def _handle_idp_callback(self, request: Request) -> Response:
        response = await super()._handle_idp_callback(request)
        location = response.headers.get("location")
        code = parse_qs(urlparse(location).query).get("code", [None])[0] if location else None
        if response.status_code != 302 or code is None:
            return response
        stored = await self._code_store.get(key=code)
        github_token = stored.idp_tokens.get("access_token") if stored else None
        user = await self._token_validator.verify_token(github_token) if github_token else None
        github_id = user.claims.get("sub") if user else None
        if github_id == self._allowed_github_id:
            logger.info("Sign-in granted to GitHub ID %s for client %s", github_id, stored.client_id)
            return response
        await self._code_store.delete(key=code)
        login = user.claims.get("login") if user else None
        logger.warning("Sign-in refused: GitHub ID %s (%s) isn't the owner", github_id, login)
        html = create_error_html(
            error_title="Access denied",
            error_message="This GitHub account can't use this server.",
        )
        return HTMLResponse(content=html, status_code=403)

    async def load_access_token(self, token: str) -> AccessToken | None:
        access = await super().load_access_token(token)
        if access is None or (access.claims or {}).get("sub") != self._allowed_github_id:
            return None
        return access


def build_auth(settings: Settings, **overrides) -> OwnerOnlyGitHubProvider:
    settings.state_dir.mkdir(parents=True, exist_ok=True)
    storage = FernetEncryptionWrapper(
        key_value=FileTreeStore(
            data_directory=settings.state_dir,
            key_sanitization_strategy=FileTreeV1KeySanitizationStrategy(settings.state_dir),
            collection_sanitization_strategy=FileTreeV1CollectionSanitizationStrategy(settings.state_dir),
        ),
        fernet=Fernet(settings.storage_encryption_key),
        # A changed key reads old state as missing (sign in again) rather than failing every request
        raise_on_decryption_error=False,
    )
    return OwnerOnlyGitHubProvider(
        allowed_github_id=settings.allowed_github_id,
        client_id=settings.github_client_id,
        client_secret=settings.github_client_secret,
        base_url=settings.public_url,
        required_scopes=GITHUB_SCOPES,
        allowed_client_redirect_uris=ALLOWED_CLIENT_REDIRECT_URIS,
        client_storage=storage,
        jwt_signing_key=settings.jwt_signing_key,
        cache_ttl_seconds=TOKEN_CACHE_SECONDS,
        **overrides,
    )


class KbState:
    """The index of the synced checkout. `refresh` runs in the background, never in a request: it builds a new Index
    and swaps it in with one assignment, so a request reads either the old index or the new one, whole."""

    def __init__(self, link: Path):
        self.link = link
        self.index: kb_index.Index | None = None

    @property
    def commit(self) -> str | None:
        return self.index.commit if self.index else None

    @property
    def entries(self) -> int | None:
        return len(self.index.entries) if self.index else None

    @property
    def built_at(self) -> datetime | None:
        return self.index.built_at if self.index else None

    def refresh(self) -> None:
        # git-sync flips the link atomically; "the basename of the target of the link is the current hash"
        try:
            target = self.link.resolve(strict=True)
        except FileNotFoundError:
            return
        if target.name == self.commit:
            return
        self.index = kb_index.load(target)
        metrics.index_loaded(self.index)
        logger.info(
            "Indexed commit %s: %d entries in %.2f s", self.commit, self.entries, self.index.build_seconds
        )

    def status_text(self) -> str:
        if self.index is None:
            return f"No checkout yet: git-sync hasn't created {self.link}."
        return (
            f"Commit: {self.commit}\n"
            f"Entries: {self.entries}\n"
            f"Index built: {self.built_at.isoformat(timespec='seconds')} in {self.index.build_seconds:.2f} s"
        )


async def keep_refreshed(state: KbState) -> None:
    while True:
        try:
            await asyncio.to_thread(state.refresh)
        except Exception:
            logger.exception("Refreshing the index failed; keeping commit %s", state.commit)
        await asyncio.sleep(REFRESH_SECONDS)


def create_mcp(state: KbState, auth: OwnerOnlyGitHubProvider | None) -> FastMCP:
    """The server with its tools and routes. Descriptions carry the usage rules too: claude.ai web and desktop drop
    `instructions` (anthropics/claude-ai-mcp#93); Claude Code keeps them. Keep descriptions stable: claude.ai's
    "Always allow" is reported to be keyed on their hash (anthropics/claude-ai-mcp#1087)."""

    @contextlib.asynccontextmanager
    async def lifespan(_server: FastMCP) -> AsyncIterator[None]:
        task = asyncio.create_task(keep_refreshed(state))
        try:
            yield
        finally:
            task.cancel()

    mcp = FastMCP("claude-kb", instructions=kb_tools.INSTRUCTIONS, auth=auth, lifespan=lifespan, icons=ICONS)
    mcp.add_middleware(metrics.ToolMetrics())
    # Read-only tools can run without a per-call prompt. Text content only: with an output schema, Claude Code hands
    # Claude the structured JSON instead.
    read_only = {"readOnlyHint": True, "destructiveHint": False, "openWorldHint": False}

    @mcp.tool(title="Search the knowledge base", annotations=read_only, output_schema=None)
    def kb_search(
        query: Annotated[str, Field(description="Words, a phrase, or entry IDs such as MCP-017")],
        topic: Annotated[
            str | None, Field(description="Only this topic: a name such as mcp or a prefix such as MCP")
        ] = None,
        type: Annotated[
            str | None,
            Field(description="Only this entry type: fact, pattern, recommendation, anti-pattern, tool or comparison"),
        ] = None,
        limit: Annotated[int, Field(description="How many entries, 1 to 20")] = 8,
    ) -> str:
        """Search claude-kb, a knowledge base on using Claude and Claude Code efficiently: models and effort,
        subagents, skills, hooks, prompting, CLAUDE.md and memory, MCP servers and connectors, sessions, workflows,
        tokens and caching, docs, SEO. Returns entry IDs with title, type, confidence, last-verified date and a
        summary. Search first, then kb_get the 1 to 4 best IDs. Cite entry IDs. Check an entry last verified more
        than 60 days ago against its sources."""
        return kb_tools.search(state.index, query, topic, type, limit)

    @mcp.tool(title="Read entries", annotations=read_only, output_schema=None)
    def kb_get(
        ids: Annotated[list[str], Field(description="1 to 10 entry IDs, such as [\"MCP-017\", \"TOK-005\"]")],
    ) -> str:
        """The full Markdown of claude-kb entries by ID, with their sources, confidence, last-verified date and
        related IDs. A merged entry comes with the entry it points to."""
        return kb_tools.get(state.index, ids)

    @mcp.tool(title="Quick answers", annotations=read_only, output_schema=None)
    def kb_quick_answers(
        topic: Annotated[
            str | None, Field(description="A topic name such as mcp or a prefix such as MCP; leave out for all")
        ] = None,
    ) -> str:
        """claude-kb's most-asked questions, each with a one-line answer and its entry IDs: across the knowledge base,
        or for one topic together with that topic's recommendations for our setup."""
        return kb_tools.quick_answers(state.index, topic)

    @mcp.tool(title="Knowledge base status", annotations=read_only, output_schema=None)
    def kb_status() -> str:
        """The claude-kb commit this server has loaded, its number of entries, and when it last indexed them."""
        return state.status_text()

    @mcp.custom_route("/healthz", methods=["GET"])
    async def healthz(_request: Request) -> Response:
        return PlainTextResponse("ok")

    async def icon(request: Request) -> Response:
        name, media_type = ICON_FILES[request.url.path]
        return FileResponse(
            ASSETS / name,
            media_type=media_type,
            headers={"Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff"},
        )

    for path in ICON_FILES:
        mcp.custom_route(path, methods=["GET"])(icon)
    return mcp


def create_app(state: KbState, auth: OwnerOnlyGitHubProvider | None) -> Starlette:
    app = create_mcp(state, auth).http_app(
        path=MCP_PATH, stateless_http=True, middleware=[Middleware(metrics.HttpMetrics)]
    )
    # FastMCP serves the protected-resource metadata only at the path-suffixed URL (RFC 9728). Claude's
    # troubleshooting page curls the root one, so serve the same document there too.
    suffixed = f"/.well-known/oauth-protected-resource{MCP_PATH}"
    for route in list(app.routes):
        if isinstance(route, Route) and route.path == suffixed:
            app.router.routes.append(
                Route("/.well-known/oauth-protected-resource", route.endpoint, methods=list(route.methods or []))
            )
    return app


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--local", action="store_true", help="no sign-in, listen on 127.0.0.1 only")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8000")))
    args = parser.parse_args(argv)
    logs.configure()
    # It logs "Terminating session: None" after every stateless request
    logging.getLogger("mcp.server.streamable_http").setLevel(logging.WARNING)

    if args.local:
        kb_link = Path(os.environ.get("KB_LINK", Path(__file__).resolve().parent.parent))
        app = create_app(KbState(kb_link), auth=None)
        host = "127.0.0.1"
    else:
        settings = Settings.from_env(os.environ)
        app = create_app(KbState(settings.kb_link), auth=build_auth(settings))
        host = "0.0.0.0"
        metrics.serve()
    # Only Traefik reaches the pod; its X-Forwarded-For puts the client's address in the request lines. Those come from
    # logs.request, so uvicorn's own access log is off, and log_config=None leaves its loggers to logs.configure.
    uvicorn.run(
        app, host=host, port=args.port, proxy_headers=True, forwarded_allow_ips="*", log_config=None, access_log=False
    )


if __name__ == "__main__":
    main()
