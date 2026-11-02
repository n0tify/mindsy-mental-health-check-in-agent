"""Optional asynchronous Azure OpenAI responses for the Companion."""

from __future__ import annotations

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AsyncAzureOpenAI,
    AuthenticationError,
    NotFoundError,
    RateLimitError,
)

from ..config import settings
from .sentiment import SentimentResult

AZURE_OPENAI_TIMEOUT_SECONDS = 8.0
MAX_REPLY_LENGTH = 1200

SYSTEM_PROMPT = (
    "You are a brief, supportive reflection assistant in a wellness journaling app. "
    "Be warm, respectful, and non-clinical. Do not diagnose, prescribe medication, "
    "claim to be a therapist or emergency service, encourage dependence, or imply "
    "that you can keep someone safe. Do not present an automated sentiment estimate "
    "as fact. Acknowledge the user's own words and offer one practical, optional next "
    "step. Keep the response under 120 words. If the user appears to be in immediate "
    "danger, encourage contacting a trusted person and local emergency support."
)


class AzureOpenAIUnavailable(RuntimeError):
    """A safe, non-sensitive description of an unavailable Azure integration."""

    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


def _sentiment_context(sentiment: SentimentResult | None) -> str:
    if sentiment is None:
        return "Local sentiment context is unavailable; rely on the user's own words."
    return (
        "A local VADER lexical estimate is "
        f"{sentiment.classification} (compound {sentiment.compound:.3f}; "
        f"positive {sentiment.positive:.3f}, negative {sentiment.negative:.3f}, "
        f"neutral {sentiment.neutral:.3f}). This is supplementary, non-clinical "
        "context and may be wrong; do not infer a diagnosis."
    )


async def generate_reply(
    message: str, sentiment: SentimentResult | None = None
) -> str:
    """Request a bounded response only when Azure is explicitly enabled/configured."""
    if not settings.azure_openai_enabled:
        raise AzureOpenAIUnavailable("disabled")
    if not settings.azure_openai_configured:
        raise AzureOpenAIUnavailable("missing_configuration")

    try:
        async with AsyncAzureOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            timeout=AZURE_OPENAI_TIMEOUT_SECONDS,
            max_retries=0,
        ) as client:
            response = await client.chat.completions.create(
                model=settings.azure_openai_deployment,
                messages=[
                    {
                        "role": "system",
                        "content": f"{SYSTEM_PROMPT}\n{_sentiment_context(sentiment)}",
                    },
                    {"role": "user", "content": message},
                ],
                max_tokens=180,
                temperature=0.4,
            )
    except APITimeoutError:
        raise AzureOpenAIUnavailable("timeout") from None
    except APIConnectionError:
        raise AzureOpenAIUnavailable("connection_error") from None
    except AuthenticationError:
        raise AzureOpenAIUnavailable("authentication_error") from None
    except RateLimitError:
        raise AzureOpenAIUnavailable("rate_limited") from None
    except NotFoundError:
        raise AzureOpenAIUnavailable("deployment_unavailable") from None
    except APIStatusError:
        raise AzureOpenAIUnavailable("api_error") from None
    except Exception:
        raise AzureOpenAIUnavailable("unexpected_error") from None

    try:
        content = response.choices[0].message.content
    except (AttributeError, IndexError, TypeError):
        raise AzureOpenAIUnavailable("invalid_response") from None

    if not isinstance(content, str) or not content.strip():
        raise AzureOpenAIUnavailable("empty_response")
    return content.strip()[:MAX_REPLY_LENGTH]
