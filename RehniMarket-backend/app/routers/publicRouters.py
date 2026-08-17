#Public
from fastapi import APIRouter,Depends,Query
from sqlalchemy.orm import Session
from app.database.Connection import get_db
from app.services.publicService.Products import (
    get_catalogs_service,
    get_specifications_by_catalog_service,
    get_colors_service,
    get_daily_products_service,
    list_public_products_service,
    get_public_product_detail_service,
)
from app.services.publicService.Advertisements import get_active_advertisements_service
from app.services.publicService.Company import (
    get_public_company_profile_service,
    get_public_company_products_service,
    get_company_rating_service,
)
from app.services.commerce.ReviewService import list_product_reviews_service
from decimal import Decimal

from app.schemas.SchemaPublic import (
    CatalogResponse,
    SpecificationResponse,
    ColorResponse,
    PublicProductCardResponse,
    PublicProductsPaginatedResponse,
    PublicProductDetailResponse,
    PublicCompanyProfileResponse,
    PublicCompanyProductsResponse,
    CompanyRatingResponse,
)
from app.schemas.SchemaCommerce.SchemaReview import ReviewsPaginatedResponse
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
# PRODUCTOS PÚBLICOS (catálogo completo + Productos del día)
# ==========================

@router.get("/products", response_model=PublicProductsPaginatedResponse)
def get_public_products(
    search: str | None = Query(None),
    catalog_id: UUID | None = Query(None),
    min_price: Decimal | None = Query(None, ge=0),
    max_price: Decimal | None = Query(None, ge=0),
    discount: bool | None = Query(None),
    in_stock: bool | None = Query(None),
    # Anuncios dinamicos por reglas (ver ALCANCE > Anuncios dinamicos):
    # mismo criterio snake_case que min_price/max_price/in_stock - el
    # frontend traduce esto desde los parametros camelCase de la URL de
    # la pagina (minDiscount/maxStock/days, ver
    # features/public/products/api/productsService.ts > getPublicProducts).
    min_discount: int | None = Query(None, ge=0, le=100),
    max_stock: int | None = Query(None, ge=0),
    days: int | None = Query(None, ge=1),
    sort: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=48),
    database: Session = Depends(get_db),
):
    return list_public_products_service(
        database,
        search=search,
        catalog_id=catalog_id,
        min_price=min_price,
        max_price=max_price,
        discount=discount,
        in_stock=in_stock,
        min_discount=min_discount,
        max_stock=max_stock,
        days=days,
        sort=sort,
        page=page,
        limit=limit,
    )


@router.get("/products/daily", response_model=list[PublicProductCardResponse])
def get_daily_products(
    limit: int = Query(8, ge=1, le=24),
    database: Session = Depends(get_db),
):
    return get_daily_products_service(database, limit=limit)


@router.get("/products/{product_id}", response_model=PublicProductDetailResponse)
def get_public_product_detail(product_id: UUID, database: Session = Depends(get_db)):
    return get_public_product_detail_service(database, product_id)


@router.get("/products/{product_id}/reviews", response_model=ReviewsPaginatedResponse)
def get_public_product_reviews(
    product_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    database: Session = Depends(get_db),
):
    return list_product_reviews_service(database, product_id, page=page, limit=limit)


# ==========================
# PERFIL PUBLICO DE EMPRESA
# ==========================

@router.get("/company/{company_id}", response_model=PublicCompanyProfileResponse)
def get_public_company(company_id: UUID, database: Session = Depends(get_db)):
    return get_public_company_profile_service(database, company_id)


@router.get("/company/{company_id}/products", response_model=PublicCompanyProductsResponse)
def get_public_company_products(
    company_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=48),
    database: Session = Depends(get_db),
):
    return get_public_company_products_service(
        database, company_id, page=page, limit=limit
    )


# Reputación de empresa (ver ALCANCE > Calificaciones de empresa) -
# endpoint único y reutilizable (regla 9), consumido desde 3 lugares
# distintos del frontend (Dashboard Empresa, Mi tienda, perfil público de
# empresa - ver CompanyRatingBadge.tsx).
@router.get("/company/{company_id}/rating", response_model=CompanyRatingResponse)
def get_public_company_rating(company_id: UUID, database: Session = Depends(get_db)):
    return get_company_rating_service(database, company_id)
