from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from sqlalchemy.orm import Session

from app.models.app_models import AppPermission
from app.services.constants import is_sensitive

Outcome = Literal["allowed", "limited", "blocked"]
Context = Literal["foreground", "background", "unknown"]


@dataclass(frozen=True)
class PermissionView:
    state: str
    foreground_only: bool = False
    max_per_tick: int | None = None

    @property
    def is_restricted(self) -> bool:
        return self.state == "restricted"


def permission_view_from_row(row: AppPermission | None) -> PermissionView | None:
    if row is None:
        return None

    options = row.options or {}
    if row.state == "restricted":
        foreground_only = bool(options.get("foreground_only", True))
        max_per_tick = options.get("max_per_tick")
        return PermissionView(
            state=row.state, foreground_only=foreground_only, max_per_tick=max_per_tick
        )

    return PermissionView(state=row.state)


def load_permission_view(session: Session, app_id: str, resource: str) -> PermissionView | None:
    row = (
        session.query(AppPermission)
        .filter(AppPermission.app_id == app_id, AppPermission.resource == resource)
        .one_or_none()
    )
    return permission_view_from_row(row)


def gate(
    *,
    app_status: str,
    permission: PermissionView | None,
    resource: str,
    context: Context,
    used_this_tick: int,
) -> Outcome:
    if app_status == "suspended" and (is_sensitive(resource) or resource == "network"):
        return "blocked"

    if permission is None or permission.state == "denied":
        return "blocked"

    if permission.state == "restricted":
        if permission.foreground_only and context != "foreground":
            return "blocked"

        if permission.max_per_tick is not None and used_this_tick >= permission.max_per_tick:
            return "blocked"

        return "limited"

    return "allowed"
