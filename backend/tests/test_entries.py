from __future__ import annotations

from app.routes import entries as entries_route

ENTRY = {
    "primary_mood": "calm",
    "emotions": ["calm", "hopeful"],
    "energy": "medium",
    "note": "A slow morning and a good cup of tea.",
    "tags": ["self", "health"],
}


def test_requires_authentication(client):
    assert client.get("/api/entries").status_code == 401
    assert client.post("/api/entries", json=ENTRY).status_code == 401


def test_create_and_list_entry(client, user):
    created = client.post("/api/entries", json=ENTRY, headers=user["headers"])
    assert created.status_code == 201
    body = created.json()
    assert body["id"]
    assert body["emotions"] == ["calm", "hopeful"]
    assert body["energy"] == "medium"
    assert body["tags"] == ["self", "health"]
    assert body["created_at"].endswith("Z")
    assert body["sentiment_positive"] is not None
    assert body["sentiment_negative"] is not None
    assert body["sentiment_neutral"] is not None
    assert body["sentiment_compound"] is not None

    listed = client.get("/api/entries", headers=user["headers"])
    assert listed.status_code == 200
    assert [entry["id"] for entry in listed.json()] == [body["id"]]
    loaded = client.get(f"/api/entries/{body['id']}", headers=user["headers"])
    assert loaded.status_code == 200
    assert {
        key: loaded.json()[key]
        for key in (
            "sentiment_positive",
            "sentiment_negative",
            "sentiment_neutral",
            "sentiment_compound",
        )
    } == {
        key: body[key]
        for key in (
            "sentiment_positive",
            "sentiment_negative",
            "sentiment_neutral",
            "sentiment_compound",
        )
    }


def test_entries_are_newest_first(client, user):
    ids = []
    for mood in ("happy", "calm", "sad"):
        response = client.post(
            "/api/entries",
            json={**ENTRY, "primary_mood": mood, "emotions": [mood]},
            headers=user["headers"],
        )
        assert response.status_code == 201
        ids.append(response.json()["id"])

    listed = [entry["id"] for entry in client.get("/api/entries", headers=user["headers"]).json()]
    assert listed[0] == ids[-1]
    assert set(listed) == set(ids)


def test_multiple_emotions_are_preserved(client, user):
    payload = {**ENTRY, "emotions": ["anxious", "overwhelmed", "tired".replace("tired", "sad")]}
    response = client.post("/api/entries", json=payload, headers=user["headers"])
    assert response.status_code == 201
    assert response.json()["emotions"] == ["anxious", "overwhelmed", "sad"]


def test_duplicate_emotions_are_deduplicated(client, user):
    payload = {**ENTRY, "emotions": ["calm", "calm", "happy"]}
    response = client.post("/api/entries", json=payload, headers=user["headers"])
    assert response.status_code == 201
    assert response.json()["emotions"] == ["calm", "happy"]


def test_validation_rejects_bad_input(client, user):
    no_emotions = client.post(
        "/api/entries", json={**ENTRY, "emotions": []}, headers=user["headers"]
    )
    assert no_emotions.status_code == 422

    unknown_emotion = client.post(
        "/api/entries", json={**ENTRY, "emotions": ["ecstatic"]}, headers=user["headers"]
    )
    assert unknown_emotion.status_code == 422

    unknown_tag = client.post(
        "/api/entries", json={**ENTRY, "tags": ["spaceships"]}, headers=user["headers"]
    )
    assert unknown_tag.status_code == 422

    bad_energy = client.post(
        "/api/entries", json={**ENTRY, "energy": "cosmic"}, headers=user["headers"]
    )
    assert bad_energy.status_code == 422

    unknown_primary = client.post(
        "/api/entries", json={**ENTRY, "primary_mood": "meh"}, headers=user["headers"]
    )
    assert unknown_primary.status_code == 422


def test_entry_note_is_optional(client, user):
    payload = {**ENTRY, "note": "   "}
    response = client.post("/api/entries", json=payload, headers=user["headers"])
    assert response.status_code == 201
    assert response.json()["note"] is None
    assert response.json()["sentiment_compound"] is None


def test_sentiment_failure_does_not_prevent_check_in_save(client, user, monkeypatch):
    def fail_analysis(_note: str):
        raise RuntimeError("analyzer unavailable")

    monkeypatch.setattr(entries_route, "analyze_sentiment", fail_analysis)

    response = client.post("/api/entries", json=ENTRY, headers=user["headers"])

    assert response.status_code == 201
    assert response.json()["note"] == ENTRY["note"]
    assert response.json()["sentiment_compound"] is None


def test_sentiment_scores_are_isolated_between_users(client, register, auth_headers):
    owner = register()
    other_user = register()
    owner_headers = auth_headers(owner["access_token"])
    other_headers = auth_headers(other_user["access_token"])

    created = client.post("/api/entries", json=ENTRY, headers=owner_headers)
    owner_entry = client.get(
        f"/api/entries/{created.json()['id']}", headers=owner_headers
    )
    other_entries = client.get("/api/entries", headers=other_headers)

    assert owner_entry.status_code == 200
    assert owner_entry.json()["sentiment_compound"] is not None
    assert other_entries.json() == []


def test_users_cannot_read_or_delete_another_users_entry(client, register, auth_headers):
    owner = register()
    intruder = register()
    owner_headers = auth_headers(owner["access_token"])
    intruder_headers = auth_headers(intruder["access_token"])

    entry = client.post("/api/entries", json=ENTRY, headers=owner_headers).json()

    assert client.get(f"/api/entries/{entry['id']}", headers=intruder_headers).status_code == 404
    assert client.delete(f"/api/entries/{entry['id']}", headers=intruder_headers).status_code == 404
    assert client.get("/api/entries", headers=intruder_headers).json() == []

    # The owner's entry is untouched.
    assert client.get(f"/api/entries/{entry['id']}", headers=owner_headers).status_code == 200


def test_backdated_check_in_is_accepted_for_migration(client, user):
    from datetime import datetime, timedelta, timezone

    three_days_ago = (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
    response = client.post(
        "/api/entries",
        json={**ENTRY, "created_at": three_days_ago},
        headers=user["headers"],
    )
    assert response.status_code == 201
    created = response.json()["created_at"]
    assert created.startswith(
        (datetime.now(timezone.utc) - timedelta(days=3)).strftime("%Y-%m-%d")
    )


import pytest  # noqa: E402


@pytest.mark.parametrize("offset_days", [-3, 500])
def test_future_or_ancient_check_ins_are_rejected(client, user, offset_days):
    from datetime import datetime, timedelta, timezone

    stamp = datetime.now(timezone.utc) + timedelta(days=offset_days * -1 if offset_days == -3 else offset_days)
    if offset_days == -3:
        stamp = datetime.now(timezone.utc) + timedelta(days=3)
    response = client.post(
        "/api/entries",
        json={**ENTRY, "created_at": stamp.isoformat()},
        headers=user["headers"],
    )
    assert response.status_code == 422


def test_owner_can_delete_entry(client, user):
    entry = client.post("/api/entries", json=ENTRY, headers=user["headers"]).json()
    assert client.delete(f"/api/entries/{entry['id']}", headers=user["headers"]).status_code == 204
    assert client.get(f"/api/entries/{entry['id']}", headers=user["headers"]).status_code == 404
