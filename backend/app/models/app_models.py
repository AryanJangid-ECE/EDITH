from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class CreatedAtMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        server_default=func.current_timestamp(),
    )


class User(CreatedAtMixin, Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="viewer")


class Device(CreatedAtMixin, Base):
    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    platform: Mapped[str] = mapped_column(String(64), nullable=False)
    source: Mapped[str] = mapped_column(String(64), nullable=False)
    capabilities: Mapped[dict[str, bool]] = mapped_column(JSON, nullable=False, default=dict)

    apps: Mapped[list[App]] = relationship(back_populates="device")


class App(CreatedAtMixin, Base):
    __tablename__ = "apps"
    __table_args__ = (UniqueConstraint("device_id", "app_key", name="uq_apps_device_app_key"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    device_id: Mapped[str] = mapped_column(String(36), ForeignKey("devices.id"), nullable=False)
    app_key: Mapped[str] = mapped_column(String(128), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(128), nullable=False)
    publisher: Mapped[str] = mapped_column(String(255), nullable=False, default="demo")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    declared_purposes: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)

    device: Mapped[Device] = relationship(back_populates="apps")
    permissions: Mapped[list[AppPermission]] = relationship(back_populates="app")
    events: Mapped[list[Event]] = relationship(back_populates="app")
    trust_scores: Mapped[list[TrustScore]] = relationship(back_populates="app")
    control_actions: Mapped[list[ControlAction]] = relationship(back_populates="app")
    recommendations: Mapped[list[Recommendation]] = relationship(back_populates="app")
    alerts: Mapped[list[Alert]] = relationship(back_populates="app")
    incidents: Mapped[list[Incident]] = relationship(back_populates="app")
    pending_requests: Mapped[list[PendingRequest]] = relationship(back_populates="app")


class AppPermission(CreatedAtMixin, Base):
    __tablename__ = "app_permissions"
    __table_args__ = (
        UniqueConstraint("app_id", "resource", name="uq_app_permissions_app_resource"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    app_id: Mapped[str] = mapped_column(String(36), ForeignKey("apps.id"), nullable=False)
    resource: Mapped[str] = mapped_column(String(128), nullable=False)
    state: Mapped[str] = mapped_column(String(32), nullable=False, default="granted")
    options: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    granted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    granted_tick: Mapped[int] = mapped_column(Integer, nullable=False, default=-1)
    last_changed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    requested_by: Mapped[str] = mapped_column(String(32), nullable=False, default="install")

    app: Mapped[App] = relationship(back_populates="permissions")


class Event(CreatedAtMixin, Base):
    __tablename__ = "events"
    __table_args__ = (
        Index("ix_events_app_ts", "app_id", "ts"),
        Index("ix_events_resource_ts", "resource", "ts"),
        Index("ix_events_sim_tick", "sim_tick"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    event_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    schema_version: Mapped[str] = mapped_column(String(32), nullable=False)
    device_id: Mapped[str] = mapped_column(String(36), nullable=False)
    app_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("apps.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    resource: Mapped[str] = mapped_column(String(128), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sim_tick: Mapped[int] = mapped_column(Integer, nullable=False)
    context: Mapped[str] = mapped_column(String(32), nullable=False)
    purpose_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    outcome: Mapped[str] = mapped_column(String(32), nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    bytes_out: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    destination: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source: Mapped[str] = mapped_column(String(64), nullable=False)

    app: Mapped[App | None] = relationship(back_populates="events")


class Baseline(CreatedAtMixin, Base):
    __tablename__ = "baselines"
    __table_args__ = (
        UniqueConstraint("app_id", "resource", "context", name="uq_baselines_app_resource_context"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    app_id: Mapped[str] = mapped_column(String(36), ForeignKey("apps.id"), nullable=False)
    resource: Mapped[str] = mapped_column(String(128), nullable=False)
    context: Mapped[str] = mapped_column(String(32), nullable=False)
    mean: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    variance: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    observed_windows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_tick: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class TrustScore(CreatedAtMixin, Base):
    __tablename__ = "trust_scores"
    __table_args__ = (Index("ix_trust_scores_app_tick", "app_id", "sim_tick"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    app_id: Mapped[str] = mapped_column(String(36), ForeignKey("apps.id"), nullable=False)
    sim_tick: Mapped[int] = mapped_column(Integer, nullable=False)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    band: Mapped[str | None] = mapped_column(String(32), nullable=True)
    confidence: Mapped[str | None] = mapped_column(String(32), nullable=True)
    e: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    g: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    b: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    d: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    prev_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    explanation: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)

    app: Mapped[App] = relationship(back_populates="trust_scores")


class Incident(CreatedAtMixin, Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    app_id: Mapped[str] = mapped_column(String(36), ForeignKey("apps.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    severity: Mapped[str] = mapped_column(String(32), nullable=False, default="low")
    opened_tick: Mapped[int] = mapped_column(Integer, nullable=False)
    last_activity_tick: Mapped[int] = mapped_column(Integer, nullable=False)
    closed_tick: Mapped[int | None] = mapped_column(Integer, nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    app: Mapped[App] = relationship(back_populates="incidents")
    findings: Mapped[list[Finding]] = relationship(back_populates="incident")
    alerts: Mapped[list[Alert]] = relationship(back_populates="incident")


class Finding(CreatedAtMixin, Base):
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    app_id: Mapped[str] = mapped_column(String(36), ForeignKey("apps.id"), nullable=False)
    incident_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("incidents.id"), nullable=True
    )
    rule_id: Mapped[str] = mapped_column(String(32), nullable=False)
    sim_tick: Mapped[int] = mapped_column(Integer, nullable=False)
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    severity: Mapped[str] = mapped_column(String(32), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_event_ids: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    baseline_mean: Mapped[float | None] = mapped_column(Float, nullable=True)
    z: Mapped[float | None] = mapped_column(Float, nullable=True)

    incident: Mapped[Incident | None] = relationship(back_populates="findings")


class Alert(CreatedAtMixin, Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    incident_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("incidents.id"), nullable=True
    )
    app_id: Mapped[str] = mapped_column(String(36), ForeignKey("apps.id"), nullable=False)
    severity: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="new")

    incident: Mapped[Incident | None] = relationship(back_populates="alerts")
    app: Mapped[App] = relationship(back_populates="alerts")


class Recommendation(CreatedAtMixin, Base):
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    app_id: Mapped[str] = mapped_column(String(36), ForeignKey("apps.id"), nullable=False)
    incident_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("incidents.id"), nullable=True
    )
    rec_rule: Mapped[str] = mapped_column(String(64), nullable=False)
    target_type: Mapped[str] = mapped_column(String(64), nullable=False)
    target: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    options: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    priority: Mapped[str] = mapped_column(String(32), nullable=False)
    confidence: Mapped[str] = mapped_column(String(32), nullable=False)
    rationale: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    predicted_score_after: Mapped[int | None] = mapped_column(Integer, nullable=True)
    impact_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reversible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")

    app: Mapped[App] = relationship(back_populates="recommendations")


class ControlAction(CreatedAtMixin, Base):
    __tablename__ = "control_actions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    app_id: Mapped[str] = mapped_column(String(36), ForeignKey("apps.id"), nullable=False)
    actor_user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(32), nullable=False)
    target: Mapped[str] = mapped_column(String(255), nullable=False)
    previous_state: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    new_state: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    recommendation_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    undone: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sim_tick: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    app: Mapped[App] = relationship(back_populates="control_actions")


class PendingRequest(CreatedAtMixin, Base):
    __tablename__ = "pending_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    app_id: Mapped[str] = mapped_column(String(36), ForeignKey("apps.id"), nullable=False)
    resource: Mapped[str] = mapped_column(String(128), nullable=False)
    purpose_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    requested_tick: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")

    app: Mapped[App] = relationship(back_populates="pending_requests")


class SimState(CreatedAtMixin, Base):
    __tablename__ = "sim_state"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    seed: Mapped[int] = mapped_column(Integer, nullable=False, default=42)
    tick: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    running: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ms_per_tick: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    active_scenario: Mapped[str | None] = mapped_column(String(128), nullable=True)
    scenario_start_tick: Mapped[int | None] = mapped_column(Integer, nullable=True)
    auto_grant_requests: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Setting(CreatedAtMixin, Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(128), primary_key=True)
    value: Mapped[Any] = mapped_column(JSON, nullable=False)
