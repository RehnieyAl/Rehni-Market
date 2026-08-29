from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

DiscountType = Literal["percent", "fixed"]


class ProductAttributeValueItem(BaseModel):
    attribute_id: UUID
    value: str = Field(min_length=1, max_length=500)


class SetProductAttributesRequest(BaseModel):
    values: list[ProductAttributeValueItem]


class ProductAttributeValueResponse(BaseModel):
    attribute_id: UUID
    name: str
    value: str


class CatalogAttributeOptionBrief(BaseModel):
    id: UUID
    value: str
    hex_color: str | None = None

    model_config = ConfigDict(from_attributes=True)


class CatalogAttributeBrief(BaseModel):
    id: UUID
    name: str
    role: str
    input_type: str
    is_active: bool
    options: list[CatalogAttributeOptionBrief] = []

    model_config = ConfigDict(from_attributes=True)


class ProductAvailableAttributesResponse(BaseModel):
    product_attributes: list[CatalogAttributeBrief]
    variant_axes: list[CatalogAttributeBrief]


class ProductDiscountRequest(BaseModel):
    discount_enable: bool
    discount_value: Decimal = Field(default=0, ge=0)
    discount_type: DiscountType | None = None
    discount_starts_at: datetime | None = None
    discount_ends_at: datetime | None = None
