"""Rutas de liquidaciones y saldo de la empresa autenticada (solo rol company)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.dbconexion import get_db
from app.core.AuthDependencies import AuthContext, require_role

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
    current: Annotated[AuthContext, Depends(require_role("company"))],
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    database: Session = Depends(get_db, scope="function"),
):
    return list_company_payouts_service(current.user_id, database, page=page, limit=limit)


@router.get("/payouts/{payout_id}", response_model=CompanyPayoutResponse)
def get_my_payout_detail(
    current: Annotated[AuthContext, Depends(require_role("company"))],
    payout_id: UUID,
    database: Session = Depends(get_db, scope="function"),
):
    return get_company_payout_detail_service(current.user_id, payout_id, database)


@router.get("/balance", response_model=CompanyBalanceResponse)
def get_my_balance(
    current: Annotated[AuthContext, Depends(require_role("company"))],
    database: Session = Depends(get_db, scope="function"),
):
    return get_company_balance_service(current.user_id, database)
