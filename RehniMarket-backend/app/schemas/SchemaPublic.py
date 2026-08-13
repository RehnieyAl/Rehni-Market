from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class CatalogResponse(BaseModel):
    id: UUID
    name: str

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

    price: Decimal
    discount_enabled: bool
    # None cuando discount_enabled es False.
    discount_percentage: int | None
    final_price: Decimal


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