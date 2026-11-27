"""Cierre mensual de liquidaciones y plazo de consignación: festivos de Colombia, quinto día hábil,
meses por generar en el listado del owner, filtros, paginación, duplicados y permisos."""

import uuid
from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.exc import IntegrityError

from app.core import BusinessCalendar
from app.core.PayoutConfig import COMMISSION_PERCENTAGE
from app.models.ModelCompanyPayout import CompanyPayout, PayoutStatusEnum
from app.models.ModelOrder import OrderStatusEnum
from app.services import PayoutService
from tests.conftest import auth
from tests.factories import make_bank_account, make_company, make_user, place_order, silence_emails, utc

SEPT = {"periodStart": "2026-09-01", "periodEnd": "2026-09-30"}

# Calendarios oficiales publicados para Colombia (Ley 51 de 1983), usados como referencia externa.
OFFICIAL_HOLIDAYS = {
    2024: [
        "2024-01-01", "2024-01-08", "2024-03-25", "2024-03-28", "2024-03-29", "2024-05-01",
        "2024-05-13", "2024-06-03", "2024-06-10", "2024-07-01", "2024-07-20", "2024-08-07",
        "2024-08-19", "2024-10-14", "2024-11-04", "2024-11-11", "2024-12-08", "2024-12-25",
    ],
    2025: [
        "2025-01-01", "2025-01-06", "2025-03-24", "2025-04-17", "2025-04-18", "2025-05-01",
        "2025-06-02", "2025-06-23", "2025-06-30", "2025-07-20", "2025-08-07", "2025-08-18",
        "2025-10-13", "2025-11-03", "2025-11-17", "2025-12-08", "2025-12-25",
    ],
    2026: [
        "2026-01-01", "2026-01-12", "2026-03-23", "2026-04-02", "2026-04-03", "2026-05-01",
        "2026-05-18", "2026-06-08", "2026-06-15", "2026-06-29", "2026-07-20", "2026-08-07",
        "2026-08-17", "2026-10-12", "2026-11-02", "2026-11-16", "2026-12-08", "2026-12-25",
    ],
}


@pytest.fixture(autouse=True)
def _silence(monkeypatch):
    silence_emails(monkeypatch)


@pytest.fixture()
def today(monkeypatch):
    def _set(value: date):
        monkeypatch.setattr(BusinessCalendar, "today_bogota", lambda: value)

    _set(date(2026, 10, 1))
    return _set


@pytest.fixture()
def bank_account(db, company):
    return make_bank_account(db, company)


@pytest.fixture()
def delivered_sept(client, tokens, db, product, address, buyer_wallet):
    return [
        place_order(client, tokens["user"], db, product, address, 2, OrderStatusEnum.DELIVERED, utc(2026, 9, 5)),
        place_order(client, tokens["user"], db, product, address, 1, OrderStatusEnum.DELIVERED, utc(2026, 9, 28)),
        place_order(client, tokens["user"], db, product, address, 3, OrderStatusEnum.CANCELLED, utc(2026, 9, 10)),
    ]


def listing(client, token, **params):
    return client.get("/admin/payouts", params=params, headers=auth(token))


def generate(client, token, company_id, period=SEPT):
    return client.post("/admin/payouts/generate", json={"companyId": str(company_id), **period}, headers=auth(token))


def add_payout(db, company, bank_account, year, month, status, net="100.00"):
    period_start, period_end = PayoutService._month_period(date(year, month, 1))
    payout = CompanyPayout(
        company_id=company.id,
        period_start=period_start,
        period_end=period_end,
        gross_sales=Decimal(net),
        commission_percentage=COMMISSION_PERCENTAGE,
        commission_amount=Decimal("0"),
        net_amount=Decimal(net),
        payout_status=status,
        bank_account_id=bank_account.id,
    )
    db.add(payout)
    db.commit()
    return payout


class TestColombianCalendar:
    @pytest.mark.parametrize("year", sorted(OFFICIAL_HOLIDAYS))
    def test_holidays_match_the_official_calendar(self, year):
        expected = {date.fromisoformat(day) for day in OFFICIAL_HOLIDAYS[year]}
        assert BusinessCalendar.colombian_holidays(year) == expected

    def test_weekends_and_holidays_are_not_business_days(self):
        assert not BusinessCalendar.is_business_day(date(2026, 10, 3))
        assert not BusinessCalendar.is_business_day(date(2026, 10, 4))
        assert not BusinessCalendar.is_business_day(date(2026, 11, 2))
        assert BusinessCalendar.is_business_day(date(2026, 11, 3))


class TestDeadline:
    @pytest.mark.parametrize(
        "month_start, period_end, deadline",
        [
            (date(2026, 9, 1), date(2026, 9, 30), date(2026, 10, 7)),
            (date(2026, 10, 1), date(2026, 10, 31), date(2026, 11, 9)),
            (date(2026, 2, 1), date(2026, 2, 28), date(2026, 3, 6)),
            (date(2024, 2, 1), date(2024, 2, 29), date(2024, 3, 7)),
            (date(2028, 2, 1), date(2028, 2, 29), date(2028, 3, 7)),
            (date(2025, 12, 1), date(2025, 12, 31), date(2026, 1, 8)),
            (date(2024, 3, 1), date(2024, 3, 31), date(2024, 4, 5)),
        ],
        ids=["30-dias", "31-dias-festivo", "febrero", "bisiesto-2024", "bisiesto-2028", "fin-de-ano", "semana-santa"],
    )
    def test_fifth_business_day_after_the_month_closes(self, month_start, period_end, deadline):
        assert PayoutService._month_period(month_start) == (month_start, period_end)
        assert PayoutService.consignment_deadline(period_end) == deadline


class TestMonthClosure:
    def test_open_month_is_not_listed_nor_liquidable(self, client, tokens, db, company, bank_account, delivered_sept, today):
        today(date(2026, 9, 30))

        assert listing(client, tokens["owner"]).json()["total"] == 0
        periods = client.get(
            "/admin/payouts/available-periods", params={"company_id": str(company.id)}, headers=auth(tokens["owner"])
        ).json()
        assert periods == []
        response = generate(client, tokens["owner"], company.id)
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "PAYOUT_INVALID_PERIOD"
        assert db.query(CompanyPayout).count() == 0

    def test_closed_month_appears_without_generating_and_creates_nothing(
        self, client, tokens, db, company, bank_account, delivered_sept, today
    ):
        first = listing(client, tokens["owner"]).json()
        second = listing(client, tokens["owner"]).json()

        assert first == second
        assert first["total"] == 1
        item = first["items"][0]
        gross = sum(Decimal(o["total"]) for o in delivered_sept[:2])
        commission = (gross * COMMISSION_PERCENTAGE).quantize(Decimal("0.01"))
        assert item["id"] is None and item["isGenerated"] is False
        assert item["companyName"] == company.nameCompany
        assert (item["periodStart"], item["periodEnd"]) == ("2026-09-01", "2026-09-30")
        assert Decimal(item["netAmount"]) == gross - commission
        assert item["payoutStatus"] == "pending"
        assert item["consignmentDeadline"] == "2026-10-07"
        assert item["isOverdue"] is False
        assert item["bankAccount"]["lastFourDigits"] == bank_account.account_number[-4:]
        assert db.query(CompanyPayout).count() == 0

    def test_overdue_is_only_an_indicator(self, client, tokens, company, bank_account, delivered_sept, today):
        today(date(2026, 10, 7))
        assert listing(client, tokens["owner"]).json()["items"][0]["isOverdue"] is False

        today(date(2026, 10, 8))
        item = listing(client, tokens["owner"]).json()["items"][0]
        assert item["isOverdue"] is True
        assert item["payoutStatus"] == "pending"

    def test_company_without_delivered_sales_is_not_listed(
        self, client, tokens, db, product, address, buyer_wallet, company, bank_account, today
    ):
        place_order(client, tokens["user"], db, product, address, 1, OrderStatusEnum.CANCELLED, utc(2026, 9, 5))
        assert listing(client, tokens["owner"]).json()["total"] == 0

    def test_missing_bank_account_keeps_the_obligation(self, client, tokens, db, company, delivered_sept, today):
        item = listing(client, tokens["owner"]).json()["items"][0]

        assert item["bankAccount"] is None
        assert item["isGenerated"] is False
        assert generate(client, tokens["owner"], company.id).json()["detail"]["code"] == "PAYOUT_NO_BANK_ACCOUNT"
        assert db.query(CompanyPayout).count() == 0

    def test_generating_replaces_the_estimate_without_duplicating(
        self, client, tokens, db, company, bank_account, delivered_sept, today
    ):
        estimate = listing(client, tokens["owner"]).json()["items"][0]
        generated = generate(client, tokens["owner"], company.id).json()

        after = listing(client, tokens["owner"]).json()
        assert after["total"] == 1
        assert after["items"][0]["id"] == generated["id"]
        assert after["items"][0]["isGenerated"] is True
        assert after["items"][0]["consignmentDeadline"] == estimate["consignmentDeadline"]
        for field in ("grossSales", "refundsAmount", "commissionAmount", "netAmount"):
            assert Decimal(after["items"][0][field]) == Decimal(estimate[field])

    def test_estimate_discounts_approved_refunds_like_the_generation(
        self, client, tokens, db, company, bank_account, product, address, buyer_wallet, today
    ):
        order = place_order(client, tokens["user"], db, product, address, 2, OrderStatusEnum.DELIVERED, utc(2026, 9, 5))
        requested = client.post(
            f"/orders/{order['id']}/returns",
            json={"orderItemId": order["items"][0]["id"], "reason": "Llegó defectuoso y no enciende"},
            headers=auth(tokens["user"]),
        ).json()
        approved = client.patch(
            f"/company/dashboard/returns/{requested['id']}", json={"action": "approve"}, headers=auth(tokens["company"])
        ).json()

        estimate = listing(client, tokens["owner"]).json()["items"][0]
        generated = generate(client, tokens["owner"], company.id).json()

        assert Decimal(estimate["refundsAmount"]) == Decimal(approved["refundAmount"]) > 0
        assert Decimal(estimate["grossSales"]) == Decimal(order["total"]) - Decimal(approved["refundAmount"])
        assert Decimal(estimate["netAmount"]) == Decimal(generated["netAmount"])

    def test_paid_payout_leaves_pending_and_is_never_overdue(
        self, client, tokens, company, bank_account, delivered_sept, today
    ):
        payout = generate(client, tokens["owner"], company.id).json()
        client.patch(f"/admin/payouts/{payout['id']}/pay", headers=auth(tokens["owner"]))
        today(date(2026, 12, 1))

        assert listing(client, tokens["owner"], status="pending").json()["total"] == 0
        paid = listing(client, tokens["owner"], status="paid").json()["items"]
        assert [p["id"] for p in paid] == [payout["id"]]
        assert paid[0]["isOverdue"] is False

    def test_concurrent_generation_returns_409_instead_of_500(
        self, client, tokens, db, company, bank_account, delivered_sept, today, monkeypatch
    ):
        def _lost_race(database, payout):
            raise IntegrityError("INSERT", {}, Exception("uq_payout_company_period"))

        monkeypatch.setattr(PayoutService.repo, "create_payout", _lost_race)

        response = generate(client, tokens["owner"], company.id)

        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "PAYOUT_ALREADY_EXISTS"


class TestListingOrderAndPagination:
    @pytest.fixture()
    def mixed(self, db, company, bank_account, delivered_sept, today):
        """12 liquidaciones generadas de 2025 (estados mezclados) más septiembre de 2026 por generar."""
        today(date(2026, 10, 20))
        statuses = [PayoutStatusEnum.PAID] * 8 + [
            PayoutStatusEnum.PENDING,
            PayoutStatusEnum.PROCESSING,
            PayoutStatusEnum.FAILED,
            PayoutStatusEnum.PENDING,
        ]
        return [add_payout(db, company, bank_account, 2025, month, status) for month, status in enumerate(statuses, 1)]

    def test_ten_per_page_without_gaps_or_duplicates(self, client, tokens, mixed):
        first = listing(client, tokens["owner"], page=1, limit=10).json()
        second = listing(client, tokens["owner"], page=2, limit=10).json()

        assert (first["total"], first["total_pages"]) == (13, 2)
        assert (len(first["items"]), len(second["items"])) == (10, 3)
        keys = [(i["periodStart"], i["isGenerated"]) for i in first["items"] + second["items"]]
        assert len(set(keys)) == 13

    def test_unpaid_by_nearest_deadline_then_paid_most_recent_first(self, client, tokens, mixed):
        items = listing(client, tokens["owner"], limit=50).json()["items"]

        unpaid = [i["periodStart"] for i in items[:5]]
        assert unpaid == ["2025-09-01", "2025-10-01", "2025-11-01", "2025-12-01", "2026-09-01"]
        assert all(i["isOverdue"] for i in items[:4])
        assert items[4]["isGenerated"] is False and items[4]["isOverdue"] is True
        paid = [i["periodStart"] for i in items[5:]]
        assert paid == sorted(paid, reverse=True)
        assert {i["payoutStatus"] for i in items[5:]} == {"paid"}

    @pytest.mark.parametrize(
        "status, expected", [("pending", 3), ("processing", 1), ("paid", 8), ("failed", 1)]
    )
    def test_filters_count_pending_generation_only_as_pending(self, client, tokens, mixed, status, expected):
        body = listing(client, tokens["owner"], status=status).json()

        assert body["total"] == expected
        assert {i["payoutStatus"] for i in body["items"]} == {status}

    def test_historical_payout_of_an_open_month_stays_visible(self, client, tokens, db, company, bank_account, today):
        legacy = add_payout(db, company, bank_account, 2026, 10, PayoutStatusEnum.PENDING)
        today(date(2026, 10, 15))

        items = listing(client, tokens["owner"]).json()["items"]
        detail = client.get(f"/admin/payouts/{legacy.id}", headers=auth(tokens["owner"])).json()

        assert [i["id"] for i in items] == [str(legacy.id)]
        assert detail["consignmentDeadline"] == "2026-11-09"
        assert Decimal(detail["netAmount"]) == legacy.net_amount


class TestPermissions:
    @pytest.mark.parametrize("role", ["user", "company", "admin"])
    def test_only_the_owner_sees_the_listing(self, client, tokens, role):
        response = listing(client, tokens[role])
        assert response.status_code == 403

    def test_company_without_sales_gets_no_fictitious_obligation(
        self, client, tokens, db, company, bank_account, delivered_sept, today
    ):
        owner, _ = make_user(db, "company", "empresa.dos@test.local")
        make_company(db, owner, "Segunda Co", "800197268")

        items = listing(client, tokens["owner"]).json()["items"]

        assert [i["companyId"] for i in items] == [str(company.id)]

    def test_unknown_payout_cannot_be_paid(self, client, tokens):
        assert client.patch(f"/admin/payouts/{uuid.uuid4()}/pay", headers=auth(tokens["owner"])).status_code == 404
