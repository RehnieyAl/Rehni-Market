"""Flujo de certificación de empresas: rechazo / "certificado inválido" con razón
obligatoria, login por rol y estado de certificado (NEEDS_UPDATE y REJECTED se
interrumpen SIN emitir JWT), y reemplazo del certificado (solo permitido en
NEEDS_UPDATE, nunca aprueba automáticamente)."""

import pytest

from app.models.ModelCompany import Company, CompanyCertificateEnum
from app.models.ModelUser import Users
from app.services.NasService import get_nas_service
from app.utils.Security import hash_password
from tests.conftest import auth

CERT_STATUS_URL = "/admin/dashboard/companies/certificate/status/{}"
MY_PROFILE_URL = "/company/dashboard/my-profile"
REPLACE_CERT_URL = "/company/certificate"


class _FakeNas:
    """Evita tocar MinIO en los tests; devuelve rutas deterministas."""

    def __init__(self):
        self.deleted = []
        self._n = 0

    def upload_file(self, file, path: str):
        self._n += 1
        return {
            "success": True,
            "object_name": f"{path}fake{self._n}.pdf",
            "path": f"uploads/{path}fake{self._n}.pdf",
        }

    def delete_file(self, object_name: str):
        self.deleted.append(object_name)
        return {"success": True}


@pytest.fixture()
def nas(client):
    fake = _FakeNas()
    client.app.dependency_overrides[get_nas_service] = lambda: fake
    yield fake
    client.app.dependency_overrides.pop(get_nas_service, None)


def _pdf(name="certificado.pdf"):
    return {"certificate": (name, b"%PDF-1.4 fake certificate", "application/pdf")}


def _reject(client, tokens, company_id, reason=None):
    payload = {"status": "rejected"}
    if reason is not None:
        payload["reason"] = reason
    return client.patch(
        CERT_STATUS_URL.format(company_id),
        json=payload,
        headers=auth(tokens["admin"]),
    )


def _needs_update(client, tokens, company_id, reason=None):
    """Marca el certificado como inválido (la empresa debe subir uno nuevo)."""
    payload = {"status": "needs_update"}
    if reason is not None:
        payload["reason"] = reason
    return client.patch(
        CERT_STATUS_URL.format(company_id),
        json=payload,
        headers=auth(tokens["admin"]),
    )


def _approve(client, tokens, company_id):
    return client.patch(
        CERT_STATUS_URL.format(company_id),
        json={"status": "approved"},
        headers=auth(tokens["admin"]),
    )


class TestAdminRejectionRequiresReason:
    def test_reject_without_reason_is_rejected(self, client, tokens, company):
        response = _reject(client, tokens, company.id)

        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "MISSING_REQUIRED_FIELD"

    def test_reject_with_blank_reason_is_rejected(self, client, tokens, company):
        response = _reject(client, tokens, company.id, reason="   ")

        assert response.status_code == 400

    def test_reject_with_reason_stores_it(self, client, tokens, company, db):
        response = _reject(client, tokens, company.id, reason="Documento ilegible")

        assert response.status_code == 200
        body = response.json()
        assert body["certificate_status"] == "rejected"
        assert body["rejection_reason"] == "Documento ilegible"

        db.refresh(company)
        assert company.CompanyCertificateStatus.value == "rejected"
        assert company.rejection_reason == "Documento ilegible"

    def test_approve_clears_previous_rejection_reason(self, client, tokens, company, db):
        _reject(client, tokens, company.id, reason="Falta firma")

        response = _approve(client, tokens, company.id)

        assert response.status_code == 200
        assert response.json()["rejection_reason"] is None

        db.refresh(company)
        assert company.CompanyCertificateStatus.value == "approved"
        assert company.rejection_reason is None


class TestAdminNeedsUpdate:
    """status=needs_update: el certificado es inválido y la empresa debe subir uno nuevo.
    Es una acción distinta de 'rejected' (que es terminal)."""

    def test_needs_update_without_reason_is_rejected(self, client, tokens, company):
        response = client.patch(
            CERT_STATUS_URL.format(company.id),
            json={"status": "needs_update"},
            headers=auth(tokens["admin"]),
        )

        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "MISSING_REQUIRED_FIELD"

    def test_needs_update_with_blank_reason_is_rejected(self, client, tokens, company):
        assert _needs_update(client, tokens, company.id, reason="   ").status_code == 400

    def test_needs_update_stores_status_and_reason(self, client, tokens, company, db):
        response = _needs_update(
            client, tokens, company.id, reason="El PDF está ilegible"
        )

        assert response.status_code == 200
        body = response.json()
        assert body["certificate_status"] == "needs_update"
        assert body["rejection_reason"] == "El PDF está ilegible"

        db.refresh(company)
        assert company.CompanyCertificateStatus.value == "needs_update"
        assert company.rejection_reason == "El PDF está ilegible"

    def test_approve_clears_needs_update_reason(self, client, tokens, company, db):
        _needs_update(client, tokens, company.id, reason="Vencido")

        assert _approve(client, tokens, company.id).status_code == 200

        db.refresh(company)
        assert company.CompanyCertificateStatus.value == "approved"
        assert company.rejection_reason is None

    def test_invalid_status_value_is_rejected(self, client, tokens, company):
        response = client.patch(
            CERT_STATUS_URL.format(company.id),
            json={"status": "banana", "reason": "x"},
            headers=auth(tokens["admin"]),
        )
        # Literal del schema -> 422; si llegara al servicio -> 400 INVALID_STATUS.
        assert response.status_code in (400, 422)


LOGIN_URL = "/auth/login-user"
VALID_PWD = "secret123"


def _make_role_user(db, role_name, email, *, with_company=False, cert_status=None, reason=None):
    """Crea un usuario (y opcionalmente su empresa) con un email de dominio válido
    — el conftest usa `.local`, que `EmailStr` rechaza, y aquí sí se prueba el
    endpoint real de login."""
    from app.models.ModelRole import Role

    role = db.query(Role).filter(Role.name == role_name).first()
    user = Users(
        fullName=f"{role_name} valido",
        email=email,
        hashed_password=hash_password(VALID_PWD),
        tell="3000009999",
        verified=True,
        role_id=role.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    company = None
    if with_company:
        company = Company(
            nameCompany="Login Co",
            addressCompany="Calle 9",
            CompanyNIT="900555111",
            CompanyNITDV="9",
            user_id=user.id,
        )
        if cert_status is not None:
            company.CompanyCertificateStatus = cert_status
        if reason is not None:
            company.rejection_reason = reason
        db.add(company)
        db.commit()
        db.refresh(company)

    return user, company


def _login(client, email, password=VALID_PWD):
    return client.post(LOGIN_URL, json={"email": email, "password": password})


class TestLoginByRoleAndCertificate:
    """POST /auth/login-user: qué roles/estados obtienen JWT y cuáles no."""

    def test_user_login_returns_jwt(self, client, db):
        _make_role_user(db, "user", "buyer@rehni.co")
        body = _login(client, "buyer@rehni.co").json()
        assert body["role"] == "user"
        assert body["access_token"] and body["refresh_token"]

    def test_admin_login_returns_jwt(self, client, db):
        _make_role_user(db, "admin", "adminx@rehni.co")
        body = _login(client, "adminx@rehni.co").json()
        assert body["role"] == "admin"
        assert body["access_token"] and body["refresh_token"]

    def test_owner_login_returns_jwt(self, client, db):
        _make_role_user(db, "owner", "ownerx@rehni.co")
        body = _login(client, "ownerx@rehni.co").json()
        assert body["role"] == "owner"
        assert body["access_token"] and body["refresh_token"]

    def test_company_approved_login_returns_jwt(self, client, db):
        _make_role_user(
            db, "company", "approved@rehni.co",
            with_company=True, cert_status=CompanyCertificateEnum.APPROVED,
        )
        body = _login(client, "approved@rehni.co").json()
        assert body["role"] == "company"
        assert body["access_token"] and body["refresh_token"]

    def test_company_rejected_login_blocked_without_jwt(self, client, db):
        """REJECTED es terminal: el login se interrumpe SIN emitir tokens; el
        frontend muestra el modal 'Empresa rechazada' con el motivo real."""
        _make_role_user(
            db, "company", "rej@rehni.co",
            with_company=True, cert_status=CompanyCertificateEnum.REJECTED,
            reason="Empresa no elegible",
        )
        resp = _login(client, "rej@rehni.co")

        assert resp.status_code == 403
        detail = resp.json()["detail"]
        assert detail["code"] == "COMPANY_REJECTED"
        assert detail["reason"] == "Empresa no elegible"
        assert "access_token" not in resp.json()
        assert "refresh_token" not in resp.json()

    def test_company_pending_login_blocked(self, client, db):
        _make_role_user(
            db, "company", "pend@rehni.co",
            with_company=True, cert_status=CompanyCertificateEnum.PENDING,
        )
        resp = _login(client, "pend@rehni.co")
        assert resp.status_code == 403
        assert resp.json()["detail"]["code"] == "COMPANY_PENDING"

    def test_company_needs_update_login_blocked_without_jwt(self, client, db):
        _make_role_user(
            db, "company", "needs@rehni.co",
            with_company=True, cert_status=CompanyCertificateEnum.NEEDS_UPDATE,
            reason="Certificado ilegible",
        )
        resp = _login(client, "needs@rehni.co")

        assert resp.status_code == 403
        detail = resp.json()["detail"]
        assert detail["code"] == "COMPANY_CERTIFICATE_INVALID"
        assert detail["reason"] == "Certificado ilegible"
        # nunca se emite ningún token
        assert "access_token" not in resp.json()
        assert "refresh_token" not in resp.json()

    def test_needs_update_cannot_obtain_jwt_via_login(self, client, db):
        _make_role_user(
            db, "company", "needs2@rehni.co",
            with_company=True, cert_status=CompanyCertificateEnum.NEEDS_UPDATE,
            reason="x",
        )
        body = _login(client, "needs2@rehni.co").json()
        assert "access_token" not in body and "refresh_token" not in body and "role" not in body

    def test_wrong_password_does_not_reveal_certificate_status(self, client, db):
        _make_role_user(
            db, "company", "needs3@rehni.co",
            with_company=True, cert_status=CompanyCertificateEnum.NEEDS_UPDATE,
            reason="x",
        )
        resp = _login(client, "needs3@rehni.co", password="incorrecta")

        assert resp.status_code == 400
        detail = resp.json()["detail"]
        assert detail["code"] == "INVALID_CREDENTIALS"
        assert "reason" not in detail
        assert detail["code"] != "COMPANY_CERTIFICATE_INVALID"


class TestCompanyReadsRejectionReason:
    def test_my_profile_shows_status_and_reason(self, client, tokens, company):
        _reject(client, tokens, company.id, reason="NIT no coincide")

        response = client.get(MY_PROFILE_URL, headers=auth(tokens["company"]))

        assert response.status_code == 200
        body = response.json()
        assert body["certificateStatus"] == "rejected"
        assert body["rejectionReason"] == "NIT no coincide"

    def test_my_profile_shows_needs_update_status_and_reason(self, client, tokens, company):
        _needs_update(client, tokens, company.id, reason="Certificado vencido")

        response = client.get(MY_PROFILE_URL, headers=auth(tokens["company"]))

        assert response.status_code == 200
        body = response.json()
        assert body["certificateStatus"] == "needs_update"
        assert body["rejectionReason"] == "Certificado vencido"


class TestReplaceCertificate:
    def test_replace_requires_rejected_status_pending(
        self, client, tokens, company, nas, db
    ):
        company.CompanyCertificateStatus = CompanyCertificateEnum.PENDING
        db.commit()

        response = client.put(
            REPLACE_CERT_URL, files=_pdf(), headers=auth(tokens["company"])
        )

        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "COMPANY_PENDING"

    def test_replace_requires_rejected_status_approved(self, client, tokens, company, nas):
        # company fixture ya nace APPROVED
        response = client.put(
            REPLACE_CERT_URL, files=_pdf(), headers=auth(tokens["company"])
        )

        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "COMPANY_APPROVED"

    def test_replace_blocked_when_company_terminally_rejected(
        self, client, tokens, company, nas, db
    ):
        _reject(client, tokens, company.id, reason="Empresa no elegible")

        response = client.put(
            REPLACE_CERT_URL, files=_pdf(), headers=auth(tokens["company"])
        )

        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "COMPANY_REJECTED"

        db.refresh(company)
        assert company.CompanyCertificateStatus.value == "rejected"

    def test_replace_rejects_non_pdf_file(self, client, tokens, company, nas):
        _needs_update(client, tokens, company.id, reason="x")

        response = client.put(
            REPLACE_CERT_URL,
            files={"certificate": ("cert.png", b"\x89PNG", "image/png")},
            headers=auth(tokens["company"]),
        )

        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "INVALID_FILE"

    def test_replace_updates_file_and_resets_to_pending(
        self, client, tokens, company, nas, db
    ):
        _needs_update(client, tokens, company.id, reason="Documento vencido")
        old_certificate = company.CompanyCertificate

        response = client.put(
            REPLACE_CERT_URL, files=_pdf(), headers=auth(tokens["company"])
        )

        assert response.status_code == 200
        body = response.json()
        assert body["certificate_status"] == "pending"

        db.refresh(company)
        assert company.CompanyCertificateStatus.value == "pending"
        assert company.rejection_reason is None
        assert company.CompanyCertificate != old_certificate
        assert company.CompanyStatus is True  # no queda aprobada automáticamente

    def test_replace_does_not_touch_another_companys_certificate(
        self, client, tokens, company, nas, db, users
    ):
        role = users["company"].role

        other_user = Users(
            fullName="Otra empresa",
            email="other-company@test.local",
            hashed_password=hash_password("secret123"),
            tell="3000000001",
            verified=True,
            role_id=role.id,
        )
        db.add(other_user)
        db.commit()
        db.refresh(other_user)

        other_company = Company(
            nameCompany="Otra Co",
            addressCompany="Calle 2",
            CompanyNIT="900999999",
            CompanyNITDV="1",
            user_id=other_user.id,
        )
        db.add(other_company)
        db.commit()
        db.refresh(other_company)

        _needs_update(client, tokens, company.id, reason="x")
        _needs_update(client, tokens, other_company.id, reason="y")

        response = client.put(
            REPLACE_CERT_URL, files=_pdf(), headers=auth(tokens["company"])
        )

        assert response.status_code == 200

        db.refresh(other_company)
        assert other_company.CompanyCertificateStatus.value == "needs_update"
        assert other_company.rejection_reason == "y"

    def test_company_cannot_call_admin_status_endpoint(self, client, tokens, company):
        response = client.patch(
            CERT_STATUS_URL.format(company.id),
            json={"status": "approved"},
            headers=auth(tokens["company"]),
        )

        assert response.status_code == 403

    def test_admin_reviews_resubmitted_certificate(self, client, tokens, company, nas, db):
        _needs_update(client, tokens, company.id, reason="Documento vencido")
        client.put(REPLACE_CERT_URL, files=_pdf(), headers=auth(tokens["company"]))

        response = _approve(client, tokens, company.id)

        assert response.status_code == 200
        assert response.json()["certificate_status"] == "approved"

        db.refresh(company)
        assert company.CompanyCertificateStatus.value == "approved"
        assert company.rejection_reason is None


UPDATE_CERT_URL = "/company/certificate/update"

COMPANY_EMAIL = "company@test.local"
COMPANY_PASSWORD = "secret123"


def _big_pdf():
    return {
        "certificate": (
            "grande.pdf",
            b"%PDF-1.4" + b"0" * (5 * 1024 * 1024 + 64),
            "application/pdf",
        )
    }


def _update_cert(client, *, email=COMPANY_EMAIL, password=COMPANY_PASSWORD, files=None):
    return client.post(
        UPDATE_CERT_URL,
        data={"email": email, "password": password},
        files=files if files is not None else _pdf(),
    )


class TestCertificateUpdateWithCredentials:
    """POST /company/certificate/update — actualización por correo + contraseña, sin JWT."""

    def _flag_needs_update(self, client, tokens, company, db, reason="Certificado vencido."):
        assert _needs_update(client, tokens, company.id, reason=reason).status_code == 200
        db.refresh(company)

    def test_requires_email(self, client, company, nas):
        response = client.post(
            UPDATE_CERT_URL, data={"password": COMPANY_PASSWORD}, files=_pdf()
        )
        assert response.status_code == 422

    def test_requires_password(self, client, company, nas):
        response = client.post(
            UPDATE_CERT_URL, data={"email": COMPANY_EMAIL}, files=_pdf()
        )
        assert response.status_code == 422

    def test_requires_certificate_file(self, client, company, nas):
        response = client.post(
            UPDATE_CERT_URL,
            data={"email": COMPANY_EMAIL, "password": COMPANY_PASSWORD},
        )
        assert response.status_code == 422

    def test_correct_credentials_rejected_company_returns_200(
        self, client, tokens, company, nas, db
    ):
        self._flag_needs_update(client, tokens, company, db)

        response = _update_cert(client)

        assert response.status_code == 200, response.text
        body = response.json()
        assert body == {
            "message": "Certificado actualizado correctamente. Tu empresa volverá a revisión.",
            "certificateStatus": "pending",
        }

    def test_status_moves_to_pending_and_reason_is_cleared(
        self, client, tokens, company, nas, db
    ):
        self._flag_needs_update(client, tokens, company, db, reason="NIT no coincide")
        assert company.rejection_reason == "NIT no coincide"

        assert _update_cert(client).status_code == 200

        db.refresh(company)
        assert company.CompanyCertificateStatus.value == "pending"
        assert company.rejection_reason is None

    def test_certificate_reference_is_updated(self, client, tokens, company, nas, db):
        self._flag_needs_update(client, tokens, company, db)
        old_certificate = company.CompanyCertificate

        assert _update_cert(client).status_code == 200

        db.refresh(company)
        assert company.CompanyCertificate != old_certificate

    def test_response_has_no_jwt(self, client, tokens, company, nas, db):
        self._flag_needs_update(client, tokens, company, db)

        body = _update_cert(client).json()

        assert "access_token" not in body
        assert "refresh_token" not in body
        assert set(body.keys()) == {"message", "certificateStatus"}

    def test_wrong_email_is_rejected(self, client, tokens, company, nas, db):
        self._flag_needs_update(client, tokens, company, db)

        response = _update_cert(client, email="noexiste@test.local")

        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "INVALID_CREDENTIALS"

        db.refresh(company)
        assert company.CompanyCertificateStatus.value == "needs_update"

    def test_wrong_password_is_rejected(self, client, tokens, company, nas, db):
        self._flag_needs_update(client, tokens, company, db)

        response = _update_cert(client, password="incorrecta")

        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "INVALID_CREDENTIALS"

        db.refresh(company)
        assert company.CompanyCertificateStatus.value == "needs_update"

    def test_account_without_company_is_rejected(self, client, tokens, company, nas, db):
        # users["user"] existe (user@test.local / secret123) pero no tiene empresa.
        response = _update_cert(client, email="user@test.local", password="secret123")

        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "INVALID_CREDENTIALS"

    def test_approved_company_cannot_update(self, client, tokens, company, nas, db):
        # el fixture nace APPROVED
        response = _update_cert(client)

        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "COMPANY_APPROVED"

    def test_pending_company_cannot_update(self, client, tokens, company, nas, db):
        company.CompanyCertificateStatus = CompanyCertificateEnum.PENDING
        db.commit()

        response = _update_cert(client)

        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "COMPANY_PENDING"

    def test_terminally_rejected_company_cannot_update(self, client, tokens, company, nas, db):
        assert _reject(client, tokens, company.id, reason="Empresa no elegible").status_code == 200
        db.refresh(company)

        response = _update_cert(client)

        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "COMPANY_REJECTED"

        db.refresh(company)
        assert company.CompanyCertificateStatus.value == "rejected"

    def test_non_pdf_file_is_rejected(self, client, tokens, company, nas, db):
        self._flag_needs_update(client, tokens, company, db)

        response = _update_cert(
            client, files={"certificate": ("cert.png", b"\x89PNG", "image/png")}
        )

        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "INVALID_FILE"

    def test_file_over_5mb_is_rejected(self, client, tokens, company, nas, db):
        self._flag_needs_update(client, tokens, company, db)

        response = _update_cert(client, files=_big_pdf())

        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "INVALID_FILE"

    def test_does_not_touch_another_company(self, client, tokens, company, nas, db, users):
        role = users["company"].role

        other_user = Users(
            fullName="Otra empresa",
            email="other-cert@test.local",
            hashed_password=hash_password("secret123"),
            tell="3000000031",
            verified=True,
            role_id=role.id,
        )
        db.add(other_user)
        db.commit()
        db.refresh(other_user)

        other_company = Company(
            nameCompany="Otra Co",
            addressCompany="Calle 3",
            CompanyNIT="900888777",
            CompanyNITDV="2",
            user_id=other_user.id,
        )
        db.add(other_company)
        db.commit()
        db.refresh(other_company)

        self._flag_needs_update(client, tokens, company, db)
        _reject(client, tokens, other_company.id, reason="otra razón")
        db.refresh(other_company)

        # empresa A actualiza con SUS credenciales
        assert _update_cert(client).status_code == 200

        db.refresh(other_company)
        assert other_company.CompanyCertificateStatus.value == "rejected"
        assert other_company.rejection_reason == "otra razón"

    def test_error_during_storage_rolls_back(
        self, client, tokens, company, nas, db, monkeypatch
    ):
        self._flag_needs_update(client, tokens, company, db)
        old_certificate = company.CompanyCertificate

        def _boom():
            raise RuntimeError("fallo simulado al guardar")

        monkeypatch.setattr(db, "commit", _boom)

        response = _update_cert(client)

        assert response.status_code == 500

        db.rollback()
        db.refresh(company)
        assert company.CompanyCertificateStatus.value == "needs_update"
        assert company.CompanyCertificate == old_certificate
        # el objeto recién subido a MinIO se limpió
        assert len(nas.deleted) == 1

    def test_no_company_id_field_accepted(self, client, tokens, company, nas, db, users):
        """Enviar company_id no cambia nada: la empresa se resuelve solo por credenciales."""
        role = users["company"].role
        other_user = Users(
            fullName="Empresa objetivo",
            email="target-cert@test.local",
            hashed_password=hash_password("secret123"),
            tell="3000000032",
            verified=True,
            role_id=role.id,
        )
        db.add(other_user)
        db.commit()
        db.refresh(other_user)
        other_company = Company(
            nameCompany="Target Co",
            addressCompany="Calle 4",
            CompanyNIT="900777666",
            CompanyNITDV="3",
            user_id=other_user.id,
        )
        db.add(other_company)
        db.commit()
        db.refresh(other_company)

        self._flag_needs_update(client, tokens, company, db)
        _reject(client, tokens, other_company.id, reason="x")
        db.refresh(other_company)

        response = client.post(
            UPDATE_CERT_URL,
            data={
                "email": COMPANY_EMAIL,
                "password": COMPANY_PASSWORD,
                "company_id": str(other_company.id),
            },
            files=_pdf(),
        )

        assert response.status_code == 200

        db.refresh(company)
        db.refresh(other_company)
        assert company.CompanyCertificateStatus.value == "pending"
        assert other_company.CompanyCertificateStatus.value == "rejected"
