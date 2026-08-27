from sqlalchemy import Numeric, ForeignKey, DateTime, Date, Enum, UniqueConstraint
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, date, timezone
from enum import Enum as PyEnum

from app.database.Connection import Base


class PayoutStatusEnum(str, PyEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    PAID = "paid"
    FAILED = "failed"


class CompanyPayout(Base):
    """
    Liquidación mensual de una empresa (ver ALCANCE > Módulo de
    liquidaciones, Fase 2 y PayoutService.py, que es el único lugar que
    calcula/crea filas de esta tabla - nunca se arma a mano en un router).

    Snapshot en el momento de generarse: `commission_percentage` guarda la
    tasa REALMENTE aplicada (ver app/core/PayoutConfig.py), no un valor
    fijo en código - si la comisión cambia en el futuro, las liquidaciones
    ya generadas no cambian retroactivamente (mismo criterio que
    OrderItem.unit_price, que snapshotea el precio al momento de comprar).
    """

    __tablename__ = "company_payouts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("company.id"), nullable=False
    )

    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)

    # Suma de Order.total de pedidos DELIVERED de la empresa dentro del
    # periodo (ver OrderRepository.sum_valid_company_sales) - único estado
    # que este sistema trata como "venta finalizada" (ver
    # OrderStatusCountsResponse.completed, que ya mapea DELIVERED a
    # "completado").
    gross_sales: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)

    commission_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False)
    commission_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    net_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)

    payout_status: Mapped[PayoutStatusEnum] = mapped_column(
        Enum(PayoutStatusEnum), nullable=False, default=PayoutStatusEnum.PENDING
    )

    # Cuenta a la que se gira el neto - se fija en el momento de generar la
    # liquidación (la predeterminada de la empresa en ese momento, ver
    # PayoutService), no se recalcula en vivo si la empresa cambia su
    # cuenta predeterminada después. RESTRICT: una cuenta referenciada por
    # al menos una liquidación no se puede borrar (ver
    # BankAccountService.delete_bank_account_service).
    bank_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("company_bank_accounts.id", ondelete="RESTRICT"),
        nullable=False,
    )

    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    company = relationship("Company", back_populates="payouts")
    bank_account = relationship("CompanyBankAccount", back_populates="payouts")

    rehnicoin_movement = relationship(
        "RehniCoinMovement",
        back_populates="payout",
        uselist=False,
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        # Idempotencia: no se puede generar dos veces la liquidación del
        # mismo periodo exacto para la misma empresa (ver
        # PayoutService.generate_company_payout_service).
        UniqueConstraint(
            "company_id", "period_start", "period_end", name="uq_payout_company_period"
        ),
    )
