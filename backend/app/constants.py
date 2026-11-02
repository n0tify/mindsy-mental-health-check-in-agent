"""Controlled vocabularies shared by the API and the garden derivation."""

from __future__ import annotations

MOODS: dict[str, str] = {
    "happy": "Happy",
    "calm": "Calm",
    "loved": "Loved",
    "hopeful": "Hopeful",
    "sad": "Sad",
    "anxious": "Anxious",
    "angry": "Angry",
    "exhausted": "Exhausted",
    "confused": "Confused",
    "overwhelmed": "Overwhelmed",
}

MOOD_EMOJI: dict[str, str] = {
    "happy": "😊",
    "calm": "😌",
    "loved": "🥰",
    "hopeful": "✨",
    "sad": "😔",
    "anxious": "😟",
    "angry": "😡",
    "exhausted": "😴",
    "confused": "😕",
    "overwhelmed": "😣",
}

ENERGIES = ("low", "medium", "high")

TAGS = (
    "work",
    "study",
    "family",
    "friends",
    "health",
    "relationships",
    "self",
    "other",
)

# Emotion -> botanical species. "mixed" is used when several emotions are
# selected and therefore no single species represents the check-in.
MOOD_PLANTS: dict[str, str] = {
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
    "mixed": "blossom",
}
