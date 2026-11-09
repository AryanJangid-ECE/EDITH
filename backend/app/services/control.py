from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.core.errors import BadRequestError, ConflictError, NotFoundError
from app.models.app_models import App, AppPermission, ControlAction, Device, User
from app.services.apps_query import get_current_tick

_POST_ACTION_HOOKS: list[Callable[[Session, ControlResult], None]] = []


@dataclass
class ControlResult:
    action_id: str
    app_id: str
    action: str
    target: str
    previous_state: dict[str, Any]
    new_state: dict[str, Any]
    app_score: int | None = None


def register_post_action_hook(fn: Callable[[Session, ControlResult], None]) -> None:
    _POST_ACTION_HOOKS.append(fn)


def _normalize_reason(reason: str | None) -> str | None:
    if reason is None:
        return None
    value = " ".join(reason.strip().split())
    if not value:
        return None
    return value[:500]


def _permission_snapshot(
    permission: AppPermission | None, *, resource: str | None = None
) -> dict[str, Any]:
    if permission is None:
        return {
            "kind": "permission",
            "resource": resource,
            "existed": False,
            "state": None,
            "options": None,
            "granted_tick": -1,
        }
    return {
        "kind": "permission",
        "resource": permission.resource,
        "existed": True,
        "state": permission.state,
        "options": permission.options,
        "granted_tick": permission.granted_tick,
    }


def _status_snapshot(app: App) -> dict[str, Any]:
    return {"kind": "status", "status": app.status}


def _run_hooks(session: Session, result: ControlResult) -> None:
    for hook in _POST_ACTION_HOOKS:
        hook(session, result)


def _load_device_for_app(session: Session, app: App) -> Device:
    device = session.query(Device).filter(Device.id == app.device_id).one_or_none()
    return device or Device(
        id="device-demo",
        name="EDITH Sandbox",
        platform="sandbox",
        source="simulated",
        capabilities={"supports_revoke": True, "supports_restrict": True, "supports_suspend": True},
    )


def set_permission(
    session: Session,
    *,
    app: App,
    resource: str,
    action: str,
    options: dict[str, Any] | None = None,
    actor: User | None = None,
    reason: str | None = None,
    recommendation_id: str | None = None,
    create_if_missing: bool = False,
) -> ControlResult:
    tick = get_current_tick(session)
    ts = datetime.now(UTC)
    permission = (
        session.query(AppPermission)
        .filter(AppPermission.app_id == app.id, AppPermission.resource == resource)
        .one_or_none()
    )
    device = _load_device_for_app(session, app)

    normalized_reason = _normalize_reason(reason)
    action_name = action.lower()

    if action_name == "approve":
        if permission is None:
            if not create_if_missing:
                raise NotFoundError("PERMISSION_NOT_FOUND", "Permission not found")
            permission = AppPermission(
                id=f"perm-{app.id}-{resource}-{tick}",
                app_id=app.id,
                resource=resource,
                state="granted",
                options=None,
                granted_at=ts,
                granted_tick=tick,
                last_changed_at=ts,
                requested_by="runtime",
            )
            session.add(permission)
            previous_state = _permission_snapshot(None, resource=resource)
            new_state = {
                "kind": "permission",
                "resource": resource,
                "existed": False,
                "state": "granted",
                "options": None,
                "granted_tick": tick,
            }
            action_record = ControlAction(
                id=f"ctrl-{object()}",
                app_id=app.id,
                actor_user_id=getattr(actor, "id", None),
                action="approve",
                target=resource,
                previous_state=previous_state,
                new_state=new_state,
                reason=normalized_reason,
                recommendation_id=recommendation_id,
                undone=False,
                ts=ts,
                sim_tick=tick,
            )
            session.add(action_record)
            session.flush()
            result = ControlResult(
                action_id=action_record.id,
                app_id=app.id,
                action="approve",
                target=resource,
                previous_state=previous_state,
                new_state=new_state,
                app_score=None,
            )
            _run_hooks(session, result)
            return result

        previous_state = _permission_snapshot(permission)
        same_state = permission.state == "granted" and (
            permission.options in (None, {})
            or permission.options == {"foreground_only": False, "max_per_tick": None}
        )
        if same_state:
            raise ConflictError("NO_CHANGE", "Permission already granted")

        permission.state = "granted"
        permission.options = None
        permission.last_changed_at = ts
        if previous_state["state"] == "denied":
            permission.granted_tick = tick
            permission.granted_at = ts
        new_state = {
            "kind": "permission",
            "resource": resource,
            "existed": True,
            "state": permission.state,
            "options": permission.options,
            "granted_tick": permission.granted_tick,
        }
        action_record = ControlAction(
            id=f"ctrl-{app.id}-{resource}-{tick}-{datetime.now(UTC).microsecond}",
            app_id=app.id,
            actor_user_id=getattr(actor, "id", None),
            action="approve",
            target=resource,
            previous_state=previous_state,
            new_state=new_state,
            reason=normalized_reason,
            recommendation_id=recommendation_id,
            undone=False,
            ts=ts,
            sim_tick=tick,
        )
        session.add(action_record)
        session.flush()
        result = ControlResult(
            action_id=action_record.id,
            app_id=app.id,
            action="approve",
            target=resource,
            previous_state=previous_state,
            new_state=new_state,
            app_score=None,
        )
        _run_hooks(session, result)
        return result

    if action_name == "restrict":
        if permission is None:
            raise NotFoundError("PERMISSION_NOT_FOUND", "Permission not found")
        if not device.capabilities.get("supports_restrict", True):
            raise ConflictError(
                "CAPABILITY_UNSUPPORTED", "This source is monitor-only for that action"
            )
        if permission.state == "denied":
            raise ConflictError(
                "INVALID_STATE", "A revoked permission cannot be restricted; approve it first"
            )

        effective_options = {
            "foreground_only": bool(options.get("foreground_only", True)) if options else True,
            "max_per_tick": options.get("max_per_tick") if options else None,
        }
        if not effective_options["foreground_only"] and effective_options["max_per_tick"] is None:
            raise BadRequestError(
                "INVALID_OPTIONS", "At least one effective restriction is required"
            )
        if effective_options["max_per_tick"] is not None and not (
            1 <= int(effective_options["max_per_tick"]) <= 100
        ):
            raise BadRequestError("INVALID_OPTIONS", "max_per_tick must be between 1 and 100")

        previous_state = _permission_snapshot(permission)
        if permission.state == "restricted" and permission.options == {
            "foreground_only": effective_options["foreground_only"],
            "max_per_tick": effective_options["max_per_tick"],
        }:
            raise ConflictError("NO_CHANGE", "Permission already restricted with the same settings")

        permission.state = "restricted"
        permission.options = {
            "foreground_only": effective_options["foreground_only"],
            "max_per_tick": effective_options["max_per_tick"],
        }
        permission.last_changed_at = ts
        new_state = {
            "kind": "permission",
            "resource": resource,
            "existed": True,
            "state": permission.state,
            "options": permission.options,
            "granted_tick": permission.granted_tick,
        }
        action_record = ControlAction(
            id=f"ctrl-{app.id}-{resource}-{tick}-{datetime.now(UTC).microsecond}",
            app_id=app.id,
            actor_user_id=getattr(actor, "id", None),
            action="restrict",
            target=resource,
            previous_state=previous_state,
            new_state=new_state,
            reason=normalized_reason,
            recommendation_id=recommendation_id,
            undone=False,
            ts=ts,
            sim_tick=tick,
        )
        session.add(action_record)
        session.flush()
        result = ControlResult(
            action_id=action_record.id,
            app_id=app.id,
            action="restrict",
            target=resource,
            previous_state=previous_state,
            new_state=new_state,
            app_score=None,
        )
        _run_hooks(session, result)
        return result

    if action_name == "revoke":
        if permission is None:
            raise NotFoundError("PERMISSION_NOT_FOUND", "Permission not found")
        if not device.capabilities.get("supports_revoke", True):
            raise ConflictError(
                "CAPABILITY_UNSUPPORTED", "This source is monitor-only for that action"
            )
        previous_state = _permission_snapshot(permission)
        if permission.state == "denied":
            raise ConflictError("NO_CHANGE", "Permission is already denied")

        permission.state = "denied"
        permission.options = None
        permission.last_changed_at = ts
        new_state = {
            "kind": "permission",
            "resource": resource,
            "existed": True,
            "state": permission.state,
            "options": None,
            "granted_tick": permission.granted_tick,
        }
        action_record = ControlAction(
            id=f"ctrl-{app.id}-{resource}-{tick}-{datetime.now(UTC).microsecond}",
            app_id=app.id,
            actor_user_id=getattr(actor, "id", None),
            action="revoke",
            target=resource,
            previous_state=previous_state,
            new_state=new_state,
            reason=normalized_reason,
            recommendation_id=recommendation_id,
            undone=False,
            ts=ts,
            sim_tick=tick,
        )
        session.add(action_record)
        session.flush()
        result = ControlResult(
            action_id=action_record.id,
            app_id=app.id,
            action="revoke",
            target=resource,
            previous_state=previous_state,
            new_state=new_state,
            app_score=None,
        )
        _run_hooks(session, result)
        return result

    raise BadRequestError("INVALID_ACTION", f"Unsupported action: {action}")


def set_status(
    session: Session,
    *,
    app: App,
    action: str,
    actor: User | None = None,
    reason: str | None = None,
    recommendation_id: str | None = None,
) -> ControlResult:
    tick = get_current_tick(session)
    ts = datetime.now(UTC)
    action_name = action.lower()
    device = _load_device_for_app(session, app)
    if action_name in {"suspend", "resume"}:
        if not device.capabilities.get("supports_suspend", True):
            raise ConflictError(
                "CAPABILITY_UNSUPPORTED", "This source is monitor-only for that action"
            )
    else:
        raise BadRequestError("INVALID_ACTION", f"Unsupported status action: {action}")

    previous_state = _status_snapshot(app)
    if action_name == "suspend" and app.status == "suspended":
        raise ConflictError("NO_CHANGE", "App is already suspended")
    if action_name == "resume" and app.status == "active":
        raise ConflictError("NO_CHANGE", "App is already active")

    app.status = "suspended" if action_name == "suspend" else "active"
    app.last_changed_at = ts if hasattr(app, "last_changed_at") else None
    new_state = {"kind": "status", "status": app.status}
    action_record = ControlAction(
        id=f"ctrl-{app.id}-{action_name}-{tick}-{datetime.now(UTC).microsecond}",
        app_id=app.id,
        actor_user_id=getattr(actor, "id", None),
        action=action_name,
        target="status",
        previous_state=previous_state,
        new_state=new_state,
        reason=_normalize_reason(reason),
        recommendation_id=recommendation_id,
        undone=False,
        ts=ts,
        sim_tick=tick,
    )
    session.add(action_record)
    session.flush()
    result = ControlResult(
        action_id=action_record.id,
        app_id=app.id,
        action=action_name,
        target="status",
        previous_state=previous_state,
        new_state=new_state,
        app_score=None,
    )
    _run_hooks(session, result)
    return result


def undo(
    session: Session, *, action_id: str, actor: User | None = None, reason: str | None = None
) -> ControlResult:
    record = session.query(ControlAction).filter(ControlAction.id == action_id).one_or_none()
    if record is None:
        raise NotFoundError("ACTION_NOT_FOUND", "Action not found")
    if record.action == "undo":
        raise ConflictError("NOT_UNDOABLE", "Undo actions cannot be undone")
    if record.undone:
        raise ConflictError("ALREADY_UNDONE", "This action has already been undone")

    app = session.query(App).filter(App.id == record.app_id).one_or_none()
    if app is None:
        raise NotFoundError("APP_NOT_FOUND", "App not found")

    current_snapshot = record.new_state
    previous_snapshot = record.previous_state
    if record.action in {"approve", "restrict", "revoke"}:
        permission_row = (
            session.query(AppPermission)
            .filter(AppPermission.app_id == record.app_id, AppPermission.resource == record.target)
            .one_or_none()
        )
        if permission_row is not None:
            permission_row.state = previous_snapshot.get("state") or permission_row.state
            permission_row.options = previous_snapshot.get("options")
            permission_row.granted_tick = previous_snapshot.get(
                "granted_tick", permission_row.granted_tick
            )
            if (
                previous_snapshot.get("state") == "granted"
                and previous_snapshot.get("granted_tick", -1) == -1
            ):
                permission_row.granted_tick = -1
        elif previous_snapshot.get("existed") is True:
            permission_row = AppPermission(
                id=f"perm-undo-{record.target}-{record.app_id}",
                app_id=record.app_id,
                resource=record.target,
                state=previous_snapshot.get("state", "granted"),
                options=previous_snapshot.get("options"),
                granted_tick=previous_snapshot.get("granted_tick", -1),
                requested_by="runtime",
                granted_at=None,
                last_changed_at=datetime.now(UTC),
            )
            session.add(permission_row)
        elif previous_snapshot.get("existed") is False:
            if permission_row is not None:
                session.delete(permission_row)
    elif record.action in {"suspend", "resume"}:
        app.status = previous_snapshot.get("status", app.status)

    record.undone = True
    tick = get_current_tick(session)
    ts = datetime.now(UTC)
    undo_record = ControlAction(
        id=f"ctrl-{record.id}-undo",
        app_id=record.app_id,
        actor_user_id=getattr(actor, "id", None),
        action="undo",
        target=record.target,
        previous_state=current_snapshot,
        new_state=previous_snapshot,
        reason=_normalize_reason(reason),
        recommendation_id=None,
        undone=False,
        ts=ts,
        sim_tick=tick,
    )
    session.add(undo_record)
    session.flush()
    result = ControlResult(
        action_id=undo_record.id,
        app_id=record.app_id,
        action="undo",
        target=record.target,
        previous_state=current_snapshot,
        new_state=previous_snapshot,
        app_score=None,
    )
    _run_hooks(session, result)
    return result
