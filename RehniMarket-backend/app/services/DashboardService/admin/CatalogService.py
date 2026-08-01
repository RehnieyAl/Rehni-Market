from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.ModelCatalog import Catalog
from app.schemas.SchemaDashboard.SchemaCatalog import (
    CreateCatalogRequest,
    UpdateCatalogRequest,
)


def get_catalogs_service(database: Session):

    return (
        database.query(Catalog)
        .order_by(Catalog.name.asc())
        .all()
    )


def create_catalog_service(
    database: Session,
    data: CreateCatalogRequest,
):

    exists = (
        database.query(Catalog)
        .filter(Catalog.name.ilike(data.name))
        .first()
    )

    if exists:
        raise HTTPException(
            status_code=409,
            detail="El catálogo ya existe."
        )

    catalog = Catalog(
        name=data.name.strip().title()
    )

    database.add(catalog)
    database.commit()
    database.refresh(catalog)

    return catalog


def update_catalog_service(
    database: Session,
    catalog_id: UUID,
    data: UpdateCatalogRequest,
):

    catalog = database.get(Catalog, catalog_id)

    if not catalog:
        raise HTTPException(
            status_code=404,
            detail="Catálogo no encontrado."
        )

    exists = (
        database.query(Catalog)
        .filter(
            Catalog.name.ilike(data.name),
            Catalog.id != catalog_id
        )
        .first()
    )

    if exists:
        raise HTTPException(
            status_code=409,
            detail="Ya existe otro catálogo con ese nombre."
        )

    catalog.name = data.name.strip().title()

    database.commit()
    database.refresh(catalog)

    return catalog


def delete_catalog_service(
    database: Session,
    catalog_id: UUID,
):

    catalog = database.get(Catalog, catalog_id)

    if not catalog:
        raise HTTPException(
            status_code=404,
            detail="Catálogo no encontrado."
        )

    if catalog.products:
        raise HTTPException(
            status_code=409,
            detail="No puedes eliminar un catálogo que tiene productos asociados."
        )

    database.delete(catalog)
    database.commit()

    return {
        "message": "Catálogo eliminado correctamente."
    }