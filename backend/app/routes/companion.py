from __future__ import annotations

from fastapi import APIRouter

from ..schemas.companion import CompanionReply, CompanionRequest
from ..services.companion import respond

router = APIRouter(prefix="/api", tags=["companion"])


@router.post("/companion", response_model=CompanionReply)
def companion_reply(payload: CompanionRequest) -> CompanionReply:
    """Public endpoint: guests get support too, and no account is needed.

    The response is produced by a transparent rule set, so it costs nothing to
    run and never claims to be a clinician.
    """
    return respond(payload.message)
