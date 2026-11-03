"""Mindsy API entrypoint.

Run locally:
    uvicorn app.main:app --reload --port 8010
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routes import auth, companion, entries, garden, gratitude, guest_migrations, journal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mindsy")


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.validate()
    init_db()
    if settings.uses_default_secret:
        logger.warning(
            "JWT_SECRET is not set; using the development default. "
            "Set JWT_SECRET before exposing this API publicly."
        )
    logger.info("Mindsy API ready (database: %s)", settings.database_url.split("://")[0])
    yield


app = FastAPI(
    title="Mindsy API",
    description=(
        "Backend for Mindsy, a mental wellness and emotional check-in application. "
        "Mindsy is a wellness tool, not a medical service."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    auth.router,
    entries.router,
    garden.router,
    journal.router,
    gratitude.router,
    guest_migrations.router,
    companion.router,
):
    app.include_router(router)


@app.get("/api/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "mindsy-api"}
