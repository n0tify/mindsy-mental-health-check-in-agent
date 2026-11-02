from __future__ import annotations

from unittest.mock import AsyncMock, Mock

from app.config import Settings
from app.routes import companion as companion_route
from app.services.azure_openai import AzureOpenAIUnavailable


def enabled_azure_settings() -> Settings:
    return Settings(
        azure_openai_enabled=True,
        azure_openai_endpoint="https://mindsy-resource.openai.azure.com",
        azure_openai_api_key="test-key-not-a-secret",
        azure_openai_deployment="mindsy-chat-deployment",
        azure_openai_api_version="2024-10-21",
    )


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


def test_enabled_azure_response_keeps_existing_contract(client, monkeypatch):
    monkeypatch.setattr(
        companion_route,
        "settings",
        enabled_azure_settings(),
    )
    monkeypatch.setattr(
        companion_route,
        "analyze_sentiment",
        lambda _message: None,
    )
    generate = AsyncMock(return_value="An optional AI reflection.")
    monkeypatch.setattr(companion_route, "generate_reply", generate)

    response = client.post(
        "/api/companion",
        json={
            "message": "I feel hopeful.",
            "allow_external_processing": True,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"reply", "tone", "suggestions", "crisis", "disclaimer"}
    assert body["reply"] == "An optional AI reflection."
    assert body["tone"] == "hopeful"
    assert body["crisis"] is False
    assert body["suggestions"]
    generate.assert_awaited_once()


def test_azure_failure_returns_existing_rule_based_response(client, monkeypatch):
    monkeypatch.setattr(
        companion_route,
        "settings",
        enabled_azure_settings(),
    )
    monkeypatch.setattr(companion_route, "analyze_sentiment", lambda _message: None)
    monkeypatch.setattr(
        companion_route,
        "generate_reply",
        AsyncMock(side_effect=AzureOpenAIUnavailable("timeout")),
    )

    response = client.post(
        "/api/companion",
        json={
            "message": "I feel anxious.",
            "allow_external_processing": True,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["crisis"] is False
    assert body["tone"] == "anxious"
    assert body["reply"] != "An optional AI reflection."
    assert body["suggestions"]


def test_disabled_azure_returns_rule_based_response_without_optional_services(
    client, monkeypatch
):
    monkeypatch.setattr(
        companion_route,
        "settings",
        Settings(azure_openai_enabled=False),
    )
    analyze = Mock(side_effect=AssertionError("disabled integration must not analyze"))
    generate = AsyncMock(side_effect=AssertionError("disabled integration must not call Azure"))
    monkeypatch.setattr(companion_route, "analyze_sentiment", analyze)
    monkeypatch.setattr(companion_route, "generate_reply", generate)

    response = client.post(
        "/api/companion",
        json={
            "message": "I feel hopeful.",
            "allow_external_processing": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["tone"] == "hopeful"
    analyze.assert_not_called()
    generate.assert_not_awaited()


def test_crisis_is_returned_before_sentiment_or_azure(client, monkeypatch):
    monkeypatch.setattr(
        companion_route,
        "settings",
        enabled_azure_settings(),
    )
    analyze = Mock(side_effect=AssertionError("crisis text must not be analyzed"))
    generate = AsyncMock(side_effect=AssertionError("crisis text must not reach Azure"))
    monkeypatch.setattr(companion_route, "analyze_sentiment", analyze)
    monkeypatch.setattr(companion_route, "generate_reply", generate)

    response = client.post(
        "/api/companion",
        json={
            "message": "Sometimes I think about suicide.",
            "allow_external_processing": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["crisis"] is True
    analyze.assert_not_called()
    generate.assert_not_awaited()


def test_vader_failure_does_not_disable_azure_or_rule_fallback(client, monkeypatch):
    monkeypatch.setattr(
        companion_route,
        "settings",
        enabled_azure_settings(),
    )

    def fail_analysis(_message):
        raise RuntimeError("local analyzer unavailable")

    monkeypatch.setattr(companion_route, "analyze_sentiment", fail_analysis)
    generate = AsyncMock(return_value="A gentle AI response.")
    monkeypatch.setattr(companion_route, "generate_reply", generate)

    response = client.post(
        "/api/companion",
        json={
            "message": "I feel hopeful.",
            "allow_external_processing": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["reply"] == "A gentle AI response."
    generate.assert_awaited_once()


def test_azure_requires_explicit_external_processing_consent(client, monkeypatch):
    monkeypatch.setattr(
        companion_route,
        "settings",
        enabled_azure_settings(),
    )
    analyze = Mock(side_effect=AssertionError("unconsented text must not be analyzed"))
    generate = AsyncMock(side_effect=AssertionError("unconsented text must not reach Azure"))
    monkeypatch.setattr(companion_route, "analyze_sentiment", analyze)
    monkeypatch.setattr(companion_route, "generate_reply", generate)

    response = client.post("/api/companion", json={"message": "I feel hopeful."})

    assert response.status_code == 200
    assert response.json()["tone"] == "hopeful"
    analyze.assert_not_called()
    generate.assert_not_awaited()


def test_incomplete_azure_configuration_falls_back_before_sentiment(client, monkeypatch):
    monkeypatch.setattr(
        companion_route,
        "settings",
        Settings(azure_openai_enabled=True),
    )
    analyze = Mock(side_effect=AssertionError("unconfigured Azure must not analyze text"))
    generate = AsyncMock(side_effect=AssertionError("unconfigured Azure must not be called"))
    monkeypatch.setattr(companion_route, "analyze_sentiment", analyze)
    monkeypatch.setattr(companion_route, "generate_reply", generate)

    response = client.post(
        "/api/companion",
        json={
            "message": "I feel hopeful.",
            "allow_external_processing": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["tone"] == "hopeful"
    analyze.assert_not_called()
    generate.assert_not_awaited()


def test_companion_validation(client):
    assert client.post("/api/companion", json={"message": ""}).status_code == 422
    assert client.post("/api/companion", json={"message": "   "}).status_code == 422
    assert client.post("/api/companion", json={"message": "x" * 1001}).status_code == 422


def test_health(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
