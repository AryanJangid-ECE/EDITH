from __future__ import annotations

import logging
from collections.abc import Sequence

import httpx

from app.config import Settings
from app.core.errors import EdithError

logger = logging.getLogger(__name__)

ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_API_VERSION = "2023-06-01"
MAX_RESPONSE_TOKENS = 512
REQUEST_TIMEOUT_SECONDS = 20.0
SYSTEM_PROMPT = """You are E.D.I.T.H. AI Assistant, a professional and friendly guide to the
E.D.I.T.H. digital identity and cybersecurity-awareness platform. Explain identity,
privacy, trust, and platform features clearly. Be concise, honest, and practical.
Do not claim to inspect a user's accounts, device, apps, or live platform data.
The platform's app activity and trust indicators are simulated estimates, not proof
of safety or wrongdoing. Never request passwords, API keys, or sensitive personal data."""


async def generate_reply(
    messages: Sequence[dict[str, str]],
    settings: Settings,
    *,
    transport: httpx.AsyncBaseTransport | None = None,
) -> str:
    if not settings.llm_enabled or not settings.anthropic_api_key.strip():
        raise EdithError(
            "AI_UNAVAILABLE",
            "The AI assistant is not configured. Set LLM_ENABLED=true and "
            "ANTHROPIC_API_KEY on the backend, then restart it.",
            status_code=503,
        )

    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": ANTHROPIC_API_VERSION,
        "content-type": "application/json",
    }
    payload = {
        "model": settings.anthropic_model,
        "max_tokens": MAX_RESPONSE_TOKENS,
        "system": SYSTEM_PROMPT,
        "messages": [
            {"role": message["role"], "content": message["content"]} for message in messages
        ],
    }

    try:
        async with httpx.AsyncClient(
            timeout=REQUEST_TIMEOUT_SECONDS,
            transport=transport,
        ) as client:
            response = await client.post(ANTHROPIC_MESSAGES_URL, headers=headers, json=payload)
        response.raise_for_status()
        body = response.json()
        if not isinstance(body, dict):
            raise ValueError("Provider response must be an object")
        content = body.get("content", [])
        reply = "\n".join(
            block["text"]
            for block in content
            if isinstance(block, dict) and block.get("type") == "text" and block.get("text")
        ).strip()
        if not reply:
            raise ValueError("Provider response did not contain text")
        return reply
    except httpx.TimeoutException as exc:
        logger.warning("Assistant provider request timed out")
        raise EdithError(
            "AI_UNAVAILABLE",
            "The AI service took too long to respond. Please try again.",
            status_code=503,
        ) from exc
    except httpx.HTTPStatusError as exc:
        logger.warning("Assistant provider returned HTTP %s", exc.response.status_code)
        raise EdithError(
            "AI_UNAVAILABLE",
            "The AI service is temporarily unavailable. Please try again.",
            status_code=503,
        ) from exc
    except (httpx.RequestError, ValueError, KeyError, TypeError) as exc:
        logger.warning("Assistant provider response could not be used")
        raise EdithError(
            "AI_UNAVAILABLE",
            "The AI service is temporarily unavailable. Please try again.",
            status_code=503,
        ) from exc
