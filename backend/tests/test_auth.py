from __future__ import annotations

from sqlalchemy import select

from app.database import SessionLocal
from app.models import User


def test_signup_returns_token_and_public_profile(client, signup_payload):
    payload = signup_payload(name="  Maya   Chen ")
    response = client.post("/api/auth/signup", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["name"] == "Maya Chen"
    assert body["user"]["email"] == payload["email"].lower()
    assert "password" not in body["user"]
    assert "password_hash" not in body["user"]


def test_password_is_stored_as_a_hash(client, register, signup_payload):
    payload = signup_payload(password="sunflower-tea")
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 201

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == payload["email"].lower()))

    assert user is not None
    assert user.password_hash != "sunflower-tea"
    assert user.password_hash.startswith("$2")


def test_duplicate_email_is_rejected(client, signup_payload):
    payload = signup_payload()
    first = client.post("/api/auth/signup", json=payload)
    assert first.status_code == 201

    second = client.post("/api/auth/signup", json=dict(payload, name="Someone Else"))
    assert second.status_code == 409
    assert "already exists" in second.json()["detail"].lower()


def test_signup_validation(client, signup_payload):
    short = client.post("/api/auth/signup", json=signup_payload(password="short"))
    assert short.status_code == 422

    no_letter = client.post(
        "/api/auth/signup", json=signup_payload(password="12345678")
    )
    assert no_letter.status_code == 422

    bad_email = client.post(
        "/api/auth/signup", json=signup_payload(email="not-an-email")
    )
    assert bad_email.status_code == 422


def test_login_success(client, signup_payload):
    payload = signup_payload()
    client.post("/api/auth/signup", json=payload)

    response = client.post(
        "/api/auth/login",
        json={"email": payload["email"].upper(), "password": payload["password"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["user"]["email"] == payload["email"].lower()


def test_login_rejects_wrong_password(client, signup_payload):
    payload = signup_payload()
    client.post("/api/auth/signup", json=payload)

    response = client.post(
        "/api/auth/login",
        json={"email": payload["email"], "password": "wrong-password-123"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Email or password is incorrect."


def test_login_rejects_unknown_email(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "anything-123"},
    )
    assert response.status_code == 401


def test_me_requires_a_token(client):
    assert client.get("/api/auth/me").status_code == 401
    assert (
        client.get("/api/auth/me", headers={"Authorization": "Bearer nonsense"}).status_code
        == 401
    )


def test_me_returns_current_user(client, user):
    response = client.get("/api/auth/me", headers=user["headers"])
    assert response.status_code == 200
    assert response.json()["id"] == user["user"]["id"]


def test_logout_is_explicit(client, user):
    response = client.post("/api/auth/logout", headers=user["headers"])
    assert response.status_code == 200
    assert response.json()["detail"] == "Signed out."
