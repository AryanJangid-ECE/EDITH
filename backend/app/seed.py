from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.config import get_settings
from app.models.app_models import App, AppPermission, Device, SimState, User

APP_PROFILES = (
    (
        "chatterbox",
        "ChatterBox",
        "messaging",
        ("contacts", "microphone", "camera", "notifications", "network"),
        {"core_feature": True, "sync": True},
    ),
    (
        "routerunner",
        "RouteRunner",
        "navigation",
        ("location_fine", "location_background", "notifications", "network"),
        {"core_feature": True, "sync": True},
    ),
    (
        "pixelpal",
        "PixelPal",
        "photo_editor",
        ("camera", "photos", "network"),
        {"core_feature": True, "sync": True},
    ),
    (
        "flashlite",
        "FlashLite",
        "utility_flashlight",
        ("camera", "notifications"),
        {"core_feature": True},
    ),
)


def _stable_id(key: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"edith:{key}"))


def ensure_seed_data(session: Session) -> None:
    settings = get_settings()
    _ensure_user(session, settings.demo_owner_email, "owner", settings.demo_owner_password)
    _ensure_user(session, settings.demo_viewer_email, "viewer", settings.demo_viewer_password)

    device = (
        session.query(Device)
        .filter(Device.name == "EDITH Sandbox", Device.platform == "sandbox")
        .one_or_none()
    )
    if device is None:
        device = Device(
            id=_stable_id("device:sandbox"),
            name="EDITH Sandbox",
            platform="sandbox",
            source="simulated",
            capabilities={
                "supports_revoke": True,
                "supports_restrict": True,
                "supports_suspend": True,
            },
        )
        session.add(device)
        session.flush()

    for app_key, name, category, resources, purposes in APP_PROFILES:
        app = (
            session.query(App)
            .filter(App.device_id == device.id, App.app_key == app_key)
            .one_or_none()
        )
        if app is None:
            app = App(
                id=_stable_id(f"app:{app_key}"),
                device_id=device.id,
                app_key=app_key,
                name=name,
                category=category,
                publisher="Demo Lab",
                status="active",
                declared_purposes=purposes,
            )
            session.add(app)
            session.flush()

        for resource in resources:
            permission = (
                session.query(AppPermission)
                .filter(
                    AppPermission.app_id == app.id,
                    AppPermission.resource == resource,
                )
                .one_or_none()
            )
            if permission is None:
                session.add(
                    AppPermission(
                        id=_stable_id(f"permission:{app_key}:{resource}"),
                        app_id=app.id,
                        resource=resource,
                        state="granted",
                        options=None,
                        granted_at=None,
                        granted_tick=-1,
                        last_changed_at=None,
                        requested_by="install",
                    )
                )

    if session.get(SimState, 1) is None:
        session.add(
            SimState(
                id=1,
                seed=settings.sim_default_seed,
                tick=0,
                running=False,
                ms_per_tick=settings.sim_ms_per_tick,
                active_scenario=None,
                scenario_start_tick=None,
                auto_grant_requests=True,
            )
        )


def _ensure_user(session: Session, email: str, role: str, password: str) -> None:
    normalized_email = email.strip().lower()
    existing = session.query(User).filter(User.email == normalized_email).one_or_none()
    if existing is None:
        session.add(
            User(
                id=str(uuid.uuid4()),
                email=normalized_email,
                password_hash=hash_password(password),
                role=role,
            )
        )
