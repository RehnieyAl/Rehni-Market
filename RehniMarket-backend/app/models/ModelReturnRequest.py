"""Modelo ORM de reclamaciones de devolución por ítem de pedido (tabla return_requests)."""

from sqlalchemy import Numeric, String, Text, DateTime, Enum, ForeignKey, Index
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from app.core.dbconexion import Base


class ReturnStatusEnum(str, PyEnum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class ReturnRequest(Base):
    """Reclamación de devolución de UN ítem de un pedido entregado. La inicia el comprador
    (user_id) y la decide la empresa dueña del pedido (company_id, denormalizado de Order).

    Ciclo: PENDING -> APPROVED | REJECTED por la empresa. Un rechazo puede pasar a
    UNDER_REVIEW si el comprador pide revisión (una vez) y un PENDING si el administrador
    interviene; desde UNDER_REVIEW solo el administrador decide. APPROVED siempre implica el
    reembolso en RehniCoin ya acreditado (misma transacción, enlazado por
    WalletTransaction.return_request_id con índice único). La decisión de la empresa
    (company_*) se conserva aunque el administrador decida después (admin_*).

    Sin ondelete: pedidos/ítems/empresas no se borran físicamente y la reclamación debe
    sobrevivir."""

    __tablename__ = "return_requests"

    __table_args__ = (
        Index(
            "uq_return_active_per_item",
            "order_item_id",
            unique=True,
            postgresql_where="status <> 'REJECTED'",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True
    )

    order_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("order_items.id"), nullable=False
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("company.id"), nullable=False, index=True
    )

    reason: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[ReturnStatusEnum] = mapped_column(
        Enum(ReturnStatusEnum, name="return_status"),
        nullable=False,
        default=ReturnStatusEnum.PENDING,
    )

    company_subject: Mapped[str | None] = mapped_column(String(150), nullable=True)
    company_response: Mapped[str | None] = mapped_column(Text, nullable=True)

    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    review_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    review_requested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    escalated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    admin_subject: Mapped[str | None] = mapped_column(String(150), nullable=True)
    admin_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    admin_reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    admin_resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    refund_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    # Liquidación que descontó este reembolso de las ventas de la empresa (NULL: aún pendiente).
    payout_adjustment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("company_payouts.id"), nullable=True, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    order = relationship("Order")
    order_item = relationship("OrderItem")
    user = relationship("Users", foreign_keys=[user_id])
    reviewer = relationship("Users", foreign_keys=[reviewed_by])
    admin_reviewer = relationship("Users", foreign_keys=[admin_reviewed_by])
    company = relationship("Company")
    events = relationship(
        "ReturnRequestEvent", order_by="ReturnRequestEvent.created_at", back_populates="return_request"
    )
    notifications = relationship(
        "ReturnNotification", order_by="ReturnNotification.created_at", back_populates="return_request"
    )
