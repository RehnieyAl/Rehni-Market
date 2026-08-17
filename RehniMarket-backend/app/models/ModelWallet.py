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
    # Ajuste manual (ej. correccion de un error de recarga) - distinto de
    # RECHARGE para no mezclar en el historial de recargas administrativas
    # (ver AdminWalletRouter.py > "Historial") movimientos que no fueron
    # una recarga real.
    ADJUSTMENT = "adjustment"


class Wallet(Base):
    """
    RehniCoin: billetera 100% simulada dentro de la propia base de datos
    (NO blockchain, NO criptomoneda real - ver ALCANCE > Fase 8). Tasa
    fija 1 RehniCoin = 1 COP, aplicada como texto/UX en el frontend
    (formatPrice no se usa aqui a proposito, se muestra "X RC").
    """

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

    # Firmado: positivo en recargas/reembolsos, negativo en compras - el
    # saldo siempre es la suma de todos los movimientos (ledger).
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Auditoria: quien realizo el movimiento (ver ALCANCE > AUDITORIA).
    # Nulo para movimientos que no los origina un admin/owner a mano (ej.
    # PURCHASE generado por CheckoutService al confirmar un pedido).
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    wallet = relationship("Wallet", back_populates="transactions")

    # Solo para lectura (historial de "Administrador responsable" - ver
    # AdminWalletRouter.py). No se define back_populates del lado de
    # Users a proposito: no hace falta navegar de un admin a todas las
    # recargas que hizo desde el modelo Users.
    created_by_user = relationship("Users", foreign_keys=[created_by])
