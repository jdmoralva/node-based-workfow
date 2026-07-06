from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auth.models import AuthenticatedSession, InternalUser


def get_user_by_username(db: Session, username: str) -> InternalUser | None:
    return db.scalar(select(InternalUser).where(InternalUser.username == username))


def create_user(db: Session, username: str, password_hash: str) -> InternalUser:
    user = InternalUser(username=username, password_hash=password_hash)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_authenticated_session(
    db: Session,
    *,
    user: InternalUser,
    session_token_hash: str,
    expires_at: datetime,
) -> AuthenticatedSession:
    session_record = AuthenticatedSession(
        user_id=user.id,
        session_token_hash=session_token_hash,
        expires_at=expires_at,
    )
    db.add(session_record)
    db.commit()
    db.refresh(session_record)
    return session_record


def get_authenticated_session_by_hash(db: Session, token_hash: str) -> AuthenticatedSession | None:
    return db.scalar(
        select(AuthenticatedSession).where(AuthenticatedSession.session_token_hash == token_hash)
    )


def revoke_authenticated_session(db: Session, session_record: AuthenticatedSession, revoked_at: datetime) -> None:
    session_record.revoked_at = revoked_at
    db.add(session_record)
    db.commit()


def touch_authenticated_session(db: Session, session_record: AuthenticatedSession, seen_at: datetime) -> None:
    session_record.last_seen_at = seen_at
    db.add(session_record)
    db.commit()
