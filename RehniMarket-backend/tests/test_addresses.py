"""Contrato de /addresses (AddressRouter + AddressService)."""

import uuid

import pytest

from app.models.ModelAddress import Address
from tests.conftest import auth
from tests.factories import VALID_ADDRESS, make_user, place_order, silence_emails


@pytest.fixture(autouse=True)
def _silence(monkeypatch):
    silence_emails(monkeypatch)


def create(client, token, **overrides):
    return client.post("/addresses", json={**VALID_ADDRESS, **overrides}, headers=auth(token))


def ids(response):
    return [a["id"] for a in response.json()]


class TestAuthorization:
    def test_requires_token(self, client):
        response = client.get("/addresses")
        assert response.status_code == 401
        assert response.json()["detail"]["code"] == "UNAUTHORIZED"

    def test_company_role_is_forbidden_by_middleware(self, client, tokens):
        response = client.get("/addresses", headers=auth(tokens["company"]))
        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "FORBIDDEN"

    @pytest.mark.parametrize("role", ["admin", "owner"])
    def test_staff_passes_middleware_but_is_not_a_buyer(self, client, tokens, role):
        response = create(client, tokens[role])
        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "PURCHASE_NOT_ALLOWED"


class TestCreateAndList:
    def test_first_address_becomes_default_and_has_response_shape(self, client, tokens):
        response = create(client, tokens["user"], postalCode="050001")

        assert response.status_code == 200
        body = response.json()
        assert body["isDefault"] is True
        assert body["postalCode"] == "050001"
        assert set(body) == {
            "id", "label", "fullName", "country", "department", "city", "address",
            "postalCode", "phone", "additionalInstructions", "isDefault", "createdAt",
        }

    def test_new_default_replaces_the_previous_one(self, client, tokens):
        first = create(client, tokens["user"]).json()
        second = create(client, tokens["user"], label="Oficina", isDefault=True).json()

        listed = client.get("/addresses", headers=auth(tokens["user"])).json()
        defaults = {a["id"]: a["isDefault"] for a in listed}
        assert defaults == {first["id"]: False, second["id"]: True}
        assert listed[0]["id"] == second["id"], "la predeterminada va primero"

    def test_second_address_without_flag_is_not_default(self, client, tokens):
        create(client, tokens["user"])
        second = create(client, tokens["user"], label="Oficina").json()
        assert second["isDefault"] is False

    def test_list_only_returns_own_addresses(self, client, tokens, db):
        create(client, tokens["user"])
        _, other_token = make_user(db, "user", "otro.comprador@test.local")
        create(client, other_token, label="Ajena")

        listed = client.get("/addresses", headers=auth(tokens["user"])).json()
        assert [a["label"] for a in listed] == ["Casa"]

    @pytest.mark.parametrize(
        "field,value",
        [("phone", "123"), ("address", "Cl 1"), ("label", "A"), ("postalCode", "1" * 16)],
    )
    def test_invalid_fields_return_422_with_api_contract(self, client, tokens, field, value):
        response = create(client, tokens["user"], **{field: value})
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "VALIDATION_ERROR"

    def test_missing_required_field_returns_422(self, client, tokens):
        payload = {k: v for k, v in VALID_ADDRESS.items() if k != "city"}
        response = client.post("/addresses", json=payload, headers=auth(tokens["user"]))
        assert response.status_code == 422


class TestUpdate:
    def test_partial_update_keeps_other_fields(self, client, tokens):
        created = create(client, tokens["user"]).json()

        response = client.patch(
            f"/addresses/{created['id']}",
            json={"city": "Envigado", "additionalInstructions": "Portería 2"},
            headers=auth(tokens["user"]),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["city"] == "Envigado"
        assert body["additionalInstructions"] == "Portería 2"
        assert body["address"] == VALID_ADDRESS["address"]

    def test_cannot_update_another_users_address(self, client, tokens, db):
        _, other_token = make_user(db, "user", "otro.comprador@test.local")
        foreign = create(client, other_token).json()

        response = client.patch(
            f"/addresses/{foreign['id']}", json={"city": "Bello"}, headers=auth(tokens["user"])
        )

        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "ADDRESS_NOT_FOUND"
        assert db.get(Address, uuid.UUID(foreign["id"])).city == VALID_ADDRESS["city"]

    def test_invalid_update_returns_422(self, client, tokens):
        created = create(client, tokens["user"]).json()
        response = client.patch(
            f"/addresses/{created['id']}", json={"phone": "12"}, headers=auth(tokens["user"])
        )
        assert response.status_code == 422


class TestSetDefault:
    def test_switches_the_default(self, client, tokens):
        first = create(client, tokens["user"]).json()
        second = create(client, tokens["user"], label="Oficina").json()

        response = client.patch(f"/addresses/{second['id']}/set-default", headers=auth(tokens["user"]))

        assert response.status_code == 200
        assert response.json()["isDefault"] is True
        listed = {a["id"]: a["isDefault"] for a in client.get("/addresses", headers=auth(tokens["user"])).json()}
        assert listed == {first["id"]: False, second["id"]: True}

    def test_unknown_address_returns_404(self, client, tokens):
        response = client.patch(f"/addresses/{uuid.uuid4()}/set-default", headers=auth(tokens["user"]))
        assert response.status_code == 404


class TestDelete:
    def test_deleting_the_default_promotes_another(self, client, tokens):
        first = create(client, tokens["user"]).json()
        second = create(client, tokens["user"], label="Oficina").json()

        response = client.delete(f"/addresses/{first['id']}", headers=auth(tokens["user"]))

        assert response.status_code == 200
        listed = client.get("/addresses", headers=auth(tokens["user"])).json()
        assert [(a["id"], a["isDefault"]) for a in listed] == [(second["id"], True)]

    def test_deleting_a_non_default_keeps_the_default(self, client, tokens):
        first = create(client, tokens["user"]).json()
        second = create(client, tokens["user"], label="Oficina").json()

        client.delete(f"/addresses/{second['id']}", headers=auth(tokens["user"]))

        listed = client.get("/addresses", headers=auth(tokens["user"])).json()
        assert [(a["id"], a["isDefault"]) for a in listed] == [(first["id"], True)]

    def test_cannot_delete_another_users_address(self, client, tokens, db):
        _, other_token = make_user(db, "user", "otro.comprador@test.local")
        foreign = create(client, other_token).json()

        response = client.delete(f"/addresses/{foreign['id']}", headers=auth(tokens["user"]))

        assert response.status_code == 404
        assert db.get(Address, uuid.UUID(foreign["id"])) is not None

    @pytest.mark.xfail(
        strict=True,
        reason="H-06: orders.address_id sin ondelete; borrar una dirección usada en un pedido da 500 (ForeignKeyViolation)",
    )
    def test_deleting_an_address_used_by_an_order_does_not_fail_with_500(
        self, client, tokens, db, product, address, buyer_wallet
    ):
        order = place_order(client, tokens["user"], db, product, address)

        response = client.delete(f"/addresses/{address.id}", headers=auth(tokens["user"]))

        # El pedido guarda una copia de la dirección (delivery_*); borrar la
        # dirección debe responder 200 o un 4xx explícito, nunca un 500.
        assert response.status_code != 500, response.text
        assert order["id"]
