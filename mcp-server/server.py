"""claude-kb's remote MCP server: the knowledge base as tools, for claude.ai and Claude Code.

Tools (FreekMencke/claude-kb#112, text built in kb_tools.py): `kb_search`, `kb_get`, `kb_quick_answers` and
`kb_status`, all read-only, and open to anyone without a sign-in: the knowledge base is a public repo
(FreekMencke/claude-kb#142). Traefik rate-limits each client IP (claude-kb-mcp.yaml).

The KB itself is a git-sync checkout of main on a shared volume (KB_LINK), never part of the image. A background task
re-reads it when the link's target, the synced commit, changes, so no request waits on it.

Run: `python server.py` (production, reading KB_LINK) or `python server.py --local` (127.0.0.1 only, reading the
checkout it runs from, for the MCP Inspector).
"""

from __future__ import annotations

import argparse
import asyncio
import contextlib
import logging
import os
from collections.abc import AsyncIterator
from datetime import datetime
from pathlib import Path
from typing import Annotated

import mcp_types
import uvicorn
from fastmcp import FastMCP
from pydantic import Field
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.requests import Request
from starlette.responses import FileResponse, PlainTextResponse, Response

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
# How often to check whether git-sync (every 60 s) has moved the link to a new commit: a readlink, so cheap
REFRESH_SECONDS = 10


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


def create_mcp(state: KbState) -> FastMCP:
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

    mcp = FastMCP("claude-kb", instructions=kb_tools.INSTRUCTIONS, lifespan=lifespan, icons=ICONS)
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


def create_app(state: KbState) -> Starlette:
    return create_mcp(state).http_app(path=MCP_PATH, stateless_http=True, middleware=[Middleware(metrics.HttpMetrics)])


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--local", action="store_true", help="listen on 127.0.0.1 only, reading this checkout")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8000")))
    args = parser.parse_args(argv)
    logs.configure()
    # It logs "Terminating session: None" after every stateless request
    logging.getLogger("mcp.server.streamable_http").setLevel(logging.WARNING)

    if args.local:
        kb_link = Path(os.environ.get("KB_LINK", HERE.parent))
        host = "127.0.0.1"
    else:
        kb_link = Path(os.environ.get("KB_LINK", "/git/kb"))
        host = "0.0.0.0"
        metrics.serve()
    app = create_app(KbState(kb_link))
    # Only Traefik reaches the pod; its X-Forwarded-For puts the client's address in the request lines. Those come from
    # logs.request, so uvicorn's own access log is off, and log_config=None leaves its loggers to logs.configure.
    uvicorn.run(
        app, host=host, port=args.port, proxy_headers=True, forwarded_allow_ips="*", log_config=None, access_log=False
    )


if __name__ == "__main__":
    main()
