"""Prometheus metrics (FreekMencke/claude-kb#136), served on their own port, which the Ingress never routes.

`http_request_duration_seconds` has the name and labels of the Node apps' metric (`@osrs-tracker/express-metrics`),
so their dashboard panels work here too. The client's default collectors add `process_*` (memory, CPU, open files)
and `python_gc_*`. Alloy drops histogram buckets on the way to Grafana Cloud, so the histograms arrive as `_sum` and
`_count`: averages, not percentiles.
"""

from __future__ import annotations

import time
from threading import Thread
from wsgiref.simple_server import WSGIServer

import mcp_types
from fastmcp.server.middleware import CallNext, Middleware, MiddlewareContext
from fastmcp.tools.base import ToolResult
from prometheus_client import Counter, Gauge, Histogram, start_http_server
from starlette.routing import Match
from starlette.types import ASGIApp, Message, Receive, Scope, Send

import kb_index

PORT = 9090
TOOLS = ("kb_search", "kb_get", "kb_quick_answers", "kb_status")
# A route label for paths no route matches, so scanners can't add a series per path
OTHER = "other"

HTTP_DURATION = Histogram(
    "http_request_duration_seconds", "Time to answer an HTTP request", ["method", "route", "status_code"]
)
TOOL_CALLS = Counter("kb_tool_calls", "Tool calls, by tool and outcome (ok or error)", ["tool", "outcome"])
TOOL_DURATION = Histogram("kb_tool_duration_seconds", "Time a tool call took", ["tool"])
SEARCH_EMPTY = Counter("kb_search_empty", "kb_search calls that matched no entry")
INDEX_ENTRIES = Gauge("kb_index_entries", "Entries in the loaded index")
INDEX_BUILD_SECONDS = Gauge("kb_index_build_seconds", "How long the loaded index took to build")
INDEX_BUILT = Gauge("kb_index_built_timestamp_seconds", "When the loaded index was built, as a Unix time")

# Every tool and outcome from the start, so a rate over the first calls isn't missing its zero
for _tool in (*TOOLS, OTHER):
    for _outcome in ("ok", "error"):
        TOOL_CALLS.labels(_tool, _outcome)


def serve(port: int = PORT) -> tuple[WSGIServer, Thread]:
    """Serve /metrics from a daemon thread, apart from the app's port."""
    return start_http_server(port)


def index_loaded(index: kb_index.Index) -> None:
    INDEX_ENTRIES.set(len(index.entries))
    INDEX_BUILD_SECONDS.set(index.build_seconds)
    INDEX_BUILT.set(index.built_at.timestamp())


def _route(scope: Scope) -> str:
    """The matched route's path template; Starlette puts the app in the scope."""
    for route in scope["app"].routes:
        match, _ = route.matches(scope)
        if match is not Match.NONE:
            return route.path
    return OTHER


class HttpMetrics:
    """ASGI middleware timing each HTTP request until the app returns, streamed responses included."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        status = 500

        async def send_and_record(message: Message) -> None:
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
            await send(message)

        start = time.perf_counter()
        try:
            await self.app(scope, receive, send_and_record)
        finally:
            HTTP_DURATION.labels(scope["method"], _route(scope), str(status)).observe(time.perf_counter() - start)


class ToolMetrics(Middleware):
    """Counts and times tool calls. A tool's ToolError reaches here as an exception, before FastMCP turns it into an
    `isError` result."""

    async def on_call_tool(
        self,
        context: MiddlewareContext[mcp_types.CallToolRequestParams],
        call_next: CallNext[mcp_types.CallToolRequestParams, ToolResult],
    ) -> ToolResult:
        tool = context.message.name if context.message.name in TOOLS else OTHER
        outcome = "error"
        start = time.perf_counter()
        try:
            result = await call_next(context)
            outcome = "ok"
            return result
        finally:
            TOOL_CALLS.labels(tool, outcome).inc()
            TOOL_DURATION.labels(tool).observe(time.perf_counter() - start)
