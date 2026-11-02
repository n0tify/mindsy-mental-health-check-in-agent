from __future__ import annotations

ENTRY = {
    "title": "A quieter evening",
    "body": "I closed the laptop early and watched the sky change colour.",
    "mood": "calm",
}


def test_journal_requires_authentication(client):
    assert client.get("/api/journal").status_code == 401
    assert client.post("/api/journal", json=ENTRY).status_code == 401


def test_create_list_update_delete(client, user):
    created = client.post("/api/journal", json=ENTRY, headers=user["headers"])
    assert created.status_code == 201
    entry = created.json()
    assert entry["title"] == "A quieter evening"
    assert entry["mood"] == "calm"

    listed = client.get("/api/journal", headers=user["headers"]).json()
    assert [item["id"] for item in listed] == [entry["id"]]

    updated = client.patch(
        f"/api/journal/{entry['id']}",
        json={"title": "An even quieter evening", "mood": "hopeful"},
        headers=user["headers"],
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "An even quieter evening"
    assert updated.json()["mood"] == "hopeful"

    deleted = client.delete(f"/api/journal/{entry['id']}", headers=user["headers"])
    assert deleted.status_code == 204
    assert client.get("/api/journal", headers=user["headers"]).json() == []


def test_search_filters_by_title_or_body(client, user):
    client.post("/api/journal", json=ENTRY, headers=user["headers"])
    client.post(
        "/api/journal",
        json={"title": "Deadline week", "body": "Everything arrived at once."},
        headers=user["headers"],
    )

    by_title = client.get("/api/journal?q=deadline", headers=user["headers"]).json()
    assert len(by_title) == 1
    assert by_title[0]["title"] == "Deadline week"

    by_body = client.get("/api/journal?q=sky", headers=user["headers"]).json()
    assert len(by_body) == 1
    assert by_body[0]["title"] == "A quieter evening"

    by_mood = client.get("/api/journal?mood=calm", headers=user["headers"]).json()
    assert len(by_mood) == 1


def test_validation(client, user):
    assert client.post("/api/journal", json={"title": "", "body": "x"}, headers=user["headers"]).status_code == 422
    assert client.post("/api/journal", json={"title": "x", "body": "  "}, headers=user["headers"]).status_code == 422
    assert client.post("/api/journal", json={**ENTRY, "mood": "elated"}, headers=user["headers"]).status_code == 422


def test_journal_is_private(client, register, auth_headers):
    ada = auth_headers(register()["access_token"])
    grace = auth_headers(register()["access_token"])

    entry = client.post("/api/journal", json=ENTRY, headers=ada).json()

    assert client.get("/api/journal", headers=grace).json() == []
    assert client.patch(f"/api/journal/{entry['id']}", json={"title": "Mine now"}, headers=grace).status_code == 404
    assert client.delete(f"/api/journal/{entry['id']}", headers=grace).status_code == 404
