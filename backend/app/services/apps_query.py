from __future__ import annotations

from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.app_models import Alert, App, AppPermission, Event, Recommendation, TrustScore
from app.services.constants import EXPECTED_PERMISSIONS, SENSITIVITY_WEIGHTS


def get_current_tick(session: Session) -> int:
    from app.models.app_models import SimState

    state = session.query(SimState).filter(SimState.id == 1).one_or_none()
    return int(state.tick) if state else 0


def _latest_trust_score(session: Session, app_id: str) -> TrustScore | None:
    return (
        session.query(TrustScore)
        .filter(TrustScore.app_id == app_id)
        .order_by(TrustScore.sim_tick.desc(), TrustScore.ts.desc())
        .first()
    )


def _sparkline_for_app(session: Session, app_id: str) -> list[dict[str, Any]]:
    rows = (
        session.query(TrustScore.sim_tick, TrustScore.score)
        .filter(TrustScore.app_id == app_id)
        .order_by(TrustScore.sim_tick.asc())
        .limit(30)
        .all()
    )
    return [{"tick": row[0], "score": row[1]} for row in rows]


def list_apps(session: Session) -> list[dict[str, Any]]:
    apps = session.query(App).all()
    results: list[dict[str, Any]] = []
    for app in apps:
        latest = _latest_trust_score(session, app.id)
        open_alerts = (
            session.query(Alert).filter(Alert.app_id == app.id, Alert.status == "new").count()
        )
        last_activity = (
            session.query(Event.ts).filter(Event.app_id == app.id).order_by(Event.ts.desc()).first()
        )
        results.append(
            {
                "id": app.id,
                "name": app.name,
                "category": app.category,
                "status": app.status,
                "score": latest.score if latest else None,
                "band": latest.band if latest else None,
                "confidence": latest.confidence if latest else None,
                "prev_score": latest.prev_score if latest else None,
                "open_alerts": open_alerts,
                "last_activity_ts": last_activity[0] if last_activity else None,
                "sparkline": _sparkline_for_app(session, app.id),
            }
        )
    return results


def get_app_detail(session: Session, app_id: str) -> dict[str, Any] | None:
    app = session.query(App).filter(App.id == app_id).one_or_none()
    if app is None:
        return None

    current_tick = get_current_tick(session)
    latest = _latest_trust_score(session, app_id)
    permissions = []
    for permission in (
        session.query(AppPermission)
        .filter(AppPermission.app_id == app_id)
        .order_by(AppPermission.resource.asc())
        .all()
    ):
        last_used = (
            session.query(Event.ts)
            .filter(
                Event.app_id == app_id,
                Event.resource == permission.resource,
                Event.outcome.in_(["allowed", "limited"]),
                Event.event_type.in_(["access", "network"]),
            )
            .order_by(Event.ts.desc())
            .first()
        )
        uses_24h = (
            session.query(func.coalesce(func.sum(Event.count), 0))
            .filter(
                Event.app_id == app_id,
                Event.resource == permission.resource,
                Event.outcome.in_(["allowed", "limited"]),
                Event.event_type.in_(["access", "network"]),
                Event.sim_tick > current_tick - 144,
            )
            .scalar()
            or 0
        )
        permissions.append(
            {
                "resource": permission.resource,
                "state": permission.state,
                "options": permission.options,
                "granted_at": permission.granted_at,
                "granted_tick": permission.granted_tick,
                "requested_by": permission.requested_by,
                "sensitivity_weight": SENSITIVITY_WEIGHTS.get(permission.resource, 0),
                "expected_for_category": permission.resource
                in EXPECTED_PERMISSIONS.get(app.category, []),
                "last_used_ts": last_used[0] if last_used else None,
                "uses_24h": int(uses_24h),
            }
        )

    open_alerts = session.query(Alert).filter(Alert.app_id == app_id, Alert.status == "new").count()
    open_recommendations = [
        {
            "id": row.id,
            "rec_rule": row.rec_rule,
            "target": row.target,
            "status": row.status,
            "action": row.action,
        }
        for row in session.query(Recommendation)
        .filter(Recommendation.app_id == app_id, Recommendation.status == "open")
        .all()
    ]

    open_incident = session.query(Recommendation).filter(Recommendation.app_id == app_id).first()
    if open_incident is not None:
        open_incident = {"id": open_incident.id, "status": "open"}

    return {
        "id": app.id,
        "name": app.name,
        "category": app.category,
        "status": app.status,
        "score": latest.score if latest else None,
        "band": latest.band if latest else None,
        "confidence": latest.confidence if latest else None,
        "prev_score": latest.prev_score if latest else None,
        "permissions": permissions,
        "open_alerts": open_alerts,
        "open_recommendations": open_recommendations,
        "open_incident": open_incident,
    }
