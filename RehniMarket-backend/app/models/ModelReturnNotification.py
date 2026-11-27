"""Correos de una reclamación de devolución (tabla return_notifications): se guardan en la misma
transacción que la decisión y se envían después; el estado registra cada intento."""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.dbconexion import Base


class NotificationStatus(str, PyEnum):
    PENDING = "pending"
    SENDING = "sending"
    # El servidor SMTP aceptó el mensaje; no es una confirmación de entrega al buzón.
    ACCEPTED = "accepted"
    FAILED = "failed"


class ReturnNotification(Base):
    __tablename__ = "return_notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    return_request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("return_requests.id"), nullable=False, index=True
    )
    event_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("return_request_events.id"), nullable=True
    )

    kind: Mapped[str] = mapped_column(String(40), nullable=False)
    recipient_role: Mapped[str] = mapped_column(String(20), nullable=False)
    recipient_email: Mapped[str] = mapped_column(String(254), nullable=False)
    subject: Mapped[str] = mapped_column(String(150), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_html: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[NotificationStatus] = mapped_column(
        Enum(NotificationStatus, name="return_notification_status"),
        nullable=False,
        default=NotificationStatus.PENDING,
    )
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_error: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    return_request = relationship("ReturnRequest", back_populates="notifications")
