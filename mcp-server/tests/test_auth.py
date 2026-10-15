"""Sign-in: discovery, the owner gate, PKCE and redirect URIs, through the real routes.

The cases follow johnhringiv/notes-mcp's tests/test_auth.py (owner gets a token, stranger rejected, wrong PKCE
verifier, 401 with WWW-Authenticate), adapted to FastMCP's OAuth proxy, which adds a consent page before GitHub.
"""

from __future__ import annotations

import base64
import hashlib
import re
import secrets
from urllib.parse import parse_qs, urlparse

import httpx2
import pytest
from conftest import COMMIT, sse_json
from fastmcp.server.auth.cimd import CIMDDocument

import server

pytestmark = pytest.mark.anyio

RESOURCE = f"{server.PUBLIC_URL}/mcp"
CLAUDE_AI = "https://claude.ai/api/mcp/auth_callback"
MCP_HEADERS = {"Accept": "application/json, text/event-stream", "Content-Type": "application/json"}


def pkce_pair() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(48)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
    return verifier, challenge


async def register(client: httpx2.AsyncClient, redirect_uri: str = CLAUDE_AI) -> httpx2.Response:
    """Dynamic client registration, the way Claude does it when it doesn't use CIMD."""
    return await client.post(
        "/register",
        json={
            "client_name": "Claude",
            "redirect_uris": [redirect_uri],
            "grant_types": ["authorization_code", "refresh_token"],
            "response_types": ["code"],
            "token_endpoint_auth_method": "none",
        },
    )


async def sign_in(
    client: httpx2.AsyncClient, client_id: str, challenge: str, github_code: str, redirect_uri: str = CLAUDE_AI
) -> httpx2.Response:
    """/authorize, approve the consent page, GitHub's redirect to /auth/callback. Returns the callback's response."""
    authorize = await client.get(
        "/authorize",
        params={
            "client_id": client_id,
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "state": "claude-state",
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "resource": RESOURCE,
        },
    )
    assert authorize.status_code in (302, 303, 307), authorize.text
    consent = await client.get(authorize.headers["location"])
    assert consent.status_code == 200, consent.text
    form = dict(re.findall(r'name="(txn_id|csrf_token)" value="([^"]+)"', consent.text))
    approved = await client.post("/consent", data={**form, "action": "approve"})
    assert approved.status_code in (302, 303), approved.text
    to_github = urlparse(approved.headers["location"])
    assert to_github.netloc == "github.com"
    github_params = parse_qs(to_github.query)
    assert github_params["redirect_uri"] == [f"{server.PUBLIC_URL}/auth/callback"]
    assert github_params["scope"] == ["read:user"]
    return await client.get("/auth/callback", params={"code": github_code, "state": github_params["state"][0]})


async def exchange(
    client: httpx2.AsyncClient, client_id: str, verifier: str, code: str, redirect_uri: str = CLAUDE_AI
) -> httpx2.Response:
    return await client.post(
        "/token",
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "code_verifier": verifier,
            "resource": RESOURCE,
        },
    )


def code_from(callback: httpx2.Response, redirect_uri: str = CLAUDE_AI) -> str:
    assert callback.status_code == 302, callback.text
    redirect = urlparse(callback.headers["location"])
    assert f"{redirect.scheme}://{redirect.netloc}{redirect.path}" == redirect_uri
    query = parse_qs(redirect.query)
    assert query["state"] == ["claude-state"]
    # RFC 9207: Claude Code fails a sign-in whose authorization response names an unexpected issuer
    assert query["iss"] == [f"{server.PUBLIC_URL}/"]
    return query["code"][0]


async def owner_token(client: httpx2.AsyncClient) -> dict:
    client_id = (await register(client)).json()["client_id"]
    verifier, challenge = pkce_pair()
    code = code_from(await sign_in(client, client_id, challenge, "owner-code"))
    response = await exchange(client, client_id, verifier, code)
    assert response.status_code == 200, response.text
    return response.json()


async def call(client: httpx2.AsyncClient, token: str, method: str, params: dict | None = None) -> httpx2.Response:
    return await client.post(
        "/mcp",
        headers={**MCP_HEADERS, "Authorization": f"Bearer {token}"},
        json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params or {}},
    )


# discovery


async def test_mcp_requires_token_with_www_authenticate(client: httpx2.AsyncClient) -> None:
    response = await client.post("/mcp", headers=MCP_HEADERS, json={"jsonrpc": "2.0", "id": 1, "method": "ping"})
    assert response.status_code == 401
    challenge = response.headers["www-authenticate"]
    assert challenge.startswith("Bearer ")
    assert f'resource_metadata="{server.PUBLIC_URL}/.well-known/oauth-protected-resource/mcp"' in challenge


async def test_garbage_bearer_token_rejected(client: httpx2.AsyncClient) -> None:
    response = await call(client, "nonsense", "tools/list")
    assert response.status_code == 401


@pytest.mark.parametrize("path", ["/.well-known/oauth-protected-resource/mcp", "/.well-known/oauth-protected-resource"])
async def test_protected_resource_metadata(client: httpx2.AsyncClient, path: str) -> None:
    response = await client.get(path)
    assert response.status_code == 200
    metadata = response.json()
    # "must equal the URL as the user enters it in Claude, including any path component"
    assert metadata["resource"] == RESOURCE
    # Claude uses the first entry and doesn't fall back
    assert metadata["authorization_servers"] == [f"{server.PUBLIC_URL}/"]


async def test_authorization_server_metadata(client: httpx2.AsyncClient) -> None:
    response = await client.get("/.well-known/oauth-authorization-server")
    assert response.status_code == 200
    metadata = response.json()
    assert metadata["code_challenge_methods_supported"] == ["S256"]
    # Both are needed before Claude picks CIMD over DCR
    assert metadata["client_id_metadata_document_supported"] is True
    assert "none" in metadata["token_endpoint_auth_methods_supported"]
    assert metadata["authorization_response_iss_parameter_supported"] is True


async def test_health_needs_no_token(client: httpx2.AsyncClient) -> None:
    response = await client.get("/healthz")
    assert response.status_code == 200


# the owner gate


async def test_owner_gets_a_token_and_calls_kb_status(client: httpx2.AsyncClient) -> None:
    token = await owner_token(client)
    # GitHub OAuth App tokens don't expire, but Claude Code re-authenticates hourly without expires_in
    assert token["expires_in"] > 0
    response = await call(client, token["access_token"], "tools/call", {"name": "kb_status", "arguments": {}})
    assert response.status_code == 200, response.text
    result = sse_json(response)["result"]
    assert result.get("isError") is not True
    assert "structuredContent" not in result
    [content] = result["content"]
    assert content["type"] == "text"
    assert f"Commit: {COMMIT}" in content["text"]
    assert "Entries: 2" in content["text"]


@pytest.mark.parametrize("github_code", ["stranger-code", "impostor-code"])
async def test_stranger_is_rejected_at_sign_in(
    client: httpx2.AsyncClient,
    auth: server.OwnerOnlyGitHubProvider,
    monkeypatch: pytest.MonkeyPatch,
    github_code: str,
) -> None:
    # Catch the authorization code FastMCP stores before the gate drops it
    codes: list[str] = []
    put = auth._code_store.put

    async def recording_put(*args, **kwargs):
        codes.append(kwargs["key"])
        return await put(*args, **kwargs)

    monkeypatch.setattr(auth._code_store, "put", recording_put)
    client_id = (await register(client)).json()["client_id"]
    verifier, challenge = pkce_pair()
    callback = await sign_in(client, client_id, challenge, github_code)
    assert callback.status_code == 403
    assert "location" not in callback.headers
    # Even with the code and the right verifier, there's no token to get
    [code] = codes
    response = await exchange(client, client_id, verifier, code)
    assert response.status_code == 401
    assert response.json()["error"] == "invalid_grant"


async def test_token_for_another_account_is_unusable(
    client: httpx2.AsyncClient, auth: server.OwnerOnlyGitHubProvider
) -> None:
    """The per-request check: a FastMCP token whose GitHub account isn't the owner's gets a 401."""
    token = await owner_token(client)
    assert (await call(client, token["access_token"], "tools/list")).status_code == 200
    auth._allowed_github_id = "4004"
    assert (await call(client, token["access_token"], "tools/list")).status_code == 401


async def test_wrong_pkce_verifier_rejected(client: httpx2.AsyncClient) -> None:
    client_id = (await register(client)).json()["client_id"]
    _, challenge = pkce_pair()
    code = code_from(await sign_in(client, client_id, challenge, "owner-code"))
    response = await exchange(client, client_id, "not-the-right-verifier-" * 3, code)
    # FastMCP answers invalid_grant with a 401, after the MCP spec's "Invalid or expired tokens MUST receive a HTTP
    # 401 response"; the SDK under it would send a 400
    assert response.status_code == 401
    assert response.json()["error"] == "invalid_grant"


# CIMD, which Claude prefers: these are Claude's client metadata documents as fetched from claude.ai on 2026-10-15
# (Claude Code's is documented; hosted Claude's isn't)

CLAUDE_CODE_CIMD = {
    "client_id": "https://claude.ai/oauth/claude-code-client-metadata",
    "client_name": "Claude Code",
    "client_uri": "https://claude.ai",
    "redirect_uris": ["http://localhost/callback", "http://127.0.0.1/callback"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none",
}
HOSTED_CLAUDE_CIMD = {
    "client_id": "https://claude.ai/oauth/mcp-oauth-client-metadata",
    "client_name": "Claude",
    "client_uri": "https://claude.ai",
    "redirect_uris": ["https://claude.ai/api/mcp/auth_callback"],
    "grant_types": ["authorization_code", "refresh_token", "urn:ietf:params:oauth:grant-type:jwt-bearer"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none",
}


@pytest.mark.parametrize(
    ("document", "redirect_uri"),
    [
        (HOSTED_CLAUDE_CIMD, CLAUDE_AI),
        # Claude Code listens on a random port: "match both with the port component ignored"
        (CLAUDE_CODE_CIMD, "http://localhost:54321/callback"),
        (CLAUDE_CODE_CIMD, "http://127.0.0.1:41917/callback"),
    ],
)
async def test_owner_signs_in_with_claudes_cimd_client_ids(
    client: httpx2.AsyncClient,
    auth: server.OwnerOnlyGitHubProvider,
    monkeypatch: pytest.MonkeyPatch,
    document: dict,
    redirect_uri: str,
) -> None:
    async def fetch(client_id_url: str) -> CIMDDocument:
        assert client_id_url == document["client_id"]
        return CIMDDocument.model_validate(document)

    monkeypatch.setattr(auth._cimd_manager._fetcher, "fetch", fetch)
    verifier, challenge = pkce_pair()
    callback = await sign_in(client, document["client_id"], challenge, "owner-code", redirect_uri)
    response = await exchange(client, document["client_id"], verifier, code_from(callback, redirect_uri), redirect_uri)
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    assert (await call(client, token, "tools/list")).status_code == 200


# redirect URIs


@pytest.mark.parametrize(
    "redirect_uri",
    [
        "https://claude.ai/api/mcp/auth_callback",
        "https://claude.com/api/mcp/auth_callback",
        "http://localhost:53682/callback",
        "http://127.0.0.1:41917/callback",
        "http://localhost/callback",
    ],
)
async def test_claude_redirect_uris_register(client: httpx2.AsyncClient, redirect_uri: str) -> None:
    response = await register(client, redirect_uri)
    assert response.status_code == 201, response.text


@pytest.mark.parametrize(
    "redirect_uri",
    [
        "https://evil.example/api/mcp/auth_callback",
        "https://claude.ai/somewhere-else",
        "http://localhost:53682/other",
        "http://localhost@evil.example/callback",
        "https://claude.ai.evil.example/api/mcp/auth_callback",
    ],
)
async def test_other_redirect_uris_are_refused(client: httpx2.AsyncClient, redirect_uri: str) -> None:
    response = await register(client, redirect_uri)
    assert response.status_code == 400, response.text
