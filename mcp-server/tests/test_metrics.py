"""The Prometheus metrics (FreekMencke/claude-kb#136): HTTP requests by route, tool calls, empty searches, the index
gauges, and the /metrics endpoint on its own port."""

from __future__ import annotations

import re
import urllib.request

import httpx2
import pytest
from fastmcp import Client
from prometheus_client import REGISTRY

import metrics
import server


def sample(name: str, **labels: str) -> float:
    return REGISTRY.get_sample_value(name, labels) or 0.0


@pytest.mark.anyio
async def test_requests_are_counted_by_route_template(client: httpx2.AsyncClient) -> None:
    count = "http_request_duration_seconds_count"
    healthz = dict(method="GET", route="/healthz", status_code="200")
    mcp = dict(method="POST", route="/mcp", status_code="401")
    other = dict(method="GET", route="other", status_code="404")
    before = {k: sample(count, **v) for k, v in [("healthz", healthz), ("mcp", mcp), ("other", other)]}

    assert (await client.get("/healthz")).status_code == 200
    assert (await client.post("/mcp", json={})).status_code == 401
    assert (await client.get("/wp-login.php")).status_code == 404
    assert (await client.get("/.env")).status_code == 404

    assert sample(count, **healthz) == before["healthz"] + 1
    assert sample(count, **mcp) == before["mcp"] + 1
    # Unknown paths share one series, so scanners can't add one per path
    assert sample(count, **other) == before["other"] + 2


@pytest.mark.anyio
async def test_tool_calls_outcomes_and_empty_searches(state: server.KbState) -> None:
    calls = "kb_tool_calls_total"
    before = (
        sample(calls, tool="kb_search", outcome="ok"),
        sample(calls, tool="kb_get", outcome="error"),
        sample("kb_search_empty_total"),
        sample("kb_tool_duration_seconds_count", tool="kb_search"),
    )
    async with Client(server.create_mcp(state, auth=None)) as client:
        await client.call_tool("kb_search", {"query": "zzqqxx"})
        await client.call_tool("kb_get", {"ids": ["NOPE-999"]}, raise_on_error=False)

    assert sample(calls, tool="kb_search", outcome="ok") == before[0] + 1
    assert sample(calls, tool="kb_get", outcome="error") == before[1] + 1
    assert sample("kb_search_empty_total") == before[2] + 1
    assert sample("kb_tool_duration_seconds_count", tool="kb_search") == before[3] + 1


def test_every_tool_starts_at_zero() -> None:
    for tool in metrics.TOOLS:
        assert REGISTRY.get_sample_value("kb_tool_calls_total", {"tool": tool, "outcome": "error"}) is not None


def test_index_gauges_follow_a_refresh(state: server.KbState) -> None:
    assert sample("kb_index_entries") == state.entries
    assert sample("kb_index_build_seconds") == state.index.build_seconds
    assert sample("kb_index_built_timestamp_seconds") == state.built_at.timestamp()


def test_metrics_endpoint_on_its_own_port() -> None:
    httpd, _thread = metrics.serve(0)
    try:
        body = urllib.request.urlopen(f"http://127.0.0.1:{httpd.server_port}/metrics", timeout=5).read().decode()
    finally:
        httpd.shutdown()
    for name in ("http_request_duration_seconds_count", "kb_tool_calls_total", "kb_index_entries", "process_resident_memory_bytes"):
        assert re.search(rf"^{name}[{{ ]", body, re.M), name
