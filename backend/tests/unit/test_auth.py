from __future__ import annotations

from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app import auth
from app.auth import get_current_user_from_token, hash_password, verify_password
from app.core.errors import UnauthorizedError


def test_password_hash_verifies_without_storing_plaintext() -> None:
    password = "correct horse battery staple"
    password_hash = hash_password(password)

    assert password_hash != password
    assert verify_password(password, password_hash)
    assert not verify_password("incorrect password", password_hash)


def test_bcrypt_password_limit_is_handled_explicitly() -> None:
    password = "a" * 73

    with pytest.raises(ValueError, match="72-byte limit"):
        hash_password(password)
    assert not verify_password(password, "$2b$12$invalid")


def test_expired_jwt_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(auth.settings, "jwt_secret", "a sufficiently long test secret value")
    token = jwt.encode(
        {"sub": "user-id", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        auth.settings.jwt_secret,
        algorithm="HS256",
    )

    with pytest.raises(UnauthorizedError, match="Invalid or expired token"):
        get_current_user_from_token(token)
