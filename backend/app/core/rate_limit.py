from __future__ import annotations

import math
import threading
import time
from collections import deque


class RateLimiter:
    def __init__(self, limit: int, window_seconds: int) -> None:
        if limit < 1 or window_seconds < 1:
            raise ValueError("Rate limit and window must be positive")
        self.limit = limit
        self.window_seconds = window_seconds
        self._attempts: dict[str, deque[float]] = {}
        self._last_cleanup = 0.0
        self._lock = threading.Lock()

    def consume(self, key: str, now: float | None = None) -> int | None:
        current_time = time.monotonic() if now is None else now
        with self._lock:
            if current_time - self._last_cleanup >= self.window_seconds:
                self._cleanup(current_time)

            attempts = self._attempts.setdefault(key, deque())
            self._expire(attempts, current_time)
            if len(attempts) >= self.limit:
                return max(
                    1,
                    math.ceil(self.window_seconds - (current_time - attempts[0])),
                )

            attempts.append(current_time)
            return None

    def _cleanup(self, now: float) -> None:
        expired_keys = []
        for key, attempts in self._attempts.items():
            self._expire(attempts, now)
            if not attempts:
                expired_keys.append(key)
        for key in expired_keys:
            del self._attempts[key]
        self._last_cleanup = now

    def _expire(self, attempts: deque[float], now: float) -> None:
        while attempts and now - attempts[0] >= self.window_seconds:
            attempts.popleft()
