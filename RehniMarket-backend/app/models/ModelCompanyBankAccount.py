from sqlalchemy import String, Boolean, ForeignKey, DateTime, Enum, Index, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from app.database.Connection import Base


class BankAccountTypeEnum(str, PyEnum):
    SAVINGS = "savings"
    CHECKING = "checking"
    NEQUI = "nequi"
    DAVIPLATA = "daviplata"


class CompanyBankAccount(Base):
    """
    Cuentas bancarias registradas por una empresa para recibir el giro del
    95% neto de sus liquidaciones mensuales (ver ALCANCE > Módulo de
    liquidaciones, Fase 1 y ModelCompanyPayout.py > bank_account_id).

    Una empresa puede registrar varias cuentas, pero solo una puede estar
    marcada como predeterminada a la vez (ver la restricción a nivel de
    aplicación en BankAccountService.py, mismo patrón que
    Address.is_default/AddressService.clear_default, más el índice único
    parcial de abajo como defensa a nivel de base de datos, ya que acá el
    dato es financiero).
    """

    __tablename__ = "company_bank_accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("company.id"), nullable=False
    )

    account_holder: Mapped[str] = mapped_column(String(150), nullable=False)
    document_number: Mapped[str] = mapped_column(String(30), nullable=False)
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

    payouts = relationship("CompanyPayout", back_populates="bank_account")

    __table_args__ = (
        # Defensa a nivel de BD de "una sola cuenta por defecto por
        # empresa" - la aplicación ya lo garantiza (ver
        # BankAccountService.clear_default antes de cada insert/update),
        # pero un índice único parcial evita que una carrera de dos
        # requests concurrentes deje dos cuentas is_default=true para la
        # misma empresa.
        Index(
            "uq_company_bank_account_default",
            "company_id",
            unique=True,
            postgresql_where=text("is_default = true"),
        ),
    )
