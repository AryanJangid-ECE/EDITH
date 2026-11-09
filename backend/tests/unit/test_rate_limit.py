from __future__ import annotations

import pytest

from app.core.rate_limit import RateLimiter


def test_rate_limiter_allows_limit_and_returns_retry_after() -> None:
    limiter = RateLimiter(limit=2, window_seconds=60)

    assert limiter.consume("client-a", now=100.0) is None
    assert limiter.consume("client-a", now=100.5) is None
    assert limiter.consume("client-a", now=101.0) == 59


def test_rate_limit_is_per_key_and_expires_at_window_boundary() -> None:
    limiter = RateLimiter(limit=1, window_seconds=10)

    assert limiter.consume("client-a", now=5.0) is None
    assert limiter.consume("client-b", now=5.0) is None
    assert limiter.consume("client-a", now=14.9) == 1
    assert limiter.consume("client-a", now=15.0) is None


@pytest.mark.parametrize(("limit", "window"), [(0, 60), (10, 0), (-1, 60)])
def test_invalid_rate_limit_configuration_is_rejected(limit: int, window: int) -> None:
    with pytest.raises(ValueError, match="must be positive"):
        RateLimiter(limit=limit, window_seconds=window)
