from __future__ import annotations

from datetime import datetime, timezone
import uuid


def _migration_payload(record_id: str = "guest-entry-1") -> dict:
    suffix = uuid.uuid4().hex
    return {
        "entries": [
            {
                "id": f"{record_id}-{suffix[:8]}",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "primary_mood": "calm",
                "emotions": ["calm"],
                "energy": "medium",
                "note": "Synthetic guest check-in.",
                "tags": [],
            }
        ],
        "journal": [
            {
                "id": f"guest-journal-{suffix[:8]}",
                "title": "Synthetic guest journal",
                "body": "Synthetic-only journal content.",
                "mood": "calm",
            }
        ],
        "gratitude": [
            {
                "id": f"guest-gratitude-{suffix[:8]}",
                "text": "Synthetic gratitude note.",
            }
        ],
    }


def test_guest_migration_is_authenticated_and_idempotent(client, user):
    path = "/api/guest-migrations"
    payload = _migration_payload()

    assert client.post(path, json=payload).status_code == 401

    first = client.post(path, json=payload, headers=user["headers"])
    assert first.status_code == 201
    assert first.json() == {"entries": 1, "journal": 1, "gratitude": 1}

    retry = client.post(path, json=payload, headers=user["headers"])
    assert retry.status_code == 201
    assert retry.json() == {"entries": 0, "journal": 0, "gratitude": 0}
    assert len(client.get("/api/entries", headers=user["headers"]).json()) == 1
    assert len(client.get("/api/journal", headers=user["headers"]).json()) == 1
    assert len(client.get("/api/gratitude", headers=user["headers"]).json()) == 1


def test_guest_migration_assigns_current_owner_and_rejects_foreign_ids(
    client, register, auth_headers
):
    first_user = auth_headers(register()["access_token"])
    other_user = auth_headers(register()["access_token"])
    payload = _migration_payload()

    created = client.post(
        "/api/guest-migrations", json=payload, headers=first_user
    )
    assert created.status_code == 201

    conflict = client.post(
        "/api/guest-migrations", json=payload, headers=other_user
    )
    assert conflict.status_code == 409
    assert conflict.json()["detail"] == "Guest data could not be transferred. Refresh and retry."
    assert client.get("/api/entries", headers=other_user).json() == []
    assert len(client.get("/api/entries", headers=first_user).json()) == 1


def test_guest_migration_ignores_client_ownership_fields(client, user):
    payload = _migration_payload()
    payload["user_id"] = "attacker-selected-user"
    payload["entries"][0]["user_id"] = "attacker-selected-user"
    response = client.post(
        "/api/guest-migrations", json=payload, headers=user["headers"]
    )

    assert response.status_code == 201
    assert len(client.get("/api/entries", headers=user["headers"]).json()) == 1
