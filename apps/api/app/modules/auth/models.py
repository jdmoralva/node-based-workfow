from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex}"


def _utc_now_naive() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class InternalUser(Base):
    __tablename__ = "internal_users"

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: _new_id("user"))
    username: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(512))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=_utc_now_naive)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        default=_utc_now_naive,
        onupdate=_utc_now_naive,
    )

    sessions: Mapped[list[AuthenticatedSession]] = relationship(back_populates="user", cascade="all, delete-orphan")


class AuthenticatedSession(Base):
    __tablename__ = "authenticated_sessions"

    id: Mapped[str] = mapped_column(String(48), primary_key=True, default=lambda: _new_id("session"))
    user_id: Mapped[str] = mapped_column(ForeignKey("internal_users.id"), index=True)
    session_token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=_utc_now_naive)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=_utc_now_naive)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=False))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)

    user: Mapped[InternalUser] = relationship(back_populates="sessions")
