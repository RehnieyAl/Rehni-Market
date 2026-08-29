from sqlalchemy import Numeric, String, ForeignKey, DateTime, Enum
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
    # Ajuste manual; separado de RECHARGE para no ensuciar el historial de recargas.
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

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    wallet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False
    )

    type: Mapped[WalletTransactionType] = mapped_column(
        Enum(WalletTransactionType), nullable=False
    )

    # Firmado: + en recargas/reembolsos, - en compras (el saldo es la suma del ledger).
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Admin/owner que originó el movimiento; None si es automático (ej. PURCHASE del checkout).
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # Pedido reembolsado (solo REFUND); distingue "cancelado" de "cancelado y
    # reembolsado". SET NULL: el movimiento es un registro contable que debe sobrevivir.
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    wallet = relationship("Wallet", back_populates="transactions")

    # Solo lectura (historial de "Administrador responsable"); sin back_populates en Users.
    created_by_user = relationship("Users", foreign_keys=[created_by])

    order = relationship("Order")
