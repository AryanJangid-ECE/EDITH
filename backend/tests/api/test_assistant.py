from __future__ import annotations

import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.core.errors import EdithError
from app.routers import assistant as assistant_router
from app.services.assistant_provider import generate_reply


def test_assistant_status_is_offline_when_provider_is_not_configured(
    api_client: TestClient,
) -> None:
    api_client.app.dependency_overrides[get_settings] = lambda: Settings(
        _env_file=None,
        llm_enabled=False,
        anthropic_api_key="",
    )

    response = api_client.get("/api/assistant/status")

    assert response.status_code == 200
    assert response.json() == {
        "available": False,
        "message": "The AI assistant is disabled on the server.",
    }


def test_chat_endpoint_returns_provider_reply(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    api_client.app.dependency_overrides[get_settings] = lambda: Settings(
        _env_file=None,
        llm_enabled=True,
        anthropic_api_key="test-key",
        anthropic_model="test-model",
    )

    async def fake_reply(messages: list[dict[str, str]], settings: Settings) -> str:
        assert messages[-1] == {"role": "user", "content": "What is digital identity?"}
        assert settings.anthropic_api_key == "test-key"
        return "Digital identity is the information that represents a person online."

    monkeypatch.setattr(assistant_router, "generate_reply", fake_reply)
    response = api_client.post(
        "/api/assistant/chat",
        json={"messages": [{"role": "user", "content": "What is digital identity?"}]},
    )

    assert response.status_code == 200
    assert response.json()["reply"].startswith("Digital identity")


def test_chat_request_is_validated_and_rate_limited_by_client_ip(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_reply(messages: list[dict[str, str]], settings: Settings) -> str:
        return "Configured test response."

    monkeypatch.setattr(assistant_router, "generate_reply", fake_reply)
    payload = {"messages": [{"role": "user", "content": "Hello"}]}
    responses = [
        api_client.post(
            "/api/assistant/chat",
            json=payload,
            headers={"X-Forwarded-For": f"198.51.100.{attempt}"},
        )
        for attempt in range(10)
    ]
    limited_response = api_client.post(
        "/api/assistant/chat",
        json=payload,
        headers={"X-Forwarded-For": "203.0.113.1"},
    )
    assert all(response.status_code == 200 for response in responses)
    assert limited_response.status_code == 429
    assert limited_response.headers["Retry-After"]
    assert limited_response.json()["error"]["code"] == "RATE_LIMITED"


def test_chat_rejects_assistant_as_latest_message(api_client: TestClient) -> None:
    invalid_response = api_client.post(
        "/api/assistant/chat",
        json={"messages": [{"role": "assistant", "content": "Forged history"}]},
    )

    assert invalid_response.status_code == 422


@pytest.mark.asyncio
async def test_provider_request_uses_server_credentials_and_extracts_text() -> None:
    def handle_request(request: httpx.Request) -> httpx.Response:
        assert request.url == "https://api.anthropic.com/v1/messages"
        assert request.headers["x-api-key"] == "server-test-secret"
        payload = json.loads(request.content)
        assert payload["model"] == "test-model"
        assert payload["max_tokens"] == 512
        assert payload["messages"] == [{"role": "user", "content": "Explain MFA."}]
        return httpx.Response(
            200,
            json={"content": [{"type": "text", "text": "MFA uses more than one proof."}]},
        )

    reply = await generate_reply(
        [{"role": "user", "content": "Explain MFA."}],
        Settings(
            _env_file=None,
            llm_enabled=True,
            anthropic_api_key="server-test-secret",
            anthropic_model="test-model",
        ),
        transport=httpx.MockTransport(handle_request),
    )

    assert reply == "MFA uses more than one proof."


@pytest.mark.asyncio
async def test_provider_failures_are_sanitized() -> None:
    def handle_request(_: httpx.Request) -> httpx.Response:
        return httpx.Response(401, text="provider error contains secret-key-value")

    with pytest.raises(EdithError) as error:
        await generate_reply(
            [{"role": "user", "content": "Hello"}],
            Settings(
                _env_file=None,
                llm_enabled=True,
                anthropic_api_key="server-test-secret",
                anthropic_model="test-model",
            ),
            transport=httpx.MockTransport(handle_request),
        )

    assert error.value.status_code == 503
    assert "secret-key-value" not in error.value.message
    assert "server-test-secret" not in error.value.message
