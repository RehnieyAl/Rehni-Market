"""JWT con PyJWT (#45): tokens válidos, vencidos o manipulados dan 401 (nunca 500) y los emitidos
por python-jose siguen siendo válidos, para no cerrar sesiones al desplegar."""
import base64
import json
import uuid
from datetime import datetime, timedelta, UTC

import jwt
import pytest

from app.services.authentication import JWTService
from app.services.authentication.JWTService import (
    create_access_token,
    create_refresh_token,
    verify_token,
)
from app.models.ModelUser import Users
from tests.conftest import auth

PROTECTED_URL = "/cart"
REFRESH_URL = "/auth/refresh"

# Emitidos con python-jose 3.5.0 (formato anterior a esta versión), vencen en 2099.
JOSE_SECRET = "secreto-de-prueba-solo-para-compatibilidad-jose"
JOSE_SUB = "6f1c2a7e-3b4d-4e5f-8a9b-0c1d2e3f4a5b"
JOSE_ACCESS = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZjFjMmE3ZS0zYjRkLTRlNWYtOGE5Yi0wYzFkMmUzZjRhNWIi"
    "LCJyb2xlIjoidXNlciIsInR5cGUiOiJhY2Nlc3MiLCJleHAiOjQwNzA5MDg4MDB9.iNPGaXCvo7rVo8tLAe-SXfW2ML5cZ6vu2SjWH3F78E0"
)
JOSE_REFRESH = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZjFjMmE3ZS0zYjRkLTRlNWYtOGE5Yi0wYzFkMmUzZjRhNWIi"
    "LCJ0eXBlIjoicmVmcmVzaCIsImV4cCI6NDA3MDkwODgwMH0.bdLlZF8K6BXFxSVL6_N-PDbC-4b_ertfRLg7wj63RP0"
)


def _b64(data: dict) -> str:
    raw = json.dumps(data, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _claims(user, **extra):
    claims = {
        "sub": str(user.id),
        "role": "user",
        "type": "access",
        "exp": datetime.now(UTC) + timedelta(minutes=5),
    }
    claims.update(extra)
    return claims


def _expect_401(response):
    assert response.status_code == 401, response.text


class TestAccessToken:

    def test_valid_token_is_accepted(self, client, users):
        token = create_access_token(str(users["user"].id), "user")

        assert client.get(PROTECTED_URL, headers=auth(token)).status_code == 200

    def test_sub_is_always_a_string(self, users):
        token = create_access_token(users["user"].id, "user")

        assert verify_token(token)["sub"] == str(users["user"].id)

    def test_expired_token_gives_401(self, client, users):
        token = jwt.encode(
            _claims(users["user"], exp=datetime.now(UTC) - timedelta(seconds=1)),
            JWTService.SECRET_KEY,
            algorithm="HS256",
        )

        response = client.get(PROTECTED_URL, headers=auth(token))

        _expect_401(response)
        assert response.json()["detail"]["code"] == "TOKEN_EXPIRED"

    def test_tampered_signature_gives_401(self, client, users):
        token = create_access_token(str(users["user"].id), "user")
        header, payload, signature = token.split(".")
        tampered = f"{header}.{payload}.{signature[:-2]}{'AA' if signature[-2:] != 'AA' else 'BB'}"

        _expect_401(client.get(PROTECTED_URL, headers=auth(tampered)))

    def test_tampered_payload_gives_401(self, client, users):
        token = create_access_token(str(users["user"].id), "user")
        header, _, signature = token.split(".")
        forged = f"{header}.{_b64(_claims(users['user'], role='owner', exp=4070908800))}.{signature}"

        _expect_401(client.get(PROTECTED_URL, headers=auth(forged)))

    def test_alg_none_gives_401(self, client, users):
        claims = _claims(users["user"], exp=4070908800)
        token = f"{_b64({'alg': 'none', 'typ': 'JWT'})}.{_b64(claims)}."

        _expect_401(client.get(PROTECTED_URL, headers=auth(token)))

    @pytest.mark.parametrize("algorithm", ["HS512", "HS384"])
    def test_other_hmac_algorithm_gives_401(self, client, users, algorithm):
        token = jwt.encode(_claims(users["user"]), JWTService.SECRET_KEY, algorithm=algorithm)

        _expect_401(client.get(PROTECTED_URL, headers=auth(token)))

    def test_rs256_header_gives_401(self, client, users):
        claims = _claims(users["user"], exp=4070908800)
        token = f"{_b64({'alg': 'RS256', 'typ': 'JWT'})}.{_b64(claims)}.{'A' * 342}"

        _expect_401(client.get(PROTECTED_URL, headers=auth(token)))

    def test_missing_sub_gives_401(self, client, users):
        claims = _claims(users["user"])
        del claims["sub"]
        token = jwt.encode(claims, JWTService.SECRET_KEY, algorithm="HS256")

        _expect_401(client.get(PROTECTED_URL, headers=auth(token)))

    def test_sub_that_is_not_a_uuid_gives_401(self, client, users):
        token = jwt.encode(_claims(users["user"], sub="1"), JWTService.SECRET_KEY, algorithm="HS256")

        _expect_401(client.get(PROTECTED_URL, headers=auth(token)))

    def test_refresh_token_is_not_an_access_token(self, client, users):
        token = create_refresh_token(str(users["user"].id))

        _expect_401(client.get(PROTECTED_URL, headers=auth(token)))


class TestRefreshToken:

    def test_valid_refresh_returns_new_tokens(self, client, users):
        response = client.post(REFRESH_URL, json={"refresh_token": create_refresh_token(str(users["user"].id))})

        assert response.status_code == 200
        body = response.json()
        assert verify_token(body["access_token"])["type"] == "access"
        assert verify_token(body["refresh_token"])["type"] == "refresh"

    def test_expired_refresh_gives_401_not_500(self, client, users):
        token = jwt.encode(
            {"sub": str(users["user"].id), "type": "refresh", "exp": datetime.now(UTC) - timedelta(seconds=1)},
            JWTService.SECRET_KEY,
            algorithm="HS256",
        )

        response = client.post(REFRESH_URL, json={"refresh_token": token})

        _expect_401(response)
        assert response.json()["detail"]["code"] == "REFRESH_TOKEN_EXPIRED"

    @pytest.mark.parametrize("token", ["no-es-un-jwt", "a.b.c", ""])
    def test_malformed_refresh_gives_401(self, client, token):
        _expect_401(client.post(REFRESH_URL, json={"refresh_token": token}))

    def test_refresh_without_sub_gives_401(self, client):
        token = jwt.encode(
            {"type": "refresh", "exp": datetime.now(UTC) + timedelta(days=1)},
            JWTService.SECRET_KEY,
            algorithm="HS256",
        )

        _expect_401(client.post(REFRESH_URL, json={"refresh_token": token}))

    def test_access_token_is_not_a_refresh_token(self, client, users):
        token = create_access_token(str(users["user"].id), "user")

        _expect_401(client.post(REFRESH_URL, json={"refresh_token": token}))


class TestPythonJoseCompatibility:

    @pytest.fixture()
    def jose_secret(self, monkeypatch):
        monkeypatch.setattr(JWTService, "SECRET_KEY", JOSE_SECRET)

    @pytest.fixture()
    def jose_user(self, db, users):
        user = Users(
            id=uuid.UUID(JOSE_SUB),
            fullName="Sesión anterior",
            email="sesion.anterior@rehni.co",
            hashed_password="x",
            tell="3000000000",
            verified=True,
            role_id=users["user"].role_id,
        )
        db.add(user)
        db.commit()
        return user

    def test_payload_of_a_python_jose_token_is_read_unchanged(self, jose_secret):
        payload = verify_token(JOSE_ACCESS)

        assert payload["sub"] == JOSE_SUB
        assert payload["role"] == "user"
        assert payload["type"] == "access"

    def test_python_jose_access_token_still_opens_a_session(self, client, jose_secret, jose_user):
        assert client.get(PROTECTED_URL, headers=auth(JOSE_ACCESS)).status_code == 200

    def test_python_jose_refresh_token_still_renews_the_session(self, client, jose_secret, jose_user):
        response = client.post(REFRESH_URL, json={"refresh_token": JOSE_REFRESH})

        assert response.status_code == 200
        assert verify_token(response.json()["access_token"])["sub"] == JOSE_SUB
