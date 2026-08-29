from sqlalchemy import String, Text, DateTime, Enum, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from app.database.Connection import Base


class ReportTargetType(str, PyEnum):
    PRODUCT = "product"
    COMPANY = "company"


class ReportStatus(str, PyEnum):
    PENDING = "pending"
    REVIEWING = "reviewing"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class Report(Base):
    """Reporte de un producto o una empresa (un solo modelo, diferenciado por
    target_type; product_id/company_id mutuamente excluyentes, ver el CheckConstraint).
    Sin ondelete: producto/empresa nunca se borran físicamente y el reporte debe
    sobrevivir. Reportar no dispara ninguna acción automática: queda PENDING."""

    __tablename__ = "reports"

    __table_args__ = (
        CheckConstraint(
            "(target_type = 'PRODUCT' AND product_id IS NOT NULL AND company_id IS NULL) OR "
            "(target_type = 'COMPANY' AND company_id IS NOT NULL AND product_id IS NULL)",
            name="ck_report_target_exclusive",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Siempre de la sesión autenticada, nunca de un campo enviado por el frontend.
    reporter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    target_type: Mapped[ReportTargetType] = mapped_column(
        Enum(ReportTargetType, name="report_target_type"), nullable=False
    )

    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=True
    )

    company_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("company.id"), nullable=True
    )

    reason: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status"),
        nullable=False,
        default=ReportStatus.PENDING,
    )

    admin_response: Mapped[str | None] = mapped_column(Text, nullable=True)

    resolved_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    reporter = relationship("Users", foreign_keys=[reporter_id])
    resolver = relationship("Users", foreign_keys=[resolved_by])
    product = relationship("Product")
    company = relationship("Company")

    evidences: Mapped[list["ReportEvidence"]] = relationship(
        "ReportEvidence",
        back_populates="report",
        cascade="all, delete-orphan",
        order_by="ReportEvidence.created_at",
    )


class ReportEvidence(Base):
    """Imagen de evidencia de un Report, solo se agrega al crear el reporte.
    `url` = object_name de MinIO (ver build_media_url). CASCADE defensivo."""

    __tablename__ = "report_evidences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
    )

    url: Mapped[str] = mapped_column(String(255), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    report = relationship("Report", back_populates="evidences")
