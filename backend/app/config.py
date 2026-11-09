from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parents[1]


def parse_cors_origins(value: object) -> list[str]:
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return ["http://localhost:5173"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[BACKEND_DIR / ".env", PROJECT_ROOT / ".env"],
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    database_url: str = "sqlite:///./edith.db"
    jwt_secret: str = "change-me-long-random"
    jwt_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173"
    ingest_token: str = "change-me-ingest"
    demo_owner_email: str = "owner@edith.local"
    demo_owner_password: str = "ChangeMe123!"
    demo_viewer_email: str = "viewer@edith.local"
    demo_viewer_password: str = "ChangeMe123!"
    sim_default_seed: int = 42
    sim_ms_per_tick: int = 1000
    llm_enabled: bool = False
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-haiku-5-5"
    log_level: str = "INFO"
    vite_api_base: str = "http://localhost:8000/api"
    vite_ws_url: str = "ws://localhost:8000/ws"

    def __getattribute__(self, name: str) -> object:
        value = super().__getattribute__(name)
        if name == "cors_origins" and isinstance(value, str):
            return parse_cors_origins(value)
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
