"""Local, non-clinical sentiment analysis for short reflections."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Literal

MAX_SENTIMENT_TEXT_LENGTH = 1000
SentimentLabel = Literal["positive", "negative", "neutral"]


class SentimentAnalysisUnavailable(RuntimeError):
    """Raised when the optional local VADER analyzer cannot be initialized."""


@dataclass(frozen=True)
class SentimentResult:
    compound: float
    positive: float
    negative: float
    neutral: float
    classification: SentimentLabel


@lru_cache(maxsize=1)
def _analyzer():
    try:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

        return SentimentIntensityAnalyzer()
    except Exception as exc:
        raise SentimentAnalysisUnavailable from exc


def analyze_sentiment(text: str) -> SentimentResult:
    """Return VADER scores without retaining or logging the supplied text."""
    if not isinstance(text, str):
        raise TypeError("Sentiment input must be text.")

    cleaned = text.strip()
    if len(cleaned) > MAX_SENTIMENT_TEXT_LENGTH:
        cleaned = cleaned[:MAX_SENTIMENT_TEXT_LENGTH]
    if not cleaned:
        return SentimentResult(
            compound=0.0,
            positive=0.0,
            negative=0.0,
            neutral=0.0,
            classification="neutral",
        )

    scores = _analyzer().polarity_scores(cleaned)
    compound = float(scores["compound"])
    if compound >= 0.05:
        classification: SentimentLabel = "positive"
    elif compound <= -0.05:
        classification = "negative"
    else:
        classification = "neutral"

    return SentimentResult(
        compound=compound,
        positive=float(scores["pos"]),
        negative=float(scores["neg"]),
        neutral=float(scores["neu"]),
        classification=classification,
    )
