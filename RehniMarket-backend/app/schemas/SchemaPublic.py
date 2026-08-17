from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class CatalogResponse(BaseModel):
    id: UUID
    name: str

    # product_count: calculado en get_catalogs_service con un único query
    # agregado (ver ALCANCE > Rendimiento) - productos activos, visibles
    # y con stock válido (mismo criterio que _has_visible_stock). No es
    # una columna del modelo.
    #
    # image_url: SÍ es una columna real (ver ModelCatalog.py >
    # Catalog.image_url, subida por admin/owner con el mismo flujo NAS
    # que productos/anuncios) - None si la categoría todavía no tiene
    # imagen propia (el frontend muestra un placeholder, ver
    # CategoryCard.tsx).
    product_count: int
    image_url: str | None

    model_config = {
        "from_attributes": True
    }

class SpecificationResponse(BaseModel):
    id: UUID
    name: str
    type: str
    required: bool

    model_config = {
        "from_attributes": True
    }

class ColorResponse(BaseModel):
    id: UUID
    name: str
    hex_color: str

    model_config = {
        "from_attributes": True
    }


# ==========================
# PRODUCTOS PÚBLICOS
# ==========================
# "Productos del dia" (Home) y detalle publico de producto. No exponen
# nada scoped a la empresa (company_id, catalog_id crudo, etc.) - solo lo
# necesario para mostrarse en el storefront publico.

class PublicProductCardResponse(BaseModel):
    id: UUID
    name: str
    image: str | None
    company_name: str

    # Catálogo del producto (ver ALCANCE > filtros de catálogo público:
    # "Categoría") - antes no se exponía, así que el listado público no
    # podía filtrar/mostrar categoría en el cliente.
    catalog_id: UUID
    catalog_name: str

    price: Decimal
    discount_enabled: bool
    # None cuando discount_enabled es False.
    discount_percentage: int | None
    final_price: Decimal

    # Para el filtro "Disponibilidad" y el badge "Agotado" en la tarjeta
    # (ver ALCANCE > filtros de catálogo público). Con variantes, este es
    # el stock del producto base (ver ModelProduct.py) - la
    # disponibilidad real en ese caso ya la resuelve _has_visible_stock
    # del lado del filtro, no este número aislado.
    stock: int


class PublicProductImageResponse(BaseModel):
    id: UUID
    url: str
    is_main: bool


class PublicProductSpecificationResponse(BaseModel):
    name: str
    value: str


class PublicProductColorResponse(BaseModel):
    name: str
    hex_color: str


class PublicProductVariantResponse(BaseModel):
    """
    Variante real del producto (ProductVariant) expuesta al storefront
    publico - mismos campos que ya administra la empresa (ver
    app/services/DashboardService/company/Variants.py), sin nada
    scoped a la empresa.
    """

    id: UUID
    name: str
    price: Decimal

    # Descuento propio de la variante (independiente del descuento del
    # producto base) - mismos campos calculados que
    # PublicProductCardResponse/PublicProductDetailResponse (ver
    # _compute_price_fields en publicService/Products.py).
    discount_enabled: bool
    discount_percentage: int | None
    final_price: Decimal

    stock: int
    color: PublicProductColorResponse | None
    images: list[PublicProductImageResponse]
    specifications: list[PublicProductSpecificationResponse]


class PublicProductDetailResponse(BaseModel):
    id: UUID
    name: str
    descripcion: str
    catalog_name: str
    company_name: str
    # Datos minimos de la empresa para el bloque "Vendido por" del detalle
    # publico de producto (ver ProductDetail.tsx > "Ver perfil de empresa").
    # No se reutiliza PublicCompanyProfileResponse completo a proposito:
    # aqui solo hace falta lo necesario para el link, no todo el perfil.
    company_id: UUID
    company_logo: str | None
    is_active: bool

    price: Decimal
    discount_enabled: bool
    discount_percentage: int | None
    final_price: Decimal

    stock: int

    color: PublicProductColorResponse | None
    images: list[PublicProductImageResponse]
    specifications: list[PublicProductSpecificationResponse]
    variants: list[PublicProductVariantResponse]


# ==========================
# PERFIL PUBLICO DE EMPRESA
# ==========================
# Vista publica de una empresa (ver /company/:companyId en el frontend),
# accesible desde el detalle de producto. Solo expone lo necesario para el
# storefront - nada scoped a la propia empresa (correo, NIT, certificado,
# etc.), a diferencia de AdminCompanyDetailResponse.

class PublicCompanyProfileResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    logo_url: str | None
    banner_url: str | None
    is_verified: bool
    created_at: datetime
    total_products: int


class CompanyRatingResponse(BaseModel):
    """
    Reputación de empresa (ver ALCANCE > Calificaciones de empresa):
    calculada en caliente agregando las reseñas ACTIVAS de todos los
    productos de la empresa (ver ReviewRepository.get_company_rating) -
    la empresa no tiene reseñas propias, no hay ninguna columna de
    calificación en Company.

    average_rating es None (no 0) cuando total_reviews es 0 - el
    frontend muestra "Sin calificaciones todavía" en ese caso, nunca
    "0.0 estrellas" (ver ALCANCE > regla 7).
    """

    average_rating: float | None
    total_reviews: int


class PublicCompanyProductsResponse(BaseModel):
    """
    Productos activos de una empresa, paginados. Mismo shape de paginacion
    que company_dashboard_get_my_products (page/limit/total/total_pages) -
    ver app/services/DashboardService/company/Dashboard.py.
    """

    page: int
    limit: int
    total: int
    total_pages: int
    products: list[PublicProductCardResponse]


class PublicProductsPaginatedResponse(BaseModel):
    """
    Listado público de productos con filtros (ver ALCANCE > catálogo
    público: Categoría, Precio, Descuento, Disponibilidad, Ordenamiento -
    GET /public/products). Mismo shape de paginación que
    PublicCompanyProductsResponse.
    """

    page: int
    limit: int
    total: int
    total_pages: int
    products: list[PublicProductCardResponse]