from __future__ import annotations

from typing import Any


class EdithError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        self.headers = headers or {}


class BadRequestError(EdithError):
    def __init__(
        self,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(code, message, status_code=400, details=details)


class UnauthorizedError(EdithError):
    def __init__(
        self,
        code: str = "UNAUTHORIZED",
        message: str = "Authentication required",
        details: dict[str, Any] | None = None,
    ):
        super().__init__(code, message, status_code=401, details=details)


class ForbiddenError(EdithError):
    def __init__(
        self,
        code: str = "FORBIDDEN",
        message: str = "Access forbidden",
        details: dict[str, Any] | None = None,
    ):
        super().__init__(code, message, status_code=403, details=details)


class NotFoundError(EdithError):
    def __init__(
        self,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(code, message, status_code=404, details=details)


class ConflictError(EdithError):
    def __init__(
        self,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(code, message, status_code=409, details=details)


class RateLimitError(EdithError):
    def __init__(self, retry_after: int) -> None:
        super().__init__(
            "RATE_LIMITED",
            "Too many login attempts",
            status_code=429,
            headers={"Retry-After": str(retry_after)},
        )


class ValidationError(EdithError):
    def __init__(
        self,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(code, message, status_code=422, details=details)


def error_response(error: EdithError) -> dict[str, object]:
    return {
        "error": {
            "code": error.code,
            "message": error.message,
            "details": error.details,
        }
    }
