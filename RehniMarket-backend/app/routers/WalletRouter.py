from fastapi import APIRouter, Request, Depends, Query
from sqlalchemy.orm import Session

from app.database.Connection import get_db

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

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
def get_my_wallet(request: Request, database: Session = Depends(get_db)):
    return get_my_wallet_service(request.state.user_id, database)


@router.get("/transactions", response_model=WalletTransactionsPaginatedResponse)
def get_my_transactions(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    database: Session = Depends(get_db),
):
    return get_my_transactions_service(
        request.state.user_id, database, page=page, limit=limit
    )


@router.post("/recharge", response_model=WalletResponse)
def recharge_wallet(
    request: Request, data: RechargeWalletRequest, database: Session = Depends(get_db)
):
    # /wallet/recharge no esta en ROLES_PERMISSIONS_ROUTERS["user"] (ver
    # RolePermissions.py), asi que un USER ya recibe 403 antes de llegar
    # aqui. ADMIN/OWNER si tienen bypass total del middleware
    # (FULL_ACCESS_ROLES), por eso se revalida explicitamente aca - mismo
    # patron que las capacidades exclusivas de OWNER en UserService.py.
    if request.state.role not in ("admin", "owner"):
        api_error(
            403,
            ErrorCodes.FORBIDDEN,
            "Solo un administrador puede recargar saldo de RehniCoin.",
        )

    return recharge_wallet_service(data, database, created_by=request.state.user_id)
