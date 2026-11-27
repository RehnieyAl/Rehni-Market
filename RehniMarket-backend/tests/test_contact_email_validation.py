"""Correo de contacto de Mi tienda: la expresión lineal acepta y rechaza lo mismo que la anterior."""

import pytest
from pydantic import ValidationError

from app.schemas.SchemaDashboard.ShemaCompany import UpdateInformationCompanyRequest

VALID = ["ventas@tienda.co", "a@b.c", "a.b@sub.dominio.com", "x@.b.c", "x@b..c", "x@b.c.", "Soporte@TestCo.local"]
INVALID = ["sin-arroba", "@b.c", "a@b", "a@.b", "a@b.", "a@@b.c", "a@b c.d", "a@b.c@d"]


@pytest.mark.parametrize("email", VALID)
def test_valid_contact_email_is_accepted_and_normalized(email):
    assert UpdateInformationCompanyRequest(contactEmail=email).contactEmail == email.strip().lower()


@pytest.mark.parametrize("email", INVALID)
def test_invalid_contact_email_is_rejected(email):
    with pytest.raises(ValidationError):
        UpdateInformationCompanyRequest(contactEmail=email)


def test_overlong_contact_email_is_rejected_before_the_pattern():
    with pytest.raises(ValidationError):
        UpdateInformationCompanyRequest(contactEmail="a@" + "." * 300 + "b.co")
