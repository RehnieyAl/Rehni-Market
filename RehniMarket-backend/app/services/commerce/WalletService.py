import traceback
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.core.WalletConfig import (
    MAX_ADMIN_RECHARGE_AMOUNT,
    MAX_ADMIN_RECHARGE_MESSAGE,
)

from app.models.ModelWallet import WalletTransaction, WalletTransactionType
from app.repository import WalletRepository as repo
from app.repository.UserRepository import get_by_id, get_by_email

from app.schemas.SchemaCommerce.SchemaWallet import (
    RechargeWalletRequest,
    RechargeWalletByEmailRequest,
    RechargeWalletByEmailResponse,
    CorrectRechargeRequest,
    CorrectRechargeResponse,
    WalletResponse,
    WalletTransactionResponse,
    WalletTransactionsPaginatedResponse,
    WalletRechargeHistoryItemResponse,
    WalletRechargeHistoryPaginatedResponse,
)

from app.services.email.WalletEmailService import (
    send_recharge_email,
    send_recharge_correction_email,
)

def _validate_admin_recharge_amount(amount: Decimal) -> None:
    """Tope por operación de recarga administrativa (aplica a recarga y a la
    cantidad final de una corrección). No es un límite de saldo total."""

    if Decimal(amount) > MAX_ADMIN_RECHARGE_AMOUNT:
        api_error(400, ErrorCodes.INVALID_AMOUNT, MAX_ADMIN_RECHARGE_MESSAGE)


def _to_transaction_response(transaction: WalletTransaction) -> WalletTransactionResponse:
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
        _validate_admin_recharge_amount(data.amount)

        target_user = get_by_id(database, data.userId)

        if not target_user:
            api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado.")

        wallet = get_or_create_wallet(database, data.userId)

        wallet.balance = Decimal(wallet.balance) + data.amount

        description = data.description or "Recarga de saldo"

        transaction = WalletTransaction(
            wallet_id=wallet.id,
            type=WalletTransactionType.RECHARGE,
            amount=data.amount,
            description=description,
            created_by=created_by,
        )

        repo.create_transaction(database, transaction)

        database.commit()
        database.refresh(wallet)
        database.refresh(transaction)

        send_recharge_email(
            target_user, data.amount, wallet.balance, description, transaction.created_at
        )

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
        _validate_admin_recharge_amount(data.amount)

        target_user = get_by_email(database, data.email)

        if not target_user:
            api_error(
                404,
                ErrorCodes.USER_NOT_FOUND,
                "No existe ningun usuario registrado con ese correo.",
            )

        wallet = get_or_create_wallet(database, target_user.id)

        wallet.balance = Decimal(wallet.balance) + data.amount

        description = data.description or "Recarga de saldo"

        transaction = WalletTransaction(
            wallet_id=wallet.id,
            type=WalletTransactionType.RECHARGE,
            amount=data.amount,
            description=description,
            created_by=created_by,
        )

        repo.create_transaction(database, transaction)

        database.commit()
        database.refresh(wallet)
        database.refresh(transaction)

        send_recharge_email(
            target_user, data.amount, wallet.balance, description, transaction.created_at
        )

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


def _to_history_response(
    transaction: WalletTransaction, corrected_ids: set[UUID] | None = None
) -> WalletRechargeHistoryItemResponse:
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
        isCorrected=transaction.id in corrected_ids if corrected_ids else False,
    )


def list_recharge_history_service(
    database: Session, page: int = 1, limit: int = 10
) -> WalletRechargeHistoryPaginatedResponse:
    """Historial de recargas administrativas; solo admin/owner (validado en el router)."""

    transactions, total = repo.list_recharge_history(database, page, limit)

    corrected_ids = repo.corrected_recharge_ids(database, [t.id for t in transactions])

    return WalletRechargeHistoryPaginatedResponse(
        items=[_to_history_response(t, corrected_ids) for t in transactions],
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit if total else 0,
    )


def correct_recharge_service(
    transaction_id: UUID,
    data: CorrectRechargeRequest,
    corrected_by: UUID,
    database: Session,
) -> CorrectRechargeResponse:
    """Corrige una recarga administrativa realizada por error. Solo admin/owner
    (validado en el router). NO edita ni borra la recarga original: crea un
    movimiento type=ADJUSTMENT por la diferencia (newAmount - original), vinculado
    a la recarga vía corrects_transaction_id. Saldo + movimiento en un solo commit."""

    try:
        original = repo.get_transaction_by_id(database, transaction_id)

        if not original:
            api_error(
                404,
                ErrorCodes.WALLET_TRANSACTION_NOT_FOUND,
                "Movimiento de RehniCoin no encontrado.",
            )

        # Solo recargas administrativas: type=RECHARGE hechas por un admin/owner
        # (mismo criterio que list_recharge_history). Nunca compras, reembolsos,
        # devoluciones ni ajustes previos.
        if (
            original.type != WalletTransactionType.RECHARGE
            or original.created_by is None
        ):
            api_error(
                400,
                ErrorCodes.RECHARGE_NOT_CORRECTABLE,
                "Solo se pueden corregir recargas realizadas por un administrador.",
            )

        if repo.get_correction_of(database, original.id) is not None:
            api_error(
                409,
                ErrorCodes.RECHARGE_ALREADY_CORRECTED,
                "Esta recarga ya fue corregida y no puede corregirse de nuevo.",
            )

        original_amount = Decimal(original.amount)
        new_amount = Decimal(data.newAmount)

        # La cantidad final corregida tampoco puede superar el tope por operación.
        _validate_admin_recharge_amount(new_amount)

        adjustment = new_amount - original_amount

        if adjustment == 0:
            api_error(
                400,
                ErrorCodes.INVALID_AMOUNT,
                "La cantidad corregida es igual a la original: no hay nada que ajustar.",
            )

        wallet = original.wallet
        new_balance = Decimal(wallet.balance) + adjustment

        if new_balance < 0:
            api_error(
                400,
                ErrorCodes.INVALID_AMOUNT,
                "La corrección dejaría el saldo del usuario en negativo.",
            )

        wallet.balance = new_balance

        correction = WalletTransaction(
            wallet_id=wallet.id,
            type=WalletTransactionType.ADJUSTMENT,
            amount=adjustment,
            description=f"Corrección de recarga: {data.reason}",
            created_by=corrected_by,
            corrects_transaction_id=original.id,
        )

        repo.create_transaction(database, correction)

        database.commit()
        database.refresh(wallet)
        database.refresh(correction)

        target_user = wallet.user

        send_recharge_correction_email(
            target_user,
            original_amount,
            new_amount,
            adjustment,
            wallet.balance,
            data.reason,
            correction.created_at,
        )

        return CorrectRechargeResponse(
            balance=wallet.balance,
            userName=target_user.fullName,
            userEmail=target_user.email,
            originalAmount=original_amount,
            newAmount=new_amount,
            adjustment=adjustment,
            correctionTransactionId=correction.id,
        )

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


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
