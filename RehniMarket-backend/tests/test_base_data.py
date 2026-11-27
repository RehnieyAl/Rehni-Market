"""Datos base: el arranque no siembra nada con RUN_SEED=false; con RUN_SEED=true (o a mano con
ensure_base_data) se crean, no se duplican y no deshacen cambios del panel."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dbconexion import Base
from app.models.ModelCatalog import Catalog
from app.models.ModelCatalogAttribute import CatalogAttribute, CatalogAttributeOption
from app.models.ModelRole import Role
from app.models.ModelShippingCarrier import ShippingCarrier
from app.utils.base_data import ensure_base_data

COUNTED = (Role, Catalog, CatalogAttribute, CatalogAttributeOption, ShippingCarrier)


@pytest.fixture()
def empty_db(engine):
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)


def _start_app(engine, monkeypatch, run_seed=True):
    from app import main

    monkeypatch.setattr(main.config, "RUN_SEED", run_seed)
    monkeypatch.setattr(main, "ensure_bucket", lambda: None)
    monkeypatch.setattr(main, "ensure_base_data", lambda: ensure_base_data(engine))
    # Los datos de demostración no son objeto de estas pruebas y usarían la conexión de la app.
    monkeypatch.setattr(main, "run_seed", lambda db: None)
    with TestClient(main.app):
        pass


def _counts(engine):
    with Session(engine) as db:
        return {model.__name__: db.query(func.count()).select_from(model).scalar() for model in COUNTED}


def test_startup_without_run_seed_seeds_nothing(empty_db, monkeypatch):
    _start_app(empty_db, monkeypatch, run_seed=False)

    assert set(_counts(empty_db).values()) == {0}


def test_manual_ensure_base_data_creates_roles_and_catalogs(empty_db):
    ensure_base_data(empty_db)

    with Session(empty_db) as db:
        assert {role.name for role in db.query(Role)} == {"user", "company", "admin", "owner"}


def test_roles_and_base_catalogs_exist_after_startup_with_run_seed(empty_db, monkeypatch):
    _start_app(empty_db, monkeypatch)

    with Session(empty_db) as db:
        roles = {role.name for role in db.query(Role)}
    counts = _counts(empty_db)

    assert roles == {"user", "company", "admin", "owner"}
    assert counts["Catalog"] > 0
    assert counts["CatalogAttribute"] > 0
    assert counts["ShippingCarrier"] > 0


def test_second_startup_does_not_duplicate_base_data(empty_db, monkeypatch):
    _start_app(empty_db, monkeypatch)
    first = _counts(empty_db)

    _start_app(empty_db, monkeypatch)

    assert _counts(empty_db) == first


def test_startup_does_not_restore_an_option_deleted_from_the_panel(empty_db, monkeypatch):
    _start_app(empty_db, monkeypatch)
    with Session(empty_db) as db:
        option = db.query(CatalogAttributeOption).first()
        option_id = option.id
        db.delete(option)
        db.commit()
    before = _counts(empty_db)

    _start_app(empty_db, monkeypatch)

    with Session(empty_db) as db:
        assert db.get(CatalogAttributeOption, option_id) is None
    assert _counts(empty_db) == before
