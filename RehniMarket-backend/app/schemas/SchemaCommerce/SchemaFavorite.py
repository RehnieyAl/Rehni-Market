from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class AddFavoriteRequest(BaseModel):
    productId: UUID


class FavoriteProductResponse(BaseModel):
    id: UUID
    name: str
    image: str | None
    companyName: str
    price: Decimal
    finalPrice: Decimal
    discountEnabled: bool
    isActive: bool


class FavoriteResponse(BaseModel):
    id: UUID
    createdAt: str
    product: FavoriteProductResponse
