"""scripts/migracion/transformar.sql: migra con pgcrypto ausente o ya instalada en public, y rollback.sql lo revierte."""
import re
import subprocess
from pathlib import Path

import pytest
from sqlalchemy import text

from tests.conftest import TEST_DB_URL
from tests.test_crear_owner_sql import psql  # noqa: F401  fixture compartido

SCRIPTS = Path(__file__).resolve().parents[2] / "scripts" / "migracion"

# carga-staging.sql lee el CSV con COPY desde una ruta del servidor de PostgreSQL, que la base
# de pruebas no tiene: se ejecuta sin ese COPY y las filas se insertan directamente.
COPY_DEL_SERVIDOR = re.compile(r"^COPY migracion\.clientes_legado .*?;\n", re.DOTALL | re.MULTILINE)

FILAS = [
    ("CL0001", "  Ana   Gómez ", " ANA.GOMEZ@Example.Com ", "2021-03-15", "300 111 2233"),
    ("CL0002", "Luis Pérez", "luis.perez@example.com", "15/04/2022", "+57 301 222 3344"),
    ("CL0003", "Sin Correo", "", "2022-01-01", "3001112233"),
]


def _psql(binario, script, **variables):
    command = [binario, "-X", "-v", "ON_ERROR_STOP=1", TEST_DB_URL]
    for name, value in variables.items():
        command += ["-v", f"{name}={value}"]
    return subprocess.run(command, input=script, capture_output=True, text=True, timeout=120)


def _scalar(db, sql, **params):
    db.rollback()
    return db.execute(text(sql), params).scalar()


@pytest.fixture()
def staging(psql, db):  # noqa: F811
    carga = COPY_DEL_SERVIDOR.sub("", (SCRIPTS / "carga-staging.sql").read_text())
    assert "COPY migracion" not in carga
    result = _psql(psql, carga)
    assert result.returncode == 0, result.stderr
    db.execute(
        text("INSERT INTO migracion.clientes_legado (codigo, nombre_completo, correo, fecha_alta, telefono) "
             "VALUES (:c, :n, :e, :f, :t)"),
        [dict(zip("cneft", fila)) for fila in FILAS],
    )
    db.commit()
    yield
    db.rollback()
    db.execute(text("DROP SCHEMA IF EXISTS migracion CASCADE"))
    db.commit()


def _preparar_pgcrypto(db, esquema):
    db.execute(text("DROP EXTENSION IF EXISTS pgcrypto CASCADE"))
    if esquema:
        db.execute(text(f"CREATE EXTENSION pgcrypto WITH SCHEMA {esquema}"))
    db.commit()


@pytest.mark.parametrize("esquema_previo, esquema_esperado", [(None, "migracion"), ("public", "public")])
def test_migra_y_revierte_con_pgcrypto_ausente_o_en_public(psql, db, staging, esquema_previo, esquema_esperado):  # noqa: F811
    _preparar_pgcrypto(db, esquema_previo)
    users_antes = _scalar(db, "SELECT count(*) FROM users")

    transformar = _psql(psql, (SCRIPTS / "transformar.sql").read_text(), archivo_sha256="prueba")

    assert transformar.returncode == 0, transformar.stderr
    assert _scalar(db, "SELECT extnamespace::regnamespace::text FROM pg_extension "
                       "WHERE extname = 'pgcrypto'") == esquema_esperado
    id_ejecucion = _scalar(db, "SELECT id_ejecucion FROM migracion.ejecuciones WHERE estado = 'APLICADA'")
    assert _scalar(db, "SELECT count(*) FROM users") == users_antes + 2
    assert _scalar(db, "SELECT count(*) FROM migracion.rechazos WHERE id_ejecucion = :i", i=id_ejecucion) == 1
    assert _scalar(
        db,
        "SELECT count(DISTINCT u.hashed_password) FROM users u "
        "JOIN migracion.usuarios_migrados m ON m.user_id = u.id "
        "WHERE u.hashed_password LIKE '$2a$12$%'",
    ) == 2

    rollback = _psql(psql, (SCRIPTS / "rollback.sql").read_text(),
                     id_ejecucion=str(id_ejecucion))

    assert rollback.returncode == 0, rollback.stderr
    assert _scalar(db, "SELECT count(*) FROM users") == users_antes
    assert _scalar(db, "SELECT estado FROM migracion.ejecuciones WHERE id_ejecucion = :i",
                   i=id_ejecucion) == "REVERTIDA"
