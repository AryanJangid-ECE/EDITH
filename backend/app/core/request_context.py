from __future__ import annotations

import logging
import re
import uuid
from contextvars import ContextVar
from typing import Any

from starlette.types import ASGIApp, Message, Receive, Scope, Send

request_id_context: ContextVar[str] = ContextVar("request_id", default="-")
_REQUEST_ID_PATTERN = re.compile(r"[A-Za-z0-9._-]{1,128}\Z")


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_context.get()
        return True


def configure_logging(level: str) -> None:
    numeric_level = logging.getLevelName(level.upper())
    if not isinstance(numeric_level, int):
        raise ValueError("LOG_LEVEL must be a valid Python logging level")

    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)
    if not root_logger.handlers:
        root_logger.addHandler(logging.StreamHandler())

    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s request_id=%(request_id)s %(name)s: %(message)s"
    )
    for handler in root_logger.handlers:
        if not any(isinstance(item, RequestIdFilter) for item in handler.filters):
            handler.addFilter(RequestIdFilter())
        handler.setFormatter(formatter)


def request_id_from_scope(scope: Scope) -> str:
    state = scope.setdefault("state", {})
    request_id = state.get("request_id")
    if isinstance(request_id, str):
        return request_id
    return "-"


class RequestContextMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] not in {"http", "websocket"}:
            await self.app(scope, receive, send)
            return

        supplied_id = self._request_header(scope, b"x-request-id")
        request_id = supplied_id if _REQUEST_ID_PATTERN.fullmatch(supplied_id) else uuid.uuid4().hex
        state = scope.setdefault("state", {})
        state["request_id"] = request_id
        token = request_id_context.set(request_id)

        async def send_with_request_id(message: Message) -> None:
            if message["type"] in {"http.response.start", "websocket.accept"}:
                headers = [
                    (key, value)
                    for key, value in message.get("headers", [])
                    if key.lower() != b"x-request-id"
                ]
                headers.append((b"x-request-id", request_id.encode("ascii")))
                message = {**message, "headers": headers}
            await send(message)

        try:
            await self.app(scope, receive, send_with_request_id)
        finally:
            request_id_context.reset(token)

    @staticmethod
    def _request_header(scope: Scope, name: bytes) -> str:
        value = next((value for key, value in scope.get("headers", []) if key.lower() == name), b"")
        try:
            return value.decode("ascii")
        except UnicodeDecodeError:
            return ""


def error_headers(request_id: str) -> dict[str, str]:
    return {"X-Request-ID": request_id}


def validation_error_details(errors: list[dict[str, Any]]) -> list[dict[str, str]]:
    return [
        {
            "field": ".".join(str(part) for part in error.get("loc", ())),
            "message": str(error.get("msg", "Invalid value")),
            "type": str(error.get("type", "value_error")),
        }
        for error in errors
    ]
