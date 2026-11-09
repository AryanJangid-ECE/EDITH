from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from sqlalchemy.orm import Session

from app.auth import create_token, require_user, verify_password
from app.core.errors import RateLimitError, UnauthorizedError
from app.core.rate_limit import RateLimiter
from app.db import get_db
from app.models.app_models import User

router = APIRouter(prefix="/api/auth")
login_rate_limiter = RateLimiter(limit=10, window_seconds=60)


def enforce_login_rate_limit(request: Request) -> None:
    client_host = request.client.host if request.client is not None else "unknown"
    retry_after = login_rate_limiter.consume(client_host)
    if retry_after is not None:
        raise RateLimitError(retry_after)


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: Annotated[str, StringConstraints(min_length=3, max_length=254, strip_whitespace=True)]
    password: str = Field(min_length=1, max_length=72)


@router.post("/login", dependencies=[Depends(enforce_login_rate_limit)])
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> dict[str, object]:
    user = db.query(User).filter(User.email == payload.email.lower()).one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise UnauthorizedError("INVALID_CREDENTIALS", "Invalid email or password")
    token = create_token(user)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "role": user.role},
    }


@router.get("/me")
def me(current_user: Annotated[User, Depends(require_user)]) -> dict[str, object]:
    return {"id": current_user.id, "email": current_user.email, "role": current_user.role}
