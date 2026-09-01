from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class AddCartItemRequest(BaseModel):
    productId: UUID
    variantId: UUID | None = None
    quantity: int = Field(default=1, ge=1)


class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(ge=1)


class CartItemColorResponse(BaseModel):
    name: str
    hex_color: str


class CartItemOptionResponse(BaseModel):
    attribute: str
    value: str


class CartItemResponse(BaseModel):
    id: UUID
    productId: UUID
    variantId: UUID | None

    name: str
    variantName: str | None
    sku: str | None = None
    image: str | None
    color: CartItemColorResponse | None
    options: list[CartItemOptionResponse] = []

    companyId: UUID
    companyName: str

    basePrice: Decimal
    unitPrice: Decimal
    discountPercentage: int | None = None
    appliesTax: bool
    taxAmount: Decimal
    quantity: int
    subtotal: Decimal

    availableStock: int

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    id: UUID
    items: list[CartItemResponse]
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    totalItems: int
