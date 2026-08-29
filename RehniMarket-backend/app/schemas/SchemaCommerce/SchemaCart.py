from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class AddCartItemRequest(BaseModel):
    productId: UUID
    variantId: UUID | None = None
    quantity: int = Field(default=1, ge=1)


class UpdateCartItemRequest(BaseModel):
    # No se permite 0: para quitar un producto se usa el DELETE dedicado.
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
    quantity: int
    subtotal: Decimal

    # Stock actual del producto o la variante seleccionada.
    availableStock: int

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    id: UUID
    items: list[CartItemResponse]
    subtotal: Decimal
    totalItems: int
