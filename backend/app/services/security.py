"""Password hashing and JWT helpers."""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from sqlalchemy import delete
from sqlalchemy.orm import Session

from ..config import settings
from ..models import RevokedToken
from ..models.user import utcnow


def _password_bytes(password: str) -> bytes:
    # bcrypt only considers the first 72 bytes; truncate explicitly so long
    # passwords never raise instead of being silently shortened.
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_password_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(_password_bytes(password), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "jti": uuid.uuid4().hex,
        "iat": now,
        "exp": now + timedelta(days=settings.access_token_days),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
        options={"require": ["exp", "sub"]},
    )


def access_token_is_revoked(db: Session, token: str) -> bool:
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    return db.get(RevokedToken, token_hash) is not None


def revoke_access_token(db: Session, token: str) -> None:
    payload = decode_access_token(token)
    expires_at = datetime.fromtimestamp(payload["exp"], timezone.utc).replace(
        tzinfo=None
    )

    db.execute(delete(RevokedToken).where(RevokedToken.expires_at <= utcnow()))
    db.add(
        RevokedToken(
            token_hash=hashlib.sha256(token.encode("utf-8")).hexdigest(),
            expires_at=expires_at,
        )
    )
    db.commit()
