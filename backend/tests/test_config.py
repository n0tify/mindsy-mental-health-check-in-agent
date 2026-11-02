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
