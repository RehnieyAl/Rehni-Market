import traceback
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelReport import Report, ReportTargetType, ReportStatus

from app.repository import ReportRepository as repo

from app.services.NasService import build_media_url

from app.schemas.SchemaCommerce.SchemaReport import (
    ReportResponse,
    ReportEvidenceResponse,
    ReportListItemResponse,
    ReportsPaginatedResponse,
    UpdateReportStatusRequest,
)


def list_reports_service(
    database: Session,
    page: int = 1,
    limit: int = 10,
    target_type: str | None = None,
    status: str | None = None,
    search: str | None = None,
) -> ReportsPaginatedResponse:

    parsed_target_type: ReportTargetType | None = None

    if target_type and target_type != "all":
        try:
            parsed_target_type = ReportTargetType(target_type)
        except ValueError:
            api_error(400, ErrorCodes.INVALID_REPORT_TARGET, "Tipo de reporte inválido.")

    parsed_status: ReportStatus | None = None

    if status and status != "all":
        try:
            parsed_status = ReportStatus(status)
        except ValueError:
            api_error(400, ErrorCodes.VALIDATION_ERROR, "Estado de reporte inválido.")

    reports, total = repo.list_reports(
        database=database,
        page=page,
        limit=limit,
        target_type=parsed_target_type,
        status=parsed_status,
        search=search,
    )

    items = [_to_list_item(report) for report in reports]

    return ReportsPaginatedResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit if total else 0,
    )


def _to_list_item(report: Report) -> ReportListItemResponse:
    is_product = report.target_type == ReportTargetType.PRODUCT

    target_label = (
        (report.product.name if report.product else "Producto eliminado")
        if is_product
        else (report.company.nameCompany if report.company else "Empresa eliminada")
    )

    company_name = (
        (report.product.company.nameCompany if report.product and report.product.company else None)
        if is_product
        else (report.company.nameCompany if report.company else None)
    )

    return ReportListItemResponse(
        id=report.id,
        targetType=report.target_type.value,
        targetLabel=target_label,
        companyName=company_name,
        reporterName=report.reporter.fullName if report.reporter else "",
        reason=report.reason,
        status=report.status.value,
        createdAt=report.created_at,
    )


def get_report_detail_service(
    database: Session, report_id: UUID
) -> ReportResponse:

    report = repo.get_report_by_id(database, report_id)

    if not report:
        api_error(404, ErrorCodes.REPORT_NOT_FOUND, "Reporte no encontrado.")

    return _to_report_response(report)


def _to_report_response(report: Report) -> ReportResponse:
    is_product = report.target_type == ReportTargetType.PRODUCT

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


def _assert_report_editable(report: Report) -> None:
    if report.status == ReportStatus.RESOLVED:
        api_error(
            409,
            ErrorCodes.REPORT_ALREADY_RESOLVED,
            "El reporte ya fue resuelto y no puede modificarse.",
        )


def update_report_status_service(
    database: Session,
    report_id: UUID,
    admin_id: UUID,
    data: UpdateReportStatusRequest,
) -> ReportResponse:

    try:
        report = repo.get_report_by_id(database, report_id)

        if not report:
            api_error(404, ErrorCodes.REPORT_NOT_FOUND, "Reporte no encontrado.")

        _assert_report_editable(report)

        try:
            target_status = ReportStatus(data.status)
        except ValueError:
            api_error(400, ErrorCodes.VALIDATION_ERROR, "Estado de reporte inválido.")

        is_final = target_status in (ReportStatus.RESOLVED, ReportStatus.REJECTED)

        repo.update_report_status(
            database=database,
            report=report,
            status=target_status,
            admin_response=(
                data.adminResponse.strip() if data.adminResponse else None
            ),
            resolved_by=admin_id if is_final else None,
            resolved_at=datetime.now(timezone.utc) if is_final else None,
        )

        database.commit()

        full_report = repo.get_report_by_id(database, report.id)

        return _to_report_response(full_report)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")
