from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from hashlib import sha256
import secrets

from fastapi import Response

from app.core.config import Settings, get_settings


@dataclass(slots=True)
class SessionTokenPair:
    raw_token: str
    token_hash: str


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def generate_session_token_pair() -> SessionTokenPair:
    raw_token = secrets.token_urlsafe(32)
    token_hash = sha256(raw_token.encode("utf-8")).hexdigest()
    return SessionTokenPair(raw_token=raw_token, token_hash=token_hash)


def expires_at_from_now(settings: Settings | None = None) -> datetime:
    active_settings = settings or get_settings()
    return utc_now() + timedelta(seconds=active_settings.session_cookie_max_age_seconds)


def hash_session_token(raw_token: str) -> str:
    return sha256(raw_token.encode("utf-8")).hexdigest()


def set_session_cookie(response: Response, raw_token: str, settings: Settings | None = None) -> None:
    active_settings = settings or get_settings()
    response.set_cookie(
        key=active_settings.session_cookie_name,
        value=raw_token,
        httponly=True,
        secure=active_settings.resolved_session_cookie_secure,
        samesite=active_settings.session_cookie_samesite,
        max_age=active_settings.session_cookie_max_age_seconds,
        path=active_settings.session_cookie_path,
    )


def clear_session_cookie(response: Response, settings: Settings | None = None) -> None:
    active_settings = settings or get_settings()
    response.delete_cookie(
        key=active_settings.session_cookie_name,
        path=active_settings.session_cookie_path,
    )
