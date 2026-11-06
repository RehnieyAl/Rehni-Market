"""Contrato y reglas de dinero de las liquidaciones (AdminPayoutRouter,
CompanyPayoutRouter, PayoutService): comisión, neto, duplicados, estados."""

import uuid
from datetime import date
from decimal import Decimal

import pytest

from app.core.PayoutConfig import COMMISSION_PERCENTAGE
from app.models.ModelCompanyPayout import CompanyPayout, PayoutStatusEnum
from app.models.ModelOrder import OrderStatusEnum
from app.models.ModelRehniCoinMovement import RehniCoinMovement
from tests.conftest import auth
from tests.factories import make_bank_account, make_company, make_user, place_order, silence_emails, utc

SEPT = {"periodStart": "2026-09-01", "periodEnd": "2026-09-30"}


@pytest.fixture(autouse=True)
def _silence(monkeypatch):
    silence_emails(monkeypatch)
    for name in ("EmailReturnRequested", "EmailReturnApproved", "EmailReturnRejected"):
        monkeypatch.setattr(f"app.services.commerce.ReturnService.{name}", lambda *a, **k: None)


@pytest.fixture()
def bank_account(db, company):
    return make_bank_account(db, company)


@pytest.fixture()
def delivered_sept(client, tokens, db, product, address, buyer_wallet):
    """Dos pedidos entregados en septiembre y uno cancelado (no cuenta)."""
    orders = [
        place_order(client, tokens["user"], db, product, address, 2,
                    OrderStatusEnum.DELIVERED, utc(2026, 9, 5)),
        place_order(client, tokens["user"], db, product, address, 1,
                    OrderStatusEnum.DELIVERED, utc(2026, 9, 28)),
        place_order(client, tokens["user"], db, product, address, 3,
                    OrderStatusEnum.CANCELLED, utc(2026, 9, 10)),
    ]
    return orders


def gross_of(orders):
    return sum(Decimal(o["total"]) for o in orders)


def generate(client, token, company_id, period=SEPT):
    return client.post(
        "/admin/payouts/generate", json={"companyId": str(company_id), **period}, headers=auth(token)
    )


class TestAuthorization:
    def test_requires_token(self, client):
        assert client.get("/admin/payouts").status_code == 401

    @pytest.mark.parametrize("role", ["user", "company"])
    def test_non_staff_is_forbidden_by_middleware(self, client, tokens, role):
        response = client.get("/admin/payouts", headers=auth(tokens[role]))
        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "FORBIDDEN"

    def test_admin_is_not_enough_only_owner_manages_payouts(self, client, tokens, company):
        response = generate(client, tokens["admin"], company.id)
        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "FORBIDDEN"

    def test_buyer_cannot_see_company_balance(self, client, tokens):
        assert client.get("/company/balance", headers=auth(tokens["user"])).status_code == 403


class TestPreconditions:
    def test_unknown_company_returns_404(self, client, tokens):
        response = generate(client, tokens["owner"], uuid.uuid4())
        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "COMPANY_NOT_FOUND"

    def test_reversed_period_is_rejected(self, client, tokens, company):
        response = generate(
            client, tokens["owner"], company.id, {"periodStart": "2026-09-30", "periodEnd": "2026-09-01"}
        )
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "VALIDATION_ERROR"

    def test_requires_a_default_bank_account(self, client, tokens, company, delivered_sept):
        response = generate(client, tokens["owner"], company.id)
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "PAYOUT_NO_BANK_ACCOUNT"

    def test_requires_delivered_sales_in_the_period(self, client, tokens, company, bank_account):
        response = generate(client, tokens["owner"], company.id)
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "PAYOUT_NO_VALID_SALES"


class TestGenerate:
    def test_amounts_use_only_delivered_orders_of_the_period(
        self, client, tokens, db, company, bank_account, delivered_sept, product, address
    ):
        # Pedido entregado fuera del periodo: no debe sumar.
        place_order(client, tokens["user"], db, product, address, 1,
                    OrderStatusEnum.DELIVERED, utc(2026, 10, 1, 0))

        response = generate(client, tokens["owner"], company.id)

        assert response.status_code == 200, response.text
        body = response.json()
        gross = gross_of(delivered_sept[:2])
        commission = (gross * COMMISSION_PERCENTAGE).quantize(Decimal("0.01"))
        assert Decimal(body["grossSales"]) == gross
        assert Decimal(body["commissionPercentage"]) == COMMISSION_PERCENTAGE
        assert Decimal(body["commissionAmount"]) == commission
        assert Decimal(body["netAmount"]) == gross - commission
        assert body["payoutStatus"] == "pending"
        assert body["bankAccount"]["lastFourDigits"] == bank_account.account_number[-4:]

    def test_creates_the_rehnicoin_movement_for_the_net_amount(
        self, client, tokens, db, company, bank_account, delivered_sept
    ):
        body = generate(client, tokens["owner"], company.id).json()

        movement = db.query(RehniCoinMovement).filter(
            RehniCoinMovement.payout_id == uuid.UUID(body["id"])
        ).one()
        assert movement.amount_cop == Decimal(body["netAmount"])
        assert Decimal(body["rehniCoinMovement"]["rehniCoins"]) == Decimal(body["netAmount"])

    def test_preview_matches_generation_and_creates_nothing(
        self, client, tokens, db, company, bank_account, delivered_sept
    ):
        preview = client.get(
            "/admin/payouts/preview",
            params={"company_id": str(company.id), "period_start": "2026-09-01", "period_end": "2026-09-30"},
            headers=auth(tokens["owner"]),
        )
        assert preview.status_code == 200
        assert db.query(CompanyPayout).count() == 0

        generated = generate(client, tokens["owner"], company.id).json()
        for field in ("grossSales", "commissionAmount", "netAmount"):
            assert preview.json()[field] == generated[field]

    def test_same_period_twice_is_rejected(self, client, tokens, db, company, bank_account, delivered_sept):
        assert generate(client, tokens["owner"], company.id).status_code == 200

        response = generate(client, tokens["owner"], company.id)

        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "PAYOUT_ALREADY_EXISTS"
        assert db.query(CompanyPayout).count() == 1

    @pytest.mark.xfail(
        strict=True,
        reason="H-07: el duplicado solo se detecta con el periodo exacto; un periodo solapado vuelve a liquidar las mismas ventas",
    )
    def test_overlapping_period_does_not_pay_the_same_sales_twice(
        self, client, tokens, db, company, bank_account, delivered_sept
    ):
        assert generate(client, tokens["owner"], company.id).status_code == 200

        overlap = generate(
            client, tokens["owner"], company.id, {"periodStart": "2026-09-15", "periodEnd": "2026-10-15"}
        )

        paid_twice = db.query(CompanyPayout).count() == 2
        assert overlap.status_code == 409 or not paid_twice

    def test_available_periods_exclude_already_generated_months(
        self, client, tokens, db, company, bank_account, delivered_sept, product, address
    ):
        place_order(client, tokens["user"], db, product, address, 1,
                    OrderStatusEnum.DELIVERED, utc(2026, 10, 3))
        params = {"company_id": str(company.id)}

        before = client.get("/admin/payouts/available-periods", params=params, headers=auth(tokens["owner"])).json()
        generate(client, tokens["owner"], company.id)
        after = client.get("/admin/payouts/available-periods", params=params, headers=auth(tokens["owner"])).json()

        assert {p["periodStart"] for p in before} == {"2026-09-01", "2026-10-01"}
        assert [p["periodStart"] for p in after] == ["2026-10-01"]
        assert after[0]["periodEnd"] == "2026-10-31"

    @pytest.mark.xfail(
        strict=True,
        reason="H-08: una devolución aprobada se reembolsa al comprador pero su importe sigue en las ventas liquidadas a la empresa",
    )
    def test_approved_return_is_not_paid_out_to_the_company(
        self, client, tokens, db, company, bank_account, product, address, buyer_wallet
    ):
        order = place_order(client, tokens["user"], db, product, address, 2,
                            OrderStatusEnum.DELIVERED, utc(2026, 9, 5))
        requested = client.post(
            f"/orders/{order['id']}/returns",
            json={"orderItemId": order["items"][0]["id"], "reason": "Llegó defectuoso y no enciende"},
            headers=auth(tokens["user"]),
        ).json()
        approved = client.patch(
            f"/company/dashboard/returns/{requested['id']}",
            json={"action": "approve"},
            headers=auth(tokens["company"]),
        ).json()
        refunded = Decimal(approved["refundAmount"])
        assert refunded > 0

        body = generate(client, tokens["owner"], company.id).json()

        assert Decimal(body.get("grossSales", "0")) == Decimal(order["total"]) - refunded


class TestPay:
    def test_marks_as_paid_once(self, client, tokens, company, bank_account, delivered_sept):
        payout = generate(client, tokens["owner"], company.id).json()

        paid = client.patch(f"/admin/payouts/{payout['id']}/pay", headers=auth(tokens["owner"]))
        assert paid.status_code == 200
        assert paid.json()["payoutStatus"] == "paid"
        assert paid.json()["paidAt"] is not None

        again = client.patch(f"/admin/payouts/{payout['id']}/pay", headers=auth(tokens["owner"]))
        assert again.status_code == 409
        assert again.json()["detail"]["code"] == "PAYOUT_ALREADY_PAID"

    def test_unknown_payout_returns_404(self, client, tokens):
        response = client.patch(f"/admin/payouts/{uuid.uuid4()}/pay", headers=auth(tokens["owner"]))
        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "PAYOUT_NOT_FOUND"


class TestListing:
    def test_admin_list_filters_by_status(self, client, tokens, company, bank_account, delivered_sept):
        payout = generate(client, tokens["owner"], company.id).json()
        client.patch(f"/admin/payouts/{payout['id']}/pay", headers=auth(tokens["owner"]))

        paid = client.get("/admin/payouts", params={"status": "paid"}, headers=auth(tokens["owner"])).json()
        pending = client.get("/admin/payouts", params={"status": "pending"}, headers=auth(tokens["owner"])).json()

        assert (paid["total"], pending["total"]) == (1, 0)
        assert paid["items"][0]["id"] == payout["id"]

    def test_invalid_status_filter_returns_422(self, client, tokens):
        response = client.get("/admin/payouts", params={"status": "lost"}, headers=auth(tokens["owner"]))
        assert response.status_code == 422

    def test_admin_detail(self, client, tokens, company, bank_account, delivered_sept):
        payout = generate(client, tokens["owner"], company.id).json()
        detail = client.get(f"/admin/payouts/{payout['id']}", headers=auth(tokens["owner"]))
        assert detail.status_code == 200
        assert detail.json()["companyName"] == company.nameCompany


class TestCompanyView:
    def test_company_sees_its_payouts_and_balance(self, client, tokens, company, bank_account, delivered_sept):
        payout = generate(client, tokens["owner"], company.id).json()

        listing = client.get("/company/payouts", headers=auth(tokens["company"])).json()
        assert [p["id"] for p in listing["items"]] == [payout["id"]]

        balance = client.get("/company/balance", headers=auth(tokens["company"])).json()
        assert Decimal(balance["grossSalesAccumulated"]) == Decimal(payout["grossSales"])
        assert Decimal(balance["commissionAccumulated"]) == Decimal(payout["commissionAmount"])
        assert Decimal(balance["netBalance"]) == Decimal(payout["netAmount"])

        client.patch(f"/admin/payouts/{payout['id']}/pay", headers=auth(tokens["owner"]))
        after = client.get("/company/balance", headers=auth(tokens["company"])).json()
        assert Decimal(after["netBalance"]) == 0, "lo pagado sale del saldo pendiente"

    def test_company_cannot_see_another_companys_payout(
        self, client, tokens, db, company, bank_account, delivered_sept
    ):
        payout = generate(client, tokens["owner"], company.id).json()
        owner, other_token = make_user(db, "company", "empresa.dos@test.local")
        make_company(db, owner, "Segunda Co", "800197268")

        response = client.get(f"/company/payouts/{payout['id']}", headers=auth(other_token))

        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "PAYOUT_NOT_FOUND"

    def test_balance_without_payouts_is_zero(self, client, tokens, company):
        body = client.get("/company/balance", headers=auth(tokens["company"])).json()
        assert Decimal(body["netBalance"]) == Decimal(body["grossSalesAccumulated"]) == 0
        assert date.fromisoformat(body["nextPayoutDate"]).day >= 28
