import pytest

from app.config import DEFAULT_JWT_SECRET, Settings


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
    settings = Settings(app_env="production", jwt_secret="x" * 32)

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
