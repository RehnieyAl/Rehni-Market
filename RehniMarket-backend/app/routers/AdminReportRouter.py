from fastapi import APIRouter, Request, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.Connection import get_db

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

# Centro único de gestión de reportes (ver ALCANCE > Reportes - reutiliza
# la entrada de menú "Reportes" que ya existía en
# shared/config/dashboardNavigation.tsx, id "reports"). Solo ADMIN/OWNER
# llegan acá (bypass total vía FULL_ACCESS_ROLES, ver
# middleware/RolePermissions.py - mismo patrón que AdminPayoutRouter.py).
router = APIRouter(prefix="/admin/reports", tags=["admin", "reports"])


@router.get("", response_model=ReportsPaginatedResponse)
def get_reports(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    target_type: str | None = Query(default=None),
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    database: Session = Depends(get_db),
):
    return list_reports_service(
        database=database,
        page=page,
        limit=limit,
        target_type=target_type,
        status=status,
        search=search,
    )


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: UUID, database: Session = Depends(get_db)):
    return get_report_detail_service(database, report_id)


@router.patch("/{report_id}/status", response_model=ReportResponse)
def update_report_status(
    request: Request,
    report_id: UUID,
    data: UpdateReportStatusRequest,
    database: Session = Depends(get_db),
):
    admin_id = request.state.user_id

    return update_report_status_service(
        database=database,
        report_id=report_id,
        admin_id=admin_id,
        data=data,
    )
