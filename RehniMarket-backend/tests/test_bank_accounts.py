"""Contrato de /company/bank-accounts (BankAccountRouter + BankAccountService)."""

import uuid
from datetime import date
from decimal import Decimal

import pytest

from app.models.ModelCompanyBankAccount import CompanyBankAccount
from app.models.ModelCompanyPayout import CompanyPayout, PayoutStatusEnum
from tests.conftest import auth
from tests.factories import VALID_BANK_ACCOUNT, make_company, make_user

URL = "/company/bank-accounts"


def create(client, token, **overrides):
    return client.post(URL, json={**VALID_BANK_ACCOUNT, **overrides}, headers=auth(token))


def listed(client, token):
    return {a["id"]: a["isDefault"] for a in client.get(URL, headers=auth(token)).json()}


@pytest.fixture()
def other_company(db):
    owner, token = make_user(db, "company", "empresa.dos@test.local")
    return make_company(db, owner, "Segunda Co", "800197268"), token


class TestAuthorization:
    def test_requires_token(self, client):
        assert client.get(URL).status_code == 401

    def test_buyer_is_forbidden(self, client, tokens):
        response = client.get(URL, headers=auth(tokens["user"]))
        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "FORBIDDEN"

    def test_company_user_without_company_gets_404(self, client, db):
        _, token = make_user(db, "company", "sin.empresa@test.local")
        response = client.get(URL, headers=auth(token))
        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "COMPANY_NOT_FOUND"


class TestCreateAndList:
    def test_first_account_becomes_default_with_full_shape(self, client, tokens, company):
        response = create(client, tokens["company"])

        assert response.status_code == 200
        body = response.json()
        assert body["isDefault"] is True
        assert body["accountType"] == "savings"
        assert body["accountNumber"] == VALID_BANK_ACCOUNT["accountNumber"]
        assert set(body) == {
            "id", "accountHolder", "documentNumber", "bankName", "accountType",
            "accountNumber", "isDefault", "createdAt", "updatedAt",
        }

    def test_new_default_replaces_the_previous_one(self, client, tokens, company):
        first = create(client, tokens["company"]).json()
        second = create(client, tokens["company"], bankName="Nequi", accountType="nequi", isDefault=True).json()

        assert listed(client, tokens["company"]) == {first["id"]: False, second["id"]: True}

    def test_list_only_returns_own_accounts(self, client, tokens, company, other_company):
        _, other_token = other_company
        create(client, other_token)

        assert client.get(URL, headers=auth(tokens["company"])).json() == []

    @pytest.mark.parametrize(
        "field,value",
        [("accountType", "bitcoin"), ("accountNumber", "123"), ("documentNumber", "1"), ("bankName", "B")],
    )
    def test_invalid_fields_return_422(self, client, tokens, company, field, value):
        response = create(client, tokens["company"], **{field: value})
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "VALIDATION_ERROR"


class TestUpdate:
    def test_partial_update(self, client, tokens, company):
        account = create(client, tokens["company"]).json()

        response = client.patch(
            f"{URL}/{account['id']}", json={"bankName": "Davivienda"}, headers=auth(tokens["company"])
        )

        assert response.status_code == 200
        assert response.json()["bankName"] == "Davivienda"
        assert response.json()["accountNumber"] == VALID_BANK_ACCOUNT["accountNumber"]

    def test_marking_as_default_clears_the_previous_default(self, client, tokens, company):
        first = create(client, tokens["company"]).json()
        second = create(client, tokens["company"], bankName="Nequi").json()

        client.patch(f"{URL}/{second['id']}", json={"isDefault": True}, headers=auth(tokens["company"]))

        assert listed(client, tokens["company"]) == {first["id"]: False, second["id"]: True}

    def test_unsetting_the_only_default_is_ignored(self, client, tokens, company):
        # Siempre debe quedar una cuenta predeterminada para las liquidaciones.
        account = create(client, tokens["company"]).json()

        response = client.patch(
            f"{URL}/{account['id']}", json={"isDefault": False}, headers=auth(tokens["company"])
        )

        assert response.status_code == 200
        assert response.json()["isDefault"] is True

    def test_cannot_update_another_companys_account(self, client, tokens, company, other_company):
        _, other_token = other_company
        foreign = create(client, other_token).json()

        response = client.patch(
            f"{URL}/{foreign['id']}", json={"bankName": "X Bank"}, headers=auth(tokens["company"])
        )

        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "BANK_ACCOUNT_NOT_FOUND"


class TestDelete:
    def test_deleting_the_default_promotes_another(self, client, tokens, company):
        first = create(client, tokens["company"]).json()
        second = create(client, tokens["company"], bankName="Nequi").json()

        response = client.delete(f"{URL}/{first['id']}", headers=auth(tokens["company"]))

        assert response.status_code == 200
        assert listed(client, tokens["company"]) == {second["id"]: True}

    def test_unknown_account_returns_404(self, client, tokens, company):
        response = client.delete(f"{URL}/{uuid.uuid4()}", headers=auth(tokens["company"]))
        assert response.status_code == 404

    def test_account_with_payouts_cannot_be_deleted(self, client, tokens, company, db):
        account = create(client, tokens["company"]).json()
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
