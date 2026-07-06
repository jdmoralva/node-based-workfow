from app.core.session import expires_at_from_now, generate_session_token_pair, hash_session_token, utc_now

from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db_session
from app.core.security import verify_against_dummy_hash, verify_password
from app.modules.auth import repository
from app.modules.auth.models import AuthenticatedSession, InternalUser

INVALID_CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid credentials",
)
UNAUTHENTICATED_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Authentication required",
)


def authenticate_user(db: Session, username: str, password: str) -> InternalUser:
    user = repository.get_user_by_username(db, username)
    if user is None:
        verify_against_dummy_hash(password)
        raise INVALID_CREDENTIALS_ERROR
    if not user.is_active or not verify_password(password, user.password_hash):
        raise INVALID_CREDENTIALS_ERROR
    return user


def create_session_for_user(db: Session, user: InternalUser) -> tuple[AuthenticatedSession, str]:
    token_pair = generate_session_token_pair()
    session_record = repository.create_authenticated_session(
        db,
        user=user,
        session_token_hash=token_pair.token_hash,
        expires_at=expires_at_from_now(),
    )
    return session_record, token_pair.raw_token


def _load_valid_session(db: Session, raw_token: str) -> AuthenticatedSession:
    token_hash = hash_session_token(raw_token)
    session_record = repository.get_authenticated_session_by_hash(db, token_hash)
    now = utc_now()
    if session_record is None or session_record.revoked_at is not None or session_record.expires_at <= now:
        raise UNAUTHENTICATED_ERROR
    repository.touch_authenticated_session(db, session_record, now)
    return session_record


def revoke_session_if_present(db: Session, raw_token: str | None) -> None:
    if not raw_token:
        return
    token_hash = hash_session_token(raw_token)
    session_record = repository.get_authenticated_session_by_hash(db, token_hash)
    if session_record is None or session_record.revoked_at is not None:
        return
    repository.revoke_authenticated_session(db, session_record, utc_now())


def require_current_user(
    request: Request,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
    session_cookie: str | None = Cookie(default=None, alias="rv_session"),
) -> InternalUser:
    raw_token = session_cookie
    if settings.session_cookie_name != "rv_session":
        raw_token = request.cookies.get(settings.session_cookie_name)
    if not raw_token:
        raise UNAUTHENTICATED_ERROR
    session_record = _load_valid_session(db, raw_token)
    return session_record.user
