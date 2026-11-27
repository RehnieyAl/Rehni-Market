"""Consistencia del saldo RehniCoin: cada movimiento se acumula aunque haya operaciones simultáneas."""

import threading
import time
from decimal import Decimal

import pytest
from sqlalchemy.orm import sessionmaker

from app.models.ModelWallet import Wallet, WalletTransaction, WalletTransactionType
from app.schemas.SchemaCommerce.SchemaWallet import RechargeWalletRequest
from app.services.commerce import WalletService


@pytest.fixture(autouse=True)
def no_emails(monkeypatch):
    monkeypatch.setattr(WalletService, "send_recharge_email", lambda *a, **k: None)
    monkeypatch.setattr(WalletService, "send_recharge_correction_email", lambda *a, **k: None)


@pytest.fixture()
def new_session(engine, db):
    # Depende de `db` para cerrarse antes de que este borre las tablas.
    sessions = []
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def make():
        session = factory()
        sessions.append(session)
        return session

    yield make
    for session in sessions:
        session.rollback()
        session.close()


def _balance(engine, user_id) -> Decimal:
    session = sessionmaker(bind=engine)()
    try:
        return session.query(Wallet).filter(Wallet.user_id == user_id).one().balance
    finally:
        session.close()


def _run_while_wallet_locked(new_session, user_id, locked_change: Decimal, operation):
    """Otra transacción (p. ej. un checkout) tiene la billetera bloqueada y la modifica;
    `operation` arranca en un hilo con su propia sesión mientras ese bloqueo sigue vivo."""

    holder = new_session()
    wallet = (
        holder.query(Wallet).filter(Wallet.user_id == user_id).with_for_update().one()
    )
    wallet.balance = Decimal(wallet.balance) + locked_change
    holder.flush()

    errors = []

    def worker():
        session = new_session()
        try:
            operation(session)
        except Exception as error:  # el hilo debe reportar el fallo al test
            errors.append(error)
        finally:
            session.close()

    thread = threading.Thread(target=worker)
    thread.start()
    time.sleep(0.5)
    holder.commit()
    thread.join(timeout=10)
    assert not thread.is_alive(), "la operación concurrente quedó bloqueada"
    assert not errors, errors


def test_recarga_concurrente_con_un_cobro_no_pierde_ninguno(engine, new_session, users, buyer_wallet):
    user_id = users["user"].id

    _run_while_wallet_locked(
        new_session,
        user_id,
        Decimal("-300000"),
        lambda session: WalletService.recharge_wallet_service(
            RechargeWalletRequest(userId=user_id, amount=Decimal("50000")), session
        ),
    )

    assert _balance(engine, user_id) == Decimal("750000.00")


def test_reembolso_concurrente_se_acumula(engine, new_session, users, buyer_wallet):
    user_id = users["user"].id

    def refund(session):
        WalletService.refund_wallet(session, user_id, Decimal("20000"), "Reembolso de prueba")
        session.commit()

    _run_while_wallet_locked(new_session, user_id, Decimal("50000"), refund)

    assert _balance(engine, user_id) == Decimal("1070000.00")


def test_dos_recargas_seguidas_se_acumulan_y_registran_un_movimiento_cada_una(db, users, buyer_wallet):
    user_id = users["user"].id

    for amount in ("10000", "15000"):
        WalletService.recharge_wallet_service(
            RechargeWalletRequest(userId=user_id, amount=Decimal(amount)), db
        )

    db.expire_all()
    assert db.query(Wallet).filter(Wallet.user_id == user_id).one().balance == Decimal("1025000.00")
    recharges = db.query(WalletTransaction).filter(WalletTransaction.type == WalletTransactionType.RECHARGE).all()
    assert sorted(t.amount for t in recharges) == [Decimal("10000.00"), Decimal("15000.00")]


def test_reembolso_sin_billetera_la_crea_sin_confirmar_la_transaccion(db, users):
    """El reembolso no hace commit: si el llamador revierte, no queda billetera ni movimiento."""

    user_id = users["user"].id

    WalletService.refund_wallet(db, user_id, Decimal("5000"), "Reembolso")
    db.rollback()

    assert db.query(Wallet).filter(Wallet.user_id == user_id).first() is None
    assert db.query(WalletTransaction).count() == 0

    wallet = WalletService.refund_wallet(db, user_id, Decimal("5000"), "Reembolso")
    db.commit()
    assert wallet.balance == Decimal("5000")


def test_cada_comprador_ve_solo_su_saldo(db, users, buyer_wallet):
    other = users["company"].id

    assert WalletService.get_my_wallet_service(users["user"].id, db).balance == Decimal("1000000.00")
    assert WalletService.get_my_wallet_service(other, db).balance == Decimal("0")
