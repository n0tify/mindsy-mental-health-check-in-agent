"""A supportive, rule based companion.

This is intentionally *not* a medical service and does not require any paid AI
provider. If you later wire a language model in, keep the crisis handling below
ahead of any model call and keep the disclaimer in every response.
"""

from __future__ import annotations

from ..schemas.companion import CompanionReply
from .garden import fnv1a

DISCLAIMER = (
    "I'm Mindsy's supportive companion, not a therapist, doctor or emergency "
    "service. For clinical help please speak to a qualified professional."
)

CRISIS_PHRASES = (
    "kill myself",
    "killing myself",
    "suicide",
    "suicidal",
    "end my life",
    "end it all",
    "want to die",
    "don't want to live",
    "do not want to live",
    "hurt myself",
    "hurting myself",
    "self harm",
    "self-harm",
    "no reason to live",
    "better off dead",
)

CRISIS_REPLY = (
    "Thank you for telling me something this heavy. I'm really glad you said it out "
    "loud instead of carrying it alone.\n\n"
    "I'm not able to keep you safe on my own, and you deserve real, human support "
    "right now. Please reach out to someone you trust today, and contact your local "
    "emergency number if you are in immediate danger. If you want to find a crisis "
    "line in your country, the Befrienders Worldwide directory lists services "
    "worldwide at https://befrienders.org.\n\n"
    "If you can, stay with someone, move away from anything you could use to hurt "
    "yourself, and keep breathing slowly. You matter, and this moment is not the "
    "whole story."
)

TONE_KEYWORDS: dict[str, tuple[str, ...]] = {
    "anxious": ("anxious", "anxiety", "panic", "worried", "worry", "nervous", "scared"),
    "sad": ("sad", "down", "low", "cry", "crying", "lonely", "alone", "empty"),
    "angry": ("angry", "angry", "furious", "annoyed", "irritated", "unfair"),
    "tired": ("tired", "exhausted", "drained", "burnt out", "burnout", "sleep"),
    "overwhelmed": ("overwhelmed", "too much", "stressed", "stress", "pressure"),
    "hopeful": ("hopeful", "better", "proud", "excited", "happy", "good news"),
}

REFLECTIONS: dict[str, tuple[str, ...]] = {
    "anxious": (
        "It sounds like your body is working hard to keep you safe, and that can be exhausting.",
        "Anxiety often shows up when something matters to you. That doesn't make it easy, though.",
    ),
    "sad": (
        "That sounds genuinely heavy, and you don't have to explain it away.",
        "Sadness can be a signal that something needs gentleness, not a verdict on you.",
    ),
    "angry": (
        "Anger usually means a boundary of yours was crossed. It makes sense that it's loud.",
        "Something clearly mattered to you there, and being angry about it is allowed.",
    ),
    "tired": (
        "Tired is information, not a character flaw.",
        "Your energy sounds stretched thin, and rest is a reasonable next step, not a reward.",
    ),
    "overwhelmed": (
        "When everything arrives at once it's normal for the whole system to feel loud.",
        "That sounds like a lot to hold, and you're allowed to put some of it down.",
    ),
    "hopeful": (
        "It's lovely that you noticed something good in this. Worth keeping.",
        "That sounds like a real spark — small good things count.",
    ),
    "neutral": (
        "Thank you for trusting me with that.",
        "I'm here and listening. There's no rush to make it sound tidy.",
    ),
}

SUGGESTIONS: dict[str, tuple[str, ...]] = {
    "anxious": (
        "Try four slow breaths with a longer exhale than inhale.",
        "Name five things you can see and three you can hear.",
        "Write the worry down, then write what is actually in your control today.",
    ),
    "sad": (
        "Open the Journal and write one true sentence, no fixing required.",
        "Message one person you feel safe with, even just \"rough day\".",
        "Step outside for five minutes with no goal other than noticing.",
    ),
    "angry": (
        "Move the energy: shake out your hands, walk one lap of the room.",
        "Write what boundary you wish had been respected.",
        "Give yourself twenty minutes before drafting the message you want to send.",
    ),
    "tired": (
        "Take a real pause: water, shoulders down, ten breaths.",
        "Pick the smallest useful task and let the rest wait.",
        "Try the Breathe page for a two minute reset.",
    ),
    "overwhelmed": (
        "List everything, then circle only one thing for today.",
        "Say no to one optional thing this week.",
        "Try the grounding steps on the Support page.",
    ),
    "hopeful": (
        "Plant this feeling in your garden so you can find it again later.",
        "Write down what made today slightly better.",
        "Send someone else a kind message — joy tends to travel.",
    ),
    "neutral": (
        "Try a check-in: even a vague feeling counts.",
        "Draw a Joy Deck card and do the smallest version of it.",
        "Drink some water. Genuinely.",
    ),
}

OPENERS = {
    "anxious": "That sounds like a lot of pressure to carry at once.",
    "sad": "I'm sorry it's heavy right now.",
    "angry": "That sounds genuinely frustrating.",
    "tired": "It makes sense that you're running low.",
    "overwhelmed": "That's a lot to have on one plate.",
    "hopeful": "I love that you noticed that.",
    "neutral": "I'm glad you wrote that down.",
}


def detect_tone(message: str) -> str:
    lowered = message.lower()
    for tone, keywords in TONE_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            return tone
    return "neutral"


def is_crisis(message: str) -> bool:
    lowered = message.lower()
    return any(phrase in lowered for phrase in CRISIS_PHRASES)


def _pick(options: tuple[str, ...], seed: str, salt: str) -> str:
    return options[fnv1a(f"{seed}:{salt}") % len(options)]


def respond(message: str) -> CompanionReply:
    if is_crisis(message):
        return CompanionReply(
            reply=CRISIS_REPLY,
            tone="crisis",
            suggestions=[
                "Contact someone you trust right now.",
                "Call your local emergency number if you are in immediate danger.",
                "Find a crisis line near you at befrienders.org.",
            ],
            crisis=True,
            disclaimer=DISCLAIMER,
        )

    tone = detect_tone(message)
    reflection = _pick(REFLECTIONS[tone], message, "reflection")
    suggestions = list(dict.fromkeys(
        (
            _pick(SUGGESTIONS[tone], message, "one"),
            _pick(SUGGESTIONS[tone], message, "two"),
            _pick(SUGGESTIONS[tone], message, "three"),
        )
    ))[:3]

    reply = (
        f"{OPENERS[tone]} {reflection}\n\n"
        "You don't have to solve it in this conversation. One small next step is enough.\n\n"
        f"Want to try one of these?\n"
        + "\n".join(f"• {item}" for item in suggestions)
    )

    return CompanionReply(
        reply=reply,
        tone=tone,
        suggestions=suggestions,
        crisis=False,
        disclaimer=DISCLAIMER,
    )
