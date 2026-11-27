"""Rutas de liquidaciones a empresas: generar, consultar y marcar pagadas (solo owner)."""

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.dbconexion import get_db
from app.core.AuthDependencies import require_role


from app.schemas.SchemaDashboard.SchemaPayout import (
    AdminPayoutsPaginatedResponse,
    GeneratePayoutRequest,
    CompanyPayoutResponse,
    PayoutAvailablePeriodResponse,
    PayoutPreviewResponse,
)

from app.services.PayoutService import (
    generate_company_payout_service,
    get_payout_preview_service,
    list_available_payout_periods_service,
    list_admin_payouts_service,
    get_admin_payout_detail_service,
    mark_payout_paid_service,
)

router = APIRouter(prefix="/admin/payouts", tags=["admin", "payouts"])

OWNER_ONLY_MESSAGE = "Solo el propietario puede gestionar liquidaciones."


@router.post(
    "/generate",
    response_model=CompanyPayoutResponse,
    dependencies=[Depends(require_role("owner", message=OWNER_ONLY_MESSAGE))],
)
def generate_payout(
    data: GeneratePayoutRequest, database: Session = Depends(get_db, scope="function")
):
    return generate_company_payout_service(data, database)


@router.get(
    "",
    response_model=AdminPayoutsPaginatedResponse,
    dependencies=[Depends(require_role("owner", message=OWNER_ONLY_MESSAGE))],
)
def get_payouts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    status: str | None = Query(None),
    database: Session = Depends(get_db, scope="function"),
):
    """Liquidaciones y meses cerrados por generar (isGenerated=false), por urgencia de consignación."""
    return list_admin_payouts_service(database, page=page, limit=limit, status=status)


@router.get(
    "/available-periods",
    response_model=list[PayoutAvailablePeriodResponse],
    dependencies=[Depends(require_role("owner", message=OWNER_ONLY_MESSAGE))],
)
def get_available_periods(
    company_id: UUID = Query(...),
    database: Session = Depends(get_db, scope="function"),
):
    return list_available_payout_periods_service(company_id, database)


@router.get(
    "/preview",
    response_model=PayoutPreviewResponse,
    dependencies=[Depends(require_role("owner", message=OWNER_ONLY_MESSAGE))],
)
def get_payout_preview(
    company_id: UUID = Query(...),
    period_start: date = Query(...),
    period_end: date = Query(...),
    database: Session = Depends(get_db, scope="function"),
):
    return get_payout_preview_service(company_id, period_start, period_end, database)


@router.get(
    "/{payout_id}",
    response_model=CompanyPayoutResponse,
    dependencies=[Depends(require_role("owner", message=OWNER_ONLY_MESSAGE))],
)
def get_payout_detail(payout_id: UUID, database: Session = Depends(get_db, scope="function")):
    return get_admin_payout_detail_service(payout_id, database)


@router.patch(
    "/{payout_id}/pay",
    response_model=CompanyPayoutResponse,
    dependencies=[Depends(require_role("owner", message=OWNER_ONLY_MESSAGE))],
)
def pay_payout(payout_id: UUID, database: Session = Depends(get_db, scope="function")):
    return mark_payout_paid_service(payout_id, database)
