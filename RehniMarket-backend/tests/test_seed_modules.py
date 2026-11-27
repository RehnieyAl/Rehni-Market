"""Seeds separados (app/utils/seed.py y seed_*.py): ejecución individual y múltiple explícita,
idempotencia, dependencias, rollback, owner único, CLI, que importar no siembre nada y el marcador de imagen de las demos."""

import importlib

import pytest
from sqlalchemy import func
from sqlalchemy.orm import sessionmaker

from app.models.ModelCatalog import Catalog
from app.models.ModelCatalogAttribute import CatalogAttribute, CatalogAttributeOption
from app.models.ModelColor import ColorVariant
from app.models.ModelCompany import Company
from app.models.ModelProduct import Product
from app.models.ModelRole import Role
from app.models.ModelShippingCarrier import ShippingCarrier
from app.models.ModelUser import Users
from app.utils import seed, seed_accounts, seed_demo
from app.utils.seed import SEEDS, SeedError, run_seeds
from app.utils.seed_catalog_data import CATALOGS, COLORS
from app.utils.seed_products import COMPANIES


def _count(db, model, *conditions):
    db.expire_all()
    return db.query(func.count(model.id)).filter(*conditions).scalar()


def _counts(db):
    return {
        model.__name__: _count(db, model)
        for model in (Role, Catalog, CatalogAttribute, CatalogAttributeOption, ColorVariant, ShippingCarrier, Users,
                      Company, Product)
    }


@pytest.fixture()
def owner_env(monkeypatch):
    monkeypatch.setattr(seed_accounts.config, "OWNER_NAME", "Owner Seed")
    monkeypatch.setattr(seed_accounts.config, "OWNER_DEFAULT", "Owner.Seed@Example.com")
    monkeypatch.setattr(seed_accounts.config, "OWNER_PASSWORD_DEFAULT", "Clave1234")


@pytest.fixture()
def small_demo(monkeypatch):
    """Una empresa demo con un producto, sin subir imágenes a MinIO."""
    company = {**COMPANIES[0], "products": COMPANIES[0]["products"][:1]}
    monkeypatch.setattr(seed_demo, "_demo_companies", lambda: [company])
    monkeypatch.setattr(seed_demo, "_ensure_media_object", lambda name, rgb: f"uploads/{name}")
    return company


class TestIndividualSeeds:
    def test_colors_alone_only_creates_colors(self, db):
        before = _counts(db)

        assert run_seeds(db, ["colores"]) == ["colores"]

        after = _counts(db)
        assert after["ColorVariant"] == len(COLORS)
        assert {k: v for k, v in after.items() if k != "ColorVariant"} == {
            k: v for k, v in before.items() if k != "ColorVariant"
        }

    def test_categories_alone(self, db):
        run_seeds(db, ["categorias"])

        assert _count(db, Catalog) == len(CATALOGS)
        assert _count(db, CatalogAttribute) == 0

    def test_shipping_alone(self, db):
        run_seeds(db, ["transportadoras"])

        assert _count(db, ShippingCarrier) == 4
        assert _count(db, Catalog) == 0

    @pytest.mark.parametrize("name", [name for name in SEEDS if name not in ("productos-demo",)])
    def test_every_seed_is_idempotent(self, db, owner_env, small_demo, name):
        dependencies = [required for required in SEEDS[name].requires if required != name]
        selection = [*dependencies, name]

        run_seeds(db, selection)
        first = _counts(db)
        run_seeds(db, selection)

        assert _counts(db) == first

    def test_demo_products_are_idempotent(self, db, small_demo):
        selection = ["categorias", "especificaciones", "atributos", "empresas-demo", "productos-demo"]

        run_seeds(db, selection)
        first = _counts(db)
        run_seeds(db, selection)

        assert first["Product"] == 1
        assert _counts(db) == first


class TestExplicitSelection:
    def test_runs_only_what_was_selected_in_dependency_order(self, db):
        executed = run_seeds(db, ["especificaciones", "categorias"])

        assert executed == ["categorias", "especificaciones"]
        assert _count(db, CatalogAttribute, CatalogAttribute.role == "product") > 0
        assert _count(db, CatalogAttribute, CatalogAttribute.role == "variant") == 0
        assert _count(db, ShippingCarrier) == 0

    def test_base_group_matches_the_startup_base_data(self, db):
        executed = run_seeds(db, ["base"])

        assert executed == list(seed.GROUPS["base"])
        assert _count(db, ColorVariant) == 0, "los colores no son datos base"
        assert _count(db, Users) == 0, "base no crea cuentas"

    @pytest.mark.parametrize("selection", [[], ["no-existe"], ["base", "no-existe"]])
    def test_invalid_selection_is_rejected(self, db, selection):
        with pytest.raises(SeedError):
            run_seeds(db, selection)

        assert _count(db, Catalog) == 0


class TestDependencies:
    def test_missing_dependency_is_reported_and_nothing_runs(self, db):
        with pytest.raises(SeedError, match="categorias"):
            run_seeds(db, ["especificaciones"])

        assert _count(db, CatalogAttribute) == 0

    def test_dependency_already_present_is_accepted(self, db):
        run_seeds(db, ["categorias"])

        assert run_seeds(db, ["atributos"]) == ["atributos"]

    def test_demo_products_need_demo_companies(self, db, small_demo):
        run_seeds(db, ["categorias", "especificaciones", "atributos"])

        with pytest.raises(SeedError, match="empresas-demo"):
            run_seeds(db, ["productos-demo"])


class TestRollback:
    def test_failing_seed_rolls_back_its_changes(self, db, monkeypatch):
        def broken(session):
            session.add(Catalog(name="A medio sembrar"))
            session.flush()
            raise RuntimeError("fallo a mitad del seed")

        monkeypatch.setitem(SEEDS, "categorias", SEEDS["categorias"].__class__(
            "categorias", "roto", broken, SEEDS["categorias"].is_present,
        ))

        with pytest.raises(RuntimeError):
            run_seeds(db, ["categorias"])

        assert _count(db, Catalog) == 0


class TestOwner:
    def test_creates_the_owner_once_with_normalized_email(self, db, owner_env):
        run_seeds(db, ["owner"])
        run_seeds(db, ["owner"])

        owners = db.query(Users).join(Role).filter(Role.name == "owner").all()
        assert [owner.email for owner in owners] == ["owner.seed@example.com"]

    def test_never_creates_a_second_owner(self, db, users, owner_env):
        assert _count(db, Users, Users.role_id == users["owner"].role_id) == 1

        run_seeds(db, ["owner"])

        assert _count(db, Users, Users.role_id == users["owner"].role_id) == 1
        assert _count(db, Users, Users.email == "owner.seed@example.com") == 0

    def test_without_env_credentials_creates_nothing(self, db, monkeypatch):
        monkeypatch.setattr(seed_accounts.config, "OWNER_PASSWORD_DEFAULT", None)

        run_seeds(db, ["owner"])

        assert _count(db, Users) == 0


class TestNothingRunsAutomatically:
    def test_importing_the_seed_modules_does_not_touch_the_database(self, db):
        for module in ("seed", "seed_roles", "seed_categories", "seed_colors", "seed_demo", "seed_products"):
            importlib.reload(importlib.import_module(f"app.utils.{module}"))

        assert _counts(db) == {key: (4 if key == "Role" else 0) for key in _counts(db)}

    def test_cli_without_selection_lists_and_does_not_seed(self, db, capsys):
        assert seed.main([]) == 2
        assert "colores" in capsys.readouterr().out
        assert _count(db, Catalog) == 0

    def test_cli_runs_the_selected_seed(self, db, engine, monkeypatch, capsys):
        monkeypatch.setattr("app.core.dbconexion.SessionLocal", sessionmaker(bind=engine))

        assert seed.main(["colores"]) == 0
        assert "OK: colores" in capsys.readouterr().out
        assert _count(db, ColorVariant) == len(COLORS)

    def test_cli_reports_missing_dependency(self, db, engine, monkeypatch, capsys):
        monkeypatch.setattr("app.core.dbconexion.SessionLocal", sessionmaker(bind=engine))

        assert seed.main(["atributos"]) == 1
        assert "categorias" in capsys.readouterr().err


def _decode_rgb_png(payload: bytes) -> tuple[int, int, list[bytes]]:
    import struct
    import zlib

    assert payload[:8] == b"\x89PNG\r\n\x1a\n"
    width, height = struct.unpack(">II", payload[16:24])
    idat_length = struct.unpack(">I", payload[33:37])[0]
    raw = zlib.decompress(payload[41:41 + idat_length])
    stride = 1 + width * 3
    return width, height, [raw[i * stride + 1:(i + 1) * stride] for i in range(height)]


def test_demo_image_is_a_color_swatch_on_light_background_not_a_flat_fill():
    from app.utils.seed_demo import _BACKGROUND_RGB, _BORDER_RGB, _swatch_png

    negro = (34, 34, 38)
    width, height, rows = _decode_rgb_png(_swatch_png(negro))
    pixel = lambda x, y: tuple(rows[y][x * 3:x * 3 + 3])  # noqa: E731

    assert (width, height) == (480, 480)
    assert pixel(0, 0) == _BACKGROUND_RGB
    assert pixel(479, 479) == _BACKGROUND_RGB
    assert pixel(240, 240) == negro
    assert _BORDER_RGB in {pixel(x, 240) for x in range(80, 100)}
