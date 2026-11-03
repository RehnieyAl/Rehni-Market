"""Reglas de registro (SchemaRegister.py + NitValidator.py) y su contrato HTTP.

La misma tabla de NIT reales se usa en el frontend
(src/shared/validation/nit.test.ts) para garantizar la paridad del DV.
Los xfail citan su hallazgo en docs/pruebas/REGISTRO.md; H-04 y H-05 ya están
corregidos y sus tests protegen el contrato.
"""

import pytest
from pydantic import ValidationError

from app.schemas.schemaAuth.SchemaRegister import CreateCompanyRequest, CreateUserRequest
from app.utils.NitValidator import calculate_nit_dv, validate_nit_dv

# NIT publicados por cada entidad junto con su DV.
PUBLISHED_NITS = [
    ("DIAN", "800197268", "4"),
    ("Ecopetrol", "899999068", "1"),
    ("Bancolombia", "890903938", "8"),
    ("Almacenes Éxito", "890900608", "9"),
    ("SENA", "899999034", "1"),
]

VALID_USER = {
    "full_name": "Ana Pérez",
    "email": "ana@example.com",
    "password": "Secreto123",
    "tell": "3001234567",
}

VALID_COMPANY = {
    "company_name": "Tienda Ana SAS",
    "company_address": "Calle 10 # 20-30",
    "company_nit": "800197268",
    "company_nit_dv": "4",
}


def company_error(**overrides) -> str:
    with pytest.raises(ValidationError) as exc:
        CreateCompanyRequest(**{**VALID_COMPANY, **overrides})
    return exc.value.errors()[0]["msg"]


@pytest.mark.parametrize("entity,nit,dv", PUBLISHED_NITS)
def test_published_nits_have_the_published_check_digit(entity, nit, dv):
    assert str(calculate_nit_dv(nit)) == dv
    assert validate_nit_dv(nit, dv)


@pytest.mark.parametrize("nit,dv", [("10001", 0), ("10005", 1)])
def test_remainders_zero_and_one_map_to_themselves(nit, dv):
    assert calculate_nit_dv(nit) == dv


def test_every_other_check_digit_is_rejected():
    wrong = [d for d in "0123456789" if d != "4"]
    assert not any(validate_nit_dv("800197268", d) for d in wrong)


def test_company_with_real_nit_is_valid():
    company = CreateCompanyRequest(**VALID_COMPANY)
    assert (company.company_nit, company.company_nit_dv) == ("800197268", "4")


def test_wrong_check_digit_is_rejected():
    assert company_error(company_nit_dv="5").endswith(
        "El dígito de verificación no coincide con el NIT ingresado."
    )


def test_nit_format_is_checked_before_the_check_digit():
    assert company_error(company_nit="800.197.268").endswith("El NIT solo puede contener números.")


def test_user_fields_are_trimmed():
    user = CreateUserRequest(**{**VALID_USER, "full_name": "  Ana Pérez  "})
    assert user.full_name == "Ana Pérez"


@pytest.mark.xfail(
    strict=True,
    reason="H-02: NIT de más de 15 dígitos aceptado; el DV solo pondera los 15 primeros",
)
def test_nit_longer_than_15_digits_is_rejected():
    nit_15 = "123456789012345"
    with pytest.raises(ValidationError):
        CreateCompanyRequest(
            **{**VALID_COMPANY, "company_nit": nit_15 + "9", "company_nit_dv": str(calculate_nit_dv(nit_15))}
        )


@pytest.mark.xfail(
    strict=True,
    reason="H-03: str.isdigit() acepta dígitos no ASCII (ancho completo) en el teléfono",
)
def test_phone_with_non_ascii_digits_is_rejected():
    with pytest.raises(ValidationError):
        CreateUserRequest(**{**VALID_USER, "tell": "３００１２３４５６７"})


@pytest.mark.xfail(
    strict=True,
    reason="H-03: str.isdigit() acepta dígitos no ASCII (ancho completo) en el NIT",
)
def test_nit_with_non_ascii_digits_is_rejected():
    with pytest.raises(ValidationError):
        CreateCompanyRequest(**{**VALID_COMPANY, "company_nit": "８００１９７２６８"})


# --- Contrato HTTP de los errores de validación -----------------------------


def register_company(client, **overrides):
    data = {**VALID_USER, **VALID_COMPANY, **overrides}
    return client.post(
        "/auth/register-company",
        data=data,
        files={"certificate": ("camara.pdf", b"%PDF-1.4", "application/pdf")},
    )


def test_register_company_wrong_dv_returns_422_validation_error(client):
    response = register_company(client, company_nit_dv="5")

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail["code"] == "VALIDATION_ERROR"
    assert "El dígito de verificación no coincide con el NIT ingresado." in detail["message"]


def test_register_company_message_has_no_pydantic_prefix(client):
    # H-05 (corregido)
    detail = register_company(client, company_nit_dv="5").json()["detail"]
    assert detail["message"] == "El dígito de verificación no coincide con el NIT ingresado."


def test_register_user_invalid_password_returns_422(client):
    response = client.post("/auth/register-user", json={**VALID_USER, "password": "corta"})
    assert response.status_code == 422


def test_register_user_422_follows_the_api_error_contract(client):
    # H-04 (corregido)
    detail = client.post("/auth/register-user", json={**VALID_USER, "password": "corta"}).json()["detail"]
    assert detail == {
        "code": "VALIDATION_ERROR",
        "message": "La contraseña debe tener al menos 8 caracteres.",
    }


def test_query_param_validation_also_follows_the_api_error_contract(client):
    # RequestValidationError fuera del cuerpo: limit tiene ge=1 en /public/products.
    response = client.get("/public/products", params={"limit": 0})

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail["code"] == "VALIDATION_ERROR"
    assert isinstance(detail["message"], str) and detail["message"]
