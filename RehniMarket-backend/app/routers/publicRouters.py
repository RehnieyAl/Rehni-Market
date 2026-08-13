#Public
from fastapi import APIRouter,Depends,Query
from sqlalchemy.orm import Session
from app.database.Connection import get_db
from app.services.publicService.Products import (
    get_catalogs_service,
    get_specifications_by_catalog_service,
    get_colors_service,
    get_daily_products_service,
    get_public_product_detail_service,
)
from app.services.publicService.Advertisements import get_active_advertisements_service
from app.schemas.SchemaPublic import (
    CatalogResponse,
    SpecificationResponse,
    ColorResponse,
    PublicProductCardResponse,
    PublicProductDetailResponse,
)
from app.schemas.SchemaDashboard.SchemaAdvertisement import AdvertisementResponse
from uuid import UUID

router = APIRouter(
    prefix=("/public"),
    tags=["public"]
)

@router.get("/catalogs", response_model=list[CatalogResponse])
def get_catalogs(database: Session = Depends(get_db)):
    return get_catalogs_service(database)

@router.get("/catalogs/{catalog_id}/specifications",response_model=list[SpecificationResponse],)
def get_catalog_specifications(catalog_id: UUID,database: Session = Depends(get_db),):
    return get_specifications_by_catalog_service(catalog_id,database,)

@router.get("/colors", response_model=list[ColorResponse])
def get_colors(database: Session = Depends(get_db)):
    return get_colors_service(database)


# ==========================
# ANUNCIOS (Hero del Home)
# ==========================

@router.get("/advertisements", response_model=list[AdvertisementResponse])
def get_advertisements(database: Session = Depends(get_db)):
    return get_active_advertisements_service(database)


# ==========================
# PRODUCTOS PÚBLICOS (Productos del día)
# ==========================

@router.get("/products/daily", response_model=list[PublicProductCardResponse])
def get_daily_products(
    limit: int = Query(8, ge=1, le=24),
    database: Session = Depends(get_db),
):
    return get_daily_products_service(database, limit=limit)


@router.get("/products/{product_id}", response_model=PublicProductDetailResponse)
def get_public_product_detail(product_id: UUID, database: Session = Depends(get_db)):
    return get_public_product_detail_service(database, product_id)
