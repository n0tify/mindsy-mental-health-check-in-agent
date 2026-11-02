from __future__ import annotations

import pytest

from app.services.sentiment import (
    MAX_SENTIMENT_TEXT_LENGTH,
    SentimentAnalysisUnavailable,
    analyze_sentiment,
)


def test_vader_classifies_positive_text() -> None:
    result = analyze_sentiment("I feel wonderful and genuinely happy today.")

    assert result.classification == "positive"
    assert result.compound >= 0.05
    assert result.positive > result.negative


def test_vader_classifies_negative_text() -> None:
    result = analyze_sentiment("I feel miserable, hopeless, and awful.")

    assert result.classification == "negative"
    assert result.compound <= -0.05
    assert result.negative > result.positive


def test_vader_preserves_mixed_emotion_proportions() -> None:
    result = analyze_sentiment("I love my friends, but today has been awful.")

    assert result.positive > 0
    assert result.negative > 0
    assert result.neutral >= 0
    assert result.classification in {"positive", "negative", "neutral"}


def test_vader_classifies_neutral_text() -> None:
    result = analyze_sentiment("The meeting starts at three.")

    assert result.classification == "neutral"
    assert -0.05 < result.compound < 0.05


def test_empty_text_returns_neutral_zero_scores() -> None:
    result = analyze_sentiment("   ")

    assert result.classification == "neutral"
    assert result.compound == 0
    assert (result.positive, result.negative, result.neutral) == (0, 0, 0)


def test_non_string_input_is_rejected() -> None:
    with pytest.raises(TypeError, match="text"):
        analyze_sentiment(None)  # type: ignore[arg-type]


def test_long_text_is_truncated_to_the_first_maximum_characters(monkeypatch) -> None:
    from app.services import sentiment

    analyzed_texts: list[str] = []

    class FakeAnalyzer:
        def polarity_scores(self, text: str) -> dict[str, float]:
            analyzed_texts.append(text)
            return {"compound": 0.0, "pos": 0.0, "neg": 0.0, "neu": 1.0}

    monkeypatch.setattr(sentiment, "_analyzer", lambda: FakeAnalyzer())
    text = "a" * MAX_SENTIMENT_TEXT_LENGTH + "tail"

    analyze_sentiment(text)

    assert analyzed_texts == ["a" * MAX_SENTIMENT_TEXT_LENGTH]


def test_analyzer_initialization_failure_is_explicit(monkeypatch) -> None:
    from app.services import sentiment

    def fail_to_initialize():
        raise SentimentAnalysisUnavailable("unavailable")

    monkeypatch.setattr(sentiment, "_analyzer", fail_to_initialize)
    with pytest.raises(SentimentAnalysisUnavailable):
        analyze_sentiment("A short reflection.")
