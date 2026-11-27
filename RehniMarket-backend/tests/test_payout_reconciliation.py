"""Conciliación de liquidaciones: cierre de mes a medianoche de Bogotá (incluido febrero bisiesto),
compatibilidad con liquidaciones generadas con la ventana UTC (migración a4c6e8f0b2d4), ventas
rezagadas y devoluciones repartidas igual sin importar el orden en que se generen los meses."""

import importlib.util
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from uuid import UUID

import pytest
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker

from app.core import BusinessCalendar
from app.core.PayoutConfig import COMMISSION_PERCENTAGE
from app.models.ModelCompanyPayout import CompanyPayout, PayoutStatusEnum
from app.models.ModelOrder import Order, OrderStatusEnum
from app.models.ModelReturnRequest import ReturnRequest
from app.schemas.SchemaDashboard.SchemaPayout import GeneratePayoutRequest
from app.services.PayoutService import generate_company_payout_service
from tests.conftest import auth
from tests.factories import make_bank_account, place_order, silence_emails

AUG = {"periodStart": "2026-08-01", "periodEnd": "2026-08-31"}
SEPT = {"periodStart": "2026-09-01", "periodEnd": "2026-09-30"}
OCT = {"periodStart": "2026-10-01", "periodEnd": "2026-10-31"}
MIGRATION = Path(__file__).resolve().parents[1] / "alembic" / "versions" / "a4c6e8f0b2d4_order_payout_link.py"


@pytest.fixture(autouse=True)
def _silence(monkeypatch):
    silence_emails(monkeypatch)


@pytest.fixture()
def today(monkeypatch):
    def _set(value: date):
        monkeypatch.setattr(BusinessCalendar, "today_bogota", lambda: value)

    _set(date(2026, 12, 1))
    return _set


@pytest.fixture()
def bank_account(db, company):
    return make_bank_account(db, company)


@pytest.fixture()
def sell(client, tokens, db, product, address, buyer_wallet):
    def _sell(moment: datetime, quantity: int = 1, status=OrderStatusEnum.DELIVERED):
        return place_order(client, tokens["user"], db, product, address, quantity, status, moment)

    return _sell


def at(year, month, day, hour, minute=0):
    return datetime(year, month, day, hour, minute, tzinfo=timezone.utc)


def total(*orders) -> Decimal:
    return sum((Decimal(o["total"]) for o in orders), Decimal("0"))


def generate(client, tokens, company_id, period):
    return client.post(
        "/admin/payouts/generate", json={"companyId": str(company_id), **period}, headers=auth(tokens["owner"])
    )


def pending_by_month(client, tokens) -> dict[str, dict]:
    items = client.get("/admin/payouts", params={"status": "pending", "limit": 50}, headers=auth(tokens["owner"]))
    return {i["periodStart"]: i for i in items.json()["items"] if not i["isGenerated"]}


def approve_return(client, tokens, order) -> Decimal:
    requested = client.post(
        f"/orders/{order['id']}/returns",
        json={"orderItemId": order["items"][0]["id"], "reason": "Llegó defectuoso y no enciende"},
        headers=auth(tokens["user"]),
    )
    assert requested.status_code == 200, requested.text
    approved = client.patch(
        f"/company/dashboard/returns/{requested.json()['id']}", json={"action": "approve"}, headers=auth(tokens["company"])
    )
    assert approved.status_code == 200, approved.text
    return Decimal(approved.json()["refundAmount"])


def linked_orders(db, payout_id) -> set[str]:
    db.expire_all()
    return {str(o.id) for o in db.query(Order).filter(Order.payout_id == UUID(payout_id))}


def assert_same_amounts(estimate, generated):
    for field in ("grossSales", "refundsAmount", "commissionAmount", "netAmount"):
        assert Decimal(estimate[field]) == Decimal(generated[field]), field


def legacy_payout(db, company, bank_account, period, sales: Decimal) -> CompanyPayout:
    """Liquidación como la dejó el código anterior (ventana UTC), sin enlaces en los pedidos."""
    commission = (sales * COMMISSION_PERCENTAGE).quantize(Decimal("0.01"))
    payout = CompanyPayout(
        company_id=company.id,
        period_start=date.fromisoformat(period["periodStart"]),
        period_end=date.fromisoformat(period["periodEnd"]),
        gross_sales=sales,
        commission_percentage=COMMISSION_PERCENTAGE,
        commission_amount=commission,
        net_amount=sales - commission,
        payout_status=PayoutStatusEnum.PAID,
        bank_account_id=bank_account.id,
    )
    db.add(payout)
    db.commit()
    return payout


def run_backfill(db):
    spec = importlib.util.spec_from_file_location("order_payout_link", MIGRATION)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    db.execute(text(migration.BACKFILL_SQL))
    db.commit()


class TestBogotaMonthBoundaries:
    def test_sales_near_midnight_fall_in_the_colombian_month(
        self, client, tokens, db, company, bank_account, sell, today
    ):
        aug_last_minute = sell(at(2026, 9, 1, 4, 59))
        sept_first_minute = sell(at(2026, 9, 1, 5, 0))
        sept_last_minute = sell(at(2026, 10, 1, 4, 59))
        oct_first_minute = sell(at(2026, 10, 1, 5, 0))

        pending = pending_by_month(client, tokens)

        assert Decimal(pending["2026-08-01"]["grossSales"]) == total(aug_last_minute)
        assert Decimal(pending["2026-09-01"]["grossSales"]) == total(sept_first_minute, sept_last_minute)
        assert Decimal(pending["2026-10-01"]["grossSales"]) == total(oct_first_minute)

        generated = generate(client, tokens, company.id, SEPT).json()

        assert_same_amounts(pending["2026-09-01"], generated)
        assert linked_orders(db, generated["id"]) == {sept_first_minute["id"], sept_last_minute["id"]}
        after = pending_by_month(client, tokens)
        assert set(after) == {"2026-08-01", "2026-10-01"}
        assert_same_amounts(pending["2026-08-01"], after["2026-08-01"])
        assert_same_amounts(pending["2026-10-01"], after["2026-10-01"])

    def test_leap_february_closes_at_bogota_midnight_of_the_29th(
        self, client, tokens, db, company, bank_account, sell, today
    ):
        today(date(2028, 3, 1))
        feb_29_night = sell(at(2028, 3, 1, 4, 30))
        march_first = sell(at(2028, 3, 1, 5, 0))

        pending = pending_by_month(client, tokens)

        assert set(pending) == {"2028-02-01"}
        assert pending["2028-02-01"]["periodEnd"] == "2028-02-29"
        assert Decimal(pending["2028-02-01"]["grossSales"]) == total(feb_29_night)
        assert pending["2028-02-01"]["consignmentDeadline"] == "2028-03-07"

        today(date(2028, 4, 1))
        assert Decimal(pending_by_month(client, tokens)["2028-03-01"]["grossSales"]) == total(march_first)

    def test_year_end_sale_at_night_belongs_to_december(self, client, tokens, company, bank_account, sell, today):
        today(date(2026, 2, 1))
        new_year_eve = sell(at(2026, 1, 1, 4, 0))

        pending = pending_by_month(client, tokens)

        assert set(pending) == {"2025-12-01"}
        assert Decimal(pending["2025-12-01"]["grossSales"]) == total(new_year_eve)

    def test_open_month_still_cannot_be_liquidated(self, client, tokens, company, bank_account, sell, today):
        today(date(2026, 9, 30))
        sell(at(2026, 9, 10, 12))

        response = generate(client, tokens, company.id, SEPT)

        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "PAYOUT_INVALID_PERIOD"


class TestLegacyPayouts:
    def test_backfill_keeps_what_the_utc_window_paid_and_the_rest_is_paid_once_later(
        self, client, tokens, db, company, bank_account, sell, today
    ):
        sept_day = sell(at(2026, 9, 10, 12))
        sept_night = sell(at(2026, 10, 1, 3, 0))  # 30 sep 22:00 en Bogotá, 1 oct en UTC
        october = sell(at(2026, 10, 15, 12))
        legacy = legacy_payout(db, company, bank_account, SEPT, total(sept_day))

        run_backfill(db)

        assert linked_orders(db, str(legacy.id)) == {sept_day["id"]}
        estimate = pending_by_month(client, tokens)["2026-10-01"]
        assert Decimal(estimate["grossSales"]) == total(sept_night, october)

        generated = generate(client, tokens, company.id, OCT).json()

        assert_same_amounts(estimate, generated)
        assert linked_orders(db, generated["id"]) == {sept_night["id"], october["id"]}
        assert pending_by_month(client, tokens) == {}
        db.expire_all()
        historic = db.get(CompanyPayout, legacy.id)
        assert (historic.gross_sales, historic.payout_status) == (total(sept_day), PayoutStatusEnum.PAID)

    def test_sale_paid_by_a_legacy_later_month_is_not_paid_again(
        self, client, tokens, db, company, bank_account, sell, today
    ):
        sept_day = sell(at(2026, 9, 10, 12))
        sept_night = sell(at(2026, 10, 1, 3, 0))
        legacy_oct = legacy_payout(db, company, bank_account, OCT, total(sept_night))

        run_backfill(db)

        assert linked_orders(db, str(legacy_oct.id)) == {sept_night["id"]}
        estimate = pending_by_month(client, tokens)["2026-09-01"]
        assert Decimal(estimate["grossSales"]) == total(sept_day)
        assert_same_amounts(estimate, generate(client, tokens, company.id, SEPT).json())

    def test_backfill_is_idempotent_and_prefers_the_first_overlapping_payout(
        self, db, company, bank_account, sell
    ):
        order = sell(at(2026, 9, 20, 12))
        first = legacy_payout(db, company, bank_account, SEPT, total(order))
        db.add(CompanyPayout(
            company_id=company.id, period_start=date(2026, 9, 15), period_end=date(2026, 10, 15),
            gross_sales=Decimal("0"), commission_percentage=COMMISSION_PERCENTAGE, commission_amount=Decimal("0"),
            net_amount=Decimal("0"), payout_status=PayoutStatusEnum.PENDING, bank_account_id=bank_account.id,
            created_at=datetime(2030, 1, 1, tzinfo=timezone.utc),
        ))
        db.commit()

        run_backfill(db)
        run_backfill(db)

        assert linked_orders(db, str(first.id)) == {order["id"]}

    def test_sale_delivered_after_its_month_was_liquidated_is_paid_in_the_next_one(
        self, client, tokens, db, company, bank_account, sell, today
    ):
        delivered = sell(at(2026, 9, 5, 12))
        late = sell(at(2026, 9, 25, 12), status=OrderStatusEnum.SHIPPED)
        sept = generate(client, tokens, company.id, SEPT).json()
        assert Decimal(sept["grossSales"]) == total(delivered)

        db.query(Order).filter(Order.id == UUID(late["id"])).update({"status": OrderStatusEnum.DELIVERED})
        db.commit()
        october = sell(at(2026, 10, 3, 12))

        estimate = pending_by_month(client, tokens)["2026-10-01"]
        generated = generate(client, tokens, company.id, OCT).json()

        assert Decimal(generated["grossSales"]) == total(late, october)
        assert_same_amounts(estimate, generated)
        assert linked_orders(db, sept["id"]) == {delivered["id"]}


class TestRefundsAcrossPendingMonths:
    def test_generating_a_later_month_first_does_not_take_the_earlier_months_refund(
        self, client, tokens, db, company, bank_account, sell, today
    ):
        september = sell(at(2026, 9, 5, 12), quantity=2)
        october = sell(at(2026, 10, 5, 12), quantity=5)
        refund = approve_return(client, tokens, september)
        before = pending_by_month(client, tokens)
        assert Decimal(before["2026-09-01"]["refundsAmount"]) == refund
        assert Decimal(before["2026-10-01"]["refundsAmount"]) == 0

        oct_payout = generate(client, tokens, company.id, OCT).json()
        sept_estimate_after = pending_by_month(client, tokens)["2026-09-01"]
        sept_payout = generate(client, tokens, company.id, SEPT).json()

        assert_same_amounts(before["2026-10-01"], oct_payout)
        assert_same_amounts(before["2026-09-01"], sept_estimate_after)
        assert_same_amounts(before["2026-09-01"], sept_payout)
        assert Decimal(sept_payout["grossSales"]) == total(september) - refund
        assert Decimal(oct_payout["grossSales"]) == total(october)

    def test_refund_that_does_not_fit_keeps_its_place_whatever_the_generation_order(
        self, client, tokens, db, company, bank_account, sell, today
    ):
        august = sell(at(2026, 8, 5, 12), quantity=5)
        assert generate(client, tokens, company.id, AUG).status_code == 200
        sept_a = sell(at(2026, 9, 5, 12), quantity=1)
        sept_b = sell(at(2026, 9, 6, 12), quantity=1)
        october = sell(at(2026, 10, 5, 12), quantity=5)
        big = approve_return(client, tokens, august)
        small = approve_return(client, tokens, sept_b)
        # Precondiciones del escenario: el grande no cabe en septiembre y los dos no caben en octubre.
        assert big > total(sept_a, sept_b) and big <= total(october) < big + small

        before = pending_by_month(client, tokens)
        assert Decimal(before["2026-09-01"]["refundsAmount"]) == 0
        assert Decimal(before["2026-10-01"]["refundsAmount"]) == big

        oct_payout = generate(client, tokens, company.id, OCT).json()
        sept_payout = generate(client, tokens, company.id, SEPT).json()

        assert_same_amounts(before["2026-10-01"], oct_payout)
        assert_same_amounts(before["2026-09-01"], sept_payout)
        db.expire_all()
        adjustments = {r.id: r.payout_adjustment_id for r in db.query(ReturnRequest)}
        assert sorted(str(v) for v in adjustments.values() if v) == [oct_payout["id"]]
        assert list(adjustments.values()).count(None) == 1, "el reembolso pequeño sigue pendiente, sin duplicarse"

    def test_each_refund_is_discounted_once_in_any_generation_order(
        self, client, tokens, db, company, bank_account, sell, today
    ):
        orders = [sell(at(2026, month, 5, 12), quantity=3) for month in (8, 9, 10)]
        refunds = [approve_return(client, tokens, order) for order in orders]
        before = pending_by_month(client, tokens)

        generated = {
            period["periodStart"]: generate(client, tokens, company.id, period).json()
            for period in (OCT, AUG, SEPT)
        }

        for month, estimate in before.items():
            assert_same_amounts(estimate, generated[month])
        discounted = sum(Decimal(p["refundsAmount"]) for p in generated.values())
        assert discounted == sum(refunds)
        db.expire_all()
        assert all(r.payout_adjustment_id for r in db.query(ReturnRequest))


class TestConcurrentGeneration:
    def test_two_months_generated_at_once_share_nothing(
        self, client, tokens, engine, db, company, bank_account, sell, today
    ):
        september = sell(at(2026, 9, 5, 12), quantity=2)
        october = sell(at(2026, 10, 5, 12), quantity=5)
        refund = approve_return(client, tokens, september)
        before = pending_by_month(client, tokens)
        Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
        barrier = threading.Barrier(2)

        def run(period):
            session = Session()
            try:
                barrier.wait()
                request = GeneratePayoutRequest(companyId=company.id, **period)
                return generate_company_payout_service(request, session).model_dump(mode="json")
            finally:
                session.close()

        with ThreadPoolExecutor(max_workers=2) as pool:
            sept_payout, oct_payout = pool.map(run, [SEPT, OCT])

        assert_same_amounts(before["2026-09-01"], sept_payout)
        assert_same_amounts(before["2026-10-01"], oct_payout)
        assert Decimal(sept_payout["refundsAmount"]) + Decimal(oct_payout["refundsAmount"]) == refund
        assert linked_orders(db, sept_payout["id"]) == {september["id"]}
        assert linked_orders(db, oct_payout["id"]) == {october["id"]}
