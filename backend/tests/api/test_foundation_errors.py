from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.config import get_settings
from app.core.rate_limit import RateLimiter
from app.core.request_context import RequestContextMiddleware
from app.main import handle_unexpected_error
from app.routers import auth as auth_router


def test_request_id_is_returned_and_valid_client_id_is_preserved(api_client: TestClient) -> None:
    response = api_client.get(
        "/api/health",
        headers={"X-Request-ID": "phase4-test-id"},
    )

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "phase4-test-id"


def test_validation_error_is_uniform_and_does_not_echo_credentials(
    api_client: TestClient,
) -> None:
    email = "private-input@example.test"
    password = "private-password-value"
    response = api_client.post(
        "/api/auth/login",
        json={"email": email, "password": password, "unexpected": "private-extra-value"},
        headers={"X-Request-ID": "validation-test"},
    )

    assert response.status_code == 422
    assert response.headers["X-Request-ID"] == "validation-test"
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert email not in response.text
    assert password not in response.text
    assert "private-extra-value" not in response.text
    assert all("input" not in field for field in response.json()["error"]["details"]["fields"])


def test_not_found_error_uses_uniform_body_and_request_id(api_client: TestClient) -> None:
    response = api_client.get("/api/not-a-route")

    assert response.status_code == 404
    assert response.headers.get("X-Request-ID")
    assert response.json()["error"]["code"] == "NOT_FOUND"
    assert response.json()["error"]["details"] == {}


def test_invalid_request_id_is_replaced(api_client: TestClient) -> None:
    response = api_client.get(
        "/api/health",
        headers={"X-Request-ID": "contains spaces and secrets"},
    )

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] != "contains spaces and secrets"
    assert response.headers["X-Request-ID"].isascii()


def test_demo_owner_can_login_and_read_identity(api_client: TestClient) -> None:
    settings = get_settings()
    response = api_client.post(
        "/api/auth/login",
        json={
            "email": settings.demo_owner_email,
            "password": settings.demo_owner_password,
        },
    )

    assert response.status_code == 200
    token = response.json()["access_token"]
    identity = api_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert identity.status_code == 200
    assert identity.json()["role"] == "owner"


def test_missing_identity_token_returns_uniform_error(api_client: TestClient) -> None:
    response = api_client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.headers.get("X-Request-ID")
    assert response.json()["error"]["code"] == "MISSING_TOKEN"


def test_login_rate_limit_returns_retry_after(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(auth_router, "login_rate_limiter", RateLimiter(limit=10, window_seconds=60))
    payload = {"email": "unknown@example.test", "password": "not-the-password"}

    responses = [
        api_client.post(
            "/api/auth/login",
            json=payload,
            headers={"X-Forwarded-For": f"198.51.100.{attempt}"},
        )
        for attempt in range(10)
    ]
    limited_response = api_client.post(
        "/api/auth/login",
        json=payload,
        headers={"X-Forwarded-For": "203.0.113.1"},
    )

    assert all(response.status_code == 401 for response in responses)
    assert limited_response.status_code == 429
    assert limited_response.headers["Retry-After"] == "60"
    assert limited_response.json()["error"]["code"] == "RATE_LIMITED"


def test_unexpected_error_is_logged_but_not_exposed_to_client() -> None:
    application = FastAPI()
    application.add_middleware(RequestContextMiddleware)
    application.add_exception_handler(Exception, handle_unexpected_error)

    @application.get("/failure")
    async def fail() -> None:
        raise RuntimeError("private stack detail")

    with TestClient(application, raise_server_exceptions=False) as client:
        response = client.get("/failure", headers={"X-Request-ID": "error-test"})

    assert response.status_code == 500
    assert response.headers["X-Request-ID"] == "error-test"
    assert response.json()["error"]["code"] == "INTERNAL_ERROR"
    assert "private stack detail" not in response.text
