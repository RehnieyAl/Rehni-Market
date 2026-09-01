from fastapi import APIRouter, Request, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.Connection import get_db

from app.schemas.SchemaDashboard.SchemaPayout import (
    CompanyPayoutResponse,
    CompanyPayoutsPaginatedResponse,
    CompanyBalanceResponse,
)

from app.services.PayoutService import (
    list_company_payouts_service,
    get_company_payout_detail_service,
    get_company_balance_service,
)

router = APIRouter(prefix="/company", tags=["company", "payouts"])


@router.get("/payouts", response_model=CompanyPayoutsPaginatedResponse)
def get_my_payouts(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    database: Session = Depends(get_db),
):
    return list_company_payouts_service(request.state.user_id, database, page=page, limit=limit)


@router.get("/payouts/{payout_id}", response_model=CompanyPayoutResponse)
def get_my_payout_detail(
    request: Request, payout_id: UUID, database: Session = Depends(get_db)
):
    return get_company_payout_detail_service(request.state.user_id, payout_id, database)


@router.get("/balance", response_model=CompanyBalanceResponse)
def get_my_balance(request: Request, database: Session = Depends(get_db)):
    return get_company_balance_service(request.state.user_id, database)
