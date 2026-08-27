from sqlalchemy import Numeric, ForeignKey, DateTime
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone

from app.database.Connection import Base


class RehniCoinMovement(Base):
    """
    Registro de auditoría de la conversión del neto de una liquidación a
    RehniCoin (ver ALCANCE > Módulo de liquidaciones, Fase 3). Se crea
    automáticamente al generar cada CompanyPayout (ver PayoutService.py) -
    NO acredita el Wallet real de nadie (ver ModelWallet.py, que es la
    billetera con la que los USUARIOS compran); es solo trazabilidad de
    "cuánto de este giro equivaldría en RehniCoin y a qué tasa", para
    auditoría, no un saldo gastable.

    `conversion_rate` se guarda por fila (no se relee de PayoutConfig más
    adelante) para que un cambio futuro de la tasa no altere el valor
    histórico de conversiones ya registradas.
    """

    __tablename__ = "rehnicoin_movements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("company.id"), nullable=False
    )

    # Uno a uno: cada liquidación genera como máximo un movimiento de
    # conversión (ver CompanyPayout.rehnicoin_movement).
    payout_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("company_payouts.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    amount_cop: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    rehni_coins: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    conversion_rate: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    company = relationship("Company")
    payout = relationship("CompanyPayout", back_populates="rehnicoin_movement")
