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
    """Liquidación mensual; solo la crea PayoutService. Snapshot al generarse:
    `commission_percentage` es la tasa aplicada, no cambia retroactivamente."""

    __tablename__ = "company_payouts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("company.id"), nullable=False
    )

    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)

    gross_sales: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)

    commission_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False)
    commission_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    net_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)

    payout_status: Mapped[PayoutStatusEnum] = mapped_column(
        Enum(PayoutStatusEnum), nullable=False, default=PayoutStatusEnum.PENDING
    )

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
        UniqueConstraint(
            "company_id", "period_start", "period_end", name="uq_payout_company_period"
        ),
    )
