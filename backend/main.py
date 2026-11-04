"""Vercel adapter entry point for Mindsy.

Vercel's Python runtime looks for a FastAPI instance named ``app`` at a
supported entrypoint (main.py). This file only re-exports the existing
application from ``backend/app/main.py`` so Vercel can run the existing
FastAPI business logic unchanged.
"""

from app.main import app  # type: ignore

__all__ = ["app"]
