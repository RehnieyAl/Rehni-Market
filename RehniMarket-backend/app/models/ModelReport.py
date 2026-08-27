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
    """
    Reporte/denuncia de un PRODUCTO o de una EMPRESA, hecho por un
    usuario autenticado. Vive bajo el centro único "Admin > Reportes"
    que ya existía como entrada de menú (ver
    shared/config/dashboardNavigation.tsx, id "reports") sin
    implementación real - este modelo es esa implementación.

    Un solo modelo para ambos tipos de reporte -no ProductReport/
    CompanyReport separados- diferenciados por target_type, con
    product_id/company_id mutuamente excluyentes según cuál sea (ver
    CheckConstraint ck_report_target_exclusive):

        target_type=PRODUCT -> product_id != NULL, company_id == NULL
        target_type=COMPANY -> company_id != NULL, product_id == NULL

    Sin ondelete en las FK de producto/empresa: ninguna de las dos se
    borra físicamente en este sistema (los productos se desactivan con
    is_active=False, ver delete_product_service; las empresas se
    suspenden con CompanyStatus=False, ver
    update_company_status_service) - el reporte debe sobrevivir intacto
    a ambos casos, nunca perderse ni quedar huérfano.

    Reportar NUNCA dispara ninguna acción automática (suspender empresa,
    desactivar producto, reembolsar, etc.): el reporte queda PENDING a
    la espera de que un admin/owner lo revise y, si corresponde, decida
    a mano usar los servicios YA EXISTENTES de suspensión/eliminación -
    esa lógica no se duplica acá.
    """

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

    # El usuario reportante SIEMPRE se obtiene de la sesión autenticada
    # (request.state.user_id, ver ReportRouter.py) - nunca de un campo
    # enviado por el frontend (ver ALCANCE > "no aceptar reporter_id como
    # dato confiable").
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

    # Sin back_populates del lado de Users/Product/Company a propósito:
    # no hace falta navegar "todos los reportes hechos por este usuario"
    # ni "todos los reportes de este producto/empresa" desde esos
    # modelos - se consulta siempre desde Report (ver ReportRepository.py),
    # así se evita tocar ModelUser.py/ModelProduct.py/ModelCompany.py.
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
    """
    Imagen adjunta como evidencia de un Report (ver ALCANCE > Reportes -
    EVIDENCIAS/IMÁGENES), opcional y solo se agregan al CREAR el reporte
    (ver ReportService.create_report_service) - no existe ningún
    endpoint para agregar/quitar evidencias después, así que la regla
    "RESOLVED es de solo lectura" (ver _assert_report_editable en
    DashboardService/admin/ReportService.py) ya cubre este caso sin
    necesitar un chequeo aparte: simplemente no hay manera de tocarlas
    una vez creado el reporte.

    Mismo patrón de almacenamiento que ProductImage (ver ModelProduct.py):
    `url` guarda el object_name/path relativo dentro del bucket de MinIO
    (NO una URL completa), armado en NasService.upload_file - se
    convierte en una URL real recién al leer, con build_media_url (mismo
    mecanismo público que usan TODAS las imágenes del proyecto: logos,
    banners, fotos de producto, certificados de empresa - no se inventa
    un mecanismo de acceso distinto solo para esto).

    FK con ondelete="CASCADE" a nivel de Postgres, además del cascade de
    SQLAlchemy en Report.evidences arriba: ninguno de los dos endpoints
    reales de este proyecto borra un Report (no existe esa operación,
    ver ALCANCE > "los reportes no se eliminan"), así que esto es
    puramente defensivo, para que un Report nunca pueda quedar con
    evidencias huérfanas si alguna vez se borra uno a mano.
    """

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
