"""GET /company/dashboard/my-profile ("Mi tienda"): solo datos de la empresa, sin datos personales del
representante en ningún nivel del JSON; permisos, aislamiento entre empresas y /auth/me intacto."""

import pytest

from app.models.ModelCompany import CompanyCertificateEnum
from tests.conftest import auth
from tests.factories import make_company, make_user

URL = "/company/dashboard/my-profile"

EXPECTED_KEYS = {
    "id",
    "nameCompany",
    "addressCompany",
    "description",
    "CompanyNIT",
    "CompanyNITDV",
    "CompanyStatus",
    "suspensionReason",
    "certificateStatus",
    "rejectionReason",
    "memberAT",
    "logo",
    "banner",
    # Contacto empresarial propio de Mi tienda (vacío hasta que la empresa lo registre); no son los
    # datos personales del representante, que siguen fuera de esta respuesta.
    "contactEmail",
    "contactPhone",
    # Permiso de la empresa para mostrar ese contacto en su perfil público (false por defecto).
    "contactPublic",
}


def _all_keys_and_values(node):
    """Todas las claves y valores escalares del JSON, recorriendo objetos y listas anidados."""
    if isinstance(node, dict):
        for key, value in node.items():
            yield key
            yield from _all_keys_and_values(value)
    elif isinstance(node, list):
        for item in node:
            yield from _all_keys_and_values(item)
    else:
        yield node


@pytest.fixture()
def representative(db, users):
    user = users["company"]
    user.fullName = "Representante Personal"
    user.tell = "3105550000"
    db.commit()
    return user


class TestStoreSettingsContract:
    def test_returns_exactly_the_company_fields(self, client, tokens, company):
        response = client.get(URL, headers=auth(tokens["company"]))

        assert response.status_code == 200
        body = response.json()
        assert set(body) == EXPECTED_KEYS
        assert body["id"] == str(company.id)
        assert body["nameCompany"] == "Test Co"
        assert body["CompanyNIT"] == "900123456"
        assert body["CompanyStatus"] is True
        assert body["certificateStatus"] == "approved"

    def test_no_personal_data_of_the_representative_anywhere(self, client, tokens, company, representative):
        body = client.get(URL, headers=auth(tokens["company"])).json()
        found = set(map(str, _all_keys_and_values(body)))

        assert representative.fullName not in found
        assert representative.tell not in found
        assert representative.email not in found
        assert not {"fullName", "name", "email", "tell", "phone", "user", "representative"} & found
        assert not any(isinstance(value, (dict, list)) for value in body.values())

    def test_member_since_is_the_company_registration_not_the_account(self, client, tokens, company, db):
        company.created_at = company.created_at.replace(year=2020)
        db.commit()

        body = client.get(URL, headers=auth(tokens["company"])).json()

        assert body["memberAT"].startswith("2020-")

    def test_openapi_documents_the_store_settings_schema(self, client):
        # app.openapi() y no GET /openapi.json: esa ruta solo existe con DOCS_ENABLED=true.
        schema = client.app.openapi()
        response = schema["paths"][URL]["get"]["responses"]["200"]["content"]["application/json"]["schema"]

        assert response["$ref"].endswith("/CompanyStoreSettingsResponse")
        properties = schema["components"]["schemas"]["CompanyStoreSettingsResponse"]["properties"]
        assert set(properties) == EXPECTED_KEYS


class TestStoreSettingsAccess:
    @pytest.mark.parametrize("role", ["user", "admin", "owner"])
    def test_other_roles_are_forbidden(self, client, tokens, company, role):
        assert client.get(URL, headers=auth(tokens[role])).status_code == 403

    def test_missing_token(self, client):
        assert client.get(URL).status_code == 401

    def test_each_company_only_sees_its_own_store(self, client, tokens, company, db):
        other_owner, other_token = make_user(db, "company", "otra@test.local", tell="3000000013")
        other = make_company(db, other_owner, "Otra Tienda", "900765432")

        mine = client.get(URL, headers=auth(tokens["company"])).json()
        theirs = client.get(URL, headers=auth(other_token)).json()

        assert mine["id"] == str(company.id)
        assert theirs["id"] == str(other.id)
        assert theirs["nameCompany"] == "Otra Tienda"

    def test_company_under_review_can_still_read_its_store(self, client, tokens, company, db):
        company.CompanyCertificateStatus = CompanyCertificateEnum.PENDING
        db.commit()

        response = client.get(URL, headers=auth(tokens["company"]))

        assert response.status_code == 200
        assert response.json()["certificateStatus"] == "pending"

    def test_account_without_company_gets_404(self, client, db):
        _, token = make_user(db, "company", "sin-empresa@test.local", tell="3000000014")

        response = client.get(URL, headers=auth(token))

        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "COMPANY_NOT_FOUND"


class TestRelatedFlowsStillWork:
    def test_account_settings_keep_returning_the_representative(self, client, tokens, company, representative):
        body = client.get("/auth/me", headers=auth(tokens["company"])).json()
        flat = set(map(str, _all_keys_and_values(body)))

        assert representative.email in flat
        assert representative.tell in flat
        assert representative.fullName in flat

    def test_update_store_information_is_reflected(self, client, tokens, company):
        response = client.patch(
            "/company/dashboard/upgrade-my-profile",
            json={"addressCompany": "Carrera 9", "description": "Nueva descripción"},
            headers=auth(tokens["company"]),
        )
        assert response.status_code == 200

        body = client.get(URL, headers=auth(tokens["company"])).json()
        assert body["addressCompany"] == "Carrera 9"
        assert body["description"] == "Nueva descripción"
        assert body["CompanyNIT"] == "900123456"

    def test_rejected_certificate_exposes_status_and_reason(self, client, tokens, company, db):
        company.CompanyCertificateStatus = CompanyCertificateEnum.NEEDS_UPDATE
        company.rejection_reason = "Certificado vencido"
        db.commit()

        body = client.get(URL, headers=auth(tokens["company"])).json()

        assert body["certificateStatus"] == "needs_update"
        assert body["rejectionReason"] == "Certificado vencido"
