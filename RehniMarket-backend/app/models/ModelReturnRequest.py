from sqlalchemy import Numeric, Text, DateTime, Enum, ForeignKey, Index
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from app.database.Connection import Base


class ReturnStatusEnum(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ReturnRequest(Base):
    """Solicitud de devolución de UN ítem de un pedido entregado. La inicia el
    comprador (user_id) y la evalúa la empresa dueña del pedido (company_id, columna
    denormalizada desde Order para acotar las consultas y la seguridad).

    Ciclo: PENDING -> APPROVED | REJECTED (terminal). Al aprobar se reintegra el
    dinero a la billetera RehniCoin del comprador con WalletService.refund_wallet
    (order_id=None: la idempotencia vive en el estado + el índice único parcial, no
    en el índice de reembolso por pedido de la cancelación). Al rechazar,
    company_response guarda el motivo obligatorio.

    Sin ondelete: pedidos/ítems/empresas no se borran físicamente y la devolución
    debe sobrevivir."""

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

    company_response: Mapped[str | None] = mapped_column(Text, nullable=True)

    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    refund_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

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
    company = relationship("Company")
