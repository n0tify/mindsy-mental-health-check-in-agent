from __future__ import annotations


def test_companion_is_available_without_an_account(client):
    response = client.post("/api/companion", json={"message": "I feel anxious about tomorrow."})
    assert response.status_code == 200
    body = response.json()
    assert body["crisis"] is False
    assert body["tone"] == "anxious"
    assert "not a therapist" in body["disclaimer"].lower()
    assert 1 <= len(body["suggestions"]) <= 3
    assert body["reply"]


def test_companion_is_deterministic(client):
    payload = {"message": "Work has been overwhelming and I am exhausted."}
    first = client.post("/api/companion", json=payload).json()
    second = client.post("/api/companion", json=payload).json()
    assert first == second


def test_crisis_language_routes_to_safety_copy(client):
    response = client.post(
        "/api/companion", json={"message": "Sometimes I think about suicide."}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["crisis"] is True
    assert "emergency" in body["reply"].lower()
    assert "befrienders.org" in body["reply"].lower()


def test_companion_validation(client):
    assert client.post("/api/companion", json={"message": ""}).status_code == 422
    assert client.post("/api/companion", json={"message": "   "}).status_code == 422
    assert client.post("/api/companion", json={"message": "x" * 1001}).status_code == 422


def test_health(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
