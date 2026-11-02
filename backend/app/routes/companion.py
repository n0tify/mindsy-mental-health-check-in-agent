from __future__ import annotations

import logging

from fastapi import APIRouter

from ..config import settings
from ..schemas.companion import CompanionReply, CompanionRequest
from ..services.azure_openai import AzureOpenAIUnavailable, generate_reply
from ..services.companion import respond
from ..services.sentiment import SentimentResult, analyze_sentiment

logger = logging.getLogger("mindsy.companion")

router = APIRouter(prefix="/api", tags=["companion"])


@router.post("/companion", response_model=CompanionReply)
async def companion_reply(payload: CompanionRequest) -> CompanionReply:
    """Public endpoint: guests get support too, and no account is needed.

    Azure processing additionally requires explicit per-request consent.
    """
    fallback = respond(payload.message)
    if (
        fallback.crisis
        or not settings.azure_openai_enabled
        or not settings.azure_openai_configured
        or not payload.allow_external_processing
    ):
        return fallback

    sentiment: SentimentResult | None = None
    try:
        sentiment = analyze_sentiment(payload.message)
    except Exception as exc:
        logger.warning(
            "Local sentiment analysis unavailable (%s); continuing without it.",
            type(exc).__name__,
        )

    try:
        generated = await generate_reply(payload.message, sentiment)
    except AzureOpenAIUnavailable as exc:
        logger.warning("Optional Azure Companion unavailable (%s).", exc.reason)
        return fallback
    except Exception as exc:
        logger.warning(
            "Optional Azure Companion failed (%s); using the rule-based response.",
            type(exc).__name__,
        )
        return fallback

    return fallback.model_copy(update={"reply": generated})
