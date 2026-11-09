from app.config import Settings, get_settings


def test_default_settings_load_correctly() -> None:
    settings = Settings()

    assert settings.database_url == "sqlite:///./edith.db"
    assert settings.jwt_secret == "change-me-long-random"
    assert settings.cors_origins == ["http://localhost:5173"]
    assert settings.vite_api_base == "http://localhost:8000/api"


def test_cors_origins_string_parses_into_list() -> None:
    settings = Settings(cors_origins="http://localhost:5173,https://app.example.com")

    assert settings.cors_origins == ["http://localhost:5173", "https://app.example.com"]


def test_environment_overrides_are_applied(monkeypatch) -> None:
    monkeypatch.setenv("JWT_SECRET", "new-secret")
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173,https://preview.example")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./custom.db")
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.jwt_secret == "new-secret"
    assert settings.cors_origins == ["http://localhost:5173", "https://preview.example"]
    assert settings.database_url == "sqlite:///./custom.db"

    get_settings.cache_clear()
