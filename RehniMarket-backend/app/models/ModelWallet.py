from sqlalchemy import Numeric, String, ForeignKey, DateTime, Enum, Index
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from app.database.Connection import Base


class WalletTransactionType(str, PyEnum):
    RECHARGE = "recharge"
    PURCHASE = "purchase"
    REFUND = "refund"
    ADJUSTMENT = "adjustment"


class Wallet(Base):
    """RehniCoin: billetera simulada en BD (no blockchain). Tasa fija 1 RehniCoin = 1 COP."""

    __tablename__ = "wallets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True
    )

    balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("Users", back_populates="wallet")

    transactions: Mapped[list["WalletTransaction"]] = relationship(
        "WalletTransaction", back_populates="wallet", cascade="all, delete-orphan"
    )


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    __table_args__ = (
        Index(
            "uq_wallet_transaction_refund_per_order",
            "order_id",
            unique=True,
            postgresql_where="type = 'REFUND' AND order_id IS NOT NULL",
        ),
        # Una recarga administrativa solo puede corregirse una vez: la fila de
        # corrección (type=ADJUSTMENT) apunta a la recarga original y esta
        # columna es única mientras no sea NULL. Garantía a nivel de BD contra
        # la doble corrección (el chequeo en la app, get_correction_of, la asume).
        Index(
            "uq_wallet_transaction_correction_per_recharge",
            "corrects_transaction_id",
            unique=True,
            postgresql_where="corrects_transaction_id IS NOT NULL",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    wallet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False
    )

    type: Mapped[WalletTransactionType] = mapped_column(
        Enum(WalletTransactionType), nullable=False
    )

    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Solo lo usa la fila de corrección (type=ADJUSTMENT): apunta a la recarga
    # RECHARGE original que se está corrigiendo. NULL en el resto de movimientos.
    corrects_transaction_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("wallet_transactions.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    wallet = relationship("Wallet", back_populates="transactions")

    created_by_user = relationship("Users", foreign_keys=[created_by])

    order = relationship("Order")
