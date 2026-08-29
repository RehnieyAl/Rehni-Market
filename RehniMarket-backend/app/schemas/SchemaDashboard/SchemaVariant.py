from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

DiscountType = Literal["percent", "fixed"]


class VariantOptionPair(BaseModel):
    attribute_id: UUID
    attribute_name: str
    option_id: UUID
    value: str
    hex_color: str | None = None


class VariantAttributeValuePair(BaseModel):
    attribute_id: UUID
    attribute_name: str
    value: str


class VariantImageResponse(BaseModel):
    id: UUID
    url: str
    is_main: bool

    model_config = {"from_attributes": True}


class VariantResponse(BaseModel):
    id: UUID
    name: str
    sku: str | None
    price: Decimal
    stock: int
    combo_key: str | None
    deleted_at: datetime | None

    discount_enable: bool
    discount_value: Decimal
    discount_type: str | None
    discount_starts_at: datetime | None
    discount_ends_at: datetime | None

    effective_price: Decimal
    discount_percentage: int | None
    discount_source: str | None

    product_id: UUID
    options: list[VariantOptionPair]
    main_image_url: str | None


class VariantDetailResponse(VariantResponse):
    images: list[VariantImageResponse]
    attribute_values: list[VariantAttributeValuePair]


class VariantAttributeValueItem(BaseModel):
    attribute_id: UUID
    value: str = Field(min_length=1, max_length=500)


class CreateVariantRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    sku: str | None = Field(default=None, max_length=64)
    price: Decimal = Field(ge=0)
    stock: int = Field(ge=0)
    option_ids: list[UUID] = []
    attribute_values: list[VariantAttributeValueItem] = []
    discount_enable: bool = False
    discount_value: Decimal = Field(default=0, ge=0)
    discount_type: DiscountType | None = None
    discount_starts_at: datetime | None = None
    discount_ends_at: datetime | None = None


class UpdateVariantRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    sku: str | None = Field(default=None, max_length=64)
    price: Decimal | None = Field(default=None, ge=0)
    stock: int | None = Field(default=None, ge=0)
    option_ids: list[UUID] | None = None
    attribute_values: list[VariantAttributeValueItem] | None = None
    discount_enable: bool | None = None
    discount_value: Decimal | None = Field(default=None, ge=0)
    discount_type: DiscountType | None = None
    discount_starts_at: datetime | None = None
    discount_ends_at: datetime | None = None


class GenerateCombinationsRequest(BaseModel):
    # Vacío = todos los ejes de variante activos del catálogo.
    attribute_ids: list[UUID] = []


class GeneratedCombination(BaseModel):
    options: list[VariantOptionPair]
    combo_key: str
    exists: bool
