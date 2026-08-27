import traceback
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelWallet import WalletTransaction, WalletTransactionType
from app.repository import WalletRepository as repo
from app.repository.UserRepository import get_by_id, get_by_email

from app.schemas.SchemaCommerce.SchemaWallet import (
    RechargeWalletRequest,
    RechargeWalletByEmailRequest,
    RechargeWalletByEmailResponse,
    WalletResponse,
    WalletTransactionResponse,
    WalletTransactionsPaginatedResponse,
    WalletRechargeHistoryItemResponse,
    WalletRechargeHistoryPaginatedResponse,
)

# RehniCoin es un simulador interno (ver ModelWallet.py) - NO hay
# blockchain ni criptomoneda real, ni ninguna integracion externa aqui.


def _to_transaction_response(transaction: WalletTransaction) -> WalletTransactionResponse:
    # No se usa .model_validate(): from_attributes solo lee atributos con
    # el MISMO nombre, y createdAt (schema) no coincide con created_at
    # (modelo) - se mapea a mano (mismo caso que AddressService.py).
    return WalletTransactionResponse(
        id=transaction.id,
        type=transaction.type.value,
        amount=transaction.amount,
        description=transaction.description,
        createdAt=transaction.created_at,
    )


def get_or_create_wallet(database: Session, user_id: UUID):
    wallet = repo.get_wallet_by_user_id(database, user_id)

    if not wallet:
        wallet = repo.create_wallet(database, user_id)
        database.commit()
        database.refresh(wallet)

    return wallet


def get_my_wallet_service(user_id: UUID, database: Session) -> WalletResponse:
    wallet = get_or_create_wallet(database, user_id)

    return WalletResponse(balance=wallet.balance)


def get_my_transactions_service(
    user_id: UUID, database: Session, page: int = 1, limit: int = 10
) -> WalletTransactionsPaginatedResponse:
    wallet = get_or_create_wallet(database, user_id)

    transactions, total = repo.list_transactions(database, wallet.id, page, limit)

    return WalletTransactionsPaginatedResponse(
        items=[_to_transaction_response(t) for t in transactions],
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit if total else 0,
    )


def recharge_wallet_service(
    data: RechargeWalletRequest, database: Session, created_by: UUID | None = None
) -> WalletResponse:
    """
    Solo ADMIN/OWNER pueden llamar este servicio - la validacion de rol
    vive en el router (mismo patron que el resto del backoffice de
    admin, ver AdminUserRouters.py), no aqui.

    `created_by` es opcional para no romper el contrato existente de este
    endpoint (userId), pero el router siempre lo pasa (request.state.user_id)
    - ver ALCANCE > AUDITORIA.
    """

    try:
        target_user = get_by_id(database, data.userId)

        if not target_user:
            api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado.")

        wallet = get_or_create_wallet(database, data.userId)

        wallet.balance = Decimal(wallet.balance) + data.amount

        transaction = WalletTransaction(
            wallet_id=wallet.id,
            type=WalletTransactionType.RECHARGE,
            amount=data.amount,
            description=data.description or "Recarga de saldo",
            created_by=created_by,
        )

        repo.create_transaction(database, transaction)

        database.commit()
        database.refresh(wallet)

        return WalletResponse(balance=wallet.balance)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def recharge_wallet_by_email_service(
    data: RechargeWalletByEmailRequest, created_by: UUID, database: Session
) -> RechargeWalletByEmailResponse:
    """
    POST /admin/wallet/recharge (ver AdminWalletRouter.py) - identifica al
    usuario por email en vez de userId (ver ALCANCE > IDENTIFICACION DEL
    USUARIO). Reutiliza la misma mecanica de ledger que
    recharge_wallet_service (no se duplica: se llama a get_or_create_wallet
    y se arma el mismo tipo de WalletTransaction).
    """

    try:
        target_user = get_by_email(database, data.email)

        if not target_user:
            api_error(
                404,
                ErrorCodes.USER_NOT_FOUND,
                "No existe ningun usuario registrado con ese correo.",
            )

        wallet = get_or_create_wallet(database, target_user.id)

        wallet.balance = Decimal(wallet.balance) + data.amount

        transaction = WalletTransaction(
            wallet_id=wallet.id,
            type=WalletTransactionType.RECHARGE,
            amount=data.amount,
            description=data.description or "Recarga de saldo",
            created_by=created_by,
        )

        repo.create_transaction(database, transaction)

        database.commit()
        database.refresh(wallet)

        return RechargeWalletByEmailResponse(
            balance=wallet.balance,
            userName=target_user.fullName,
            userEmail=target_user.email,
        )

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def _to_history_response(transaction: WalletTransaction) -> WalletRechargeHistoryItemResponse:
    target_user = transaction.wallet.user
    admin_user = transaction.created_by_user

    return WalletRechargeHistoryItemResponse(
        id=transaction.id,
        createdAt=transaction.created_at,
        userName=target_user.fullName,
        userEmail=target_user.email,
        amount=transaction.amount,
        description=transaction.description,
        createdByName=admin_user.fullName if admin_user else None,
        createdByEmail=admin_user.email if admin_user else None,
    )


def list_recharge_history_service(
    database: Session, page: int = 1, limit: int = 10
) -> WalletRechargeHistoryPaginatedResponse:
    """
    Historial de recargas administrativas para la vista "RehniCoin" (ver
    ALCANCE > HISTORIAL) - solo ADMIN/OWNER (validado en el router).
    """

    transactions, total = repo.list_recharge_history(database, page, limit)

    return WalletRechargeHistoryPaginatedResponse(
        items=[_to_history_response(t) for t in transactions],
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit if total else 0,
    )


def charge_wallet(database: Session, user_id: UUID, amount: Decimal, description: str):
    """
    Descuenta `amount` de la billetera del usuario (usado por
    CheckoutService al confirmar un pedido). NO hace commit - el llamador
    controla la transaccion completa (pedido + descuento atomicos). Lanza
    INSUFFICIENT_BALANCE si no alcanza el saldo.
    """

    wallet = repo.get_wallet_by_user_id(database, user_id)

    if not wallet or Decimal(wallet.balance) < amount:
        api_error(
            402,
            ErrorCodes.INSUFFICIENT_BALANCE,
            "Saldo de RehniCoin insuficiente para completar la compra.",
        )

    wallet.balance = Decimal(wallet.balance) - amount

    transaction = WalletTransaction(
        wallet_id=wallet.id,
        type=WalletTransactionType.PURCHASE,
        amount=-amount,
        description=description,
    )

    repo.create_transaction(database, transaction)

    return wallet


def refund_wallet(
    database: Session,
    user_id: UUID,
    amount: Decimal,
    description: str,
    order_id: UUID | None = None,
):
    """
    Acredita `amount` a la billetera del usuario (reembolso). Misma
    mecánica de ledger que charge_wallet (suma/resta sobre wallet.balance
    + WalletTransaction) y mismo contrato: NO hace commit, el llamador
    controla la transacción completa (ver
    OrderService.cancel_and_refund_company_orders_for_suspension, que
    necesita que el reembolso, el cambio de estado del pedido y el
    bloqueo de la empresa sean atómicos).

    `order_id` enlaza el movimiento con el pedido reembolsado (ver
    ModelWallet.py > WalletTransaction.order_id) para poder distinguir
    "cancelado" de "cancelado Y reembolsado" y evitar un doble reembolso
    (ver WalletRepository.has_order_been_refunded) - el llamador es
    responsable de verificar esa idempotencia ANTES de llamar acá, esta
    función no lo hace por sí sola.
    """

    wallet = get_or_create_wallet(database, user_id)

    wallet.balance = Decimal(wallet.balance) + amount

    transaction = WalletTransaction(
        wallet_id=wallet.id,
        type=WalletTransactionType.REFUND,
        amount=amount,
        description=description,
        order_id=order_id,
    )

    repo.create_transaction(database, transaction)

    return wallet
