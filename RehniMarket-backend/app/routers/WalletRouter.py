"""Rutas de la billetera RehniCoin: saldo y movimientos del comprador, y recarga por admin u owner."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dbconexion import get_db
from app.core.AuthDependencies import AuthContext, require_role


from app.schemas.SchemaCommerce.SchemaWallet import (
    RechargeWalletRequest,
    WalletResponse,
    WalletTransactionsPaginatedResponse,
)

from app.services.commerce.WalletService import (
    get_my_wallet_service,
    get_my_transactions_service,
    recharge_wallet_service,
)

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("/me", response_model=WalletResponse)
def get_my_wallet(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    database: Session = Depends(get_db, scope="function"),
):
    return get_my_wallet_service(current.user_id, database)


@router.get("/transactions", response_model=WalletTransactionsPaginatedResponse)
def get_my_transactions(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    database: Session = Depends(get_db, scope="function"),
):
    return get_my_transactions_service(
        current.user_id, database, page=page, limit=limit
    )


@router.post("/recharge", response_model=WalletResponse)
def recharge_wallet(
    current: Annotated[AuthContext, Depends(require_role("admin", "owner"))],
    data: RechargeWalletRequest,
    database: Session = Depends(get_db, scope="function"),
):
    return recharge_wallet_service(data, database, created_by=current.user_id)
