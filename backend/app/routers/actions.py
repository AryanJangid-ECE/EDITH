from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import require_owner, require_user
from app.db import get_db
from app.models.app_models import ControlAction, User
from app.services.control import undo

router = APIRouter(prefix="/api")


@router.get("/actions")
def list_actions(
    *,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_user)],
    app_id: str | None = None,
    limit: int = 20,
) -> dict[str, object]:
    _ = current_user
    query = db.query(ControlAction)
    if app_id:
        query = query.filter(ControlAction.app_id == app_id)
    rows = query.order_by(ControlAction.ts.desc()).limit(limit).all()
    return {
        "items": [
            {
                "id": row.id,
                "app_id": row.app_id,
                "action": row.action,
                "target": row.target,
                "previous_state": row.previous_state,
                "new_state": row.new_state,
                "reason": row.reason,
                "undone": row.undone,
                "ts": row.ts.isoformat(),
                "sim_tick": row.sim_tick,
            }
            for row in rows
        ]
    }


@router.post("/actions/{action_id}/undo")
def undo_action(
    *,
    action_id: str,
    db: Annotated[Session, Depends(get_db)],
    actor: Annotated[User, Depends(require_owner)],
    reason: str | None = None,
) -> dict[str, object]:
    result = undo(db, action_id=action_id, actor=actor, reason=reason)
    db.commit()
    return {
        "action": result.new_state,
        "app_score": result.app_score,
        "action_id": result.action_id,
    }
