from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.modules.auth.models import InternalUser


def _new_id() -> str:
    return f"conn_{uuid4().hex}"


def _utc_now_naive() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class DatabaseConnection(Base):
    __tablename__ = "database_connections"
    __table_args__ = (UniqueConstraint("user_id", "normalized_label", name="uq_database_connections_user_normalized_label"),)

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=_new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("internal_users.id"), index=True)
    label: Mapped[str] = mapped_column(String(255))
    normalized_label: Mapped[str] = mapped_column(String(255))
    driver: Mapped[str] = mapped_column(String(32), default="sqlite")
    database_path: Mapped[str] = mapped_column(String(1024))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=_utc_now_naive)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        default=_utc_now_naive,
        onupdate=_utc_now_naive,
    )
    last_tested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)

    user: Mapped[InternalUser] = relationship(back_populates="connections")
