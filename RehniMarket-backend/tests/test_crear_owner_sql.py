"""deploy/sql/crear-owner.sql (#54): crea un solo owner que inicia sesión y rechaza datos inválidos."""
import os
import shutil
import subprocess
from pathlib import Path

import pytest

from app.models.ModelUser import Users
from tests.conftest import TEST_DB_URL
from tests.test_single_owner import CLAVE, _new_user, _owner_count

SQL_SCRIPT = Path(__file__).resolve().parents[2] / "deploy" / "sql" / "crear-owner.sql"
PSQL = os.getenv("PSQL_BIN") or shutil.which("psql")


@pytest.fixture()
def psql():
    if PSQL:
        return PSQL
    if os.getenv("CI"):
        pytest.fail("psql no está instalado en el runner: las pruebas de crear-owner.sql no pueden omitirse")
    pytest.skip("psql no está disponible (defina PSQL_BIN)")


def _run_sql(psql, env=None, **variables):
    values = {"correo": "Owner.Prueba@Example.COM", "nombre": "Owner de Prueba",
              "telefono": "3001234567", "clave": CLAVE, **variables}
    command = [psql, "-X", TEST_DB_URL]
    for name, value in values.items():
        if value is not None:
            command += ["-v", f"{name}={value}"]
    with SQL_SCRIPT.open() as script:
        return subprocess.run(command, stdin=script, capture_output=True, text=True, timeout=60,
                              env={**os.environ, **(env or {})})


def _login(client, email, password):
    return client.post("/auth/login-user", json={"email": email, "password": password})


class TestCrearOwnerSql:

    def test_running_twice_does_not_create_a_second_owner(self, psql, db):
        first = _run_sql(psql)
        second = _run_sql(psql)

        assert first.returncode == 0, first.stderr
        assert "INSERT 0 1" in first.stdout
        assert second.returncode != 0
        assert "Ya existe un owner" in second.stderr
        assert _owner_count(db) == 1

    def test_created_owner_logs_in_through_the_api(self, psql, client):
        result = _run_sql(psql)
        assert result.returncode == 0, result.stderr

        response = _login(client, "Owner.Prueba@Example.COM", CLAVE)
        wrong = _login(client, "Owner.Prueba@Example.COM", "Otra-Clave1")

        assert response.status_code == 200
        assert response.json()["role"] == "owner"
        assert wrong.status_code != 200

    def test_password_from_environment_keeps_it_out_of_the_arguments(self, psql, client, db):
        # Así lo usa scripts/database/inicializar.sh: la clave no aparece en la línea de órdenes de psql.
        result = _run_sql(psql, env={"OWNER_CLAVE": CLAVE}, clave=None)

        assert result.returncode == 0, result.stderr
        assert _login(client, "owner.prueba@example.com", CLAVE).status_code == 200
        assert db.query(Users.email).filter(Users.is_owner.is_(True)).scalar() == "owner.prueba@example.com"

    def test_missing_password_is_rejected(self, psql, db):
        result = _run_sql(psql, env={"OWNER_CLAVE": ""}, clave=None)

        assert result.returncode != 0
        assert _owner_count(db) == 0

    def test_output_never_shows_the_password_or_hash(self, psql, db):
        result = _run_sql(psql)

        assert result.returncode == 0, result.stderr
        assert CLAVE not in result.stdout + result.stderr
        assert "$2a$" not in result.stdout + result.stderr

    def test_password_of_exactly_72_bytes_works(self, psql, client):
        clave = "Aa1" + "x" * 69
        result = _run_sql(psql, clave=clave)

        assert result.returncode == 0, result.stderr
        assert _login(client, "Owner.Prueba@Example.COM", clave).status_code == 200

    @pytest.mark.parametrize(
        "clave",
        [
            "Aa1" + "ñ" * 35,  # 38 caracteres pero 73 bytes
            "Aa1" + "x" * 70,
            "Aa1x",
        ],
    )
    def test_password_outside_8_to_72_bytes_is_rejected(self, psql, db, clave):
        result = _run_sql(psql, clave=clave)

        assert result.returncode != 0
        assert "entre 8 y 72 bytes" in result.stderr
        assert _owner_count(db) == 0

    @pytest.mark.parametrize(
        ("variables", "message"),
        [
            ({"nombre": "N" * 51}, "entre 3 y 50 caracteres"),
            ({"correo": "a" * 39 + "@example.com"}, "el máximo es 50"),
            ({"telefono": "300123"}, "10 dígitos"),
            ({"clave": "sinmayuscula1"}, "una mayúscula"),
        ],
    )
    def test_invalid_data_is_rejected_before_inserting(self, psql, db, variables, message):
        result = _run_sql(psql, **variables)

        assert result.returncode != 0
        assert message in result.stderr
        assert _owner_count(db) == 0

    def test_registered_email_needs_convertir(self, psql, client, db):
        _new_user(db, "Owner.Prueba@example.com")

        refused = _run_sql(psql)
        converted = _run_sql(psql, convertir="true")

        assert refused.returncode != 0
        assert "ya está registrado" in refused.stderr
        assert converted.returncode == 0, converted.stderr
        assert "UPDATE 1" in converted.stdout
        response = _login(client, "Owner.Prueba@example.com", CLAVE)
        assert response.status_code == 200
        assert response.json()["role"] == "owner"
