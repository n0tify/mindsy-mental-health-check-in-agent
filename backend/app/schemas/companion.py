from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class CompanionRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)

    @field_validator("message")
    @classmethod
    def clean_message(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Say anything you like.")
        return cleaned


class CompanionReply(BaseModel):
    reply: str
    tone: str
    suggestions: list[str] = Field(default_factory=list)
    crisis: bool = False
    disclaimer: str
