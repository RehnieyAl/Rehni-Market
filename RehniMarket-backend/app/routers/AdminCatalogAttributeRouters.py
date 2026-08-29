from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.Connection import get_db
from app.schemas.SchemaDashboard.SchemaCatalogAttribute import (
    CatalogAttributeResponse,
    CatalogAttributeStatusRequest,
    CreateAttributeOptionRequest,
    CreateCatalogAttributeRequest,
    CatalogAttributeOptionResponse,
    UpdateAttributeOptionRequest,
    UpdateCatalogAttributeRequest,
)
from app.services.DashboardService.admin.CatalogAttributeService import (
    create_attribute_option_service,
    create_catalog_attribute_service,
    delete_attribute_option_service,
    delete_catalog_attribute_service,
    get_catalog_attribute_service,
    list_catalog_attributes_service,
    set_catalog_attribute_status_service,
    update_attribute_option_service,
    update_catalog_attribute_service,
)

router = APIRouter(
    prefix="/admin/dashboard",
    tags=["Admin - Catalog Attributes"],
)


@router.get(
    "/catalogs/{catalog_id}/catalog-attributes",
    response_model=list[CatalogAttributeResponse],
)
def list_catalog_attributes(
    catalog_id: UUID,
    role: str | None = Query(default=None, pattern="^(product|variant)$"),
    database: Session = Depends(get_db),
):
    return list_catalog_attributes_service(database, catalog_id, role)


@router.post(
    "/catalogs/{catalog_id}/catalog-attributes",
    response_model=CatalogAttributeResponse,
    status_code=201,
)
def create_catalog_attribute(
    catalog_id: UUID,
    data: CreateCatalogAttributeRequest,
    database: Session = Depends(get_db),
):
    return create_catalog_attribute_service(database, catalog_id, data)


@router.get(
    "/catalog-attributes/{attribute_id}",
    response_model=CatalogAttributeResponse,
)
def get_catalog_attribute(
    attribute_id: UUID,
    database: Session = Depends(get_db),
):
    return get_catalog_attribute_service(database, attribute_id)


@router.patch(
    "/catalog-attributes/{attribute_id}",
    response_model=CatalogAttributeResponse,
)
def update_catalog_attribute(
    attribute_id: UUID,
    data: UpdateCatalogAttributeRequest,
    database: Session = Depends(get_db),
):
    return update_catalog_attribute_service(database, attribute_id, data)


@router.patch(
    "/catalog-attributes/{attribute_id}/status",
    response_model=CatalogAttributeResponse,
)
def set_catalog_attribute_status(
    attribute_id: UUID,
    data: CatalogAttributeStatusRequest,
    database: Session = Depends(get_db),
):
    return set_catalog_attribute_status_service(database, attribute_id, data.is_active)


@router.delete("/catalog-attributes/{attribute_id}")
def delete_catalog_attribute(
    attribute_id: UUID,
    database: Session = Depends(get_db),
):
    return delete_catalog_attribute_service(database, attribute_id)


@router.post(
    "/catalog-attributes/{attribute_id}/options",
    response_model=CatalogAttributeOptionResponse,
    status_code=201,
)
def create_attribute_option(
    attribute_id: UUID,
    data: CreateAttributeOptionRequest,
    database: Session = Depends(get_db),
):
    return create_attribute_option_service(database, attribute_id, data)


@router.patch(
    "/catalog-attribute-options/{option_id}",
    response_model=CatalogAttributeOptionResponse,
)
def update_attribute_option(
    option_id: UUID,
    data: UpdateAttributeOptionRequest,
    database: Session = Depends(get_db),
):
    return update_attribute_option_service(database, option_id, data)


@router.delete("/catalog-attribute-options/{option_id}")
def delete_attribute_option(
    option_id: UUID,
    database: Session = Depends(get_db),
):
    return delete_attribute_option_service(database, option_id)
