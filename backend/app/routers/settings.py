from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import require_owner, require_user
from app.db import get_db
from app.models.app_models import Setting, User
from app.schemas.settings import SettingsPayload, SettingsResponse

router = APIRouter(prefix="/api")


@router.get("/settings", response_model=SettingsResponse)
def get_settings_endpoint(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_user)],
) -> dict[str, bool]:
    _ = current_user
    data = {
        "auto_grant_requests": True,
        "llm_enabled": False,
        "simple_mode": False,
    }
    for row in db.query(Setting).all():
        data[row.key] = row.value
    return data


@router.put("/settings", response_model=SettingsResponse)
def put_settings_endpoint(
    payload: SettingsPayload,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_owner)],
) -> dict[str, bool]:
    _ = current_user
    existing = {row.key: row.value for row in db.query(Setting).all()}
    final = {
        "auto_grant_requests": existing.get("auto_grant_requests", True),
        "llm_enabled": existing.get("llm_enabled", False),
        "simple_mode": existing.get("simple_mode", False),
    }
    if payload.auto_grant_requests is not None:
        final["auto_grant_requests"] = payload.auto_grant_requests
        existing["auto_grant_requests"] = payload.auto_grant_requests
    if payload.llm_enabled is not None:
        final["llm_enabled"] = payload.llm_enabled
        existing["llm_enabled"] = payload.llm_enabled
    if payload.simple_mode is not None:
        final["simple_mode"] = payload.simple_mode
        existing["simple_mode"] = payload.simple_mode

    for key, value in existing.items():
        if key in {"auto_grant_requests", "llm_enabled", "simple_mode"}:
            row = db.query(Setting).filter(Setting.key == key).one_or_none()
            if row is None:
                db.add(Setting(key=key, value=value))
            else:
                row.value = value
    return final
