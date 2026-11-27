"""Seed de especificaciones: atributos role='product' de cada categoría sembrada (datos base)."""

from sqlalchemy.orm import Session

from app.models.ModelCatalogAttribute import CatalogAttribute
from app.utils.seed_catalog_data import CATALOGS, get_seed_catalog


def seed_specifications(db: Session):
    for name, _description, product_specs, _variant_attrs in CATALOGS:
        catalog = get_seed_catalog(db, name)

        if not catalog:
            continue

        for position, spec_name in enumerate(product_specs):
            exists = (
                db.query(CatalogAttribute)
                .filter(
                    CatalogAttribute.catalog_id == catalog.id,
                    CatalogAttribute.name == spec_name,
                )
                .first()
            )

            if exists:
                continue

            db.add(
                CatalogAttribute(
                    catalog_id=catalog.id,
                    name=spec_name,
                    role="product",
                    input_type="text",
                    position=position,
                )
            )

    db.commit()
