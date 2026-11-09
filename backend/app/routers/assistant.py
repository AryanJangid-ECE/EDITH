from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request

from app.config import Settings, get_settings
from app.core.errors import EdithError
from app.core.rate_limit import RateLimiter
from app.schemas.assistant import AssistantStatus, ChatRequest, ChatResponse
from app.services.assistant_provider import generate_reply

router = APIRouter(prefix="/api/assistant", tags=["assistant"])
chat_rate_limiter = RateLimiter(limit=10, window_seconds=60)


def enforce_chat_rate_limit(request: Request) -> None:
    client_host = request.client.host if request.client is not None else "unknown"
    retry_after = chat_rate_limiter.consume(client_host)
    if retry_after is not None:
        raise EdithError(
            "RATE_LIMITED",
            "Too many assistant requests. Please try again shortly.",
            status_code=429,
            headers={"Retry-After": str(retry_after)},
        )


@router.get("/status", response_model=AssistantStatus)
def assistant_status(
    settings: Annotated[Settings, Depends(get_settings)],
) -> AssistantStatus:
    if not settings.llm_enabled:
        return AssistantStatus(
            available=False,
            message="The AI assistant is disabled on the server.",
        )
    if not settings.anthropic_api_key.strip():
        return AssistantStatus(
            available=False,
            message="Configure LLM_ENABLED=true and ANTHROPIC_API_KEY on the backend.",
        )
    return AssistantStatus(available=True)


@router.post(
    "/chat",
    response_model=ChatResponse,
    dependencies=[Depends(enforce_chat_rate_limit)],
)
async def chat(
    payload: ChatRequest,
    settings: Annotated[Settings, Depends(get_settings)],
) -> ChatResponse:
    messages = [message.model_dump() for message in payload.messages]
    return ChatResponse(reply=await generate_reply(messages, settings))
