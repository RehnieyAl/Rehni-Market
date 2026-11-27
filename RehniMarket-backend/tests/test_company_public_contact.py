"""Contacto empresarial en el perfil público: solo con el permiso explícito de la empresa (contactPublic),
apagado por defecto, reversible y sin exponer nunca el correo con el que la empresa inicia sesión."""

from tests.conftest import auth

SETTINGS = "/company/dashboard/my-profile"
UPDATE = "/company/dashboard/upgrade-my-profile"


def public_profile(client, company):
    response = client.get(f"/public/company/{company.id}")
    assert response.status_code == 200, response.text
    return response.json()


def set_contact(client, tokens, **body):
    response = client.patch(UPDATE, json=body, headers=auth(tokens["company"]))
    assert response.status_code == 200, response.text


class TestPublicCompanyContact:
    def test_registered_contact_stays_private_by_default(self, client, tokens, company):
        set_contact(client, tokens, contactEmail="ventas@acme.example", contactPhone="6045550000")

        body = public_profile(client, company)

        assert body["contact_email"] is None and body["contact_phone"] is None
        assert client.get(SETTINGS, headers=auth(tokens["company"])).json()["contactPublic"] is False

    def test_company_can_publish_and_hide_its_contact(self, client, tokens, company):
        set_contact(client, tokens, contactEmail="ventas@acme.example", contactPhone="604 555-0000", contactPublic=True)

        body = public_profile(client, company)
        assert (body["contact_email"], body["contact_phone"]) == ("ventas@acme.example", "6045550000")
        assert client.get(SETTINGS, headers=auth(tokens["company"])).json()["contactPublic"] is True

        set_contact(client, tokens, contactPublic=False)
        body = public_profile(client, company)
        assert body["contact_email"] is None and body["contact_phone"] is None

    def test_permission_without_contact_publishes_nothing(self, client, tokens, company):
        set_contact(client, tokens, contactPublic=True)

        body = public_profile(client, company)

        assert body["contact_email"] is None and body["contact_phone"] is None

    def test_login_email_of_the_company_is_never_published(self, client, tokens, company, users):
        set_contact(client, tokens, contactEmail="ventas@acme.example", contactPublic=True)

        body = public_profile(client, company)

        assert users["company"].email not in str(body)

    def test_editing_other_fields_keeps_the_permission(self, client, tokens, company):
        set_contact(client, tokens, contactEmail="ventas@acme.example", contactPublic=True)
        set_contact(client, tokens, description="Muebles hechos a mano en Medellín")

        assert public_profile(client, company)["contact_email"] == "ventas@acme.example"
