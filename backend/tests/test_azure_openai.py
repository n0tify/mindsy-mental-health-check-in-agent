from __future__ import annotations

import asyncio
from types import SimpleNamespace

import httpx
import pytest
from openai import (
    APIConnectionError,
    APITimeoutError,
    AuthenticationError,
    NotFoundError,
    RateLimitError,
)

from app.config import Settings
from app.services import azure_openai
from app.services.azure_openai import AzureOpenAIUnavailable, generate_reply


def configured_settings(**overrides) -> Settings:
    values = {
        "azure_openai_enabled": True,
        "azure_openai_endpoint": "https://mindsy-resource.openai.azure.com",
        "azure_openai_api_key": "test-key-not-a-secret",
        "azure_openai_deployment": "my-gpt4o-deployment",
        "azure_openai_api_version": "2024-10-21",
    }
    values.update(overrides)
    return Settings(**values)


class FakeClient:
    def __init__(self, result=None, error=None):
        self.result = result
        self.error = error
        self.calls = []
        self.chat = SimpleNamespace(
            completions=SimpleNamespace(create=self.create_completion)
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return None

    async def create_completion(self, **kwargs):
        self.calls.append(kwargs)
        if self.error:
            raise self.error
        return self.result


def completion(content: str):
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=content))]
    )


def test_azure_settings_require_every_field() -> None:
    assert configured_settings().azure_openai_configured
    assert not configured_settings(azure_openai_api_key="").azure_openai_configured


def test_azure_is_disabled_by_default(monkeypatch) -> None:
    monkeypatch.setattr(azure_openai, "settings", Settings(azure_openai_enabled=False))
    monkeypatch.setattr(
        azure_openai,
        "AsyncAzureOpenAI",
        lambda **_kwargs: pytest.fail("disabled Azure integration must not create a client"),
    )

    with pytest.raises(AzureOpenAIUnavailable, match="disabled"):
        asyncio.run(generate_reply("A private reflection."))


def test_missing_credentials_do_not_create_a_client(monkeypatch) -> None:
    monkeypatch.setattr(
        azure_openai,
        "settings",
        configured_settings(azure_openai_api_key=""),
    )
    monkeypatch.setattr(
        azure_openai,
        "AsyncAzureOpenAI",
        lambda **_kwargs: pytest.fail("incomplete configuration must not create a client"),
    )

    with pytest.raises(AzureOpenAIUnavailable, match="missing_configuration"):
        asyncio.run(generate_reply("A private reflection."))


def test_success_uses_configured_deployment_and_bounded_request(monkeypatch) -> None:
    monkeypatch.setattr(azure_openai, "settings", configured_settings())
    fake = FakeClient(result=completion("A gentle, optional next step."))
    constructor_args = {}

    def make_client(**kwargs):
        constructor_args.update(kwargs)
        return fake

    monkeypatch.setattr(azure_openai, "AsyncAzureOpenAI", make_client)

    result = asyncio.run(generate_reply("I feel worried.", None))

    assert result == "A gentle, optional next step."
    assert constructor_args["api_key"] == "test-key-not-a-secret"
    assert constructor_args["timeout"] == azure_openai.AZURE_OPENAI_TIMEOUT_SECONDS
    assert constructor_args["max_retries"] == 0
    request = fake.calls[0]
    assert request["model"] == "my-gpt4o-deployment"
    assert request["max_tokens"] <= 180
    assert request["messages"][1]["content"] == "I feel worried."


def azure_errors():
    request = httpx.Request("POST", "https://example.test")
    cases = [
        ("timeout", APITimeoutError(request=request)),
        ("connection_error", APIConnectionError(message="offline", request=request)),
        (
            "authentication_error",
            AuthenticationError(
                "unauthorized",
                response=httpx.Response(401, request=request),
                body=None,
            ),
        ),
        (
            "rate_limited",
            RateLimitError(
                "limited",
                response=httpx.Response(429, request=request),
                body=None,
            ),
        ),
        (
            "deployment_unavailable",
            NotFoundError(
                "missing deployment",
                response=httpx.Response(404, request=request),
                body=None,
            ),
        ),
    ]
    return cases


@pytest.mark.parametrize(("reason", "error"), azure_errors())
def test_azure_failures_are_converted_to_safe_errors(monkeypatch, reason, error) -> None:
    monkeypatch.setattr(azure_openai, "settings", configured_settings())
    monkeypatch.setattr(
        azure_openai,
        "AsyncAzureOpenAI",
        lambda **_kwargs: FakeClient(error=error),
    )

    with pytest.raises(AzureOpenAIUnavailable) as caught:
        asyncio.run(generate_reply("A private reflection."))

    assert caught.value.reason == reason
    assert "private reflection" not in str(caught.value)
    assert "test-key" not in str(caught.value)


def test_empty_azure_response_is_rejected(monkeypatch) -> None:
    monkeypatch.setattr(azure_openai, "settings", configured_settings())
    monkeypatch.setattr(
        azure_openai,
        "AsyncAzureOpenAI",
        lambda **_kwargs: FakeClient(result=completion("  ")),
    )

    with pytest.raises(AzureOpenAIUnavailable, match="empty_response"):
        asyncio.run(generate_reply("A private reflection."))
