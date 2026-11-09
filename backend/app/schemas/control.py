from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ControlActionRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    app_id: str
    action: str
    target: str
    previous_state: dict[str, Any]
    new_state: dict[str, Any]
    reason: str | None = None
    undone: bool = False
    ts: datetime
    sim_tick: int = 0


class PermissionActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    permission: dict[str, Any]
    app_score: int | None = None
    action_id: str


class StatusActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    app: dict[str, Any]
    app_score: int | None = None
    action_id: str


class UndoActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    action: dict[str, Any]
    app_score: int | None = None
    action_id: str
