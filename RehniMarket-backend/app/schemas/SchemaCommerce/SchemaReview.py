from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CreateReviewRequest(BaseModel):
    productId: UUID
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class UpdateReviewRequest(BaseModel):
    """PATCH parcial: ambos campos opcionales."""

    rating: int | None = Field(default=None, ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class ReviewResponse(BaseModel):
    id: UUID
    productId: UUID
    rating: int
    comment: str | None
    createdAt: datetime
    updatedAt: datetime | None

    buyerName: str
    buyerPhoto: str | None


class ReviewsPaginatedResponse(BaseModel):
    items: list[ReviewResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class ReviewEligibilityResponse(BaseModel):
    """Dice al frontend si mostrar el formulario de reseña, sin replicar las reglas de negocio."""

    can_review: bool
    already_reviewed: bool
    my_review_id: UUID | None
