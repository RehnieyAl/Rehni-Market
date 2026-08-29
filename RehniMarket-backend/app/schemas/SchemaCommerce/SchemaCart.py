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


class CartItemResponse(BaseModel):
    id: UUID
    productId: UUID
    variantId: UUID | None

    name: str
    variantName: str | None
    image: str | None
    color: CartItemColorResponse | None

    companyId: UUID
    companyName: str

    unitPrice: Decimal
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
