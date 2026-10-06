from uuid import UUID

from fastapi import APIRouter, Request, Depends, Query
from sqlalchemy.orm import Session

from app.database.Connection import get_db

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.schemas.SchemaCommerce.SchemaWallet import (
    RechargeWalletByEmailRequest,
    RechargeWalletByEmailResponse,
    CorrectRechargeRequest,
    CorrectRechargeResponse,
    WalletRechargeHistoryPaginatedResponse,
)

from app.services.commerce.WalletService import (
    recharge_wallet_by_email_service,
    list_recharge_history_service,
    correct_recharge_service,
)

router = APIRouter(prefix="/admin/wallet", tags=["admin", "wallet"])


def _require_admin_or_owner(request: Request):
    if request.state.role not in ("admin", "owner"):
        api_error(
            403,
            ErrorCodes.FORBIDDEN,
            "Solo un administrador puede recargar saldo de RehniCoin.",
        )


@router.post("/recharge", response_model=RechargeWalletByEmailResponse)
def recharge_wallet_by_email(
    request: Request,
    data: RechargeWalletByEmailRequest,
    database: Session = Depends(get_db),
):
    _require_admin_or_owner(request)

    return recharge_wallet_by_email_service(
        data, created_by=request.state.user_id, database=database
    )


@router.get("/history", response_model=WalletRechargeHistoryPaginatedResponse)
def get_recharge_history(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    database: Session = Depends(get_db),
):
    _require_admin_or_owner(request)

    return list_recharge_history_service(database, page=page, limit=limit)


@router.post(
    "/recharge/{transaction_id}/correction",
    response_model=CorrectRechargeResponse,
)
def correct_recharge(
    request: Request,
    transaction_id: UUID,
    data: CorrectRechargeRequest,
    database: Session = Depends(get_db),
):
    _require_admin_or_owner(request)

    return correct_recharge_service(
        transaction_id=transaction_id,
        data=data,
        corrected_by=request.state.user_id,
        database=database,
    )
