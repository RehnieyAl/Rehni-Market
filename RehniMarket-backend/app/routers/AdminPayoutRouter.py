from datetime import date

from fastapi import APIRouter, Request, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.Connection import get_db

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.schemas.SchemaDashboard.SchemaPayout import (
    GeneratePayoutRequest,
    CompanyPayoutResponse,
    CompanyPayoutsPaginatedResponse,
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

# Exclusivo ADMIN/OWNER; el rol se revalida en cada endpoint (tienen bypass del middleware).
router = APIRouter(prefix="/admin/payouts", tags=["admin", "payouts"])


def _require_admin_or_owner(request: Request):
    if request.state.role not in ("admin", "owner"):
        api_error(
            403,
            ErrorCodes.FORBIDDEN,
            "Solo un administrador puede gestionar liquidaciones.",
        )


@router.post("/generate", response_model=CompanyPayoutResponse)
def generate_payout(
    request: Request, data: GeneratePayoutRequest, database: Session = Depends(get_db)
):
    _require_admin_or_owner(request)

    return generate_company_payout_service(data, database)


@router.get("", response_model=CompanyPayoutsPaginatedResponse)
def get_payouts(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    status: str | None = Query(None),
    database: Session = Depends(get_db),
):
    _require_admin_or_owner(request)

    return list_admin_payouts_service(database, page=page, limit=limit, status=status)


# Rutas estáticas: deben registrarse antes de GET /{payout_id} para que no las capture como UUID.
@router.get("/available-periods", response_model=list[PayoutAvailablePeriodResponse])
def get_available_periods(
    request: Request,
    company_id: UUID = Query(...),
    database: Session = Depends(get_db),
):
    _require_admin_or_owner(request)

    return list_available_payout_periods_service(company_id, database)


@router.get("/preview", response_model=PayoutPreviewResponse)
def get_payout_preview(
    request: Request,
    company_id: UUID = Query(...),
    period_start: date = Query(...),
    period_end: date = Query(...),
    database: Session = Depends(get_db),
):
    _require_admin_or_owner(request)

    return get_payout_preview_service(company_id, period_start, period_end, database)


@router.get("/{payout_id}", response_model=CompanyPayoutResponse)
def get_payout_detail(request: Request, payout_id: UUID, database: Session = Depends(get_db)):
    _require_admin_or_owner(request)

    return get_admin_payout_detail_service(payout_id, database)


@router.patch("/{payout_id}/pay", response_model=CompanyPayoutResponse)
def pay_payout(request: Request, payout_id: UUID, database: Session = Depends(get_db)):
    _require_admin_or_owner(request)

    return mark_payout_paid_service(payout_id, database)
