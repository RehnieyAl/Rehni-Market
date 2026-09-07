from sqlalchemy import String, Boolean, ForeignKey, DateTime, Enum, Text
from datetime import datetime, timezone
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

import uuid

from app.database.Connection import Base

from enum import Enum as PyEnum


class CompanyCertificateEnum(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    # Rechazo terminal de la empresa: NO puede resubir el certificado por sí misma
    # (solo un admin/owner puede volver a moverla). Mantiene el motivo en rejection_reason.
    REJECTED = "rejected"
    # El certificado presentado no es válido / está vencido / ilegible: la empresa
    # SÍ puede subir uno nuevo (POST /company/certificate/update sin JWT o
    # PUT /company/certificate con JWT), lo que la devuelve a PENDING.
    NEEDS_UPDATE = "needs_update"


class Company(Base):

    __tablename__ = "company"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    nameCompany: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    addressCompany: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    CompanyNIT: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    CompanyNITDV: Mapped[str] = mapped_column(
        String(1),
        nullable=False,
    )

    CompanyLogo: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    CompanyBanner: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    CompanyCertificate: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    CompanyCertificateStatus: Mapped[CompanyCertificateEnum] = mapped_column(
        Enum(CompanyCertificateEnum),
        nullable=False,
        default=CompanyCertificateEnum.PENDING,
    )

    rejection_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    CompanyStatus: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    suspension_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )

    user: Mapped["Users"] = relationship(
        "Users",
        back_populates="company",
    )

    products: Mapped[list["Product"]] = relationship(
        "Product",
        back_populates="company",
    )

    target_activities: Mapped[list["AdminActivity"]] = relationship(
        "AdminActivity",
        foreign_keys="AdminActivity.target_company_id",
        back_populates="target_company",
    )

    bank_accounts: Mapped[list["CompanyBankAccount"]] = relationship(
        "CompanyBankAccount", back_populates="company"
    )

    payouts: Mapped[list["CompanyPayout"]] = relationship(
        "CompanyPayout", back_populates="company"
    )
