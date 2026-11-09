from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Annotated

import bcrypt
import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.errors import ForbiddenError, UnauthorizedError
from app.db import get_db
from app.models.app_models import User

security = HTTPBearer(auto_error=False)
settings = get_settings()


def hash_password(password: str) -> str:
    encoded_password = password.encode("utf-8")
    if len(encoded_password) > 72:
        raise ValueError("Password exceeds bcrypt's 72-byte limit")
    return bcrypt.hashpw(encoded_password, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    encoded_password = password.encode("utf-8")
    if len(encoded_password) > 72:
        return False
    return bcrypt.checkpw(encoded_password, password_hash.encode("utf-8"))


def create_token(user: User) -> str:
    payload = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "exp": datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def get_current_user_from_token(token: str) -> User:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError as exc:  # type: ignore[attr-defined]
        raise UnauthorizedError("INVALID_TOKEN", "Invalid or expired token") from exc
    return User(
        id=payload.get("sub", ""),
        email=payload.get("email", ""),
        password_hash="",
        role=payload.get("role", "viewer"),
    )


def require_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    if not credentials:
        raise UnauthorizedError("MISSING_TOKEN", "Authentication required")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError as exc:  # type: ignore[attr-defined]
        raise UnauthorizedError("INVALID_TOKEN", "Invalid or expired token") from exc

    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if user is None:
        raise UnauthorizedError("USER_NOT_FOUND", "User not found")
    return user


def require_owner(user: Annotated[User, Depends(require_user)]) -> User:
    if user.role != "owner":
        raise ForbiddenError("FORBIDDEN", "Owner access required")
    return user
