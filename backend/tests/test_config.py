import pytest

from app.config import DEFAULT_JWT_SECRET, Settings

PRODUCTION_DATABASE_URL = (
    "postgresql+psycopg://mindsy:placeholder@db.example.invalid/mindsy"
)
PRODUCTION_CORS_ORIGINS = ["https://mindsy.example"]


def test_production_rejects_default_jwt_secret() -> None:
    settings = Settings(app_env="production", jwt_secret=DEFAULT_JWT_SECRET)

    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        settings.validate()


def test_production_rejects_short_jwt_secret() -> None:
    settings = Settings(app_env="production", jwt_secret="too-short")

    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        settings.validate()


def test_production_rejects_empty_jwt_secret() -> None:
    settings = Settings(app_env="production", jwt_secret="")

    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        settings.validate()


def test_production_rejects_example_jwt_placeholder() -> None:
    settings = Settings(
        app_env="production",
        jwt_secret="replace-with-a-long-random-value",
    )

    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        settings.validate()


def test_production_accepts_long_configured_jwt_secret() -> None:
    settings = Settings(
        app_env="production",
        jwt_secret="x" * 32,
        database_url=PRODUCTION_DATABASE_URL,
        cors_origins=PRODUCTION_CORS_ORIGINS,
    )

    settings.validate()


def test_production_rejects_ephemeral_sqlite_database() -> None:
    settings = Settings(
        app_env="production",
        jwt_secret="x" * 32,
        database_url="sqlite:///./mindsy.db",
    )

    with pytest.raises(RuntimeError, match="DATABASE_URL"):
        settings.validate()


def test_production_accepts_psycopg_three_database_url() -> None:
    settings = Settings(
        app_env="production",
        jwt_secret="x" * 32,
        database_url=PRODUCTION_DATABASE_URL,
        cors_origins=PRODUCTION_CORS_ORIGINS,
    )

    settings.validate()


def test_production_rejects_postgres_url_without_psycopg_driver() -> None:
    settings = Settings(
        app_env="production",
        jwt_secret="x" * 32,
        database_url="postgresql://mindsy:placeholder@db.example.invalid/mindsy",
        cors_origins=PRODUCTION_CORS_ORIGINS,
    )

    with pytest.raises(RuntimeError, match="DATABASE_URL"):
        settings.validate()


def test_staging_rejects_sqlite_database() -> None:
    settings = Settings(
        app_env="staging",
        jwt_secret="x" * 32,
        database_url="sqlite:///./mindsy.db",
        cors_origins=PRODUCTION_CORS_ORIGINS,
    )

    with pytest.raises(RuntimeError, match="DATABASE_URL"):
        settings.validate()


def test_unknown_app_environment_is_rejected() -> None:
    settings = Settings(
        app_env="production-like",
        jwt_secret="x" * 32,
        database_url=PRODUCTION_DATABASE_URL,
        cors_origins=PRODUCTION_CORS_ORIGINS,
    )

    with pytest.raises(RuntimeError, match="APP_ENV"):
        settings.validate()


def test_production_requires_explicit_cors_origins() -> None:
    settings = Settings(
        app_env="production",
        jwt_secret="x" * 32,
        database_url=PRODUCTION_DATABASE_URL,
        cors_origins=[],
    )

    with pytest.raises(RuntimeError, match="CORS_ORIGINS"):
        settings.validate()


@pytest.mark.parametrize(
    "cors_origins",
    [
        ["*"],
        ["http://localhost:3000"],
        ["https://mindsy.example/path"],
        ["https://mindsy.example:invalid"],
    ],
)
def test_production_rejects_non_production_cors_origins(cors_origins) -> None:
    settings = Settings(
        app_env="production",
        jwt_secret="x" * 32,
        database_url=PRODUCTION_DATABASE_URL,
        cors_origins=cors_origins,
    )

    with pytest.raises(RuntimeError, match="CORS_ORIGINS"):
        settings.validate()


def test_missing_app_env_fails_closed_for_default_secret(monkeypatch) -> None:
    monkeypatch.delenv("APP_ENV", raising=False)
    monkeypatch.delenv("JWT_SECRET", raising=False)

    settings = Settings()

    assert settings.app_env == "production"
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        settings.validate()


def test_non_development_environment_rejects_default_secret() -> None:
    settings = Settings(app_env="staging", jwt_secret=DEFAULT_JWT_SECRET)

    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        settings.validate()


def test_development_keeps_the_documented_default_secret() -> None:
    settings = Settings(app_env="development", jwt_secret=DEFAULT_JWT_SECRET)

    settings.validate()


def test_azure_integration_is_disabled_and_unconfigured_by_default() -> None:
    settings = Settings(
        azure_openai_enabled=False,
        azure_openai_endpoint="",
        azure_openai_api_key="",
        azure_openai_deployment="",
        azure_openai_api_version="",
    )

    assert not settings.azure_openai_enabled
    assert not settings.azure_openai_configured


def test_azure_settings_are_loaded_from_environment(monkeypatch) -> None:
    monkeypatch.setenv("AZURE_OPENAI_ENABLED", "true")
    monkeypatch.setenv("AZURE_OPENAI_ENDPOINT", "https://example.openai.azure.com")
    monkeypatch.setenv("AZURE_OPENAI_API_KEY", "test-key-not-a-secret")
    monkeypatch.setenv("AZURE_OPENAI_DEPLOYMENT", "mindsy-chat-deployment")
    monkeypatch.setenv("AZURE_OPENAI_API_VERSION", "2024-10-21")

    settings = Settings()

    assert settings.azure_openai_enabled
    assert settings.azure_openai_configured
    assert settings.azure_openai_deployment == "mindsy-chat-deployment"
