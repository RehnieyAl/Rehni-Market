"""Reenvío de códigos sobre PostgreSQL: registro de comprador y de empresa y recuperación de contraseña.
Cubre cooldown, topes, rotación, intentos, concurrencia, errores SMTP y la ausencia de enumeración."""

import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import sessionmaker

from app.models.ModelCode import Codes, TypeCode
from app.models.ModelCompany import Company, CompanyCertificateEnum
from app.models.ModelUser import Users
from app.schemas.schemaAuth.SchemaVerifyEmail import ResendVerificationCodeRequest
from app.services.NasService import get_nas_service
from app.services.authentication.VerifyEmailService import resend_verification_code_service
from app.services.email import CodeService, EmailService
from tests.factories import valid_pdf

PASSWORD = "Secreto123"
NEW_PASSWORD = "OtraClave456"


class _SyncExecutor:
    def submit(self, task, *args):
        task(*args)


class _FakeNas:
    def upload_file(self, file, path: str):
        return {"success": True, "object_name": f"{path}cert.pdf", "path": f"uploads/{path}cert.pdf"}

    def delete_file(self, object_name: str):
        return {"success": True}


@pytest.fixture(autouse=True)
def sync_email(monkeypatch):
    """Los correos se entregan en el mismo hilo: el buzón de pruebas queda completo al responder."""
    monkeypatch.setattr(EmailService, "_executor", _SyncExecutor())


@pytest.fixture()
def nas(client):
    client.app.dependency_overrides[get_nas_service] = lambda: _FakeNas()
    yield
    client.app.dependency_overrides.pop(get_nas_service, None)


def register_user(client, email="ana@example.com"):
    return client.post(
        "/auth/register-user",
        json={"full_name": "Ana Pérez", "email": email, "password": PASSWORD, "tell": "3001234567"},
    )


def register_company(client, email="tienda@example.com"):
    data = {
        "full_name": "Rita Gómez", "email": email, "password": PASSWORD, "tell": "3001234567",
        "company_name": "Tienda Rita SAS", "company_address": "Calle 10 # 20-30",
        "company_nit": "800197268", "company_nit_dv": "4",
    }
    return client.post(
        "/auth/register-company", data=data, files={"certificate": ("camara.pdf", valid_pdf(), "application/pdf")}
    )


def make_verified_user(db, email="ana@example.com"):
    from app.models.ModelRole import Role
    from app.utils.Security import hash_password

    user = Users(fullName="Ana Pérez", email=email, hashed_password=hash_password(PASSWORD), tell="3001234567",
                 verified=True, role_id=db.query(Role).filter(Role.name == "user").first().id)
    db.add(user)
    db.commit()
    return user


def codes_of(db, email, code_type) -> list[Codes]:
    db.expire_all()
    return (
        db.query(Codes).join(Users, Users.id == Codes.user_id)
        .filter(Users.email == email, Codes.type == code_type).all()
    )


def code_of(db, email, code_type) -> str:
    rows = codes_of(db, email, code_type)
    assert len(rows) == 1, f"se esperaba un código vigente, hay {len(rows)}"
    return rows[0].code


def age(db, email, code_type, seconds=61, expire=False):
    """Mueve el código hacia el pasado: sale del cooldown (y opcionalmente expira)."""
    for row in codes_of(db, email, code_type):
        row.created_at -= timedelta(seconds=seconds)
        if expire:
            row.expires_at = datetime.utcnow() - timedelta(seconds=1)
    db.commit()


def resend(client, email):
    return client.post("/auth/resend-verification-code", json={"email": email})


def forgot(client, email):
    return client.post("/auth/forgot-password-user", json={"email": email})


def reset(client, email, code, password=NEW_PASSWORD):
    return client.post("/auth/reset-password-user", json={"email": email, "code": code, "new_password": password})


def verify(client, email, code):
    return client.post("/auth/verify-email-user", json={"email": email, "code": code})


class TestBuyerRegistration:
    def test_resend_rotates_the_code_and_the_new_one_verifies(self, client, db, outbox):
        assert register_user(client).status_code == 200
        first = code_of(db, "ana@example.com", TypeCode.VERIFY_EMAIL)
        age(db, "ana@example.com", TypeCode.VERIFY_EMAIL)

        response = resend(client, "ana@example.com")

        assert response.status_code == 200
        assert response.json()["resend_available_in"] == CodeService.RESEND_COOLDOWN_SECONDS
        assert response.json()["expires_in"] == CodeService.VERIFY_EMAIL_EXPIRATION_MINUTES * 60
        second = code_of(db, "ana@example.com", TypeCode.VERIFY_EMAIL)
        assert [m["to"] for m in outbox] == ["ana@example.com", "ana@example.com"]
        assert db.query(Users).filter(Users.email == "ana@example.com").count() == 1

        if first != second:
            assert verify(client, "ana@example.com", first).json()["detail"]["code"] == "INVALID_CODE"
        assert verify(client, "ana@example.com", second).status_code == 200
        assert verify(client, "ana@example.com", second).json()["detail"]["code"] == "EMAIL_ALREADY_VERIFIED"

    def test_cooldown_is_enforced_by_the_server_with_retry_after(self, client, db, outbox):
        register_user(client)

        response = resend(client, "ana@example.com")

        assert response.status_code == 429
        assert response.json()["detail"]["code"] == "RESEND_COOLDOWN_ACTIVE"
        retry_after = response.json()["detail"]["retry_after"]
        assert 0 < retry_after <= 60
        assert response.headers["Retry-After"] == str(retry_after)
        assert len(outbox) == 1

    def test_expired_code_cannot_verify(self, client, db):
        register_user(client)
        code = code_of(db, "ana@example.com", TypeCode.VERIFY_EMAIL)
        age(db, "ana@example.com", TypeCode.VERIFY_EMAIL, expire=True)

        assert verify(client, "ana@example.com", code).json()["detail"]["code"] == "CODE_EXPIRED"
        assert codes_of(db, "ana@example.com", TypeCode.VERIFY_EMAIL) == []

    def test_wrong_attempts_are_limited_and_invalidate_the_code(self, client, db):
        register_user(client)
        code = code_of(db, "ana@example.com", TypeCode.VERIFY_EMAIL)
        wrong = "000000" if code != "000000" else "111111"

        statuses = [verify(client, "ana@example.com", wrong).json()["detail"]["code"] for _ in range(5)]

        assert statuses == ["INVALID_CODE"] * 4 + ["CODE_ATTEMPTS_EXCEEDED"]
        assert verify(client, "ana@example.com", code).json()["detail"]["code"] == "INVALID_CODE"
        assert db.query(Users).filter(Users.email == "ana@example.com").one().verified is False

    def test_verified_account_cannot_request_codes(self, client, db, outbox):
        make_verified_user(db)

        response = resend(client, "ana@example.com")

        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "EMAIL_ALREADY_VERIFIED"
        assert outbox == []

    def test_send_limit_per_account_per_hour(self, client, db, outbox):
        register_user(client)
        statuses = []
        for _ in range(CodeService.SEND_LIMIT_PER_ADDRESS + 1):
            age(db, "ana@example.com", TypeCode.VERIFY_EMAIL)
            statuses.append(resend(client, "ana@example.com"))

        assert [r.status_code for r in statuses] == [200] * CodeService.SEND_LIMIT_PER_ADDRESS + [429]
        assert statuses[-1].json()["detail"]["code"] == "CODE_SEND_LIMIT_EXCEEDED"
        assert "Retry-After" in statuses[-1].headers
        assert len(outbox) == 1 + CodeService.SEND_LIMIT_PER_ADDRESS

    def test_simultaneous_resends_send_one_code(self, client, db, engine, outbox):
        register_user(client)
        age(db, "ana@example.com", TypeCode.VERIFY_EMAIL)
        outbox.clear()
        Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
        start = threading.Barrier(3, timeout=10)

        def attempt(_):
            session = Session()
            start.wait()
            try:
                resend_verification_code_service(ResendVerificationCodeRequest(email="ana@example.com"), session)
                return 200
            except HTTPException as error:
                return error.status_code
            finally:
                session.close()

        with ThreadPoolExecutor(max_workers=3) as pool:
            statuses = sorted(pool.map(attempt, range(3)))

        assert statuses == [200, 429, 429]
        assert len(codes_of(db, "ana@example.com", TypeCode.VERIFY_EMAIL)) == 1
        assert len(outbox) == 1

    def test_smtp_failure_keeps_the_new_code_and_answers_normally(self, client, db, outbox):
        register_user(client)
        age(db, "ana@example.com", TypeCode.VERIFY_EMAIL)
        outbox.fail = True

        response = resend(client, "ana@example.com")

        assert response.status_code == 200
        assert len(codes_of(db, "ana@example.com", TypeCode.VERIFY_EMAIL)) == 1

    def test_failed_transaction_sends_no_email_and_keeps_the_previous_code(self, client, db, outbox, monkeypatch):
        register_user(client)
        previous = code_of(db, "ana@example.com", TypeCode.VERIFY_EMAIL)
        age(db, "ana@example.com", TypeCode.VERIFY_EMAIL)
        outbox.clear()

        def broken_state(*args, **kwargs):
            raise RuntimeError("fallo simulado antes del commit")

        monkeypatch.setattr(CodeService, "verification_state", broken_state)
        response = resend(client, "ana@example.com")

        assert response.status_code == 500
        assert outbox == []
        assert code_of(db, "ana@example.com", TypeCode.VERIFY_EMAIL) == previous

    def test_code_never_appears_in_responses_or_logs(self, client, db, caplog):
        caplog.set_level(logging.DEBUG)
        first = register_user(client)
        age(db, "ana@example.com", TypeCode.VERIFY_EMAIL)
        second = resend(client, "ana@example.com")
        code = code_of(db, "ana@example.com", TypeCode.VERIFY_EMAIL)

        assert code not in first.text and code not in second.text
        assert code not in caplog.text


class TestCompanyRegistration:
    def test_resend_keeps_the_company_pending_and_unduplicated(self, client, db, nas, outbox):
        assert register_company(client).status_code == 200
        age(db, "tienda@example.com", TypeCode.VERIFY_EMAIL)

        response = resend(client, "tienda@example.com")

        assert response.status_code == 200
        assert [m["to"] for m in outbox] == ["tienda@example.com", "tienda@example.com"]
        assert db.query(Users).filter(Users.email == "tienda@example.com").count() == 1
        company = db.query(Company).one()
        assert company.CompanyCertificateStatus == CompanyCertificateEnum.PENDING

        assert verify(client, "tienda@example.com", code_of(db, "tienda@example.com", TypeCode.VERIFY_EMAIL)).status_code == 200
        db.expire_all()
        assert db.query(Company).one().CompanyCertificateStatus == CompanyCertificateEnum.PENDING

    def test_company_resend_respects_the_cooldown(self, client, db, nas):
        register_company(client)

        assert resend(client, "tienda@example.com").status_code == 429


class TestPasswordRecovery:
    def test_unknown_email_gets_the_same_answer_and_no_email(self, client, db, outbox):
        make_verified_user(db)

        known = forgot(client, "ana@example.com")
        unknown = forgot(client, "nadie@example.com")

        assert known.status_code == unknown.status_code == 200
        assert known.json() == unknown.json()
        assert [m["to"] for m in outbox] == ["ana@example.com"]
        assert db.query(Users).count() == 1

    def test_cooldown_answers_the_same_for_known_and_unknown_emails(self, client, db, outbox):
        make_verified_user(db)
        forgot(client, "ana@example.com")
        forgot(client, "nadie@example.com")

        known = forgot(client, "ana@example.com")
        unknown = forgot(client, "nadie@example.com")

        assert known.status_code == unknown.status_code == 429
        assert known.json()["detail"]["code"] == unknown.json()["detail"]["code"] == "RESEND_COOLDOWN_ACTIVE"
        assert len(outbox) == 1

    def test_resend_after_cooldown_invalidates_the_previous_code(self, client, db, outbox, monkeypatch):
        make_verified_user(db)
        forgot(client, "ana@example.com")
        first = code_of(db, "ana@example.com", TypeCode.RESET_PASSWORD)
        age(db, "ana@example.com", TypeCode.RESET_PASSWORD)
        monkeypatch.setattr("app.middleware.RateLimitMiddleware.requests", __import__("collections").defaultdict(list))

        assert forgot(client, "ana@example.com").status_code == 200
        second = code_of(db, "ana@example.com", TypeCode.RESET_PASSWORD)
        assert len(outbox) == 2

        if first != second:
            assert reset(client, "ana@example.com", first).json()["detail"]["code"] == "INVALID_CODE"
        assert reset(client, "ana@example.com", second).status_code == 200
        assert client.post("/auth/login-user", json={"email": "ana@example.com", "password": NEW_PASSWORD}).status_code == 200

    def test_used_code_cannot_reset_twice(self, client, db):
        make_verified_user(db)
        forgot(client, "ana@example.com")
        code = code_of(db, "ana@example.com", TypeCode.RESET_PASSWORD)

        assert reset(client, "ana@example.com", code).status_code == 200
        again = reset(client, "ana@example.com", code, password="TerceraClave789")
        assert again.status_code == 400
        assert again.json()["detail"]["code"] == "INVALID_CODE"

    def test_expired_code_does_not_reset_or_send_another_email(self, client, db, outbox):
        make_verified_user(db)
        forgot(client, "ana@example.com")
        code = code_of(db, "ana@example.com", TypeCode.RESET_PASSWORD)
        age(db, "ana@example.com", TypeCode.RESET_PASSWORD, expire=True)

        response = reset(client, "ana@example.com", code)

        assert response.json()["detail"]["code"] == "CODE_EXPIRED"
        assert len(outbox) == 1

    def test_reset_for_unknown_email_looks_like_a_wrong_code(self, client, db):
        make_verified_user(db)
        forgot(client, "ana@example.com")

        unknown = reset(client, "nadie@example.com", "123456")
        wrong = reset(client, "ana@example.com", "abcdef")

        assert unknown.status_code == wrong.status_code == 400
        assert unknown.json() == wrong.json()

    def test_reset_attempts_are_limited(self, client, db):
        make_verified_user(db)
        forgot(client, "ana@example.com")
        code = code_of(db, "ana@example.com", TypeCode.RESET_PASSWORD)

        for _ in range(5):
            last = reset(client, "ana@example.com", "abcdef")

        assert last.status_code == 429
        assert last.json()["detail"]["code"] == "CODE_ATTEMPTS_EXCEEDED"
        assert reset(client, "ana@example.com", code).json()["detail"]["code"] == "INVALID_CODE"

    def test_send_limit_per_email_applies_to_unknown_emails_too(self, client, db, monkeypatch):
        statuses = []
        for _ in range(CodeService.SEND_LIMIT_PER_ADDRESS + 1):
            # Solo se salta el cooldown de 60 s para llegar al tope horario.
            store = __import__("app.middleware.RateLimitMiddleware", fromlist=["requests"]).requests
            store.pop("code-cooldown:reset:nadie@example.com", None)
            statuses.append(forgot(client, "nadie@example.com"))

        assert [r.status_code for r in statuses] == [200] * CodeService.SEND_LIMIT_PER_ADDRESS + [429]
        assert statuses[-1].json()["detail"]["code"] == "CODE_SEND_LIMIT_EXCEEDED"

    def test_reset_code_never_appears_in_the_response_or_logs(self, client, db, caplog):
        caplog.set_level(logging.DEBUG)
        make_verified_user(db)
        response = forgot(client, "ana@example.com")
        code = code_of(db, "ana@example.com", TypeCode.RESET_PASSWORD)

        assert code not in response.text
        assert code not in caplog.text


def test_codes_are_six_ascii_digits_from_a_secure_source(monkeypatch):
    calls = []
    monkeypatch.setattr(CodeService.secrets, "choice", lambda seq: calls.append(seq) or "7")

    assert CodeService.generate_code() == "777777"
    assert len(calls) == 6
