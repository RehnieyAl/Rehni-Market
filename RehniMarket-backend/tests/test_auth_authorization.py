"""Pruebas de autenticación y autorización por dependencias: errores 401/403/500, aislamiento por
rol, rol leído de la base de datos y guarda para que ninguna ruta protegida quede pública."""

import inspect
from datetime import datetime, timedelta, UTC

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.models.ModelCompany import CompanyCertificateEnum

from app.services.authentication.JWTService import (
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    create_refresh_token,
)
from tests.conftest import auth

ADMIN_ENDPOINT = "/admin/dashboard/get-users"
COMPANY_ENDPOINT = "/company/dashboard/orders"
USER_ENDPOINT = "/cart"


class TestRoleIsolation:
    def test_company_cannot_reach_admin_area(self, client, tokens):
        response = client.get(ADMIN_ENDPOINT, headers=auth(tokens["company"]))

        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "FORBIDDEN"

    def test_user_cannot_reach_admin_area(self, client, tokens):
        response = client.get(ADMIN_ENDPOINT, headers=auth(tokens["user"]))

        assert response.status_code == 403

    def test_user_cannot_reach_company_area(self, client, tokens):
        response = client.get(COMPANY_ENDPOINT, headers=auth(tokens["user"]))

        assert response.status_code == 403

    def test_company_cannot_reach_user_area(self, client, tokens):
        response = client.get(USER_ENDPOINT, headers=auth(tokens["company"]))

        assert response.status_code == 403

    def test_admin_reaches_admin_area(self, client, tokens):
        response = client.get(ADMIN_ENDPOINT, headers=auth(tokens["admin"]))

        assert response.status_code == 200

    def test_owner_reaches_admin_area(self, client, tokens):
        response = client.get(ADMIN_ENDPOINT, headers=auth(tokens["owner"]))

        assert response.status_code == 200

    def test_user_reaches_user_area(self, client, tokens):
        response = client.get(USER_ENDPOINT, headers=auth(tokens["user"]))

        assert response.status_code not in (401, 403)

    def test_missing_token_is_rejected(self, client):
        assert client.get(ADMIN_ENDPOINT).status_code == 401


class TestDatabaseRoleIsAuthoritative:
    @pytest.fixture()
    def forged_admin_token(self, users):
        return create_access_token(str(users["user"].id), "admin")

    def test_stale_admin_claim_does_not_grant_admin_access(
        self, client, forged_admin_token
    ):
        response = client.get(ADMIN_ENDPOINT, headers=auth(forged_admin_token))

        assert response.status_code == 403

    def test_stale_admin_claim_keeps_real_user_access(
        self, client, forged_admin_token
    ):
        response = client.get(USER_ENDPOINT, headers=auth(forged_admin_token))

        assert response.status_code not in (401, 403)

    def test_me_reports_database_role_not_token_claim(
        self, client, forged_admin_token
    ):
        response = client.get("/auth/me", headers=auth(forged_admin_token))

        assert response.status_code == 200
        assert response.json()["role"] == "user"


class TestMeReflectsCurrentUser:
    def test_me_returns_role_of_token_owner(self, client, tokens):
        for role in ("user", "company", "admin", "owner"):
            response = client.get("/auth/me", headers=auth(tokens[role]))

            assert response.status_code == 200
            assert response.json()["role"] == role


class TestTokenErrors:
    def test_missing_token_returns_unauthorized(self, client):
        response = client.get(USER_ENDPOINT)

        assert response.status_code == 401
        assert response.json()["detail"] == {"code": "UNAUTHORIZED", "message": "Token requerido"}

    @pytest.mark.parametrize("header", ["Bearer", "Basic abc", "Bearer a b"])
    def test_malformed_header_returns_invalid_token(self, client, header):
        response = client.get(USER_ENDPOINT, headers={"Authorization": header})

        assert response.status_code == 401
        assert response.json()["detail"]["code"] == "INVALID_TOKEN"

    def test_garbage_token_returns_invalid_token(self, client):
        response = client.get(USER_ENDPOINT, headers=auth("no-es-un-jwt"))

        assert response.status_code == 401
        assert response.json()["detail"]["code"] == "INVALID_TOKEN"

    def test_expired_token_returns_token_expired(self, client, users):
        expired = jwt.encode(
            {
                "sub": str(users["user"].id),
                "role": "user",
                "type": "access",
                "exp": datetime.now(UTC) - timedelta(minutes=1),
            },
            SECRET_KEY,
            algorithm=ALGORITHM,
        )

        response = client.get(USER_ENDPOINT, headers=auth(expired))

        assert response.status_code == 401
        assert response.json()["detail"]["code"] == "TOKEN_EXPIRED"

    def test_refresh_token_is_not_an_access_token(self, client, users):
        response = client.get(USER_ENDPOINT, headers=auth(create_refresh_token(str(users["user"].id))))

        assert response.status_code == 401
        assert response.json()["detail"]["message"] == "Access token requerido"

    def test_blocked_user_is_rejected(self, client, db, users, tokens):
        users["user"].isActive = False
        db.commit()

        response = client.get("/auth/me", headers=auth(tokens["user"]))

        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "USER_BLOCKED"

    def test_deleted_user_returns_invalid_token(self, client, db, users, tokens):
        db.delete(users["user"])
        db.commit()

        response = client.get("/auth/me", headers=auth(tokens["user"]))

        assert response.status_code == 401
        assert response.json()["detail"]["message"] == "Usuario no encontrado"

    def test_database_outage_is_not_an_auth_error(self, client, tokens, monkeypatch):
        def outage(user_id):
            raise OperationalError("SELECT 1", {}, Exception("pool agotado"))

        monkeypatch.setattr("app.core.AuthDependencies._load_user", outage)

        response = client.get("/auth/me", headers=auth(tokens["user"]))

        assert response.status_code == 503
        assert response.headers["Retry-After"] == "5"
        assert response.json()["detail"]["code"] == "DATABASE_ERROR"


class TestCompanyStatus:
    def test_suspended_company_is_blocked_everywhere(self, client, db, company, tokens):
        company.CompanyStatus = False
        company.suspension_reason = "Ventas fraudulentas"
        db.commit()

        response = client.get("/auth/me", headers=auth(tokens["company"]))

        assert response.status_code == 403
        assert response.json()["detail"] == {
            "code": "COMPANY_SUSPENDED",
            "message": "Tu empresa se encuentra suspendida.",
            "reason": "Ventas fraudulentas",
        }

    @pytest.mark.parametrize(
        "status, code",
        [
            (CompanyCertificateEnum.PENDING, "COMPANY_PENDING"),
            (CompanyCertificateEnum.REJECTED, "COMPANY_REJECTED"),
            (CompanyCertificateEnum.NEEDS_UPDATE, "COMPANY_CERTIFICATE_INVALID"),
        ],
    )
    def test_unapproved_company_only_reaches_its_status_routes(
        self, client, db, company, tokens, status, code
    ):
        company.CompanyCertificateStatus = status
        company.rejection_reason = "NIT ilegible"
        db.commit()
        headers = auth(tokens["company"])

        assert client.get("/auth/me", headers=headers).status_code == 200
        assert client.get("/company/dashboard/me", headers=headers).status_code == 200
        blocked = client.get(COMPANY_ENDPOINT, headers=headers)
        assert blocked.status_code == 403
        assert blocked.json()["detail"]["code"] == code
        assert blocked.json()["detail"]["reason"] == "NIT ilegible"


class TestExplicitRolesPerEndpoint:
    @pytest.mark.parametrize("role", ["admin", "owner"])
    def test_admin_roles_do_not_bypass_buyer_endpoints(self, client, tokens, role):
        response = client.get(USER_ENDPOINT, headers=auth(tokens[role]))

        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "FORBIDDEN"

    @pytest.mark.parametrize("role", ["admin", "owner"])
    def test_admin_roles_do_not_bypass_company_endpoints(self, client, tokens, role):
        response = client.get(COMPANY_ENDPOINT, headers=auth(tokens[role]))

        assert response.status_code == 403

    def test_admin_keeps_owner_only_message_on_payouts(self, client, tokens):
        response = client.get("/admin/payouts", headers=auth(tokens["admin"]))

        assert response.status_code == 403
        assert response.json()["detail"]["message"] == "Solo el propietario puede gestionar liquidaciones."

    def test_owner_reaches_payouts(self, client, tokens):
        response = client.get("/admin/payouts", headers=auth(tokens["owner"]))

        assert response.status_code == 200

    @pytest.mark.parametrize("role", ["user", "company"])
    def test_only_admin_roles_recharge_wallets(self, client, tokens, role):
        response = client.post(
            "/wallet/recharge", json={}, headers=auth(tokens[role])
        )

        assert response.status_code == 403

    def test_auth_is_checked_before_body_validation(self, client):
        assert client.post("/cart/add", json={}).status_code == 401


class TestUnexpectedErrors:
    def test_unhandled_error_returns_generic_500(self, client, tokens, monkeypatch):
        def boom(*args, **kwargs):
            raise RuntimeError("detalle interno que no debe salir")

        monkeypatch.setattr("app.routers.WalletRouter.get_my_wallet_service", boom)
        no_raise = TestClient(client.app, raise_server_exceptions=False)

        response = no_raise.get("/wallet/me", headers=auth(tokens["user"]))

        assert response.status_code == 500
        assert response.json()["detail"] == {
            "code": "INTERNAL_SERVER_ERROR",
            "message": "Error interno del servidor.",
        }


PUBLIC_PATHS = {
    "/auth/register-user",
    "/auth/register-company",
    "/auth/verify-email-user",
    "/auth/change-email",
    "/auth/resend-verification-code",
    "/auth/login-user",
    "/auth/forgot-password-user",
    "/auth/reset-password-user",
    "/auth/refresh",
    "/media/proxy",
    "/media/private",
    "/company/certificate/update",
    "/health/database",
    "/health/internet",
}
DOCS_PATHS = {"/docs", "/docs/oauth2-redirect", "/redoc", "/openapi.json"}


def _role_guard(dependant):
    for dependency in dependant.dependencies:
        if getattr(dependency.call, "__qualname__", "") == "require_role.<locals>.dependency":
            return inspect.getclosurevars(dependency.call).nonlocals["allowed"]
        found = _role_guard(dependency)
        if found:
            return found
    return None


class TestNoProtectedRouteIsPublic:
    def test_every_non_public_route_requires_a_role(self, client):
        unguarded = [
            route.path
            for route in client.app.routes
            if hasattr(route, "dependant")
            and route.path not in PUBLIC_PATHS | DOCS_PATHS
            and not route.path.startswith("/public/")
            and _role_guard(route.dependant) is None
        ]

        assert unguarded == []

    def test_public_routes_have_no_role_guard(self, client):
        guarded_public = [
            route.path
            for route in client.app.routes
            if hasattr(route, "dependant")
            and (route.path in PUBLIC_PATHS or route.path.startswith("/public/"))
            and _role_guard(route.dependant) is not None
        ]

        assert guarded_public == []

    def test_openapi_marks_protected_routes_with_bearer(self, client):
        schema = client.app.openapi()

        assert schema["components"]["securitySchemes"]["HTTPBearer"] == {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
        assert schema["paths"]["/cart"]["get"]["security"] == [{"HTTPBearer": []}]
        assert "security" not in schema["paths"]["/public/products"]["get"]
