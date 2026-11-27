"""Historial de una reclamación de devolución (tabla return_request_events): cada acción queda
registrada con su actor; nunca se edita ni se borra."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.dbconexion import Base


class ReturnEventType(str, PyEnum):
    REQUESTED = "requested"
    COMPANY_APPROVED = "company_approved"
    COMPANY_REJECTED = "company_rejected"
    REFUNDED = "refunded"
    REVIEW_REQUESTED = "review_requested"
    ESCALATED = "escalated"
    ADMIN_APPROVED = "admin_approved"
    ADMIN_REJECTED = "admin_rejected"
    ADMIN_EMAIL = "admin_email"
    ADMIN_CALL = "admin_call"


class CallOutcome(str, PyEnum):
    CONTACTED = "contacted"
    NO_ANSWER = "no_answer"
    WRONG_NUMBER = "wrong_number"
    CALLBACK_REQUESTED = "callback_requested"


class ReturnRequestEvent(Base):
    __tablename__ = "return_request_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    return_request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("return_requests.id"), nullable=False, index=True
    )

    event_type: Mapped[ReturnEventType] = mapped_column(
        Enum(ReturnEventType, name="return_event_type"), nullable=False
    )

    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    actor_role: Mapped[str] = mapped_column(String(20), nullable=False)

    subject: Mapped[str | None] = mapped_column(String(150), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    wallet_transaction_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wallet_transactions.id"), nullable=True
    )

    call_outcome: Mapped[CallOutcome | None] = mapped_column(
        Enum(CallOutcome, name="return_call_outcome"), nullable=True
    )
    occurred_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    return_request = relationship("ReturnRequest", back_populates="events")
    actor = relationship("Users")
