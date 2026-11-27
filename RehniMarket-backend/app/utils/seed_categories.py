"""Seed de categorías: crea las categorías de CATALOGS que falten (datos base)."""

from sqlalchemy.orm import Session

from app.models.ModelCatalog import Catalog
from app.utils.seed_catalog_data import CATALOGS, get_seed_catalog


def seed_catalog(db: Session):
    for order, (name, description, _specs_list, _variant_attrs) in enumerate(CATALOGS, start=1):
        if get_seed_catalog(db, name):
            continue

        db.add(Catalog(name=name, description=description, display_order=order))

    db.commit()
