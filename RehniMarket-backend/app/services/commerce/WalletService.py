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

def _to_transaction_response(transaction: WalletTransaction) -> WalletTransactionResponse:
    # Mapeo a mano: createdAt (schema) no coincide con created_at (modelo).
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
    """Solo admin/owner (validado en el router). `created_by` es el admin que recarga."""

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
    """POST /admin/wallet/recharge: identifica al usuario por email; misma mecánica de ledger."""

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
    """Historial de recargas administrativas; solo admin/owner (validado en el router)."""

    transactions, total = repo.list_recharge_history(database, page, limit)

    return WalletRechargeHistoryPaginatedResponse(
        items=[_to_history_response(t) for t in transactions],
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit if total else 0,
    )


def charge_wallet(database: Session, user_id: UUID, amount: Decimal, description: str):
    """Descuenta `amount` de la billetera (usado por el checkout). No hace commit;
    lanza INSUFFICIENT_BALANCE si no alcanza el saldo."""

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
    """Acredita `amount` a la billetera (reembolso). No hace commit. `order_id` enlaza
    el movimiento con el pedido; la idempotencia contra el doble reembolso es del llamador."""

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
