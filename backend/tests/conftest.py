from __future__ import annotations

import os
import tempfile
import uuid
from collections.abc import Callable
from pathlib import Path

import pytest

# The app reads its configuration at import time, so point it at a throwaway
# database before anything from `app` is imported.
_TEST_DIR = Path(tempfile.mkdtemp(prefix="mindsy-tests-"))
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DIR / 'test.db'}"
os.environ["APP_ENV"] = "test"
os.environ["JWT_SECRET"] = "test-only-jwt-secret-not-for-production-32chars"
os.environ["ACCESS_TOKEN_DAYS"] = "7"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


def _signup_payload(**overrides) -> dict:
    payload = {
        "name": "Ada Lovelace",
        "email": f"ada-{uuid.uuid4().hex[:10]}@example.com",
        "password": "lavender-dreams",
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def signup_payload() -> Callable[..., dict]:
    return _signup_payload


@pytest.fixture
def register(client) -> Callable[..., dict]:
    """Create a user and return the token response body."""

    def _register(**overrides) -> dict:
        response = client.post("/api/auth/signup", json=_signup_payload(**overrides))
        assert response.status_code == 201, response.text
        return response.json()

    return _register


@pytest.fixture
def auth_headers() -> Callable[[str], dict]:
    return lambda token: {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user(register, auth_headers) -> dict:
    body = register()
    return {"token": body["access_token"], "headers": auth_headers(body["access_token"]), "user": body["user"]}
