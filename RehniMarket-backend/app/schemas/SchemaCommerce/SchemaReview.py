from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CreateReviewRequest(BaseModel):
    productId: UUID
    rating: int = Field(ge=1, le=5)
    # Opcional a proposito - una reseña de solo estrellas es valida (ver
    # ALCANCE > sistema de reseñas).
    comment: str | None = Field(default=None, max_length=1000)


class UpdateReviewRequest(BaseModel):
    """
    Ambos campos opcionales: PATCH parcial (mismo criterio que
    UpdateInformationCompanyRequest) - se puede corregir solo el
    comentario sin repetir el rating, o viceversa.
    """

    rating: int | None = Field(default=None, ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class ReviewResponse(BaseModel):
    id: UUID
    productId: UUID
    rating: int
    comment: str | None
    createdAt: datetime
    updatedAt: datetime | None

    # Datos minimos del autor para mostrar en el listado publico (ver
    # ALCANCE > listado de reseñas de producto) - mismo patron que
    # OrderResponse.buyerName/buyerPhoto (ver SchemaOrder.py).
    buyerName: str
    buyerPhoto: str | None


class ReviewsPaginatedResponse(BaseModel):
    items: list[ReviewResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class ReviewEligibilityResponse(BaseModel):
    """
    Le dice al frontend si mostrar el formulario de "Escribir reseña" para
    un producto puntual, sin que tenga que adivinar reglas de negocio
    (compra entregada, reseña ya existente) del lado del cliente - ver
    ReviewService.check_review_eligibility_service.
    """

    can_review: bool
    already_reviewed: bool
    my_review_id: UUID | None
