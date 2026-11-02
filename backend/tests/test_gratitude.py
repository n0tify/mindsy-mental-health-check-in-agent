from __future__ import annotations


def test_gratitude_flow(client, user):
    created = client.post(
        "/api/gratitude", json={"text": "Warm socks on a cold morning."}, headers=user["headers"]
    )
    assert created.status_code == 201
    note = created.json()
    assert note["text"] == "Warm socks on a cold morning."

    listed = client.get("/api/gratitude", headers=user["headers"]).json()
    assert [item["id"] for item in listed] == [note["id"]]

    assert client.delete(f"/api/gratitude/{note['id']}", headers=user["headers"]).status_code == 204
    assert client.get("/api/gratitude", headers=user["headers"]).json() == []


def test_gratitude_requires_auth_and_valid_text(client, user):
    assert client.get("/api/gratitude").status_code == 401
    assert client.post("/api/gratitude", json={"text": ""}, headers=user["headers"]).status_code == 422
    assert client.post("/api/gratitude", json={"text": "x" * 281}, headers=user["headers"]).status_code == 422


def test_gratitude_is_private(client, register, auth_headers):
    ada = auth_headers(register()["access_token"])
    grace = auth_headers(register()["access_token"])

    note = client.post("/api/gratitude", json={"text": "Good coffee."}, headers=ada).json()
    assert client.get("/api/gratitude", headers=grace).json() == []
    assert client.delete(f"/api/gratitude/{note['id']}", headers=grace).status_code == 404
