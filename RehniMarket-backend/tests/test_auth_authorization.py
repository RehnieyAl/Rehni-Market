import pytest

from app.services.authentication.JWTService import create_access_token
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
