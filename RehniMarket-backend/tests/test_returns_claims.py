"""Reclamaciones de devolución de punta a punta sobre PostgreSQL: reembolso único con peticiones
simultáneas (B-01), monto histórico (B-04), compensación en liquidaciones (B-02), duplicados (B-03),
revisión del comprador, intervención del administrador, correos registrados, contacto empresarial,
historial y permisos."""

import importlib.util
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from uuid import UUID

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.core import BusinessCalendar
from app.core.PayoutConfig import COMMISSION_PERCENTAGE
from app.models.ModelCompanyPayout import CompanyPayout
from app.models.ModelOrder import Order, OrderItem, OrderStatusEnum
from app.models.ModelProduct import Product
from app.models.ModelReturnNotification import NotificationStatus, ReturnNotification
from app.models.ModelReturnRequest import ReturnRequest, ReturnStatusEnum
from app.models.ModelReturnRequestEvent import ReturnRequestEvent
from app.models.ModelWallet import WalletTransaction, WalletTransactionType
from app.schemas.SchemaCommerce.SchemaReturn import (
    AdminEscalateRequest,
    CreateReturnRequest,
    ReturnDecisionRequest,
)
from app.services.commerce import ReturnNotificationService, ReturnService
from tests.conftest import auth
from tests.factories import make_bank_account, make_user, place_order, silence_emails, utc, wallet_of

SEPT = {"periodStart": "2026-09-01", "periodEnd": "2026-09-30"}
OCT = {"periodStart": "2026-10-01", "periodEnd": "2026-10-31"}
REASON = "Llegó defectuoso y no enciende"


@pytest.fixture(autouse=True)
def _silence(monkeypatch):
    silence_emails(monkeypatch)


# ---------------------------------------------------------------- helpers


def deliver(client, tokens, db, product, address, quantity=2, created_at=None):
    return place_order(client, tokens["user"], db, product, address, quantity, OrderStatusEnum.DELIVERED, created_at)


def request_return(client, tokens, order, reason=REASON, token=None):
    return client.post(
        f"/orders/{order['id']}/returns",
        json={"orderItemId": order["items"][0]["id"], "reason": reason},
        headers=auth(token or tokens["user"]),
    )


def decide(client, tokens, return_id, **body):
    return client.patch(f"/company/dashboard/returns/{return_id}", json=body, headers=auth(tokens["company"]))


def admin_post(client, tokens, return_id, path, body, role="admin"):
    return client.post(f"/admin/dashboard/returns/{return_id}/{path}", json=body, headers=auth(tokens[role]))


def refunds_for(db, return_id) -> list[WalletTransaction]:
    db.expire_all()
    return (
        db.query(WalletTransaction)
        .filter(WalletTransaction.return_request_id == UUID(str(return_id)))
        .all()
    )


def refund_rows(db, user_id) -> int:
    wallet = wallet_of(db, user_id)
    return (
        db.query(WalletTransaction)
        .filter(WalletTransaction.wallet_id == wallet.id, WalletTransaction.type == WalletTransactionType.REFUND)
        .count()
    )


def notifications_of(db, return_id) -> list[ReturnNotification]:
    db.expire_all()
    return (
        db.query(ReturnNotification)
        .filter(ReturnNotification.return_request_id == UUID(str(return_id)))
        .order_by(ReturnNotification.created_at)
        .all()
    )


def generate(client, tokens, company_id, period):
    return client.post(
        "/admin/payouts/generate", json={"companyId": str(company_id), **period}, headers=auth(tokens["owner"])
    )


@pytest.fixture()
def claim(client, tokens, db, product, address, buyer_wallet, company):
    """Pedido entregado con una reclamación pendiente."""

    order = deliver(client, tokens, db, product, address)
    created = request_return(client, tokens, order)
    assert created.status_code == 200, created.text
    return order, created.json()


@pytest.fixture()
def rejected_claim(client, tokens, claim):
    order, created = claim
    response = decide(client, tokens, created["id"], action="reject", subject="Devolución no aprobada",
                      reason="El producto tiene señales de mal uso.")
    assert response.status_code == 200, response.text
    return order, response.json()


def _sessions(engine):
    return sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _status_of(exc_or_value):
    if isinstance(exc_or_value, HTTPException):
        return exc_or_value.status_code
    return 200


# ---------------------------------------------------------------- B-01: reembolso único


class TestSingleRefund:
    def test_simultaneous_company_approvals_credit_one_refund(self, engine, db, users, claim):
        _, created = claim
        balance_before = wallet_of(db, users["user"].id).balance
        Session = _sessions(engine)
        start = threading.Barrier(4, timeout=10)

        def approve(_):
            session = Session()
            start.wait()
            try:
                ReturnService.decide_return_service(
                    users["company"].id, UUID(created["id"]), ReturnDecisionRequest(action="approve"), session
                )
                return 200
            except HTTPException as error:
                return error.status_code
            finally:
                session.close()

        with ThreadPoolExecutor(max_workers=4) as pool:
            statuses = sorted(pool.map(approve, range(4)))

        assert statuses == [200, 409, 409, 409]
        refunds = refunds_for(db, created["id"])
        assert len(refunds) == 1
        assert refund_rows(db, users["user"].id) == 1
        assert wallet_of(db, users["user"].id).balance == balance_before + refunds[0].amount
        assert db.get(ReturnRequest, UUID(created["id"])).status == ReturnStatusEnum.APPROVED

    def test_company_decision_and_admin_intervention_at_once_stay_consistent(self, engine, db, users, claim):
        _, created = claim
        Session = _sessions(engine)
        start = threading.Barrier(2, timeout=10)

        def company_approves():
            session = Session()
            start.wait()
            try:
                ReturnService.decide_return_service(
                    users["company"].id, UUID(created["id"]), ReturnDecisionRequest(action="approve"), session
                )
                return "approved"
            except HTTPException as error:
                return error.status_code
            finally:
                session.close()

        def admin_escalates():
            session = Session()
            start.wait()
            try:
                ReturnService.escalate_return_service(
                    users["admin"].id, "admin", UUID(created["id"]),
                    AdminEscalateRequest(reason="La empresa no respondió a tiempo."), session,
                )
                return "escalated"
            except HTTPException as error:
                return error.status_code
            finally:
                session.close()

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = [pool.submit(company_approves), pool.submit(admin_escalates)]
            outcome = [result.result() for result in results]

        db.expire_all()
        final = db.get(ReturnRequest, UUID(created["id"])).status
        assert outcome in (["approved", 409], [409, "escalated"])
        assert final == (ReturnStatusEnum.APPROVED if outcome[0] == "approved" else ReturnStatusEnum.UNDER_REVIEW)
        assert len(refunds_for(db, created["id"])) == (1 if final == ReturnStatusEnum.APPROVED else 0)

    def test_retry_after_success_does_not_credit_again(self, client, tokens, db, users, claim):
        _, created = claim
        assert decide(client, tokens, created["id"], action="approve").status_code == 200
        again = decide(client, tokens, created["id"], action="approve")

        assert again.status_code == 409
        assert again.json()["detail"]["code"] == "RETURN_ALREADY_RESOLVED"
        assert len(refunds_for(db, created["id"])) == 1

    def test_database_rejects_a_second_refund_for_the_same_claim(self, client, tokens, db, users, claim):
        _, created = claim
        assert decide(client, tokens, created["id"], action="approve").status_code == 200
        wallet = wallet_of(db, users["user"].id)

        db.add(WalletTransaction(
            wallet_id=wallet.id, type=WalletTransactionType.REFUND, amount=Decimal("1"),
            description="duplicado", return_request_id=UUID(created["id"]),
        ))
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()

    def test_failure_during_refund_rolls_back_everything(self, client, tokens, db, users, claim, monkeypatch):
        _, created = claim
        balance_before = wallet_of(db, users["user"].id).balance

        def broken(*args, **kwargs):
            raise RuntimeError("fallo simulado")

        monkeypatch.setattr(ReturnService, "refund_wallet", broken)
        response = decide(client, tokens, created["id"], action="approve")

        assert response.status_code == 500
        db.expire_all()
        ret = db.get(ReturnRequest, UUID(created["id"]))
        assert ret.status == ReturnStatusEnum.PENDING
        assert ret.refund_amount is None and ret.resolved_at is None
        assert [e.event_type.value for e in ret.events] == ["requested"]
        assert [n.kind for n in notifications_of(db, created["id"])] == ["new_request"]
        assert wallet_of(db, users["user"].id).balance == balance_before


# ---------------------------------------------------------------- B-04: monto histórico


class TestHistoricalAmount:
    def test_refund_is_what_was_charged_even_if_tax_changes_later(
        self, client, tokens, db, users, product, address, buyer_wallet, company
    ):
        db.query(Product).filter(Product.id == product.id).update({"applies_tax": True})
        db.commit()
        order = deliver(client, tokens, db, product, address, quantity=3)
        charged = Decimal(order["total"])
        assert Decimal(order["tax"]) > 0

        db.query(Product).filter(Product.id == product.id).update({"applies_tax": False})
        db.commit()

        created = request_return(client, tokens, order).json()
        approved = decide(client, tokens, created["id"], action="approve").json()

        assert Decimal(approved["refundAmount"]) == charged
        assert refunds_for(db, created["id"])[0].amount == charged

    def test_checkout_splits_tax_per_line_matching_the_order(
        self, client, tokens, db, users, product, address, buyer_wallet, company, catalog
    ):
        db.query(Product).filter(Product.id == product.id).update({"applies_tax": True, "price": Decimal("33333")})
        free = Product(name="Libro", price=Decimal("50000"), descripcion="d", stock=10, applies_tax=False,
                       company_id=company.id, catalog_id=catalog.id)
        third = Product(name="Gorra", price=Decimal("16667"), descripcion="d", stock=10, applies_tax=True,
                        company_id=company.id, catalog_id=catalog.id)
        db.add_all([free, third])
        db.commit()
        for item, quantity in ((product, 1), (free, 1), (third, 1)):
            if item is product:
                db.query(Product).filter(Product.id == product.id).update({"stock": 10})
                db.commit()
            assert client.post("/cart/add", json={"productId": str(item.id), "quantity": quantity},
                               headers=auth(tokens["user"])).status_code == 200
        order = client.post("/checkout", json={"addressId": str(address.id)}, headers=auth(tokens["user"])).json()["orders"][0]

        db.expire_all()
        items = db.query(OrderItem).filter(OrderItem.order_id == UUID(order["id"])).all()
        taxes = {item.product_name: item.tax_amount for item in items}
        assert taxes["Libro"] == Decimal("0")
        assert sum(taxes.values()) == Decimal(order["tax"])
        assert sum(item.subtotal + item.tax_amount for item in items) == Decimal(order["total"])

    def test_unknown_historical_tax_blocks_the_refund_instead_of_guessing(self, client, tokens, db, users, claim):
        order, created = claim
        db.query(OrderItem).filter(OrderItem.order_id == UUID(order["id"])).update({"tax_amount": None})
        db.commit()

        response = decide(client, tokens, created["id"], action="approve")

        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "RETURN_REFUND_UNAVAILABLE"
        assert refunds_for(db, created["id"]) == []
        assert db.get(ReturnRequest, UUID(created["id"])).status == ReturnStatusEnum.PENDING

    @pytest.mark.parametrize(
        ("subtotals", "order_tax", "expected"),
        [
            (["100.00", "50.00"], "0.00", ["0", "0"]),
            (["100.00"], "19.00", ["19.00"]),
            (["33333.00", "16667.00"], "9500.00", ["6333.27", "3166.73"]),
            (["100.00", "50.00"], "19.00", None),
        ],
    )
    def test_migration_only_backfills_line_taxes_it_can_deduce(self, subtotals, order_tax, expected):
        path = Path(__file__).resolve().parents[1] / "alembic" / "versions" / "e9a1b3c5d7f2_returns_claims.py"
        spec = importlib.util.spec_from_file_location("returns_claims_migration", path)
        migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration)

        result = migration._line_taxes([Decimal(v) for v in subtotals], Decimal(order_tax))

        assert result == (None if expected is None else [Decimal(v) for v in expected])


# ---------------------------------------------------------------- B-02: liquidaciones


class TestPayoutCompensation:
    @pytest.fixture()
    def bank_account(self, db, company):
        return make_bank_account(db, company)

    def test_return_approved_before_payout_is_excluded(
        self, client, tokens, db, company, bank_account, product, address, buyer_wallet
    ):
        order = deliver(client, tokens, db, product, address, created_at=utc(2026, 9, 5))
        created = request_return(client, tokens, order).json()
        refund = Decimal(decide(client, tokens, created["id"], action="approve").json()["refundAmount"])

        payout = generate(client, tokens, company.id, SEPT).json()

        assert Decimal(payout["grossSales"]) == Decimal(order["total"]) - refund
        assert Decimal(payout["refundsAmount"]) == refund
        db.expire_all()
        assert str(db.get(ReturnRequest, UUID(created["id"])).payout_adjustment_id) == payout["id"]

    def test_return_after_payout_is_compensated_once_in_a_later_payout(
        self, client, tokens, db, company, bank_account, product, address, buyer_wallet, monkeypatch
    ):
        # Noviembre de 2026 solo se puede liquidar cuando ya cerró.
        monkeypatch.setattr(BusinessCalendar, "today_bogota", lambda: date(2026, 12, 1))
        september = deliver(client, tokens, db, product, address, quantity=2, created_at=utc(2026, 9, 5))
        october = deliver(client, tokens, db, product, address, quantity=5, created_at=utc(2026, 10, 5))
        sept_payout = generate(client, tokens, company.id, SEPT).json()
        assert Decimal(sept_payout["refundsAmount"]) == 0

        created = request_return(client, tokens, september).json()
        refund = Decimal(decide(client, tokens, created["id"], action="approve").json()["refundAmount"])

        oct_payout = generate(client, tokens, company.id, OCT).json()

        assert Decimal(oct_payout["refundsAmount"]) == refund
        assert Decimal(oct_payout["grossSales"]) == Decimal(october["total"]) - refund
        db.expire_all()
        historic = db.get(CompanyPayout, UUID(sept_payout["id"]))
        assert historic.gross_sales == Decimal(sept_payout["grossSales"])
        assert historic.refunds_amount == 0

        november = deliver(client, tokens, db, product, address, quantity=1, created_at=utc(2026, 11, 5))
        nov_payout = generate(client, tokens, company.id, {"periodStart": "2026-11-01", "periodEnd": "2026-11-30"}).json()
        assert Decimal(nov_payout["refundsAmount"]) == 0
        assert Decimal(nov_payout["grossSales"]) == Decimal(november["total"])

    def test_compensation_larger_than_next_sales_stays_pending(
        self, client, tokens, db, company, bank_account, product, address, buyer_wallet
    ):
        september = deliver(client, tokens, db, product, address, quantity=5, created_at=utc(2026, 9, 5))
        deliver(client, tokens, db, product, address, quantity=1, created_at=utc(2026, 10, 5))
        sept_payout = generate(client, tokens, company.id, SEPT).json()
        created = request_return(client, tokens, september).json()
        refund = Decimal(decide(client, tokens, created["id"], action="approve").json()["refundAmount"])

        oct_payout = generate(client, tokens, company.id, OCT).json()

        assert Decimal(oct_payout["refundsAmount"]) == 0
        db.expire_all()
        assert db.get(ReturnRequest, UUID(created["id"])).payout_adjustment_id is None

        # El saldo pendiente ya descuenta la compensación (sin la comisión que no se cobra).
        balance = client.get("/company/balance", headers=auth(tokens["company"])).json()
        pending_refund_net = refund - (refund * COMMISSION_PERCENTAGE).quantize(Decimal("0.01"))
        expected = Decimal(sept_payout["netAmount"]) + Decimal(oct_payout["netAmount"]) - pending_refund_net
        assert Decimal(balance["netBalance"]) == expected


# ---------------------------------------------------------------- B-03 y comprador


class TestBuyer:
    def test_simultaneous_requests_create_one_claim_and_answer_409(
        self, engine, db, users, client, tokens, product, address, buyer_wallet, company
    ):
        order = deliver(client, tokens, db, product, address)
        Session = _sessions(engine)
        start = threading.Barrier(3, timeout=10)
        data = CreateReturnRequest(orderItemId=order["items"][0]["id"], reason=REASON)

        def send(_):
            session = Session()
            start.wait()
            try:
                ReturnService.request_return_service(users["user"].id, UUID(order["id"]), data, session)
                return 200
            except HTTPException as error:
                assert error.detail["code"] == "RETURN_ALREADY_REQUESTED"
                return error.status_code
            finally:
                session.close()

        with ThreadPoolExecutor(max_workers=3) as pool:
            statuses = sorted(pool.map(send, range(3)))

        assert statuses == [200, 409, 409]
        db.expire_all()
        assert db.query(ReturnRequest).count() == 1

    def test_foreign_item_short_reason_and_foreign_order(self, client, tokens, db, users, product, address, buyer_wallet, company):
        order = deliver(client, tokens, db, product, address)

        foreign_item = client.post(f"/orders/{order['id']}/returns",
                                   json={"orderItemId": str(uuid.uuid4()), "reason": REASON}, headers=auth(tokens["user"]))
        assert foreign_item.status_code == 404
        assert foreign_item.json()["detail"]["code"] == "ORDER_ITEM_NOT_FOUND"

        assert request_return(client, tokens, order, reason="mal").status_code == 422
        assert request_return(client, tokens, order, reason="x" * 501).status_code == 422

        _, other_token = make_user(db, "user", "otro@test.local")
        assert request_return(client, tokens, order, token=other_token).status_code == 404

    def test_list_and_detail_are_limited_to_the_buyer(self, client, tokens, db, claim):
        _, created = claim
        mine = client.get("/returns", headers=auth(tokens["user"])).json()
        assert [item["id"] for item in mine["items"]] == [created["id"]]
        assert mine["items"][0]["companyName"] == "Test Co"
        assert mine["items"][0]["reference"].startswith("DEV-")

        detail = client.get(f"/returns/{created['id']}", headers=auth(tokens["user"])).json()
        assert [event["type"] for event in detail["events"]] == ["requested"]

        _, other_token = make_user(db, "user", "ajeno@test.local")
        assert client.get(f"/returns/{created['id']}", headers=auth(other_token)).status_code == 404
        assert client.get("/returns", headers=auth(other_token)).json()["total"] == 0
        assert client.get("/returns", headers=auth(tokens["company"])).status_code == 403

    def test_rejected_claim_is_reviewed_once_instead_of_reopened(self, client, tokens, db, rejected_claim):
        order, rejected = rejected_claim
        assert rejected["canRequestReview"] is True
        assert rejected["companyResponse"] == "El producto tiene señales de mal uso."
        assert rejected["companySubject"] == "Devolución no aprobada"

        reopened = request_return(client, tokens, order)
        assert reopened.status_code == 409
        assert reopened.json()["detail"]["code"] == "RETURN_ALREADY_REQUESTED"

        review = client.post(f"/returns/{rejected['id']}/review", json={"reason": "Tengo fotos del empaque roto."},
                             headers=auth(tokens["user"]))
        assert review.status_code == 200
        body = review.json()
        assert body["status"] == "under_review"
        assert body["companyResponse"] == "El producto tiene señales de mal uso."
        assert [event["type"] for event in body["events"]] == ["requested", "company_rejected", "review_requested"]

        again = client.post(f"/returns/{rejected['id']}/review", json={"reason": "Otra vez lo mismo."},
                            headers=auth(tokens["user"]))
        assert again.status_code == 409
        assert again.json()["detail"]["code"] == "RETURN_REVIEW_NOT_ALLOWED"

        blocked = decide(client, tokens, rejected["id"], action="approve")
        assert blocked.status_code == 409
        assert blocked.json()["detail"]["code"] == "RETURN_IN_ADMIN_REVIEW"

    def test_review_of_legacy_rejection_with_another_active_claim_is_a_clear_conflict(
        self, client, tokens, db, users, rejected_claim
    ):
        # Antes de la regla de una reclamación por producto, tras un rechazo se abría otra nueva.
        _, rejected = rejected_claim
        old = db.get(ReturnRequest, UUID(rejected["id"]))
        db.add(ReturnRequest(order_id=old.order_id, order_item_id=old.order_item_id, user_id=old.user_id,
                             company_id=old.company_id, reason="Segunda solicitud heredada",
                             status=ReturnStatusEnum.PENDING))
        db.commit()

        review = client.post(f"/returns/{rejected['id']}/review", json={"reason": "No estoy de acuerdo con el rechazo."},
                             headers=auth(tokens["user"]))
        escalate = admin_post(client, tokens, rejected["id"], "escalate", {"reason": "El comprador insiste."})

        for response in (review, escalate):
            assert response.status_code == 409
            assert response.json()["detail"]["code"] == "RETURN_ALREADY_REQUESTED"
        db.expire_all()
        assert db.get(ReturnRequest, UUID(rejected["id"])).status == ReturnStatusEnum.REJECTED

    def test_review_is_not_allowed_on_pending_claims(self, client, tokens, claim):
        _, created = claim
        response = client.post(f"/returns/{created['id']}/review", json={"reason": "Quiero que lo revisen."},
                               headers=auth(tokens["user"]))
        assert response.status_code == 409

    def test_order_detail_shows_review_option(self, client, tokens, rejected_claim):
        order, _ = rejected_claim
        detail = client.get(f"/orders/{order['id']}", headers=auth(tokens["user"])).json()
        assert detail["returns"][0]["canRequestReview"] is True


# ---------------------------------------------------------------- empresa


class TestCompanyDecision:
    def test_approval_stores_subject_explanation_history_and_notifies_buyer(self, client, tokens, db, users, claim, outbox):
        _, created = claim
        response = decide(client, tokens, created["id"], action="approve", subject="Aprobamos tu devolución",
                          reason="Recibimos el producto y confirmamos la falla.")

        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "approved"
        assert body["companySubject"] == "Aprobamos tu devolución"
        assert body["companyResponse"] == "Recibimos el producto y confirmamos la falla."
        assert body["decidedBy"] == "company"
        assert [event["type"] for event in body["events"]] == ["requested", "company_approved", "refunded"]
        assert Decimal(body["events"][2]["amount"]) == Decimal(body["refundAmount"])

        sent = notifications_of(db, created["id"])
        assert [(n.kind, n.recipient_email, n.status) for n in sent] == [
            ("new_request", "company@test.local", NotificationStatus.ACCEPTED),
            ("decision", "user@test.local", NotificationStatus.ACCEPTED),
        ]
        assert {"to": "user@test.local", "subject": "Aprobamos tu devolución"} in outbox

    def test_rejection_validates_reason_and_subject(self, client, tokens, claim):
        _, created = claim
        assert decide(client, tokens, created["id"], action="reject").status_code == 400
        assert decide(client, tokens, created["id"], action="reject", reason="no").status_code == 422
        assert decide(client, tokens, created["id"], action="reject", reason="x" * 501).status_code == 422
        injected = decide(client, tokens, created["id"], action="reject", reason="Fuera de la política.",
                          subject="Hola\r\nBcc: alguien@evil.test")
        assert injected.status_code == 422

    def test_company_notification_uses_business_contact_when_registered(self, client, tokens, db, company, product, address, buyer_wallet):
        company.contact_email = "soporte@testco.local"
        db.commit()
        order = deliver(client, tokens, db, product, address)
        created = request_return(client, tokens, order).json()

        assert notifications_of(db, created["id"])[0].recipient_email == "soporte@testco.local"

    def test_smtp_failure_keeps_the_refund_and_can_be_retried_once(self, client, tokens, db, users, claim, outbox):
        _, created = claim
        balance_before = wallet_of(db, users["user"].id).balance
        outbox.fail = True

        response = decide(client, tokens, created["id"], action="approve")

        assert response.status_code == 200
        decision = notifications_of(db, created["id"])[-1]
        assert decision.status == NotificationStatus.FAILED
        assert "SMTP no disponible" in decision.last_error
        assert wallet_of(db, users["user"].id).balance == balance_before + Decimal(response.json()["refundAmount"])

        outbox.fail = False
        retried = client.post(
            f"/admin/dashboard/returns/{created['id']}/notifications/{decision.id}/retry", headers=auth(tokens["admin"])
        )
        assert retried.status_code == 200
        state = {n["id"]: n for n in retried.json()["notifications"]}[str(decision.id)]
        assert (state["status"], state["attempts"]) == ("accepted", 2)

        again = client.post(
            f"/admin/dashboard/returns/{created['id']}/notifications/{decision.id}/retry", headers=auth(tokens["admin"])
        )
        assert again.status_code == 409
        assert len(refunds_for(db, created["id"])) == 1

    def test_concurrent_dispatch_sends_the_email_once(self, client, tokens, db, claim, monkeypatch, outbox):
        _, created = claim
        monkeypatch.setattr(ReturnNotificationService, "schedule_dispatch", lambda ids: None)
        decide(client, tokens, created["id"], action="reject", subject="Asunto único 123", reason="Fuera de la política.")
        pending = notifications_of(db, created["id"])[-1]
        assert pending.status == NotificationStatus.PENDING
        start = threading.Barrier(3, timeout=10)

        def dispatch(_):
            start.wait()
            ReturnNotificationService.dispatch_notifications([pending.id])

        with ThreadPoolExecutor(max_workers=3) as pool:
            list(pool.map(dispatch, range(3)))

        assert [mail["subject"] for mail in outbox].count("Asunto único 123") == 1
        assert notifications_of(db, created["id"])[-1].attempts == 1


# ---------------------------------------------------------------- administración


class TestAdmin:
    def test_suspended_company_claim_is_taken_and_refunded_by_admin(self, client, tokens, db, users, company, claim):
        _, created = claim
        company.CompanyStatus = False
        db.commit()
        assert client.get("/company/dashboard/returns", headers=auth(tokens["company"])).status_code == 403

        premature = admin_post(client, tokens, created["id"], "decision",
                               {"action": "approve", "subject": "Reembolso aprobado", "message": "Aprobado por la plataforma."})
        assert premature.status_code == 409
        assert premature.json()["detail"]["code"] == "RETURN_NOT_ESCALATED"

        escalated = admin_post(client, tokens, created["id"], "escalate", {"reason": "La empresa está suspendida."})
        assert escalated.status_code == 200
        assert escalated.json()["status"] == "under_review"

        decided = admin_post(client, tokens, created["id"], "decision",
                             {"action": "approve", "subject": "Reembolso aprobado",
                              "message": "La empresa está suspendida; Rehni Market reembolsa el producto."},
                             role="owner")
        assert decided.status_code == 200
        body = decided.json()
        assert body["status"] == "approved"
        assert body["decidedBy"] == "admin"
        assert body["refundTransactionId"] is not None
        assert [e["type"] for e in body["events"]][-3:] == ["escalated", "admin_approved", "refunded"]
        assert {n["kind"] for n in body["notifications"]} >= {"decision", "admin_decision"}
        assert len(refunds_for(db, created["id"])) == 1

        twice = admin_post(client, tokens, created["id"], "decision",
                           {"action": "approve", "subject": "Reembolso aprobado", "message": "Otra vez lo mismo."})
        assert twice.status_code == 409
        assert len(refunds_for(db, created["id"])) == 1

    def test_admin_rejection_after_review_keeps_company_decision_and_closes(self, client, tokens, db, rejected_claim):
        _, rejected = rejected_claim
        client.post(f"/returns/{rejected['id']}/review", json={"reason": "No estoy de acuerdo."}, headers=auth(tokens["user"]))

        decided = admin_post(client, tokens, rejected["id"], "decision",
                             {"action": "reject", "subject": "Revisión finalizada", "message": "Confirmamos el rechazo."})

        body = decided.json()
        assert body["status"] == "rejected"
        assert body["companyResponse"] == "El producto tiene señales de mal uso."
        assert body["adminResponse"] == "Confirmamos el rechazo."
        assert body["canRequestReview"] is False
        assert refunds_for(db, rejected["id"]) == []

    def test_contact_email_and_calls_are_recorded_and_hidden_where_private(self, client, tokens, db, company, claim, outbox):
        _, created = claim
        without_contact = admin_post(client, tokens, created["id"], "contact",
                                     {"subject": "Reclamación pendiente", "message": "Por favor revisa la solicitud."})
        assert without_contact.status_code == 422
        assert without_contact.json()["detail"]["code"] == "RETURN_CONTACT_UNAVAILABLE"

        representative = admin_post(client, tokens, created["id"], "contact",
                                    {"channel": "representative_account", "subject": "Reclamación pendiente",
                                     "message": "Por favor revisa la solicitud <b>hoy</b>."})
        assert representative.status_code == 200
        mail = representative.json()["notifications"][-1]
        assert (mail["kind"], mail["recipientEmail"], mail["status"]) == ("admin_contact", "company@test.local", "accepted")
        stored = db.get(ReturnNotification, UUID(mail["id"]))
        assert "&lt;b&gt;hoy&lt;/b&gt;" in stored.body_html

        company.contact_email = "soporte@testco.local"
        db.commit()
        business = admin_post(client, tokens, created["id"], "contact",
                              {"subject": "Segundo aviso", "message": "Seguimos esperando tu respuesta."})
        assert business.json()["notifications"][-1]["recipientEmail"] == "soporte@testco.local"
        assert business.json()["company"]["contactEmail"] == "soporte@testco.local"
        assert business.json()["company"]["representativeEmail"] == "company@test.local"

        call = admin_post(client, tokens, created["id"], "calls",
                          {"calledAt": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
                           "outcome": "no_answer", "notes": "Nadie contestó en el teléfono de contacto."})
        assert call.status_code == 200
        assert call.json()["events"][-1]["callOutcome"] == "no_answer"

        future = admin_post(client, tokens, created["id"], "calls",
                            {"calledAt": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
                             "outcome": "contacted", "notes": "Llamada que aún no ocurrió."})
        assert future.status_code == 400

        buyer_view = client.get(f"/returns/{created['id']}", headers=auth(tokens["user"])).json()
        assert [e["type"] for e in buyer_view["events"]] == ["requested"]
        company_view = client.get(f"/company/dashboard/returns/{created['id']}", headers=auth(tokens["company"])).json()
        assert "admin_call" not in [e["type"] for e in company_view["events"]]
        assert "admin_email" in [e["type"] for e in company_view["events"]]

    def test_list_filters_by_status_and_search(self, client, tokens, claim):
        order, created = claim
        listed = client.get("/admin/dashboard/returns", params={"status": "pending", "search": "Test Co"},
                            headers=auth(tokens["owner"])).json()
        assert [item["id"] for item in listed["items"]] == [created["id"]]
        by_order = client.get("/admin/dashboard/returns", params={"search": order["reference"]},
                              headers=auth(tokens["admin"])).json()
        assert by_order["total"] == 1
        assert client.get("/admin/dashboard/returns", params={"status": "approved"},
                          headers=auth(tokens["admin"])).json()["total"] == 0

    @pytest.mark.parametrize("role", ["user", "company"])
    def test_other_roles_cannot_use_admin_routes(self, client, tokens, claim, role):
        _, created = claim
        assert client.get("/admin/dashboard/returns", headers=auth(tokens[role])).status_code == 403
        assert admin_post(client, tokens, created["id"], "escalate", {"reason": "Intento no autorizado."}, role=role).status_code == 403

    def test_admin_cannot_use_buyer_or_company_routes(self, client, tokens, claim):
        _, created = claim
        assert client.get("/returns", headers=auth(tokens["admin"])).status_code == 403
        assert decide(client, {"company": tokens["admin"]}, created["id"], action="approve").status_code == 403


# ---------------------------------------------------------------- contacto empresarial


class TestBusinessContact:
    def test_store_settings_save_and_clear_business_contact(self, client, tokens, company):
        saved = client.patch("/company/dashboard/upgrade-my-profile",
                             json={"contactEmail": " Soporte@TestCo.local ", "contactPhone": "601 555-1234"},
                             headers=auth(tokens["company"]))
        assert saved.status_code == 200
        profile = client.get("/company/dashboard/my-profile", headers=auth(tokens["company"])).json()
        assert (profile["contactEmail"], profile["contactPhone"]) == ("soporte@testco.local", "6015551234")

        client.patch("/company/dashboard/upgrade-my-profile", json={"contactEmail": "", "contactPhone": ""},
                     headers=auth(tokens["company"]))
        cleared = client.get("/company/dashboard/my-profile", headers=auth(tokens["company"])).json()
        assert (cleared["contactEmail"], cleared["contactPhone"]) == (None, None)

    def test_invalid_business_contact_is_rejected(self, client, tokens, company):
        assert client.patch("/company/dashboard/upgrade-my-profile", json={"contactEmail": "no-es-correo"},
                            headers=auth(tokens["company"])).status_code == 422
        assert client.patch("/company/dashboard/upgrade-my-profile", json={"contactPhone": "12"},
                            headers=auth(tokens["company"])).status_code == 422

    def test_business_contact_is_not_public(self, client, company):
        public = client.get(f"/public/company/{company.id}")
        assert "contactEmail" not in public.text and "contact_email" not in public.text


def test_events_are_append_only_history(client, tokens, db, rejected_claim):
    _, rejected = rejected_claim
    events = db.query(ReturnRequestEvent).filter(ReturnRequestEvent.return_request_id == UUID(rejected["id"])).all()
    assert {event.actor_role for event in events} == {"user", "company"}
    assert all(event.created_at is not None for event in events)
    assert db.query(Order).count() == 1
