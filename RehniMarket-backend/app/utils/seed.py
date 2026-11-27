"""Registro y ejecución manual de los seeds: cada uno con su responsabilidad y dependencias.
Nada se ejecuta al importar; uso: python -m app.utils.seed --list | <seed o grupo> [...]"""

import argparse
import sys
from dataclasses import dataclass
from typing import Callable

from sqlalchemy.orm import Session

from app.models.ModelCatalog import Catalog
from app.models.ModelCatalogAttribute import CatalogAttribute
from app.models.ModelColor import ColorVariant
from app.models.ModelCompany import Company
from app.models.ModelRole import Role
from app.models.ModelShippingCarrier import ShippingCarrier
from app.utils.seed_accounts import seed_owner
from app.utils.seed_attributes import seed_catalog_attributes
from app.utils.seed_categories import seed_catalog
from app.utils.seed_colors import seed_colors
from app.utils.seed_demo import seed_demo_companies, seed_demo_products
from app.utils.seed_roles import seed_roles
from app.utils.seed_shipping import seed_shipping_carriers
from app.utils.seed_specifications import seed_specifications


class SeedError(Exception):
    pass


@dataclass(frozen=True)
class Seed:
    name: str
    description: str
    run: Callable[[Session], None]
    is_present: Callable[[Session], bool]
    requires: tuple[str, ...] = ()


def _has(model, *conditions) -> Callable[[Session], bool]:
    return lambda db: db.query(model.id).filter(*conditions).first() is not None


# En orden de dependencias: ejecutar en este orden respeta las claves foráneas.
SEEDS = {
    seed.name: seed
    for seed in (
        Seed("roles", "Roles user, company, admin y owner", seed_roles, _has(Role)),
        Seed("categorias", "Categorías del catálogo", seed_catalog, _has(Catalog)),
        Seed("especificaciones", "Especificaciones de producto por categoría", seed_specifications,
             _has(CatalogAttribute, CatalogAttribute.role == "product"), ("categorias",)),
        Seed("atributos", "Ejes de variante y sus opciones por categoría", seed_catalog_attributes,
             _has(CatalogAttribute, CatalogAttribute.role == "variant"), ("categorias",)),
        Seed("colores", "Colores para el color principal del producto", seed_colors, _has(ColorVariant)),
        Seed("transportadoras", "Transportadoras con URL de rastreo", seed_shipping_carriers, _has(ShippingCarrier)),
        Seed("owner", "Cuenta owner del .env (nunca un segundo owner)", seed_owner,
             lambda db: True, ("roles",)),
        Seed("empresas-demo", "Empresas de demostración aprobadas", seed_demo_companies, _has(Company), ("roles",)),
        Seed("productos-demo", "Productos y variantes de las empresas demo", seed_demo_products,
             lambda db: True, ("empresas-demo", "especificaciones", "atributos")),
    )
}

GROUPS = {
    "base": ("roles", "categorias", "especificaciones", "atributos", "transportadoras"),
    "demo": ("owner", "empresas-demo", "productos-demo"),
}


def _expand(selection) -> list[str]:
    names = []

    for item in selection:
        for name in GROUPS.get(item, (item,)):
            if name not in SEEDS:
                raise SeedError(f"Seed desconocido: {name}. Usa --list para ver los disponibles.")
            if name not in names:
                names.append(name)

    return [name for name in SEEDS if name in names]


def run_seeds(db: Session, selection) -> list[str]:
    """Ejecuta solo los seeds elegidos, en orden de dependencias. Una dependencia no elegida debe
    existir ya en la base; si un seed falla, se revierte su transacción y se detiene la ejecución."""
    names = _expand(selection)

    if not names:
        raise SeedError("Elige al menos un seed o grupo.")

    for name in names:
        missing = [
            required for required in SEEDS[name].requires
            if required not in names and not SEEDS[required].is_present(db)
        ]
        if missing:
            raise SeedError(f"'{name}' necesita antes: {', '.join(missing)}.")

    for name in names:
        try:
            SEEDS[name].run(db)
        except Exception:
            db.rollback()
            raise

    return names


def run_seed(db: Session):
    """Datos de demostración al arrancar con RUN_SEED=true, después de los datos base."""
    run_seeds(db, ["demo"])


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Ejecuta seeds de RehniMarket de forma explícita.")
    parser.add_argument("seeds", nargs="*", help="Seeds o grupos (base, demo) a ejecutar")
    parser.add_argument("--list", action="store_true", help="Muestra los seeds y grupos disponibles")
    args = parser.parse_args(argv)

    if args.list or not args.seeds:
        for seed in SEEDS.values():
            requires = f" (requiere: {', '.join(seed.requires)})" if seed.requires else ""
            print(f"{seed.name:18} {seed.description}{requires}")
        for group, names in GROUPS.items():
            print(f"{group:18} grupo: {', '.join(names)}")
        return 0 if args.list else 2

    from app.core.dbconexion import SessionLocal

    db = SessionLocal()
    try:
        done = run_seeds(db, args.seeds)
    except SeedError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    finally:
        db.close()

    print(f"OK: {', '.join(done)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
