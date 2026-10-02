"""Negotiation schema for custom plan consultation and bargain calls."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class PlanNegotiation(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "plan_negotiations"

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    client_email: Mapped[str] = mapped_column(String(255), nullable=False)
    client_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    proposed_budget: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[str] = mapped_column(String(50), nullable=False)
    preferred_window: Mapped[str] = mapped_column(String(100), nullable=False)
    target_topic: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False)
    agreed_amount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    razorpay_custom_plan_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    order_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    client: Mapped[User] = relationship("User", backref="negotiations")

    __table_args__ = (
        Index("idx_negotiations_status", "status"),
        Index("idx_negotiations_created_at", "created_at"),
    )
