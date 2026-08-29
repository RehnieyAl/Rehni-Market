from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.ModelCatalog import Catalog
from app.models.ModelProduct import Product
from app.schemas.SchemaDashboard.SchemaCatalog import (
    CreateCatalogRequest,
    UpdateCatalogRequest,
    CatalogResponse,
)

from app.services.NasService import build_media_url
from app.services.publicService.Products import _has_visible_stock


CATALOG_NAS_PATH = "catalogs/"


def _count_products_by_catalog(database: Session) -> dict[UUID, int]:
    """Un solo query agregado para todos los catálogos, con el mismo criterio de
    visibilidad que _has_visible_stock."""

    rows = (
        database.query(Product.catalog_id, func.count(Product.id))
        .filter(Product.is_active.is_(True), _has_visible_stock())
        .group_by(Product.catalog_id)
        .all()
    )

    return {catalog_id: count for catalog_id, count in rows}


def _to_response(catalog: Catalog, product_count: int = 0) -> CatalogResponse:
    return CatalogResponse(
        id=catalog.id,
        name=catalog.name,
        description=catalog.description,
        image_url=build_media_url(catalog.image_url) if catalog.image_url else None,
        display_order=catalog.display_order,
        is_active=catalog.is_active,
        product_count=product_count,
    )


def get_catalogs_service(database: Session) -> list[CatalogResponse]:
    """Listado admin: todas las categorías, activas e inactivas."""

    catalogs = database.query(Catalog).order_by(Catalog.display_order.asc(), Catalog.name.asc()).all()

    counts = _count_products_by_catalog(database)

    return [_to_response(catalog, counts.get(catalog.id, 0)) for catalog in catalogs]


def create_catalog_service(
    database: Session,
    data: CreateCatalogRequest,
    image,
    nas,
) -> CatalogResponse:

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

    try:
        image_path = None

        if image:
            upload_result = nas.upload_file(image, CATALOG_NAS_PATH)

            if not upload_result.get("success"):
                raise HTTPException(
                    status_code=500,
                    detail=upload_result.get("message", "No se pudo subir la imagen de la categoría."),
                )

            image_path = upload_result["path"]

        catalog = Catalog(
            name=data.name.strip().title(),
            description=(data.description.strip() if data.description else None),
            image_url=image_path,
            display_order=data.display_order,
            is_active=data.is_active,
        )

        database.add(catalog)
        database.commit()
        database.refresh(catalog)

        return _to_response(catalog, product_count=0)

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        raise HTTPException(status_code=500, detail=str(e))


def update_catalog_service(
    database: Session,
    catalog_id: UUID,
    data: UpdateCatalogRequest,
    image,
    nas,
) -> CatalogResponse:

    catalog = database.get(Catalog, catalog_id)

    if not catalog:
        raise HTTPException(
            status_code=404,
            detail="Catálogo no encontrado."
        )

    if data.name is not None:
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

    if data.description is not None:
        catalog.description = data.description.strip() or None

    if data.display_order is not None:
        catalog.display_order = data.display_order

    if data.is_active is not None:
        catalog.is_active = data.is_active

    try:
        if image:
            previous_image = catalog.image_url

            upload_result = nas.upload_file(image, CATALOG_NAS_PATH)

            if not upload_result.get("success"):
                raise HTTPException(
                    status_code=500,
                    detail=upload_result.get("message", "No se pudo actualizar la imagen de la categoría."),
                )

            catalog.image_url = upload_result["path"]

            if previous_image:
                nas.delete_file(previous_image.removeprefix("uploads/"))

        elif data.remove_image and catalog.image_url:
            nas.delete_file(catalog.image_url.removeprefix("uploads/"))
            catalog.image_url = None

        database.commit()
        database.refresh(catalog)

        counts = _count_products_by_catalog(database)

        return _to_response(catalog, counts.get(catalog.id, 0))

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        raise HTTPException(status_code=500, detail=str(e))


def change_catalog_status_service(
    database: Session,
    catalog_id: UUID,
    is_active: bool,
) -> CatalogResponse:
    """Activar/desactivar: una categoría inactiva sigue existiendo, solo desaparece del catálogo público."""

    catalog = database.get(Catalog, catalog_id)

    if not catalog:
        raise HTTPException(status_code=404, detail="Catálogo no encontrado.")

    catalog.is_active = is_active

    database.commit()
    database.refresh(catalog)

    counts = _count_products_by_catalog(database)

    return _to_response(catalog, counts.get(catalog.id, 0))


def delete_catalog_service(
    database: Session,
    catalog_id: UUID,
    nas,
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

    if catalog.image_url:
        nas.delete_file(catalog.image_url.removeprefix("uploads/"))

    database.delete(catalog)
    database.commit()

    return {
        "message": "Catálogo eliminado correctamente."
    }
