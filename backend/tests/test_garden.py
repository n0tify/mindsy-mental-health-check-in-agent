from __future__ import annotations


def _check_in(client, headers, mood="happy", emotions=None, **overrides):
    payload = {
        "primary_mood": mood,
        "emotions": emotions or [mood],
        "energy": "medium",
        "note": "Testing the garden.",
        "tags": ["self"],
    }
    payload.update(overrides)
    response = client.post("/api/entries", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_garden_requires_authentication(client):
    assert client.get("/api/garden").status_code == 401


def test_empty_garden(client, user):
    response = client.get("/api/garden", headers=user["headers"])
    assert response.status_code == 200
    assert response.json() == {"plants": [], "count": 0}


def test_one_check_in_plants_one_flower(client, user):
    entry = _check_in(client, user["headers"])
    body = client.get("/api/garden", headers=user["headers"]).json()

    assert body["count"] == 1
    plant = body["plants"][0]
    assert plant["entry_id"] == entry["id"]
    assert plant["plant_type"] == "sunflower"
    assert plant["primary_mood"] == "happy"
    assert plant["emotions"] == ["happy"]
    assert plant["growth"] in {"seedling", "growing", "bloom"}


def test_plants_are_stable_across_refreshes(client, user):
    _check_in(client, user["headers"], mood="calm", emotions=["calm"])
    _check_in(client, user["headers"], mood="loved", emotions=["loved"])

    first = client.get("/api/garden", headers=user["headers"]).json()
    second = client.get("/api/garden", headers=user["headers"]).json()
    third = client.get("/api/garden", headers=user["headers"]).json()

    assert first == second == third
    assert first["count"] == 2
    assert len({plant["entry_id"] for plant in first["plants"]}) == 2


def test_positions_are_inside_the_garden(client, user):
    for mood in ("happy", "calm", "loved", "sad", "anxious", "angry"):
        _check_in(client, user["headers"], mood=mood, emotions=[mood])

    plants = client.get("/api/garden", headers=user["headers"]).json()["plants"]
    assert len(plants) == 6

    for plant in plants:
        assert 0 < plant["position_x"] < 100
        assert 0 < plant["position_y"] < 100
        assert 0.3 <= plant["scale"] <= 1.4
        assert plant["z_index"] in (0, 1, 2)
        assert 0 <= plant["variant"] <= 3


def test_emotion_maps_to_expected_species(client, user):
    expected = {
        "happy": "sunflower",
        "calm": "lavender",
        "loved": "rose",
        "hopeful": "sprout",
        "sad": "bluebell",
        "anxious": "lotus",
        "angry": "hibiscus",
        "exhausted": "moonflower",
        "confused": "iris",
        "overwhelmed": "peony",
    }

    for mood in expected:
        _check_in(client, user["headers"], mood=mood, emotions=[mood])

    plants = {
        plant["primary_mood"]: plant["plant_type"]
        for plant in client.get("/api/garden", headers=user["headers"]).json()["plants"]
    }
    assert plants == expected


def test_three_or_more_emotions_become_a_mixed_bloom(client, user):
    _check_in(
        client,
        user["headers"],
        mood="anxious",
        emotions=["anxious", "sad", "overwhelmed"],
    )
    plant = client.get("/api/garden", headers=user["headers"]).json()["plants"][0]
    assert plant["plant_type"] == "blossom"


def test_gardens_are_private(client, register, auth_headers):
    ada = auth_headers(register()["access_token"])
    grace = auth_headers(register()["access_token"])

    _check_in(client, ada)
    _check_in(client, ada)

    assert client.get("/api/garden", headers=ada).json()["count"] == 2
    assert client.get("/api/garden", headers=grace).json()["count"] == 0
