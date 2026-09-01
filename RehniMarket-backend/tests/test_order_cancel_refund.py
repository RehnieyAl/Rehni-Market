from decimal import Decimal
from uuid import UUID

import pytest

from app.models.ModelOrder import Order, OrderStatusEnum
from app.models.ModelProduct import Product
from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.models.ModelWallet import Wallet, WalletTransaction, WalletTransactionType
from app.services.authentication.JWTService import create_access_token
from app.utils.Security import hash_password
from tests.conftest import auth


@pytest.fixture(autouse=True)
def _silence_emails(monkeypatch):
    monkeypatch.setattr(
        "app.services.commerce.CheckoutService.send_order_created_email",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        "app.services.commerce.OrderService.send_order_status_email",
        lambda *args, **kwargs: None,
    )


def _wallet(db, user_id):
    return db.query(Wallet).filter(Wallet.user_id == user_id).first()


def _refund_rows(db, order_id):
    return (
        db.query(WalletTransaction)
        .filter(
            WalletTransaction.order_id == order_id,
            WalletTransaction.type == WalletTransactionType.REFUND,
        )
        .all()
    )


def _place_order(client, tokens, db, product, address, quantity=2):
    db.query(Product).filter(Product.id == product.id).update({"stock": 50})
    db.commit()

    added = client.post(
        "/cart/add",
        json={"productId": str(product.id), "quantity": quantity},
        headers=auth(tokens["user"]),
    )
    assert added.status_code == 200, added.text

    checkout = client.post(
        "/checkout",
        json={"addressId": str(address.id)},
        headers=auth(tokens["user"]),
    )
    assert checkout.status_code == 200, checkout.text

    db.expire_all()
    return checkout.json()["orders"][0]


def _second_buyer(db):
    role = db.query(Role).filter(Role.name == "user").first()
    user = Users(
        fullName="Comprador Dos",
        email="comprador.dos@test.local",
        hashed_password=hash_password("secret123"),
        tell="3000000009",
        verified=True,
        role_id=role.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, create_access_token(str(user.id), "user")


class TestCancelRefund:
    def test_paid_order_cancel_refunds_the_paid_total(
        self, client, tokens, db, users, product, address, buyer_wallet
    ):
        order = _place_order(client, tokens, db, product, address, quantity=2)
        total = Decimal(order["total"])
        assert total > 0

        balance_after_purchase = _wallet(db, users["user"].id).balance

        response = client.patch(
            f"/orders/{order['id']}/cancel", headers=auth(tokens["user"])
        )

        assert response.status_code == 200, response.text
        assert response.json()["status"] == "cancelled"

        db.expire_all()
        assert _wallet(db, users["user"].id).balance == balance_after_purchase + total

    def test_unpaid_zero_total_order_is_not_refunded(
        self, client, tokens, db, users, product, address, buyer_wallet
    ):
        order = _place_order(client, tokens, db, product, address, quantity=1)

        db.query(Order).filter(Order.id == UUID(order["id"])).update(
            {"total": Decimal("0")}
        )
        db.commit()

        balance_before = _wallet(db, users["user"].id).balance

        response = client.patch(
            f"/orders/{order['id']}/cancel", headers=auth(tokens["user"])
        )

        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"

        db.expire_all()
        assert _wallet(db, users["user"].id).balance == balance_before
        assert _refund_rows(db, UUID(order["id"])) == []

    def test_second_cancel_does_not_refund_again(
        self, client, tokens, db, users, product, address, buyer_wallet
    ):
        order = _place_order(client, tokens, db, product, address, quantity=3)

        first = client.patch(
            f"/orders/{order['id']}/cancel", headers=auth(tokens["user"])
        )
        assert first.status_code == 200

        db.expire_all()
        balance_after_first = _wallet(db, users["user"].id).balance

        second = client.patch(
            f"/orders/{order['id']}/cancel", headers=auth(tokens["user"])
        )

        assert second.status_code == 409
        assert second.json()["detail"]["code"] == "ORDER_ALREADY_CANCELLED"

        db.expire_all()
        assert _wallet(db, users["user"].id).balance == balance_after_first
        assert len(_refund_rows(db, UUID(order["id"]))) == 1

    def test_cancel_of_another_users_order_is_rejected(
        self, client, tokens, db, users, product, address, buyer_wallet
    ):
        order = _place_order(client, tokens, db, product, address, quantity=1)

        _, other_token = _second_buyer(db)

        response = client.patch(
            f"/orders/{order['id']}/cancel", headers=auth(other_token)
        )

        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "ORDER_NOT_FOUND"

        db.expire_all()
        assert db.get(Order, UUID(order["id"])).status != OrderStatusEnum.CANCELLED
        assert _refund_rows(db, UUID(order["id"])) == []

    def test_final_balance_returns_to_pre_purchase_value(
        self, client, tokens, db, users, product, address, buyer_wallet
    ):
        initial_balance = _wallet(db, users["user"].id).balance

        order = _place_order(client, tokens, db, product, address, quantity=2)

        db.expire_all()
        assert _wallet(db, users["user"].id).balance < initial_balance

        client.patch(f"/orders/{order['id']}/cancel", headers=auth(tokens["user"]))

        db.expire_all()
        assert _wallet(db, users["user"].id).balance == initial_balance

    def test_refund_transaction_is_recorded(
        self, client, tokens, db, users, product, address, buyer_wallet
    ):
        order = _place_order(client, tokens, db, product, address, quantity=2)
        total = Decimal(order["total"])

        client.patch(f"/orders/{order['id']}/cancel", headers=auth(tokens["user"]))

        db.expire_all()
        refunds = _refund_rows(db, UUID(order["id"]))

        assert len(refunds) == 1
        assert refunds[0].amount == total
        assert refunds[0].type == WalletTransactionType.REFUND
        assert refunds[0].wallet_id == _wallet(db, users["user"].id).id

    def test_failure_during_cancel_leaves_no_partial_state(
        self, client, tokens, db, users, product, address, buyer_wallet, monkeypatch
    ):
        order = _place_order(client, tokens, db, product, address, quantity=2)

        db.expire_all()
        balance_before = _wallet(db, users["user"].id).balance

        def _boom(*args, **kwargs):
            raise RuntimeError("fallo simulado durante la cancelación")

        monkeypatch.setattr(
            "app.services.commerce.OrderService._restore_stock_for_order", _boom
        )

        response = client.patch(
            f"/orders/{order['id']}/cancel", headers=auth(tokens["user"])
        )

        assert response.status_code == 500

        db.expire_all()
        assert _wallet(db, users["user"].id).balance == balance_before
        assert _refund_rows(db, UUID(order["id"])) == []
        assert db.get(Order, UUID(order["id"])).status != OrderStatusEnum.CANCELLED
