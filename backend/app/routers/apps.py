from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import require_owner, require_user
from app.core.errors import NotFoundError
from app.db import get_db
from app.models.app_models import App, User
from app.schemas.apps import AppDetail, AppStatusActionRequest, AppSummary, PermissionActionRequest
from app.services.apps_query import get_app_detail, list_apps
from app.services.control import set_permission, set_status

router = APIRouter(prefix="/api")


@router.get("/apps", response_model=list[AppSummary])
def list_apps_endpoint(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_user)],
) -> list[dict[str, Any]]:
    _ = current_user
    return list_apps(db)


@router.get("/apps/{app_id}", response_model=AppDetail)
def app_detail_endpoint(
    app_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_user)],
) -> dict[str, Any]:
    _ = current_user
    details = get_app_detail(db, app_id)
    if details is None:
        raise NotFoundError("APP_NOT_FOUND", "App not found")
    return details


@router.post("/apps/{app_id}/permissions/{resource}/action", response_model=dict[str, Any])
def permission_action_endpoint(
    app_id: str,
    resource: str,
    payload: PermissionActionRequest,
    db: Annotated[Session, Depends(get_db)],
    actor: Annotated[User, Depends(require_owner)],
) -> dict[str, Any]:
    app = db.query(App).filter(App.id == app_id).one_or_none()
    if app is None:
        raise NotFoundError("APP_NOT_FOUND", "App not found")

    result = set_permission(
        db,
        app=app,
        resource=resource,
        action=payload.action,
        options=payload.options.model_dump() if payload.options else None,
        actor=actor,
        reason=payload.reason,
        create_if_missing=True,
    )
    db.commit()
    return {
        "permission": result.new_state,
        "app_score": result.app_score,
        "action_id": result.action_id,
    }


@router.post("/apps/{app_id}/status", response_model=dict[str, Any])
def app_status_endpoint(
    app_id: str,
    payload: AppStatusActionRequest,
    db: Annotated[Session, Depends(get_db)],
    actor: Annotated[User, Depends(require_owner)],
) -> dict[str, Any]:
    app = db.query(App).filter(App.id == app_id).one_or_none()
    if app is None:
        raise NotFoundError("APP_NOT_FOUND", "App not found")

    result = set_status(db, app=app, action=payload.action, actor=actor, reason=payload.reason)
    db.commit()
    return {"app": result.new_state, "app_score": result.app_score, "action_id": result.action_id}
