"""Catálogo de bancos (/admin/dashboard/banks y /company/bank-accounts/banks): permisos, duplicados,
logos en MinIO, activación, enlace de cuentas anteriores al catálogo, liquidaciones y migración d8f0a2c4e6b1."""

import importlib.util
import uuid
from pathlib import Path

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import inspect, text

from app.models.ModelBank import Bank
from app.models.ModelCompanyBankAccount import CompanyBankAccount
from app.services.NasService import get_nas_service
from tests.conftest import auth
from tests.factories import make_bank_account, valid_png, valid_webp

URL = "/admin/dashboard/banks"
MIGRATION = Path(__file__).resolve().parents[1] / "alembic/versions/d8f0a2c4e6b1_banks_catalog.py"


class _RecordingNas:
    def __init__(self):
        self.uploaded = []
        self.deleted = []

    def upload_file(self, file, path: str):
        name = f"{path}{uuid.uuid4()}.png"
        self.uploaded.append(name)
        return {"success": True, "object_name": name, "path": f"uploads/{name}"}

    def delete_file(self, object_name: str):
        self.deleted.append(object_name)
        return {"success": True}


@pytest.fixture()
def nas(client):
    fake = _RecordingNas()
    client.app.dependency_overrides[get_nas_service] = lambda: fake
    yield fake
    client.app.dependency_overrides.pop(get_nas_service, None)


def create_bank(client, token, name="Bancolombia", files=None, **form):
    return client.post(URL, data={"name": name, **form}, files=files, headers=auth(token))


class TestPermissions:
    @pytest.mark.parametrize("role", ["admin", "owner"])
    def test_admin_and_owner_manage_the_catalog(self, client, tokens, nas, role):
        assert create_bank(client, tokens[role], name=f"Banco {role}").status_code == 201
        assert client.get(URL, headers=auth(tokens[role])).status_code == 200

    @pytest.mark.parametrize("role", ["company", "user"])
    def test_company_and_buyer_cannot_touch_the_catalog(self, client, tokens, company, nas, role):
        assert create_bank(client, tokens[role]).status_code == 403
        assert client.get(URL, headers=auth(tokens[role])).status_code == 403
        assert client.patch(f"{URL}/{uuid.uuid4()}", data={"name": "X"}, headers=auth(tokens[role])).status_code == 403

    def test_requires_token(self, client):
        assert client.get(URL).status_code == 401


class TestCreateAndUpdate:
    def test_create_with_logo_stores_the_object_reference(self, client, tokens, nas, db):
        response = create_bank(
            client, tokens["admin"], name="  Banco   de Bogotá ", files={"logo": ("b.png", valid_png(), "image/png")}
        )

        assert response.status_code == 201
        body = response.json()
        assert body["name"] == "Banco de Bogotá"
        assert body["isActive"] is True
        assert body["accountsCount"] == 0
        assert body["logoUrl"].endswith(f"/media/proxy?path=uploads/{nas.uploaded[0]}")
        stored = db.get(Bank, uuid.UUID(body["id"]))
        assert stored.logo == f"uploads/{nas.uploaded[0]}"
        assert stored.normalized_name == "banco de bogotá"

    @pytest.mark.parametrize("duplicate", ["BANCOLOMBIA", " bancolombia ", "Bancolombia"])
    def test_duplicates_by_case_or_spaces_are_rejected(self, client, tokens, nas, duplicate):
        create_bank(client, tokens["admin"])

        response = create_bank(client, tokens["admin"], name=duplicate)

        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "BANK_ALREADY_EXISTS"

    def test_invalid_logo_format_is_rejected(self, client, tokens, nas):
        response = create_bank(
            client, tokens["admin"], files={"logo": ("logo.gif", b"GIF89a" + b"0" * 20, "image/gif")}
        )

        assert response.status_code == 415
        assert nas.uploaded == []

    def test_logo_over_the_limit_is_rejected(self, client, tokens, nas):
        big = valid_png() + b"0" * (5 * 1024 * 1024)
        response = create_bank(client, tokens["admin"], files={"logo": ("logo.png", big, "image/png")})

        assert response.status_code == 413
        assert nas.uploaded == []

    def test_short_name_is_rejected(self, client, tokens, nas):
        assert create_bank(client, tokens["admin"], name=" B ").status_code == 422

    def test_update_name_status_and_replace_logo(self, client, tokens, nas):
        bank = create_bank(
            client, tokens["admin"], files={"logo": ("a.png", valid_png(), "image/png")}
        ).json()
        old_logo = nas.uploaded[0]

        response = client.patch(
            f"{URL}/{bank['id']}",
            data={"name": "Bancolombia S.A.", "is_active": "false"},
            files={"logo": ("b.webp", valid_webp(), "image/webp")},
            headers=auth(tokens["admin"]),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "Bancolombia S.A."
        assert body["isActive"] is False
        assert body["logoUrl"].endswith(nas.uploaded[1])
        assert nas.deleted == [old_logo]

    def test_rename_to_an_existing_name_is_rejected(self, client, tokens, nas):
        create_bank(client, tokens["admin"], name="Nequi")
        bank = create_bank(client, tokens["admin"], name="Davivienda").json()

        response = client.patch(f"{URL}/{bank['id']}", data={"name": "NEQUI"}, headers=auth(tokens["admin"]))

        assert response.status_code == 409

    def test_unknown_bank_returns_404(self, client, tokens, nas):
        response = client.patch(f"{URL}/{uuid.uuid4()}", data={"is_active": "false"}, headers=auth(tokens["admin"]))
        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "BANK_NOT_FOUND"

    def test_there_is_no_delete_endpoint(self, client, tokens, nas):
        bank = create_bank(client, tokens["admin"]).json()
        assert client.delete(f"{URL}/{bank['id']}", headers=auth(tokens["admin"])).status_code == 405


class TestAccountsAndPayouts:
    def test_creating_a_bank_links_matching_legacy_accounts_only(self, client, tokens, company, nas, db):
        legacy = make_bank_account(db, company, bank_name="  bancolombia ")
        other = make_bank_account(db, company, is_default=False, bank_name="Banco Inventado")

        body = create_bank(client, tokens["admin"]).json()

        db.expire_all()
        assert body["accountsCount"] == 1
        assert db.get(CompanyBankAccount, legacy.id).bank_id == uuid.UUID(body["id"])
        assert db.get(CompanyBankAccount, legacy.id).bank_name == "Bancolombia"
        assert db.get(CompanyBankAccount, other.id).bank_id is None
        assert db.get(CompanyBankAccount, other.id).bank_name == "Banco Inventado"

    def test_renaming_updates_the_name_payouts_read(self, client, tokens, company, nas, db):
        account = make_bank_account(db, company, bank_name="Bancolombia")
        bank = create_bank(client, tokens["admin"]).json()

        client.patch(f"{URL}/{bank['id']}", data={"name": "Bancolombia S.A."}, headers=auth(tokens["admin"]))

        db.expire_all()
        assert db.get(CompanyBankAccount, account.id).bank_name == "Bancolombia S.A."

    def test_deactivating_keeps_existing_accounts(self, client, tokens, company, nas, db):
        account = make_bank_account(db, company, bank_name="Bancolombia")
        bank = create_bank(client, tokens["admin"]).json()

        client.patch(f"{URL}/{bank['id']}", data={"is_active": "false"}, headers=auth(tokens["admin"]))

        listed = client.get("/company/bank-accounts", headers=auth(tokens["company"])).json()
        assert [item["id"] for item in listed] == [str(account.id)]
        assert listed[0]["bankId"] == bank["id"]
        assert client.get("/company/bank-accounts/banks", headers=auth(tokens["company"])).json() == []

    def test_legacy_account_without_catalog_bank_still_lists(self, client, tokens, company, db):
        make_bank_account(db, company, bank_name="Banco Antiguo")

        listed = client.get("/company/bank-accounts", headers=auth(tokens["company"])).json()

        assert listed[0]["bankId"] is None
        assert listed[0]["bankName"] == "Banco Antiguo"
        assert listed[0]["bankLogoUrl"] is None


class TestMigration:
    @pytest.fixture()
    def migration(self):
        spec = importlib.util.spec_from_file_location("banks_catalog", MIGRATION)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def test_chains_after_shipping_fix(self, migration):
        assert migration.down_revision == "c6e8a0b2d4f7"

    def test_upgrade_keeps_accounts_and_downgrade_reverts(self, engine, db, company, migration):
        account = make_bank_account(db, company, bank_name="Banco Existente")
        db.close()

        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE company_bank_accounts DROP COLUMN bank_id"))
            connection.execute(text("DROP TABLE banks"))
            with Operations.context(MigrationContext.configure(connection)):
                migration.upgrade()

        inspector = inspect(engine)
        assert "banks" in inspector.get_table_names()
        assert "bank_id" in {c["name"] for c in inspector.get_columns("company_bank_accounts")}
        with engine.connect() as connection:
            row = connection.execute(
                text("SELECT bank_name, bank_id FROM company_bank_accounts WHERE id = :id"), {"id": account.id}
            ).one()
            assert row == ("Banco Existente", None)
            assert connection.execute(text("SELECT count(*) FROM banks")).scalar() == 0

        with engine.begin() as connection:
            with Operations.context(MigrationContext.configure(connection)):
                migration.downgrade()
        inspector = inspect(engine)
        assert "banks" not in inspector.get_table_names()
        assert "bank_id" not in {c["name"] for c in inspector.get_columns("company_bank_accounts")}
        with engine.connect() as connection:
            assert connection.execute(text("SELECT count(*) FROM company_bank_accounts")).scalar() == 1

        with engine.begin() as connection:
            with Operations.context(MigrationContext.configure(connection)):
                migration.upgrade()
