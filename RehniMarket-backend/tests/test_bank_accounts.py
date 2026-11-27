"""Contrato de /company/bank-accounts (BankAccountRouter + BankAccountService): banco del catálogo,
número enmascarado, cuenta principal (también con peticiones simultáneas) y aislamiento entre empresas."""

import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.orm import sessionmaker

from app.models.ModelBank import Bank, normalize_bank_name
from app.models.ModelCompanyBankAccount import CompanyBankAccount
from app.models.ModelCompanyPayout import CompanyPayout, PayoutStatusEnum
from tests.conftest import auth
from tests.factories import VALID_BANK_ACCOUNT, make_company, make_user

URL = "/company/bank-accounts"
NEW_ACCOUNT = {key: value for key, value in VALID_BANK_ACCOUNT.items() if key != "bankName"}


def _bank(db, name: str, active: bool = True) -> Bank:
    bank = Bank(name=name, normalized_name=normalize_bank_name(name), is_active=active, logo=None)
    db.add(bank)
    db.commit()
    db.refresh(bank)
    return bank


@pytest.fixture(autouse=True)
def banks(db):
    return {name: _bank(db, name) for name in ("Bancolombia", "Nequi", "Davivienda")}


@pytest.fixture()
def create(client, banks):
    """Registra una cuenta por la API; por defecto en Bancolombia."""

    def _create(token, bank: Bank | None = None, **overrides):
        bank_id = str((bank or banks["Bancolombia"]).id)
        return client.post(URL, json={**NEW_ACCOUNT, "bankId": bank_id, **overrides}, headers=auth(token))

    return _create


def listed(client, token):
    return {a["id"]: a["isDefault"] for a in client.get(URL, headers=auth(token)).json()}


@pytest.fixture()
def other_company(db):
    owner, token = make_user(db, "company", "empresa.dos@test.local")
    return make_company(db, owner, "Segunda Co", "800197268"), token


class TestAuthorization:
    def test_requires_token(self, create, client):
        assert client.get(URL).status_code == 401

    def test_buyer_is_forbidden(self, create, client, tokens):
        response = client.get(URL, headers=auth(tokens["user"]))
        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "FORBIDDEN"

    def test_company_user_without_company_gets_404(self, client, db):
        _, token = make_user(db, "company", "sin.empresa@test.local")
        response = client.get(URL, headers=auth(token))
        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "COMPANY_NOT_FOUND"


class TestCreateAndList:
    def test_first_account_becomes_default_with_masked_number(self, create, client, tokens, company, banks):
        response = create(tokens["company"])

        assert response.status_code == 200
        body = response.json()
        assert body["isDefault"] is True
        assert body["accountType"] == "savings"
        assert body["bankId"] == str(banks["Bancolombia"].id)
        assert body["bankName"] == "Bancolombia"
        assert body["bankLogoUrl"] is None
        assert body["lastFourDigits"] == VALID_BANK_ACCOUNT["accountNumber"][-4:]
        assert set(body) == {
            "id", "accountHolder", "documentNumber", "bankId", "bankName", "bankLogoUrl", "accountType",
            "lastFourDigits", "isDefault", "createdAt", "updatedAt",
        }

    def test_full_number_never_appears_in_list_or_responses(self, create, client, tokens, company):
        created = create(tokens["company"]).text
        listed_body = client.get(URL, headers=auth(tokens["company"])).text

        assert VALID_BANK_ACCOUNT["accountNumber"] not in created
        assert VALID_BANK_ACCOUNT["accountNumber"] not in listed_body

    def test_number_is_stored_complete_for_payouts(self, create, client, tokens, company, db):
        account = create(tokens["company"]).json()
        stored = db.get(CompanyBankAccount, uuid.UUID(account["id"]))
        assert stored.account_number == VALID_BANK_ACCOUNT["accountNumber"]

    def test_unknown_bank_is_rejected(self, create, client, tokens, company):
        response = client.post(
            URL, json={**NEW_ACCOUNT, "bankId": str(uuid.uuid4())}, headers=auth(tokens["company"])
        )
        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "BANK_NOT_FOUND"

    def test_inactive_bank_cannot_be_selected(self, create, client, tokens, company, db):
        closed = _bank(db, "Banco Cerrado", active=False)
        response = create(tokens["company"], bank=closed)
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "BANK_INACTIVE"

    def test_available_banks_lists_only_active_ones(self, create, client, tokens, company, db):
        _bank(db, "Banco Cerrado", active=False)
        names = [b["name"] for b in client.get(f"{URL}/banks", headers=auth(tokens["company"])).json()]
        assert names == ["Bancolombia", "Davivienda", "Nequi"]

    def test_buyer_cannot_list_banks(self, create, client, tokens):
        assert client.get(f"{URL}/banks", headers=auth(tokens["user"])).status_code == 403

    def test_new_default_replaces_the_previous_one(self, create, client, tokens, company, banks):
        first = create(tokens["company"]).json()
        second = create(tokens["company"], bank=banks["Nequi"], accountType="nequi", isDefault=True).json()

        assert listed(client, tokens["company"]) == {first["id"]: False, second["id"]: True}

    def test_list_only_returns_own_accounts(self, create, client, tokens, company, other_company):
        _, other_token = other_company
        create(other_token)

        assert client.get(URL, headers=auth(tokens["company"])).json() == []

    @pytest.mark.parametrize(
        "field,value",
        [("accountType", "bitcoin"), ("accountNumber", "123"), ("documentNumber", "1"), ("bankId", "no-es-uuid")],
    )
    def test_invalid_fields_return_422(self, create, tokens, company, field, value):
        response = create(tokens["company"], **{field: value})
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "VALIDATION_ERROR"


class TestUpdate:
    def test_partial_update_changes_bank_and_keeps_the_number(self, create, client, tokens, company, banks, db):
        account = create(tokens["company"]).json()

        response = client.patch(
            f"{URL}/{account['id']}", json={"bankId": str(banks["Davivienda"].id)}, headers=auth(tokens["company"])
        )

        assert response.status_code == 200
        assert response.json()["bankName"] == "Davivienda"
        assert response.json()["lastFourDigits"] == VALID_BANK_ACCOUNT["accountNumber"][-4:]
        db.expire_all()
        assert db.get(CompanyBankAccount, uuid.UUID(account["id"])).account_number == VALID_BANK_ACCOUNT["accountNumber"]

    def test_new_number_replaces_the_stored_one(self, create, client, tokens, company, db):
        account = create(tokens["company"]).json()

        response = client.patch(
            f"{URL}/{account['id']}", json={"accountNumber": "99887766554"}, headers=auth(tokens["company"])
        )

        assert response.json()["lastFourDigits"] == "6554"
        db.expire_all()
        assert db.get(CompanyBankAccount, uuid.UUID(account["id"])).account_number == "99887766554"

    def test_cannot_switch_to_an_inactive_bank(self, create, client, tokens, company, db):
        account = create(tokens["company"]).json()
        closed = _bank(db, "Banco Cerrado", active=False)

        response = client.patch(
            f"{URL}/{account['id']}", json={"bankId": str(closed.id)}, headers=auth(tokens["company"])
        )

        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "BANK_INACTIVE"

    def test_marking_as_default_clears_the_previous_default(self, create, client, tokens, company, banks):
        first = create(tokens["company"]).json()
        second = create(tokens["company"], bank=banks["Nequi"]).json()

        client.patch(f"{URL}/{second['id']}", json={"isDefault": True}, headers=auth(tokens["company"]))

        assert listed(client, tokens["company"]) == {first["id"]: False, second["id"]: True}

    def test_unsetting_the_only_default_is_ignored(self, create, client, tokens, company):
        # Siempre debe quedar una cuenta predeterminada para las liquidaciones.
        account = create(tokens["company"]).json()

        response = client.patch(
            f"{URL}/{account['id']}", json={"isDefault": False}, headers=auth(tokens["company"])
        )

        assert response.status_code == 200
        assert response.json()["isDefault"] is True

    def test_cannot_update_another_companys_account(self, create, client, tokens, company, other_company):
        _, other_token = other_company
        foreign = create(other_token).json()

        response = client.patch(
            f"{URL}/{foreign['id']}", json={"accountHolder": "Intruso"}, headers=auth(tokens["company"])
        )

        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "BANK_ACCOUNT_NOT_FOUND"


class TestDelete:
    def test_deleting_the_default_promotes_another(self, create, client, tokens, company, banks):
        first = create(tokens["company"]).json()
        second = create(tokens["company"], bank=banks["Nequi"]).json()

        response = client.delete(f"{URL}/{first['id']}", headers=auth(tokens["company"]))

        assert response.status_code == 200
        assert listed(client, tokens["company"]) == {second["id"]: True}

    def test_unknown_account_returns_404(self, client, tokens, company):
        response = client.delete(f"{URL}/{uuid.uuid4()}", headers=auth(tokens["company"]))
        assert response.status_code == 404

    def test_account_with_payouts_cannot_be_deleted(self, create, client, tokens, company, db):
        account = create(tokens["company"]).json()
        db.add(
            CompanyPayout(
                company_id=company.id,
                period_start=date(2026, 9, 1),
                period_end=date(2026, 9, 30),
                gross_sales=Decimal("100000"),
                commission_percentage=Decimal("0.05"),
                commission_amount=Decimal("5000"),
                net_amount=Decimal("95000"),
                payout_status=PayoutStatusEnum.PENDING,
                bank_account_id=uuid.UUID(account["id"]),
            )
        )
        db.commit()

        response = client.delete(f"{URL}/{account['id']}", headers=auth(tokens["company"]))

        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "BANK_ACCOUNT_IN_USE"
        assert db.get(CompanyBankAccount, uuid.UUID(account["id"])) is not None


class TestConcurrentDefault:
    def test_simultaneous_default_changes_leave_exactly_one_default(self, create, engine, client, tokens, company, users, banks):
        from app.schemas.SchemaDashboard.SchemaBankAccount import UpdateBankAccountRequest
        from app.services.DashboardService.company.BankAccountService import update_bank_account_service

        ids = [uuid.UUID(create(tokens["company"], bank=bank).json()["id"]) for bank in banks.values()]
        Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
        user_id = users["company"].id

        def make_default(account_id):
            session = Session()
            try:
                update_bank_account_service(user_id, account_id, UpdateBankAccountRequest(isDefault=True), session)
            finally:
                session.close()

        with ThreadPoolExecutor(max_workers=6) as pool:
            list(pool.map(make_default, ids * 4))

        assert sum(listed(client, tokens["company"]).values()) == 1
