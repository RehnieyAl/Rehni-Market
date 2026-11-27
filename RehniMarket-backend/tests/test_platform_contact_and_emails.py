"""Contacto institucional (solo owner, publicación selectiva) y correos: diseño común sin imágenes de
productos, escape de datos, pie con el contacto publicado y estructura MIME (texto + HTML, Date, Message-ID)."""

import re
from decimal import Decimal
from types import SimpleNamespace

import pytest

from app.Config import config
from app.models.ModelPlatformSetting import PlatformSetting
from app.services import PlatformSettingsService
from app.services.email import EmailService
from app.services.email.template import EmailBase
from app.services.email.template.EmailForgotPassword import EmailForgotPassword
from app.services.email.template.EmailOrder import EmailOrderCreated, EmailOrderDelivered
from app.services.email.template.EmailRegisterCompany import EmailRegisterCompany
from app.services.email.template.EmailRegisterUser import EmailRegisterUser
from app.services.email.template.EmailReturnStatus import build_decision_email
from tests.conftest import auth

URL = "/admin/platform-settings/contact"
PUBLIC_URL = "/public/platform-contact"
FULL = {"contactEmail": "Soporte@RehniMarket.co", "contactPhone": "+57 601 555 0101", "emailPublic": True, "phonePublic": True}


@pytest.fixture()
def captured(monkeypatch):
    """Captura (destino, asunto, html) de cada plantilla sin pasar por SMTP."""
    sent = []
    for module in ("EmailForgotPassword", "EmailRegisterUser", "EmailRegisterCompany", "EmailOrder"):
        monkeypatch.setattr(
            f"app.services.email.template.{module}.send_email",
            lambda to, subject, body: sent.append(SimpleNamespace(to=to, subject=subject, html=body)),
        )
    return sent


def _order_items():
    return [{"name": "Zapato <b>Pro</b>", "variant_name": "Talla 40", "quantity": 2,
             "unit_price": Decimal("100000"), "subtotal": Decimal("200000")}]


def _render_all(captured) -> list:
    EmailForgotPassword("ana@example.com", "482913", 15)
    EmailRegisterUser("ana@example.com", "482913", 5)
    EmailRegisterCompany("tienda@example.com", "Tienda <script>x</script>", "482913", 5)
    EmailOrderCreated(
        "ana@example.com", "Ana", "RM-000001", "Pagado", "25/11/2026 10:00", "Tienda A",
        {"full_name": "Ana", "phone": "300", "address": "Calle 1", "city": "Medellín", "department": "Antioquia"},
        _order_items(), 1, 2, Decimal("238000"),
    )
    EmailOrderDelivered("ana@example.com", "Ana", "RM-000001", "25/11/2026", _order_items(), Decimal("238000"),
                        "https://rehnimarket.example.com/user/dashboard?tab=orders")
    subject, body = build_decision_email(
        recipient_name="Ana", subject="Tu devolución fue aprobada", message="Confirmamos <img src=x onerror=1>",
        approved=True, decided_by="Tienda A", product_name="Zapato", order_reference="RM-000001",
        claim_reference="DEV-1", refund_amount=Decimal("119000"), can_request_review=False,
    )
    return [m.html for m in captured] + [body]


class TestOwnerOnlySettings:
    def test_owner_saves_and_reads_email_and_phone(self, client, tokens, db, users):
        response = client.put(URL, json=FULL, headers=auth(tokens["owner"]))

        assert response.status_code == 200, response.text
        body = response.json()
        assert body["contactEmail"] == "soporte@rehnimarket.co"
        assert body["contactPhone"] == "+576015550101"
        assert body["updatedByName"] == users["owner"].fullName
        assert client.get(URL, headers=auth(tokens["owner"])).json()["contactPhone"] == "+576015550101"
        assert db.query(PlatformSetting).count() == 1

    @pytest.mark.parametrize("role", ["admin", "company", "user"])
    def test_other_roles_cannot_read_or_modify(self, client, tokens, db, role):
        assert client.put(URL, json=FULL, headers=auth(tokens[role])).status_code == 403
        assert client.get(URL, headers=auth(tokens[role])).status_code == 403
        assert db.query(PlatformSetting).count() == 0

    def test_anonymous_cannot_modify(self, client):
        assert client.put(URL, json=FULL).status_code == 401

    def test_cannot_publish_an_empty_value_and_validates_formats(self, client, tokens):
        for body in (
            {"contactEmail": "", "emailPublic": True},
            {"contactPhone": "12", "phonePublic": False},
            {"contactPhone": "３００１２３４５６７"},
            {"contactEmail": "no-es-correo"},
        ):
            assert client.put(URL, json=body, headers=auth(tokens["owner"])).status_code == 422, body

    def test_contact_is_independent_of_the_owner_account(self, client, tokens, users):
        body = client.get(URL, headers=auth(tokens["owner"])).json()

        assert body["contactEmail"] is None and body["contactPhone"] is None
        assert users["owner"].email not in str(body)


class TestPublicContact:
    def test_nothing_configured_returns_nulls(self, client):
        assert client.get(PUBLIC_URL).json() == {"email": None, "phone": None}

    def test_only_published_values_are_exposed(self, client, tokens):
        client.put(URL, json={**FULL, "phonePublic": False}, headers=auth(tokens["owner"]))

        assert client.get(PUBLIC_URL).json() == {"email": "soporte@rehnimarket.co", "phone": None}

    def test_every_role_reads_the_public_contact(self, client, tokens):
        client.put(URL, json=FULL, headers=auth(tokens["owner"]))

        for role in ("user", "company", "admin"):
            assert client.get(PUBLIC_URL, headers=auth(tokens[role])).json()["phone"] == "+576015550101"


class TestTemplates:
    def test_shared_brand_design_without_product_images(self, captured):
        for body in _render_all(captured):
            assert f"background:{EmailBase.PRIMARY}" in body and EmailBase.BG_PAGE in body
            assert EmailBase.PRIMARY == "#8b0d35" and EmailBase.SECONDARY == "#e51d48"
            assert 'content="light only"' in body
            assert "max-width:600px" in body
            assert "<img" not in body.lower()
            assert "#6D0F2D" not in body and "#ffffff;border-radius:18px" not in body
            assert "box-shadow" not in body

    def test_dynamic_content_is_escaped(self, captured):
        html = "".join(_render_all(captured))

        assert "<script>" not in html and "&lt;script&gt;" in html
        assert "<b>Pro</b>" not in html and "&lt;b&gt;Pro&lt;/b&gt;" in html
        assert "<img src=x" not in html

    def test_order_lists_name_variant_quantity_and_historical_price(self, captured):
        _render_all(captured)
        order_html = captured[3].html

        assert "Talla 40" in order_html and "2 &times; $100.000" in order_html and "$200.000" in order_html

    def test_code_emails_show_the_code_in_the_same_block(self, captured):
        _render_all(captured)

        for message in captured[:3]:
            assert re.search(r'class="rm-code"[^>]*>482913<', message.html)

    def test_order_email_does_not_query_product_images(self):
        from app.services.email import OrderEmailService

        class Item:
            product_name, variant_name, quantity = "Zapato", None, 1
            unit_price = subtotal = Decimal("10")

            @property
            def product(self):
                pytest.fail("el correo no debe cargar el producto ni sus imágenes")

        order = SimpleNamespace(items=[Item()])
        assert OrderEmailService._build_items(order)[0] == {
            "name": "Zapato", "variant_name": None, "quantity": 1, "unit_price": Decimal("10"), "subtotal": Decimal("10"),
        }

    @pytest.mark.parametrize("href", ["http://rehnimarket.co/x", "https://localhost/x", "https://127.0.0.1/x", "javascript:alert(1)"])
    def test_unsafe_links_are_not_rendered(self, href):
        assert "href" not in EmailBase.cta_button("Ver pedido", href)

    def test_footer_shows_only_published_contact(self, client, tokens, captured):
        client.put(URL, json={**FULL, "phonePublic": False}, headers=auth(tokens["owner"]))
        PlatformSettingsService.invalidate_cache()

        EmailRegisterUser("ana@example.com", "482913", 5)

        assert 'href="mailto:soporte@rehnimarket.co"' in captured[-1].html
        assert "6015550101" not in captured[-1].html

    def test_footer_without_contact_has_no_empty_block(self, captured):
        EmailRegisterUser("ana@example.com", "482913", 5)

        assert "¿Necesitas ayuda?" not in captured[-1].html


class TestMimeStructure:
    def test_message_has_text_and_html_with_standard_headers(self, monkeypatch):
        monkeypatch.setattr(config, "EMAIL_FROM", "rehni.market@gmail.com")
        message = EmailService.build_message("ana@example.com", "Código de verificación · Ñandú", EmailBase.email_wrapper(
            "Prueba", EmailBase.paragraph_html("Hola") + EmailBase.code_block("482913")))

        assert message.get_content_type() == "multipart/alternative"
        parts = [part.get_content_type() for part in message.iter_parts()]
        assert parts == ["text/plain", "text/html"]
        assert all(part.get_content_charset() == "utf-8" for part in message.iter_parts())
        text = message.get_body(("plain",)).get_content()
        assert "482913" in text and "<" not in text and "color-scheme" not in text
        assert message["Date"] and message["Message-ID"].endswith("@gmail.com>")
        assert message["MIME-Version"] == "1.0"
        assert message["Auto-Submitted"] == "auto-generated"
        assert message["Reply-To"] is None
        assert "=?utf-8?" in message.as_string()

    def test_from_name_is_opt_in(self, monkeypatch):
        monkeypatch.setattr(config, "EMAIL_FROM", "rehni.market@gmail.com")
        assert EmailService.build_message("a@example.com", "x", "<p>x</p>")["From"] == "rehni.market@gmail.com"

        monkeypatch.setattr(config, "EMAIL_FROM_NAME", "Rehni Market")
        assert EmailService.build_message("a@example.com", "x", "<p>x</p>")["From"] == "Rehni Market <rehni.market@gmail.com>"

    def test_reply_to_uses_published_contact_only_when_enabled(self, client, tokens, monkeypatch):
        client.put(URL, json=FULL, headers=auth(tokens["owner"]))
        PlatformSettingsService.invalidate_cache()

        assert EmailService.build_message("a@example.com", "x", "<p>x</p>")["Reply-To"] is None
        monkeypatch.setattr(config, "EMAIL_REPLY_TO_CONTACT", True)
        assert EmailService.build_message("a@example.com", "x", "<p>x</p>")["Reply-To"] == "soporte@rehnimarket.co"

    def test_misaligned_sender_is_reported(self, monkeypatch):
        monkeypatch.setattr(config, "SMTP_USERNAME", "rehni.market@gmail.com")
        monkeypatch.setattr(config, "EMAIL_FROM", "rehni.market@gmail.com")
        assert EmailService.sender_alignment_warning() is None

        monkeypatch.setattr(config, "EMAIL_FROM", "soporte@rehnimarket.co")
        assert "DMARC" in EmailService.sender_alignment_warning()
