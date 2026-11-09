from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class PermissionOptions(BaseModel):
    model_config = ConfigDict(extra="forbid")

    foreground_only: bool = True
    max_per_tick: int | None = Field(default=None, ge=1, le=100)


class PermissionActionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action: Literal["approve", "restrict", "revoke"]
    options: PermissionOptions | None = None
    reason: str | None = Field(default=None, max_length=500)


class AppStatusActionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action: Literal["suspend", "resume"]
    reason: str | None = Field(default=None, max_length=500)


class PermissionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    resource: str
    state: str
    options: dict[str, Any] | None = None
    granted_at: datetime | None = None
    granted_tick: int
    requested_by: str = "install"
    sensitivity_weight: int = 0
    expected_for_category: bool = False
    last_used_ts: datetime | None = None
    uses_24h: int = 0


class AppSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str
    status: str
    score: int | None = None
    band: str | None = None
    confidence: str | None = None
    prev_score: int | None = None
    open_alerts: int = 0
    last_activity_ts: datetime | None = None
    sparkline: list[dict[str, Any]] = []


class AppDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str
    status: str
    score: int | None = None
    band: str | None = None
    confidence: str | None = None
    prev_score: int | None = None
    permissions: list[PermissionSummary]
    open_alerts: int = 0
    open_recommendations: list[dict[str, Any]] = []
    open_incident: dict[str, Any] | None = None
