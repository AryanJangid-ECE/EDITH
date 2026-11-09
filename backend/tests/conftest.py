from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.engine import Engine

from app.core.rate_limit import RateLimiter
from app.db import create_database_engine
from app.main import create_app
from app.routers import assistant as assistant_router
from app.routers import auth as auth_router


@pytest.fixture
def test_engine(tmp_path) -> Iterator[Engine]:
    test_engine = create_database_engine(f"sqlite:///{tmp_path / 'test.db'}")
    try:
        yield test_engine
    finally:
        test_engine.dispose()


@pytest.fixture
def api_client(test_engine: Engine, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    monkeypatch.setattr(auth_router, "login_rate_limiter", RateLimiter(limit=10, window_seconds=60))
    monkeypatch.setattr(
        assistant_router, "chat_rate_limiter", RateLimiter(limit=10, window_seconds=60)
    )
    application: FastAPI = create_app(test_engine)
    with TestClient(application) as client:
        yield client
