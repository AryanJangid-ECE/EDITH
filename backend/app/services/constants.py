from __future__ import annotations

from datetime import UTC, datetime

SENSITIVITY_WEIGHTS: dict[str, int] = {
    "location_fine": 8,
    "location_background": 10,
    "camera": 8,
    "microphone": 8,
    "contacts": 7,
    "sms": 9,
    "call_log": 8,
    "photos": 5,
    "storage": 6,
    "calendar": 4,
    "clipboard": 4,
    "bluetooth": 3,
    "sensors": 2,
    "network": 1,
    "notifications": 1,
}

EXPECTED_PERMISSIONS: dict[str, list[str]] = {
    "messaging": ["contacts", "microphone", "camera", "photos", "notifications", "network"],
    "navigation": ["location_fine", "location_background", "network", "notifications", "bluetooth"],
    "photo_editor": ["camera", "photos", "storage", "network"],
    "utility_flashlight": ["camera", "notifications"],
}


def is_sensitive(resource: str) -> bool:
    return SENSITIVITY_WEIGHTS.get(resource, 0) >= 4


def tick_to_time(tick: int) -> datetime:
    base = datetime(2026, 1, 1, 8, 0, 0, tzinfo=UTC)
    return (base + __import__("datetime").timedelta(minutes=10 * tick)).replace(microsecond=0)


def tick_to_iso(tick: int) -> str:
    return tick_to_time(tick).isoformat().replace("+00:00", "Z")
