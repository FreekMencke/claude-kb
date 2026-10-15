"""JSON log lines in the shape of the Node apps' (`@osrs-tracker/logger`, pino): `time`, `level` (pino's names),
`logger` and `message`, an `error` with the traceback, and for each request a `type: incoming` line with `method`,
`route`, `url`, `status`, `responseTime`, `clientIp` and `userAgent`. Grafana reads them with `| json`, and the MCP
Server Dashboard filters the request lines by `route`, as Express Dashboard does.

A formatter of our own on the standard library's logging: no JSON logging package is installed, and this is short.
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime

from starlette.types import Scope

# pino's level names where Python's differ
LEVELS = {"WARNING": "warn", "CRITICAL": "fatal"}
# The kubelet's probes, one every three seconds or so
UNLOGGED = {"/healthz"}

requests = logging.getLogger("claude_kb_mcp.requests")


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        line = {
            "time": datetime.fromtimestamp(record.created, UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
            "level": LEVELS.get(record.levelname, record.levelname.lower()),
            "logger": record.name,
            **getattr(record, "fields", {}),
            "message": record.getMessage(),
        }
        if record.exc_info:
            line["error"] = self.formatException(record.exc_info)
        return json.dumps(line, default=str)


def configure(level: int = logging.INFO) -> None:
    """JSON lines on stderr for every logger, uvicorn's included (run it with `log_config=None`)."""
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    logging.basicConfig(level=level, handlers=[handler], force=True)
    # FastMCP gives its logger a Rich handler of its own and stops it propagating
    fastmcp_logger = logging.getLogger("fastmcp")
    fastmcp_logger.handlers.clear()
    fastmcp_logger.propagate = True


def request(scope: Scope, route: str, status: int, seconds: float) -> None:
    """One line per request, at pino-http's levels: warn for a 4XX, error for a 5XX. `url` keeps the query string, as
    uvicorn's access log did: `client_id` on /authorize tells CIMD from DCR."""
    if scope["path"] in UNLOGGED:
        return
    headers = dict(scope.get("headers") or [])
    query = scope.get("query_string", b"").decode("latin-1")
    fields = {
        "type": "incoming",
        "method": scope["method"],
        "route": route,
        "url": f"{scope['path']}?{query}" if query else scope["path"],
        "status": str(status),
        "responseTime": f"{round(seconds * 1000)}ms",
        "clientIp": scope["client"][0] if scope.get("client") else None,
        "userAgent": headers.get(b"user-agent", b"").decode("latin-1") or None,
    }
    level = logging.ERROR if status >= 500 else logging.WARNING if status >= 400 else logging.INFO
    requests.log(level, "%s %s %s", scope["method"], scope["path"], status, extra={"fields": fields})
