"""RehniCoin admin: recarga administrativa + corrección de recarga por error.

- Recarga: type=RECHARGE con created_by (admin/owner). Notifica al usuario.
- Corrección: NO edita la recarga; crea un movimiento type=ADJUSTMENT por la
  diferencia, vinculado a la original (corrects_transaction_id). Anti doble
  corrección por índice único parcial. Notifica al usuario.
"""

from decimal import Decimal

import pytest

from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.models.ModelWallet import Wallet, WalletTransaction, WalletTransactionType
from app.utils.Security import hash_password
from tests.conftest import auth


@pytest.fixture()
def uid(users):
    return users["user"].id


@pytest.fixture()
def emails(monkeypatch):
    """Captura los correos de RehniCoin en vez de enviarlos de verdad."""
    sent = {"recharge": [], "correction": []}
    monkeypatch.setattr(
        "app.services.commerce.WalletService.send_recharge_email",
        lambda *a, **k: sent["recharge"].append((a, k)),
    )
    monkeypatch.setattr(
        "app.services.commerce.WalletService.send_recharge_correction_email",
        lambda *a, **k: sent["correction"].append((a, k)),
    )
    return sent


def _recharge(client, token, user_id, amount, *, description=None):
    """Recarga administrativa por userId (POST /wallet/recharge): type=RECHARGE con
    created_by, igual que la de email."""
    body = {"userId": str(user_id), "amount": amount}
    if description is not None:
        body["description"] = description
    return client.post("/wallet/recharge", json=body, headers=auth(token))


def _correct(client, token, transaction_id, new_amount, reason="Recarga por error"):
    return client.post(
        f"/admin/wallet/recharge/{transaction_id}/correction",
        json={"newAmount": new_amount, "reason": reason},
        headers=auth(token),
    )


def _wallet(db, user_id):
    db.expire_all()
    return db.query(Wallet).filter(Wallet.user_id == user_id).first()


def _last_recharge_id(db, user_id):
    wallet = _wallet(db, user_id)
    tx = (
        db.query(WalletTransaction)
        .filter(
            WalletTransaction.wallet_id == wallet.id,
            WalletTransaction.type == WalletTransactionType.RECHARGE,
        )
        .order_by(WalletTransaction.created_at.desc())
        .first()
    )
    return tx.id


class TestRecharge:
    def test_admin_can_recharge(self, client, tokens, db, uid, emails):
        response = _recharge(client, tokens["admin"], uid, 100000)
        assert response.status_code == 200, response.text
        assert Decimal(response.json()["balance"]) == Decimal("100000")
        assert _wallet(db, uid).balance == Decimal("100000")

    def test_owner_can_recharge(self, client, tokens, db, uid, emails):
        response = _recharge(client, tokens["owner"], uid, 50000)
        assert response.status_code == 200, response.text
        assert Decimal(response.json()["balance"]) == Decimal("50000")

    def test_user_and_company_cannot_recharge(self, client, tokens, uid, emails):
        assert _recharge(client, tokens["user"], uid, 1000).status_code == 403
        assert _recharge(client, tokens["company"], uid, 1000).status_code == 403

    def test_user_is_notified_after_recharge(self, client, tokens, uid, emails):
        _recharge(client, tokens["admin"], uid, 100000, description="Promo")
        assert len(emails["recharge"]) == 1
        args, _ = emails["recharge"][0]
        # send_recharge_email(user, amount, new_balance, description, created_at)
        assert args[1] == Decimal("100000")
        assert args[3] == "Promo"

    def test_recharge_by_email_endpoint_works_and_notifies(self, client, tokens, db, emails):
        role = db.query(Role).filter(Role.name == "user").first()
        recipient = Users(
            fullName="Recipient",
            email="recipient@example.com",
            hashed_password=hash_password("secret123"),
            tell="3000000001",
            verified=True,
            role_id=role.id,
        )
        db.add(recipient)
        db.commit()

        response = client.post(
            "/admin/wallet/recharge",
            json={"email": "recipient@example.com", "amount": 30000},
            headers=auth(tokens["owner"]),
        )
        assert response.status_code == 200, response.text
        assert response.json()["userEmail"] == "recipient@example.com"
        assert len(emails["recharge"]) == 1


_MAX_MESSAGE = "El monto máximo de recarga es de $10.000.000."


class TestRechargeMaxAmount:
    """Tope de $10.000.000 COP por operación de recarga administrativa
    (app/core/WalletConfig.MAX_ADMIN_RECHARGE_AMOUNT)."""

    @pytest.mark.parametrize("amount", [1, 100_000, 10_000_000])
    def test_at_or_below_limit_is_accepted(self, client, tokens, db, uid, emails, amount):
        response = _recharge(client, tokens["admin"], uid, amount)
        assert response.status_code == 200, response.text
        assert _wallet(db, uid).balance == Decimal(str(amount))

    @pytest.mark.parametrize("amount", [10_000_001, 20_000_000])
    def test_above_limit_is_rejected(self, client, tokens, db, uid, emails, amount):
        response = _recharge(client, tokens["admin"], uid, amount)
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "INVALID_AMOUNT"
        assert response.json()["detail"]["message"] == _MAX_MESSAGE
        assert _wallet(db, uid) is None  # ni wallet ni movimiento
        assert emails["recharge"] == []

    def test_by_email_endpoint_also_enforces_limit(self, client, tokens, db, emails):
        role = db.query(Role).filter(Role.name == "user").first()
        db.add(
            Users(
                fullName="Recipient",
                email="recipient2@example.com",
                hashed_password=hash_password("secret123"),
                tell="3000000002",
                verified=True,
                role_id=role.id,
            )
        )
        db.commit()

        response = client.post(
            "/admin/wallet/recharge",
            json={"email": "recipient2@example.com", "amount": 10_000_001},
            headers=auth(tokens["owner"]),
        )
        assert response.status_code == 400
        assert response.json()["detail"]["message"] == _MAX_MESSAGE

    def test_owner_is_also_limited(self, client, tokens, uid, emails):
        response = _recharge(client, tokens["owner"], uid, 10_000_001)
        assert response.status_code == 400
        assert response.json()["detail"]["message"] == _MAX_MESSAGE


class TestCorrection:
    def test_admin_can_correct_recharge_down(self, client, tokens, db, uid, emails):
        _recharge(client, tokens["admin"], uid, 100000)
        tx_id = _last_recharge_id(db, uid)

        response = _correct(client, tokens["admin"], tx_id, 50000)
        assert response.status_code == 200, response.text

        body = response.json()
        assert Decimal(body["originalAmount"]) == Decimal("100000")
        assert Decimal(body["newAmount"]) == Decimal("50000")
        assert Decimal(body["adjustment"]) == Decimal("-50000")
        assert Decimal(body["balance"]) == Decimal("50000")
        assert _wallet(db, uid).balance == Decimal("50000")

    def test_owner_can_correct_recharge_up(self, client, tokens, db, uid, emails):
        _recharge(client, tokens["owner"], uid, 40000)
        tx_id = _last_recharge_id(db, uid)

        response = _correct(client, tokens["owner"], tx_id, 60000)
        assert response.status_code == 200, response.text
        assert Decimal(response.json()["adjustment"]) == Decimal("20000")
        assert _wallet(db, uid).balance == Decimal("60000")

    def test_user_cannot_correct(self, client, tokens, db, uid, emails):
        _recharge(client, tokens["admin"], uid, 100000)
        tx_id = _last_recharge_id(db, uid)
        assert _correct(client, tokens["user"], tx_id, 50000).status_code == 403

    def test_company_cannot_correct(self, client, tokens, db, uid, emails):
        _recharge(client, tokens["admin"], uid, 100000)
        tx_id = _last_recharge_id(db, uid)
        assert _correct(client, tokens["company"], tx_id, 50000).status_code == 403

    def test_cannot_correct_a_purchase(self, client, tokens, db, uid, emails):
        _recharge(client, tokens["admin"], uid, 100000)
        wallet = _wallet(db, uid)
        purchase = WalletTransaction(
            wallet_id=wallet.id,
            type=WalletTransactionType.PURCHASE,
            amount=Decimal("-10000"),
            description="Compra test",
        )
        db.add(purchase)
        db.commit()
        db.refresh(purchase)

        response = _correct(client, tokens["admin"], purchase.id, 5000)
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "RECHARGE_NOT_CORRECTABLE"

    def test_cannot_correct_a_refund(self, client, tokens, db, uid, emails):
        _recharge(client, tokens["admin"], uid, 100000)
        wallet = _wallet(db, uid)
        refund = WalletTransaction(
            wallet_id=wallet.id,
            type=WalletTransactionType.REFUND,
            amount=Decimal("10000"),
            description="Reembolso test",
        )
        db.add(refund)
        db.commit()
        db.refresh(refund)

        response = _correct(client, tokens["admin"], refund.id, 5000)
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "RECHARGE_NOT_CORRECTABLE"

    def test_cannot_correct_twice(self, client, tokens, db, uid, emails):
        _recharge(client, tokens["admin"], uid, 100000)
        tx_id = _last_recharge_id(db, uid)

        assert _correct(client, tokens["admin"], tx_id, 50000).status_code == 200
        second = _correct(client, tokens["admin"], tx_id, 30000)
        assert second.status_code == 409
        assert second.json()["detail"]["code"] == "RECHARGE_ALREADY_CORRECTED"
        assert _wallet(db, uid).balance == Decimal("50000")  # sin cambio por el 2º intento

    def test_cannot_correct_to_same_amount(self, client, tokens, db, uid, emails):
        _recharge(client, tokens["admin"], uid, 100000)
        tx_id = _last_recharge_id(db, uid)
        response = _correct(client, tokens["admin"], tx_id, 100000)
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "INVALID_AMOUNT"

    @pytest.mark.parametrize("bad", [-100, 0, "abc"])
    def test_invalid_new_amount_is_rejected(self, client, tokens, db, uid, emails, bad):
        _recharge(client, tokens["admin"], uid, 100000)
        tx_id = _last_recharge_id(db, uid)
        assert _correct(client, tokens["admin"], tx_id, bad).status_code == 422

    def test_empty_reason_is_rejected(self, client, tokens, db, uid, emails):
        _recharge(client, tokens["admin"], uid, 100000)
        tx_id = _last_recharge_id(db, uid)
        assert _correct(client, tokens["admin"], tx_id, 50000, reason="").status_code == 422

    def test_correction_keeps_original_and_records_adjustment(
        self, client, tokens, db, uid, emails
    ):
        _recharge(client, tokens["admin"], uid, 100000)
        tx_id = _last_recharge_id(db, uid)
        _correct(client, tokens["admin"], tx_id, 50000, reason="Se pasó un cero")

        db.expire_all()
        wallet = _wallet(db, uid)
        rows = (
            db.query(WalletTransaction)
            .filter(WalletTransaction.wallet_id == wallet.id)
            .order_by(WalletTransaction.created_at.asc())
            .all()
        )

        recharge = next(r for r in rows if r.type == WalletTransactionType.RECHARGE)
        adjustment = next(r for r in rows if r.type == WalletTransactionType.ADJUSTMENT)

        assert recharge.amount == Decimal("100000")  # original intacta
        assert adjustment.amount == Decimal("-50000")
        assert adjustment.corrects_transaction_id == recharge.id
        assert adjustment.description == "Corrección de recarga: Se pasó un cero"
        assert wallet.balance == recharge.amount + adjustment.amount  # saldo == suma

    def test_user_sees_both_movements_in_history(self, client, tokens, db, uid, emails):
        _recharge(client, tokens["admin"], uid, 100000)
        tx_id = _last_recharge_id(db, uid)
        _correct(client, tokens["admin"], tx_id, 50000)

        response = client.get("/wallet/transactions", headers=auth(tokens["user"]))
        assert response.status_code == 200
        types = [item["type"] for item in response.json()["items"]]
        assert "recharge" in types
        assert "adjustment" in types

    def test_user_is_notified_of_correction(self, client, tokens, db, uid, emails):
        _recharge(client, tokens["admin"], uid, 100000)
        tx_id = _last_recharge_id(db, uid)
        _correct(client, tokens["admin"], tx_id, 50000)

        assert len(emails["correction"]) == 1
        args, _ = emails["correction"][0]
        # send_recharge_correction_email(user, original, new, adjustment, balance, reason, at)
        assert args[1] == Decimal("100000")
        assert args[2] == Decimal("50000")
        assert args[3] == Decimal("-50000")

    def test_correction_is_atomic_when_balance_would_go_negative(
        self, client, tokens, db, uid, emails
    ):
        _recharge(client, tokens["admin"], uid, 100000)
        tx_id = _last_recharge_id(db, uid)

        wallet = _wallet(db, uid)
        wallet.balance = Decimal("20000")  # simula gasto previo del usuario
        db.commit()

        response = _correct(client, tokens["admin"], tx_id, 10000)
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "INVALID_AMOUNT"

        db.expire_all()
        wallet = _wallet(db, uid)
        assert wallet.balance == Decimal("20000")  # saldo intacto
        assert (
            db.query(WalletTransaction)
            .filter(
                WalletTransaction.wallet_id == wallet.id,
                WalletTransaction.type == WalletTransactionType.ADJUSTMENT,
            )
            .count()
            == 0  # ningún movimiento creado
        )
        assert emails["correction"] == []

    def test_history_marks_recharge_as_corrected(self, client, tokens, db, uid, emails):
        _recharge(client, tokens["admin"], uid, 100000)
        tx_id = _last_recharge_id(db, uid)

        before = client.get("/admin/wallet/history", headers=auth(tokens["admin"])).json()
        assert before["items"][0]["isCorrected"] is False

        _correct(client, tokens["admin"], tx_id, 50000)

        after = client.get("/admin/wallet/history", headers=auth(tokens["admin"])).json()
        row = next(item for item in after["items"] if item["id"] == str(tx_id))
        assert row["isCorrected"] is True

    def test_correct_unknown_transaction_returns_404(self, client, tokens, emails):
        response = _correct(
            client, tokens["admin"], "00000000-0000-0000-0000-000000000000", 50000
        )
        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "WALLET_TRANSACTION_NOT_FOUND"

    def test_correction_new_amount_at_limit_is_accepted(self, client, tokens, db, uid, emails):
        _recharge(client, tokens["admin"], uid, 8_000_000)
        tx_id = _last_recharge_id(db, uid)

        response = _correct(client, tokens["admin"], tx_id, 10_000_000)
        assert response.status_code == 200, response.text
        assert Decimal(response.json()["adjustment"]) == Decimal("2000000")
        assert _wallet(db, uid).balance == Decimal("10000000")

    def test_correction_new_amount_above_limit_is_rejected(self, client, tokens, db, uid, emails):
        _recharge(client, tokens["admin"], uid, 8_000_000)
        tx_id = _last_recharge_id(db, uid)

        response = _correct(client, tokens["admin"], tx_id, 10_000_001)
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "INVALID_AMOUNT"
        assert (
            response.json()["detail"]["message"]
            == "El monto máximo de recarga es de $10.000.000."
        )
        # la recarga NO queda corregida y el saldo no cambia
        assert _wallet(db, uid).balance == Decimal("8000000")
        after = client.get("/admin/wallet/history", headers=auth(tokens["admin"])).json()
        row = next(item for item in after["items"] if item["id"] == str(tx_id))
        assert row["isCorrected"] is False
