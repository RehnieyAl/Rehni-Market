"""Seed de atributos de variante: ejes (color, talla, capacidad...) y sus opciones por categoría (datos base)."""

from sqlalchemy.orm import Session

from app.models.ModelCatalogAttribute import CatalogAttribute, CatalogAttributeOption
from app.utils.seed_catalog_data import CATALOGS, get_seed_catalog


def seed_catalog_attributes(db: Session):
    for name, _description, _product_specs, variant_attrs in CATALOGS:
        catalog = get_seed_catalog(db, name)

        if not catalog:
            continue

        for position, (attr_name, options) in enumerate(variant_attrs):
            is_color = bool(options) and isinstance(options[0], tuple)
            input_type = "color" if is_color else "select"

            attribute = (
                db.query(CatalogAttribute)
                .filter(
                    CatalogAttribute.catalog_id == catalog.id,
                    CatalogAttribute.name == attr_name,
                )
                .first()
            )

            if attribute is None:
                attribute = CatalogAttribute(
                    catalog_id=catalog.id,
                    name=attr_name,
                    role="variant",
                    input_type=input_type,
                    position=position,
                )
                db.add(attribute)
                db.flush()
            elif attribute.role != "variant":
                continue

            for option_position, option in enumerate(options):
                if is_color:
                    value, hex_color = option
                else:
                    value, hex_color = option, None

                option_exists = (
                    db.query(CatalogAttributeOption)
                    .filter(
                        CatalogAttributeOption.attribute_id == attribute.id,
                        CatalogAttributeOption.value == value,
                    )
                    .first()
                )

                if option_exists:
                    continue

                db.add(
                    CatalogAttributeOption(
                        attribute_id=attribute.id,
                        value=value,
                        hex_color=hex_color,
                        position=option_position,
                    )
                )

    db.commit()
