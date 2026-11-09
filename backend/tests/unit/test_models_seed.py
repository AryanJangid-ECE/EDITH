from __future__ import annotations

import uuid
from collections.abc import Iterator

import pytest
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session

from app.db import Base, _ensure_created_at_columns
from app.models.app_models import App, AppPermission, Device, SimState, User
from app.seed import APP_PROFILES, ensure_seed_data


@pytest.fixture
def db_session() -> Iterator[Session]:
    test_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(test_engine)
    with Session(test_engine) as session:
        yield session
    test_engine.dispose()


def test_schema_has_required_tables_timestamps_and_indexes() -> None:
    expected_tables = {
        "users",
        "devices",
        "apps",
        "app_permissions",
        "events",
        "baselines",
        "trust_scores",
        "incidents",
        "findings",
        "alerts",
        "recommendations",
        "control_actions",
        "pending_requests",
        "sim_state",
        "settings",
    }

    assert set(Base.metadata.tables) == expected_tables
    assert all("created_at" in table.columns for table in Base.metadata.tables.values())
    assert {index.name for index in Base.metadata.tables["events"].indexes} == {
        "ix_events_app_ts",
        "ix_events_resource_ts",
        "ix_events_sim_tick",
    }
    assert {index.name for index in Base.metadata.tables["trust_scores"].indexes} == {
        "ix_trust_scores_app_tick"
    }


def test_seed_is_idempotent_and_uses_uuid_primary_keys(db_session: Session) -> None:
    ensure_seed_data(db_session)
    db_session.commit()
    ensure_seed_data(db_session)
    db_session.commit()

    apps = db_session.query(App).all()
    permissions = db_session.query(AppPermission).all()
    users = db_session.query(User).all()

    assert len(apps) == len(APP_PROFILES) == 4
    assert len(permissions) == 14
    assert {user.role for user in users} == {"owner", "viewer"}
    assert db_session.query(SimState).count() == 1
    assert all(uuid.UUID(row.id) for row in apps + permissions + users)
    assert all(row.created_at is not None for row in apps + permissions + users)


def test_app_key_is_unique_per_device_not_globally(db_session: Session) -> None:
    first_device = Device(
        id=str(uuid.uuid4()), name="First", platform="sandbox", source="simulated"
    )
    second_device = Device(
        id=str(uuid.uuid4()), name="Second", platform="sandbox", source="simulated"
    )
    db_session.add_all([first_device, second_device])
    db_session.flush()
    db_session.add_all(
        [
            App(
                id=str(uuid.uuid4()),
                device_id=first_device.id,
                app_key="same-key",
                name="First app",
                category="messaging",
            ),
            App(
                id=str(uuid.uuid4()),
                device_id=second_device.id,
                app_key="same-key",
                name="Second app",
                category="messaging",
            ),
        ]
    )
    db_session.commit()

    assert db_session.query(App).filter(App.app_key == "same-key").count() == 2


def test_legacy_database_gets_additive_created_at_column() -> None:
    legacy_engine = create_engine("sqlite:///:memory:")
    with legacy_engine.begin() as connection:
        connection.exec_driver_sql(
            "CREATE TABLE users (id VARCHAR(36) PRIMARY KEY, email VARCHAR(255) NOT NULL, "
            "password_hash VARCHAR(255) NOT NULL, role VARCHAR(32) NOT NULL)"
        )
        connection.exec_driver_sql(
            "INSERT INTO users (id, email, password_hash, role) "
            "VALUES ('legacy-id', 'legacy@example.test', 'hash', 'viewer')"
        )

    _ensure_created_at_columns(legacy_engine)

    columns = {column["name"] for column in inspect(legacy_engine).get_columns("users")}
    assert "created_at" in columns
    with Session(legacy_engine) as session:
        assert session.get(User, "legacy-id").created_at is not None
    legacy_engine.dispose()
