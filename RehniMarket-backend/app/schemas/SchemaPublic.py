from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class CatalogResponse(BaseModel):
    id: UUID
    name: str

    # product_count: calculado (productos activos y con stock válido), no es columna.
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


class PublicProductCardResponse(BaseModel):
    id: UUID
    name: str
    image: str | None
    company_name: str

    catalog_id: UUID
    catalog_name: str

    price: Decimal
    discount_enabled: bool
    # None cuando discount_enabled es False.
    discount_percentage: int | None
    final_price: Decimal

    # Con variantes es el stock del producto base; la disponibilidad real la resuelve el filtro.
    stock: int

    # None cuando no tiene reseñas activas.
    average_rating: float | None
    review_count: int


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


class PublicAttributePairResponse(BaseModel):
    attribute: str
    value: str


class PublicVariantOptionResponse(BaseModel):
    attribute: str
    value: str
    hex_color: str | None = None


class PublicProductVariantResponse(BaseModel):
    id: UUID
    name: str
    sku: str | None = None
    price: Decimal

    # Descuento efectivo: variante propia o, si no tiene, el del producto.
    discount_enabled: bool
    discount_percentage: int | None
    final_price: Decimal

    stock: int
    options: list[PublicVariantOptionResponse]
    color: PublicProductColorResponse | None
    images: list[PublicProductImageResponse]
    specifications: list[PublicProductSpecificationResponse]


class PublicCatalogAttributeOptionResponse(BaseModel):
    id: UUID
    value: str
    hex_color: str | None = None
    position: int

    model_config = {"from_attributes": True}


class PublicCatalogAttributeResponse(BaseModel):
    id: UUID
    name: str
    input_type: str
    unit: str | None = None
    position: int
    options: list[PublicCatalogAttributeOptionResponse]

    model_config = {"from_attributes": True}


class PublicCatalogAttributesResponse(BaseModel):
    product_attributes: list[PublicCatalogAttributeResponse]
    variant_attributes: list[PublicCatalogAttributeResponse]


class PublicRatingDistributionResponse(BaseModel):
    """Conteo de reseñas activas por puntaje."""

    five: int
    four: int
    three: int
    two: int
    one: int


class PublicProductDetailResponse(BaseModel):
    id: UUID
    name: str
    descripcion: str
    catalog_name: str
    catalog_id: UUID
    company_name: str
    company_id: UUID
    company_logo: str | None
    # CompanyCertificateStatus == APPROVED.
    company_is_verified: bool
    is_active: bool

    price: Decimal
    discount_enabled: bool
    discount_percentage: int | None
    final_price: Decimal

    stock: int

    average_rating: float | None
    review_count: int
    rating_distribution: PublicRatingDistributionResponse

    color: PublicProductColorResponse | None
    images: list[PublicProductImageResponse]
    attributes: list[PublicAttributePairResponse]
    specifications: list[PublicProductSpecificationResponse]
    variants: list[PublicProductVariantResponse]


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
    """Reputación agregada de las reseñas activas de los productos de la empresa.
    average_rating es None (no 0) cuando total_reviews es 0."""

    average_rating: float | None
    total_reviews: int


class PublicCompanyProductsResponse(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int
    products: list[PublicProductCardResponse]


class PublicProductsPaginatedResponse(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int
    products: list[PublicProductCardResponse]