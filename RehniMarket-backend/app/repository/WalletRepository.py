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
    """
    Historial de recargas administrativas (ver ALCANCE > HISTORIAL) - solo
    movimientos RECHARGE con created_by (o sea, hechos por un admin/owner
    desde /admin/wallet/recharge, no descuentos de checkout ni recargas
    legacy sin auditoria).
    """

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
