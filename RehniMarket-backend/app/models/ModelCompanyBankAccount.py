"""Modelo ORM de cuentas bancarias de la empresa para liquidaciones (tabla company_bank_accounts)."""

from sqlalchemy import String, Boolean, ForeignKey, DateTime, Enum, Index, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from app.core.dbconexion import Base


class BankAccountTypeEnum(str, PyEnum):
    SAVINGS = "savings"
    CHECKING = "checking"
    NEQUI = "nequi"
    DAVIPLATA = "daviplata"


class CompanyBankAccount(Base):
    """Cuentas para recibir el giro neto de las liquidaciones. Solo una is_default
    por empresa (garantizado en BankAccountService + índice único parcial)."""

    __tablename__ = "company_bank_accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("company.id"), nullable=False
    )

    account_holder: Mapped[str] = mapped_column(String(150), nullable=False)
    document_number: Mapped[str] = mapped_column(String(30), nullable=False)
    # Banco del catálogo. Nulo solo en cuentas registradas antes del catálogo cuyo nombre aún no coincide
    # con un banco registrado; bank_name conserva el nombre mostrado y el que leen las liquidaciones.
    bank_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("banks.id", ondelete="RESTRICT"), nullable=True, index=True
    )

    bank_name: Mapped[str] = mapped_column(String(100), nullable=False)

    account_type: Mapped[BankAccountTypeEnum] = mapped_column(
        Enum(BankAccountTypeEnum), nullable=False
    )

    account_number: Mapped[str] = mapped_column(String(40), nullable=False)

    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    company = relationship("Company", back_populates="bank_accounts")

    bank = relationship("Bank", lazy="joined")

    payouts = relationship("CompanyPayout", back_populates="bank_account")

    __table_args__ = (
        Index(
            "uq_company_bank_account_default",
            "company_id",
            unique=True,
            postgresql_where=text("is_default = true"),
        ),
    )
