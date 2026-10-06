from sqlalchemy.orm import Session
from uuid import UUID

from app.models.ModelWallet import Wallet, WalletTransaction, WalletTransactionType


def get_wallet_by_user_id(database: Session, user_id: UUID) -> Wallet | None:
    return database.query(Wallet).filter(Wallet.user_id == user_id).first()


def create_wallet(database: Session, user_id: UUID) -> Wallet:
    wallet = Wallet(user_id=user_id, balance=0)
    database.add(wallet)
    database.flush()
    return wallet


def create_transaction(database: Session, transaction: WalletTransaction) -> WalletTransaction:
    database.add(transaction)
    database.flush()
    return transaction


def get_transaction_by_id(database: Session, transaction_id: UUID) -> WalletTransaction | None:
    return (
        database.query(WalletTransaction)
        .filter(WalletTransaction.id == transaction_id)
        .first()
    )


def get_correction_of(database: Session, transaction_id: UUID) -> WalletTransaction | None:
    """Fila de corrección (type=ADJUSTMENT) que corrige a `transaction_id`, o None
    si esa recarga todavía no fue corregida."""

    return (
        database.query(WalletTransaction)
        .filter(WalletTransaction.corrects_transaction_id == transaction_id)
        .first()
    )


def corrected_recharge_ids(database: Session, recharge_ids: list[UUID]) -> set[UUID]:
    """De la lista de recargas dada, cuáles ya tienen una corrección registrada."""

    if not recharge_ids:
        return set()

    rows = (
        database.query(WalletTransaction.corrects_transaction_id)
        .filter(WalletTransaction.corrects_transaction_id.in_(recharge_ids))
        .all()
    )

    return {row[0] for row in rows}


def has_order_been_refunded(database: Session, order_id: UUID) -> bool:
    """Idempotencia del reembolso: se apoya en WalletTransaction.order_id, no en
    order.status. La garantía real es el índice único parcial; esto evita el doble insert."""

    return (
        database.query(WalletTransaction)
        .filter(
            WalletTransaction.order_id == order_id,
            WalletTransaction.type == WalletTransactionType.REFUND,
        )
        .first()
        is not None
    )


def list_transactions(database: Session, wallet_id: UUID, page: int, limit: int):
    query = (
        database.query(WalletTransaction)
        .filter(WalletTransaction.wallet_id == wallet_id)
        .order_by(WalletTransaction.created_at.desc())
    )

    total = query.count()
    offset = (page - 1) * limit
    transactions = query.offset(offset).limit(limit).all()

    return transactions, total


def list_recharge_history(database: Session, page: int, limit: int):
    """Historial de recargas: solo movimientos RECHARGE con created_by (hechos por un admin/owner)."""

    query = (
        database.query(WalletTransaction)
        .filter(
            WalletTransaction.type == WalletTransactionType.RECHARGE,
            WalletTransaction.created_by.isnot(None),
        )
        .order_by(WalletTransaction.created_at.desc())
    )

    total = query.count()
    offset = (page - 1) * limit
    transactions = query.offset(offset).limit(limit).all()

    return transactions, total
