import logging
from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.utils.FileValidator import IMAGE_EXTENSIONS, validate_uploads

from app.models.ModelReport import Report, ReportEvidence, ReportTargetType
from app.models.ModelProduct import Product
from app.models.ModelCompany import Company

from app.repository import ReportRepository as repo

from app.services.NasService import build_media_url

from app.schemas.SchemaCommerce.SchemaReport import (
    CreateReportRequest,
    ReportEvidenceResponse,
    ReportResponse,
)

logger = logging.getLogger(__name__)

MAX_EVIDENCE_IMAGES = 5
def _validate_evidence_files(evidences: list[UploadFile]) -> None:
    if len(evidences) > MAX_EVIDENCE_IMAGES:
        api_error(
            400,
            ErrorCodes.INVALID_FILE,
            f"Puedes adjuntar como máximo {MAX_EVIDENCE_IMAGES} imágenes.",
        )

    validate_uploads(evidences, IMAGE_EXTENSIONS, "Evidencia")


def create_report_service(
    reporter_id: UUID,
    data: CreateReportRequest,
    database: Session,
    nas=None,
    evidences: list[UploadFile] | None = None,
) -> ReportResponse:
    """Crea un reporte de producto o de empresa (un solo flujo, diferenciado por targetType).
    `reporter_id` viene siempre de la sesión, nunca del body. El reporte queda en PENDING,
    sin disparar ninguna acción automática. Las evidencias son opcionales y se validan antes
    de tocar la BD."""

    evidence_files = [f for f in (evidences or []) if f and f.filename]

    if evidence_files:
        _validate_evidence_files(evidence_files)

    try:
        product_id: UUID | None = None
        company_id: UUID | None = None

        if data.targetType == "product":
            product = (
                database.query(Product)
                .filter(Product.id == data.targetId)
                .first()
            )

            if not product:
                api_error(404, ErrorCodes.PRODUCT_NOT_FOUND, "Producto no encontrado.")

            product_id = product.id

            target_type = ReportTargetType.PRODUCT

        else:
            company = (
                database.query(Company)
                .filter(Company.id == data.targetId)
                .first()
            )

            if not company:
                api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada.")

            company_id = company.id

            target_type = ReportTargetType.COMPANY

        report = Report(
            reporter_id=reporter_id,
            target_type=target_type,
            product_id=product_id,
            company_id=company_id,
            reason=data.reason.strip(),
            description=(data.description.strip() if data.description else None),
        )

        repo.create_report(database, report)

        if evidence_files and nas:
            for file in evidence_files:
                result = nas.upload_file(file, f"reports/{report.id}/evidences/")

                if not result or not result.get("success"):
                    api_error(
                        500,
                        ErrorCodes.FILE_UPLOAD_FAILED,
                        "No se pudo subir una de las imágenes de evidencia.",
                    )

                database.add(
                    ReportEvidence(report_id=report.id, url=result["path"])
                )

        database.commit()

        full_report = repo.get_report_by_id(database, report.id)

        return _to_report_response(full_report)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        logger.exception("Error inesperado")
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def _to_report_response(report: Report) -> ReportResponse:
    """Idéntica a DashboardService/admin/ReportService._to_report_response; se duplica
    a propósito para no cruzar dependencias entre capas."""

    is_product = report.target_type.value == "product"

    return ReportResponse(
        id=report.id,
        targetType=report.target_type.value,
        productId=report.product_id,
        productName=report.product.name if is_product and report.product else None,
        companyId=(
            report.product.company_id
            if is_product and report.product
            else report.company_id
        ),
        companyName=(
            report.product.company.nameCompany
            if is_product and report.product and report.product.company
            else (report.company.nameCompany if report.company else None)
        ),
        reporterId=report.reporter_id,
        reporterName=report.reporter.fullName if report.reporter else "",
        reporterEmail=report.reporter.email if report.reporter else "",
        reason=report.reason,
        description=report.description,
        status=report.status.value,
        adminResponse=report.admin_response,
        resolvedByName=report.resolver.fullName if report.resolver else None,
        evidences=[
            ReportEvidenceResponse(id=evidence.id, url=build_media_url(evidence.url))
            for evidence in report.evidences
        ],
        createdAt=report.created_at,
        updatedAt=report.updated_at,
        resolvedAt=report.resolved_at,
    )
