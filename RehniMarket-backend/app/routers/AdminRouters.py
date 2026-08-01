from fastapi import APIRouter, Request,Depends, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from app.database.Connection import get_db
from uuid import UUID

from app.services.DashboardService.admin.colorsService import (
    get_colors_service, 
    create_color_service, 
    update_color_service,
    delete_color_service
)

from app.services.DashboardService.admin.CatalogService import (
    get_catalogs_service,
    create_catalog_service,
    update_catalog_service,
    delete_catalog_service,
)
#Schemas!!!

from app.schemas.SchemaDashboard.SchemaCatalog import (
    CreateCatalogRequest,
    UpdateCatalogRequest,
    CatalogResponse,
)

from app.schemas.SchemaDashboard.SchemaColor import (
    CreateColorRequest,
    UpdateColorRequest
)

#Ruta principal
router = APIRouter(
    prefix=("/admin"),
    tags=["admin"]
)

# =========================
# ROUTERS COLORES
# =========================

@router.get("/dashboard/get-colors")
def get_colors(
    #request: Request,
    database: Session = Depends(get_db),
):
    #user_id = request.state.user_id

    return get_colors_service(
        #user_id=user_id,
        database=database,
    )


@router.post("/dashboard/create-color")
def create_color(
    #request: Request,
    data: CreateColorRequest,
    database: Session = Depends(get_db),
):
    #user_id = request.state.user_id

    return create_color_service(
        #user_id=user_id,
        database=database,
        data=data,
    )


@router.put("/dashboard/update-color/{color_id}")
def update_color(
    color_id: UUID,
    #request: Request,
    data: UpdateColorRequest,
    database: Session = Depends(get_db),
):
    #user_id = request.state.user_id

    return update_color_service(
        #user_id=user_id,
        database=database,
        color_id=color_id,
        data=data,
    )


@router.delete("/dashboard/delete-color/{color_id}")
def delete_color(
    color_id: UUID,
    #request: Request,
    database: Session = Depends(get_db),
):
    #user_id = request.state.user_id

    return delete_color_service(
        #user_id=user_id,
        database=database,
        color_id=color_id,
    )


# =========================
# ROUTERS CATALOGO
# =========================

@router.get("/dashboard/get-catalogs",response_model=list[CatalogResponse])
def get_catalogs(database: Session = Depends(get_db),):
    return get_catalogs_service(database)

@router.post("/dashboard/created-catalogs",response_model=CatalogResponse)
def create_catalog(data: CreateCatalogRequest,database: Session = Depends(get_db),):
    return create_catalog_service(database, data)


@router.put("/dashboard/update-catalogs/{catalog_id}",response_model=CatalogResponse)
def update_catalog(catalog_id: UUID,data: UpdateCatalogRequest,database: Session = Depends(get_db),):
    return update_catalog_service(database,catalog_id,data,)


@router.delete("/dashboard/delete-catalogs/{catalog_id}")
def delete_catalog(catalog_id: UUID,database: Session = Depends(get_db),):
    return delete_catalog_service(database,catalog_id,)


# =========================
# ROUTERS ESPECIFICACION
# =========================