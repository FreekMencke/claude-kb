"""The JSON log lines: the Node apps' shape, and one request line per request except the probes."""

from __future__ import annotations

import json
import logging
import sys

import httpx2
import pytest

import logs


def test_lines_are_json_with_pino_level_names() -> None:
    record = logging.LogRecord("claude_kb_mcp", logging.WARNING, __file__, 1, "Sign-in refused: %s", ("x",), None)
    line = json.loads(logs.JsonFormatter().format(record))

    assert line["level"] == "warn"
    assert line["logger"] == "claude_kb_mcp"
    assert line["message"] == "Sign-in refused: x"
    assert line["time"].endswith("Z")


def test_an_exception_becomes_the_error_field() -> None:
    try:
        raise ValueError("bad index")
    except ValueError:
        record = logging.LogRecord("claude_kb_mcp", logging.ERROR, __file__, 1, "Refreshing failed", (), True)
        record.exc_info = sys.exc_info()
    line = json.loads(logs.JsonFormatter().format(record))

    assert "ValueError: bad index" in line["error"]


@pytest.mark.anyio
async def test_requests_are_logged_by_route_except_the_probes(
    client: httpx2.AsyncClient, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.INFO, logger=logs.requests.name)

    await client.get("/healthz")
    await client.post("/mcp", json={})
    await client.get("/authorize?client_id=x")

    records = [record for record in caplog.records if record.name == logs.requests.name]
    lines = [record.fields for record in records]
    assert [(line["method"], line["route"], line["url"], line["status"]) for line in lines] == [
        ("POST", "/mcp", "/mcp", "401"),
        ("GET", "/authorize", "/authorize?client_id=x", lines[1]["status"]),
    ]
    assert records[0].levelname == "WARNING"
    assert lines[0]["type"] == "incoming"
    assert lines[0]["responseTime"].endswith("ms")
