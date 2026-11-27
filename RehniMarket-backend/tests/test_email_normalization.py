"""Normalización de correos (SchemaEmail.NormalizedEmail + búsquedas sin distinguir mayúsculas):
registro, login, recuperación, verificación y cambio de correo, incluidas cuentas antiguas guardadas
con mayúsculas."""

import pytest

from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.schemas.schemaAuth.SchemaLogin import LoginRequest
from app.schemas.schemaAuth.SchemaRegister import CreateUserRequest
from app.utils.Security import hash_password
from tests.conftest import auth

PASSWORD = "Secreto123"
MIXED_CASE_VARIANTS = [
    "ana.perez@example.com",
    "Ana.Perez@Example.com",
    "ANA.PEREZ@EXAMPLE.COM",
    "  aNa.PeReZ@eXaMpLe.CoM  ",
]


def _register(client, email):
    return client.post(
        "/auth/register-user",
        json={"full_name": "Ana Pérez", "email": email, "password": PASSWORD, "tell": "3001234567"},
    )


def _make_user(db, email, verified=True):
    role = db.query(Role).filter(Role.name == "user").first()
    user = Users(
        fullName="Cuenta Antigua",
        email=email,
        hashed_password=hash_password(PASSWORD),
        tell="3000000000",
        verified=verified,
        role_id=role.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.mark.parametrize("email", MIXED_CASE_VARIANTS)
def test_schemas_store_email_trimmed_and_lowercase(email):
    assert CreateUserRequest(full_name="Ana Pérez", email=email, password=PASSWORD, tell="3001234567").email == (
        "ana.perez@example.com"
    )
    assert LoginRequest(email=email, password=PASSWORD).email == "ana.perez@example.com"


class TestRegister:
    def test_register_saves_lowercase_email(self, client, db):
        response = _register(client, "  Ana.Perez@EXAMPLE.com ")

        assert response.status_code == 200
        assert db.query(Users).filter(Users.fullName == "Ana Pérez").one().email == "ana.perez@example.com"

    @pytest.mark.parametrize("variant", MIXED_CASE_VARIANTS)
    def test_case_variant_cannot_create_a_second_account(self, client, db, variant):
        assert _register(client, "ana.perez@example.com").status_code == 200

        response = _register(client, variant)

        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "EMAIL_ALREADY_EXISTS"
        assert db.query(Users).filter(Users.fullName == "Ana Pérez").count() == 1

    def test_legacy_mixed_case_account_blocks_lowercase_duplicate(self, client, db):
        _make_user(db, "Ana.Perez@Example.com")

        assert _register(client, "ana.perez@example.com").status_code == 409


class TestLoginAndRecovery:
    @pytest.mark.parametrize("variant", MIXED_CASE_VARIANTS)
    def test_login_accepts_any_case(self, client, db, variant):
        _make_user(db, "ana.perez@example.com")

        response = client.post("/auth/login-user", json={"email": variant, "password": PASSWORD})

        assert response.status_code == 200
        assert response.json()["access_token"]

    def test_legacy_mixed_case_account_still_logs_in(self, client, db):
        _make_user(db, "Ana.Perez@Example.com")

        response = client.post(
            "/auth/login-user", json={"email": "ana.perez@example.com", "password": PASSWORD}
        )

        assert response.status_code == 200

    def test_forgot_password_finds_account_with_other_case(self, client, db, outbox):
        _make_user(db, "ana.perez@example.com")

        response = client.post("/auth/forgot-password-user", json={"email": "ANA.Perez@Example.COM"})

        assert response.status_code == 200
        assert outbox and outbox[-1]["to"] == "ana.perez@example.com"

    def test_resend_verification_finds_account_with_other_case(self, client, db, outbox):
        _make_user(db, "ana.perez@example.com", verified=False)

        response = client.post("/auth/resend-verification-code", json={"email": "Ana.PEREZ@example.com"})

        assert response.status_code == 200
        assert outbox and outbox[-1]["to"] == "ana.perez@example.com"


class TestChangeEmail:
    def test_me_accepts_own_legacy_email_and_normalizes_it(self, client, db):
        legacy = _make_user(db, "Ana.Perez@Example.com")
        login = client.post("/auth/login-user", json={"email": "ana.perez@example.com", "password": PASSWORD})

        response = client.patch(
            "/auth/me",
            json={"email": "Ana.Perez@Example.com"},
            headers=auth(login.json()["access_token"]),
        )

        assert response.status_code == 200
        db.refresh(legacy)
        assert legacy.email == "ana.perez@example.com"

    def test_me_rejects_case_variant_of_another_account(self, client, db, tokens):
        _make_user(db, "ana.perez@example.com")

        response = client.patch(
            "/auth/me", json={"email": "ANA.PEREZ@example.com"}, headers=auth(tokens["user"])
        )

        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "EMAIL_ALREADY_EXISTS"

    def test_change_email_rejects_case_variant_of_another_account(self, client, db):
        _make_user(db, "ana.perez@example.com")
        _make_user(db, "otra@example.com", verified=False)

        response = client.post(
            "/auth/change-email",
            json={"old_email": "OTRA@example.com", "new_email": "Ana.Perez@EXAMPLE.com"},
        )

        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "EMAIL_ALREADY_EXISTS"
