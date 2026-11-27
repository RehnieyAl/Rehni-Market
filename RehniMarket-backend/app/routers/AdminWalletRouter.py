"""Rutas del panel admin para recargar y corregir saldo de RehniCoin por correo (admin y owner)."""

from typing import Annotated

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dbconexion import get_db
from app.core.AuthDependencies import AuthContext, require_role


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



@router.post("/recharge", response_model=RechargeWalletByEmailResponse)
def recharge_wallet_by_email(
    current: Annotated[AuthContext, Depends(require_role("admin", "owner"))],
    data: RechargeWalletByEmailRequest,
    database: Session = Depends(get_db, scope="function"),
):
    return recharge_wallet_by_email_service(
        data, created_by=current.user_id, database=database
    )


@router.get(
    "/history",
    response_model=WalletRechargeHistoryPaginatedResponse,
    dependencies=[Depends(require_role("admin", "owner"))],
)
def get_recharge_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    database: Session = Depends(get_db, scope="function"),
):
    return list_recharge_history_service(database, page=page, limit=limit)


@router.post(
    "/recharge/{transaction_id}/correction",
    response_model=CorrectRechargeResponse,
)
def correct_recharge(
    current: Annotated[AuthContext, Depends(require_role("admin", "owner"))],
    transaction_id: UUID,
    data: CorrectRechargeRequest,
    database: Session = Depends(get_db, scope="function"),
):
    return correct_recharge_service(
        transaction_id=transaction_id,
        data=data,
        corrected_by=current.user_id,
        database=database,
    )
