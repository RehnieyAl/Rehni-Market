from uuid import UUID

from sqlalchemy.orm import Session

from app.models.ModelCatalog import Catalog
from app.models.ModelCatalogAttribute import CatalogAttribute, CatalogAttributeOption


def get_catalog(database: Session, catalog_id: UUID) -> Catalog | None:
    return database.get(Catalog, catalog_id)


def get_attribute(database: Session, attribute_id: UUID) -> CatalogAttribute | None:
    return database.get(CatalogAttribute, attribute_id)


def get_option(database: Session, option_id: UUID) -> CatalogAttributeOption | None:
    return database.get(CatalogAttributeOption, option_id)


def list_attributes_by_catalog(
    database: Session,
    catalog_id: UUID,
    role: str | None = None,
) -> list[CatalogAttribute]:

    query = database.query(CatalogAttribute).filter(
        CatalogAttribute.catalog_id == catalog_id
    )

    if role is not None:
        query = query.filter(CatalogAttribute.role == role)

    return query.order_by(
        CatalogAttribute.position.asc(), CatalogAttribute.name.asc()
    ).all()


def find_attribute_by_name(
    database: Session,
    catalog_id: UUID,
    name: str,
    exclude_id: UUID | None = None,
) -> CatalogAttribute | None:

    query = database.query(CatalogAttribute).filter(
        CatalogAttribute.catalog_id == catalog_id,
        CatalogAttribute.name.ilike(name),
    )

    if exclude_id is not None:
        query = query.filter(CatalogAttribute.id != exclude_id)

    return query.first()


def find_option_by_value(
    database: Session,
    attribute_id: UUID,
    value: str,
    exclude_id: UUID | None = None,
) -> CatalogAttributeOption | None:

    query = database.query(CatalogAttributeOption).filter(
        CatalogAttributeOption.attribute_id == attribute_id,
        CatalogAttributeOption.value.ilike(value),
    )

    if exclude_id is not None:
        query = query.filter(CatalogAttributeOption.id != exclude_id)

    return query.first()
