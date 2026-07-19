from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any
from uuid import uuid4

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.modules.auth.models import InternalUser


def _new_id() -> str:
    return f"model_{uuid4().hex}"


def _utc_now_naive() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class AnalyticalDataModel(Base):
    __tablename__ = "analytical_data_models"
    __table_args__ = (UniqueConstraint("user_id", "normalized_name", name="uq_analytical_data_models_user_normalized_name"),)

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=_new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("internal_users.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    normalized_name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    model_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    test_status: Mapped[str] = mapped_column(String(32), default="draft")
    last_tested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    last_test_succeeded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    last_test_failed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    last_test_errors_json: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    last_test_warnings_json: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    diagnostics_stale: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=_utc_now_naive)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        default=_utc_now_naive,
        onupdate=_utc_now_naive,
    )

    user: Mapped[InternalUser] = relationship(back_populates="data_models")
