"""Alineación modelos ↔ migraciones: filtro del índice de expresión en env.py y la migración
c6e8a0b2d4f7 que impone NOT NULL en shipping_carriers.created_at sin perder filas."""

import ast
import importlib.util
from pathlib import Path

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import inspect, text

BACKEND = Path(__file__).resolve().parents[1]
MIGRATION = BACKEND / "alembic/versions/c6e8a0b2d4f7_shipping_carriers_created_at_not_null.py"


def _include_object():
    """Carga include_object de alembic/env.py sin ejecutar el entorno (que abre una conexión)."""
    tree = ast.parse((BACKEND / "alembic/env.py").read_text())
    wanted = [
        node for node in tree.body
        if (isinstance(node, ast.FunctionDef) and node.name == "include_object")
        or (isinstance(node, ast.Assign) and getattr(node.targets[0], "id", "") == "EXPRESSION_INDEXES")
    ]
    namespace: dict = {}
    exec(compile(ast.Module(body=wanted, type_ignores=[]), "env.py", "exec"), namespace)
    return namespace["include_object"]


@pytest.fixture()
def migration():
    spec = importlib.util.spec_from_file_location("created_at_not_null", MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_env_ignores_only_the_reflected_trigram_index():
    include = _include_object()

    assert include(None, "ix_products_name_search_trgm", "index", True, None) is False
    assert include(None, "ix_company_followers_company_id", "index", True, None) is True
    assert include(None, "ix_products_name_search_trgm", "table", True, None) is True


def test_revision_chains_after_company_followers(migration):
    assert migration.down_revision == "b5d7f9a1c3e6"


def test_upgrade_fills_nulls_and_downgrade_relaxes(engine, db, migration):
    db.close()
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE shipping_carriers ALTER COLUMN created_at DROP NOT NULL"))
        connection.execute(text(
            "INSERT INTO shipping_carriers (id, name, tracking_url, is_active, created_at) "
            "VALUES (gen_random_uuid(), 'Sin fecha', 'https://t.test/{guia}', true, NULL), "
            "(gen_random_uuid(), 'Con fecha', 'https://t.test/{guia}', true, '2026-01-01T00:00:00Z')"
        ))
        with Operations.context(MigrationContext.configure(connection)):
            migration.upgrade()

    with engine.connect() as connection:
        rows = dict(connection.execute(text("SELECT name, created_at FROM shipping_carriers")).all())
    assert rows["Sin fecha"] is not None
    assert rows["Con fecha"].year == 2026
    column = next(c for c in inspect(engine).get_columns("shipping_carriers") if c["name"] == "created_at")
    assert column["nullable"] is False

    with engine.begin() as connection:
        with Operations.context(MigrationContext.configure(connection)):
            migration.downgrade()
    column = next(c for c in inspect(engine).get_columns("shipping_carriers") if c["name"] == "created_at")
    assert column["nullable"] is True
