from sqlalchemy import Numeric, ForeignKey, DateTime
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone

from app.database.Connection import Base


class RehniCoinMovement(Base):
    """Auditoría de la conversión del neto de una liquidación a RehniCoin. No acredita
    ningún Wallet real. `conversion_rate` se guarda por fila para no alterar históricos."""

    __tablename__ = "rehnicoin_movements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("company.id"), nullable=False
    )

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
