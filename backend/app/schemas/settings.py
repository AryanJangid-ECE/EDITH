from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class SettingsPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    auto_grant_requests: bool | None = None
    llm_enabled: bool | None = None
    simple_mode: bool | None = None


class SettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    auto_grant_requests: bool = True
    llm_enabled: bool = False
    simple_mode: bool = False
