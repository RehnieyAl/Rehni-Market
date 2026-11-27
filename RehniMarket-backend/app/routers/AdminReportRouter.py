"""Rutas del panel admin para revisar reportes de productos (admin y owner)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.dbconexion import get_db
from app.core.AuthDependencies import AuthContext, require_role

from app.schemas.SchemaCommerce.SchemaReport import (
    ReportResponse,
    ReportsPaginatedResponse,
    UpdateReportStatusRequest,
)

from app.services.DashboardService.admin.ReportService import (
    list_reports_service,
    get_report_detail_service,
    update_report_status_service,
)

router = APIRouter(prefix="/admin/reports", tags=["admin", "reports"])


@router.get(
    "",
    response_model=ReportsPaginatedResponse,
    dependencies=[Depends(require_role("admin", "owner"))],
)
def get_reports(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    target_type: str | None = Query(default=None),
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    database: Session = Depends(get_db, scope="function"),
):
    return list_reports_service(
        database=database,
        page=page,
        limit=limit,
        target_type=target_type,
        status=status,
        search=search,
    )


@router.get(
    "/{report_id}",
    response_model=ReportResponse,
    dependencies=[Depends(require_role("admin", "owner"))],
)
def get_report(report_id: UUID, database: Session = Depends(get_db, scope="function")):
    return get_report_detail_service(database, report_id)


@router.patch("/{report_id}/status", response_model=ReportResponse)
def update_report_status(
    current: Annotated[AuthContext, Depends(require_role("admin", "owner"))],
    report_id: UUID,
    data: UpdateReportStatusRequest,
    database: Session = Depends(get_db, scope="function"),
):
    admin_id = current.user_id

    return update_report_status_service(
        database=database,
        report_id=report_id,
        admin_id=admin_id,
        data=data,
    )
