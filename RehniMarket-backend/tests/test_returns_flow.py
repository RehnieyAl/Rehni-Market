"""Flujo de devoluciones: el comprador solicita la devolución de un ítem de un pedido
ENTREGADO, la empresa dueña del pedido aprueba (reintegro a RehniCoin) o rechaza (motivo
obligatorio). Seguridad: cada quien solo ve/toca lo suyo."""

from decimal import Decimal
from uuid import UUID

import pytest

from app.models.ModelCompany import Company, CompanyCertificateEnum
from app.models.ModelOrder import Order, OrderStatusEnum
from app.models.ModelProduct import Product
from app.models.ModelReturnRequest import ReturnRequest, ReturnStatusEnum
from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.models.ModelWallet import Wallet, WalletTransaction, WalletTransactionType
from app.services.authentication.JWTService import create_access_token
from app.utils.Security import hash_password
from tests.conftest import auth


@pytest.fixture(autouse=True)
def _silence_emails(monkeypatch):
    for target in (
        "app.services.commerce.CheckoutService.send_order_created_email",
        "app.services.commerce.OrderService.send_order_status_email",
    ):
        monkeypatch.setattr(target, lambda *a, **k: None)

    for name in ("EmailReturnRequested", "EmailReturnApproved", "EmailReturnRejected"):
        monkeypatch.setattr(
            f"app.services.commerce.ReturnService.{name}", lambda *a, **k: None
        )


def _wallet(db, user_id):
    return db.query(Wallet).filter(Wallet.user_id == user_id).first()


def _place_delivered_order(client, tokens, db, product, address, quantity=2):
    db.query(Product).filter(Product.id == product.id).update({"stock": 50})
    db.commit()

    added = client.post(
        "/cart/add",
        json={"productId": str(product.id), "quantity": quantity},
        headers=auth(tokens["user"]),
    )
    assert added.status_code == 200, added.text

    checkout = client.post(
        "/checkout", json={"addressId": str(address.id)}, headers=auth(tokens["user"])
    )
    assert checkout.status_code == 200, checkout.text

    order = checkout.json()["orders"][0]

    db.query(Order).filter(Order.id == UUID(order["id"])).update(
        {"status": OrderStatusEnum.DELIVERED}
    )
    db.commit()
    db.expire_all()

    return order


def _request_return(client, tokens, order, reason="Llegó defectuoso y no enciende"):
    return client.post(
        f"/orders/{order['id']}/returns",
        json={"orderItemId": order["items"][0]["id"], "reason": reason},
        headers=auth(tokens["user"]),
    )


def _second_company(db):
    role_company = db.query(Role).filter(Role.name == "company").first()
    role_user = db.query(Role).filter(Role.name == "user").first()

    owner = Users(
        fullName="Empresa Dos",
        email="empresa.dos@test.local",
        hashed_password=hash_password("secret123"),
        tell="3000000021",
        verified=True,
        role_id=role_company.id,
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)

    company = Company(
        nameCompany="Segunda Co",
        addressCompany="Calle 9",
        CompanyNIT="900222333",
        CompanyNITDV="4",
        user_id=owner.id,
        CompanyCertificateStatus=CompanyCertificateEnum.APPROVED,
    )
    db.add(company)
    db.commit()
    db.refresh(company)

    return company, create_access_token(str(owner.id), "company")


class TestRequestReturn:
    def test_buyer_requests_return_of_delivered_order(
        self, client, tokens, db, users, product, address, buyer_wallet, company
    ):
        order = _place_delivered_order(client, tokens, db, product, address)

        response = _request_return(client, tokens, order)

        assert response.status_code == 200, response.text
        body = response.json()
        assert body["status"] == "pending"
        assert body["orderReference"] == order["reference"]

        row = db.query(ReturnRequest).filter(ReturnRequest.id == UUID(body["id"])).first()
        assert row.company_id == company.id
        assert row.user_id == users["user"].id

    def test_return_requires_delivered_order(
        self, client, tokens, db, users, product, address, buyer_wallet, company
    ):
        db.query(Product).filter(Product.id == product.id).update({"stock": 50})
        db.commit()
        client.post(
            "/cart/add",
            json={"productId": str(product.id), "quantity": 1},
            headers=auth(tokens["user"]),
        )
        checkout = client.post(
            "/checkout", json={"addressId": str(address.id)}, headers=auth(tokens["user"])
        )
        order = checkout.json()["orders"][0]

        response = _request_return(client, tokens, order)

        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "RETURN_NOT_ELIGIBLE"

    def test_cannot_request_return_of_another_users_order(
        self, client, tokens, db, users, product, address, buyer_wallet, company
    ):
        order = _place_delivered_order(client, tokens, db, product, address)

        role_user = db.query(Role).filter(Role.name == "user").first()
        other = Users(
            fullName="Otro",
            email="otro.comprador@test.local",
            hashed_password=hash_password("secret123"),
            tell="3000000022",
            verified=True,
            role_id=role_user.id,
        )
        db.add(other)
        db.commit()
        db.refresh(other)

        response = client.post(
            f"/orders/{order['id']}/returns",
            json={"orderItemId": order["items"][0]["id"], "reason": "Quiero devolverlo"},
            headers=auth(create_access_token(str(other.id), "user")),
        )

        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "ORDER_NOT_FOUND"

    def test_second_active_request_for_same_item_is_rejected(
        self, client, tokens, db, users, product, address, buyer_wallet, company
    ):
        order = _place_delivered_order(client, tokens, db, product, address)

        assert _request_return(client, tokens, order).status_code == 200

        second = _request_return(client, tokens, order)
        assert second.status_code == 409
        assert second.json()["detail"]["code"] == "RETURN_ALREADY_REQUESTED"

    def test_company_account_cannot_request_return(
        self, client, tokens, db, users, product, address, buyer_wallet, company
    ):
        order = _place_delivered_order(client, tokens, db, product, address)

        response = client.post(
            f"/orders/{order['id']}/returns",
            json={"orderItemId": order["items"][0]["id"], "reason": "cualquier motivo"},
            headers=auth(tokens["company"]),
        )

        assert response.status_code in (403, 404)


class TestCompanyEvaluatesReturn:
    def test_company_sees_only_its_own_returns(
        self, client, tokens, db, users, product, address, buyer_wallet, company
    ):
        order = _place_delivered_order(client, tokens, db, product, address)
        _request_return(client, tokens, order)

        _, other_token = _second_company(db)

        mine = client.get(
            "/company/dashboard/returns", headers=auth(tokens["company"])
        )
        theirs = client.get(
            "/company/dashboard/returns", headers=auth(other_token)
        )

        assert mine.status_code == 200 and theirs.status_code == 200
        assert mine.json()["total"] == 1
        assert theirs.json()["total"] == 0

    def test_approve_refunds_subtotal_plus_tax_to_wallet(
        self, client, tokens, db, users, product, address, buyer_wallet, company
    ):
        order = _place_delivered_order(client, tokens, db, product, address)
        created = _request_return(client, tokens, order).json()

        db.expire_all()
        balance_before = _wallet(db, users["user"].id).balance
        item_subtotal = Decimal(order["items"][0]["subtotal"])

        response = client.patch(
            f"/company/dashboard/returns/{created['id']}",
            json={"action": "approve"},
            headers=auth(tokens["company"]),
        )

        assert response.status_code == 200, response.text
        body = response.json()
        assert body["status"] == "approved"

        expected_refund = Decimal(body["refundAmount"])
        assert expected_refund >= item_subtotal  # subtotal (+ IVA si aplica)

        db.expire_all()
        assert _wallet(db, users["user"].id).balance == balance_before + expected_refund

        refund_rows = (
            db.query(WalletTransaction)
            .filter(
                WalletTransaction.type == WalletTransactionType.REFUND,
                WalletTransaction.wallet_id == _wallet(db, users["user"].id).id,
            )
            .all()
        )
        assert len(refund_rows) == 1
        assert refund_rows[0].order_id is None

    def test_reject_requires_reason(
        self, client, tokens, db, users, product, address, buyer_wallet, company
    ):
        order = _place_delivered_order(client, tokens, db, product, address)
        created = _request_return(client, tokens, order).json()

        blank = client.patch(
            f"/company/dashboard/returns/{created['id']}",
            json={"action": "reject"},
            headers=auth(tokens["company"]),
        )
        assert blank.status_code == 400
        assert blank.json()["detail"]["code"] == "MISSING_REQUIRED_FIELD"

        ok = client.patch(
            f"/company/dashboard/returns/{created['id']}",
            json={"action": "reject", "reason": "El daño fue causado por el comprador."},
            headers=auth(tokens["company"]),
        )
        assert ok.status_code == 200
        assert ok.json()["status"] == "rejected"
        assert ok.json()["companyResponse"] == "El daño fue causado por el comprador."

    def test_cannot_decide_already_resolved_return(
        self, client, tokens, db, users, product, address, buyer_wallet, company
    ):
        order = _place_delivered_order(client, tokens, db, product, address)
        created = _request_return(client, tokens, order).json()

        client.patch(
            f"/company/dashboard/returns/{created['id']}",
            json={"action": "approve"},
            headers=auth(tokens["company"]),
        )

        again = client.patch(
            f"/company/dashboard/returns/{created['id']}",
            json={"action": "approve"},
            headers=auth(tokens["company"]),
        )
        assert again.status_code == 409
        assert again.json()["detail"]["code"] == "RETURN_ALREADY_RESOLVED"

    def test_company_return_detail_is_scoped(
        self, client, tokens, db, users, product, address, buyer_wallet, company
    ):
        order = _place_delivered_order(client, tokens, db, product, address)
        created = _request_return(client, tokens, order).json()

        mine = client.get(
            f"/company/dashboard/returns/{created['id']}", headers=auth(tokens["company"])
        )
        assert mine.status_code == 200
        assert mine.json()["reason"] == created["reason"]

        _, other_token = _second_company(db)
        theirs = client.get(
            f"/company/dashboard/returns/{created['id']}", headers=auth(other_token)
        )
        assert theirs.status_code == 404

    def test_user_cannot_call_company_decide_endpoint(
        self, client, tokens, db, users, product, address, buyer_wallet, company
    ):
        order = _place_delivered_order(client, tokens, db, product, address)
        created = _request_return(client, tokens, order).json()

        response = client.patch(
            f"/company/dashboard/returns/{created['id']}",
            json={"action": "approve"},
            headers=auth(tokens["user"]),
        )
        assert response.status_code == 403

    def test_company_cannot_decide_another_companys_return(
        self, client, tokens, db, users, product, address, buyer_wallet, company
    ):
        order = _place_delivered_order(client, tokens, db, product, address)
        created = _request_return(client, tokens, order).json()

        _, other_token = _second_company(db)

        response = client.patch(
            f"/company/dashboard/returns/{created['id']}",
            json={"action": "approve"},
            headers=auth(other_token),
        )
        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "RETURN_NOT_FOUND"

        db.expire_all()
        row = db.query(ReturnRequest).filter(ReturnRequest.id == UUID(created["id"])).first()
        assert row.status == ReturnStatusEnum.PENDING


class TestReturnVisibleInOrderDetail:
    def test_order_detail_includes_return_status_and_reason(
        self, client, tokens, db, users, product, address, buyer_wallet, company
    ):
        order = _place_delivered_order(client, tokens, db, product, address)
        created = _request_return(client, tokens, order).json()

        client.patch(
            f"/company/dashboard/returns/{created['id']}",
            json={"action": "reject", "reason": "Fuera de la política de devolución."},
            headers=auth(tokens["company"]),
        )

        detail = client.get(f"/orders/{order['id']}", headers=auth(tokens["user"]))
        assert detail.status_code == 200

        returns = detail.json()["returns"]
        assert len(returns) == 1
        assert returns[0]["status"] == "rejected"
        assert returns[0]["companyResponse"] == "Fuera de la política de devolución."
        assert returns[0]["orderItemId"] == order["items"][0]["id"]

    def test_no_stock_is_restored_on_approval(
        self, client, tokens, db, users, product, address, buyer_wallet, company
    ):
        order = _place_delivered_order(client, tokens, db, product, address, quantity=2)
        created = _request_return(client, tokens, order).json()

        db.expire_all()
        stock_before = db.query(Product).filter(Product.id == product.id).first().stock

        client.patch(
            f"/company/dashboard/returns/{created['id']}",
            json={"action": "approve"},
            headers=auth(tokens["company"]),
        )

        db.expire_all()
        stock_after = db.query(Product).filter(Product.id == product.id).first().stock
        assert stock_after == stock_before
