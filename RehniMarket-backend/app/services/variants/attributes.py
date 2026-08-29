from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.ModelCatalogAttribute import CatalogAttribute, CatalogAttributeOption


def get_catalog_attributes(
    database: Session,
    catalog_id,
    role: str | None = None,
    active_only: bool = False,
) -> list[CatalogAttribute]:
    query = database.query(CatalogAttribute).filter(
        CatalogAttribute.catalog_id == catalog_id
    )

    if role is not None:
        query = query.filter(CatalogAttribute.role == role)

    if active_only:
        query = query.filter(CatalogAttribute.is_active.is_(True))

    return query.order_by(
        CatalogAttribute.position.asc(), CatalogAttribute.name.asc()
    ).all()


def get_variant_axes(database: Session, catalog_id) -> list[CatalogAttribute]:
    return get_catalog_attributes(
        database, catalog_id, role="variant", active_only=True
    )


def get_attribute_option(database: Session, option_id) -> CatalogAttributeOption | None:
    return database.get(CatalogAttributeOption, option_id)


def variant_option_pairs(variant) -> list[dict]:
    links = sorted(
        variant.options,
        key=lambda link: (link.attribute.position, link.attribute.name),
    )
    return [
        {"attribute": link.attribute.name, "value": link.option.value}
        for link in links
    ]


def variant_value_pairs(variant) -> list[dict]:
    values = sorted(
        variant.attribute_values,
        key=lambda value: (value.attribute.position, value.attribute.name),
    )
    return [
        {"attribute": value.attribute.name, "value": value.value}
        for value in values
    ]


def product_attribute_pairs(product) -> list[dict]:
    values = sorted(
        product.attribute_values,
        key=lambda value: (value.attribute.position, value.attribute.name),
    )
    return [
        {"attribute": value.attribute.name, "value": value.value}
        for value in values
    ]


def variant_snapshot(variant) -> dict:
    snapshot: dict = {}
    for pair in variant_option_pairs(variant) + variant_value_pairs(variant):
        snapshot[pair["attribute"]] = pair["value"]
    return snapshot
