"""Rutas de reseñas del comprador: elegibilidad, crear, editar y borrar (solo rol user)."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.dbconexion import get_db
from app.core.AuthDependencies import AuthContext, require_role

from app.schemas.SchemaCommerce.SchemaReview import (
    CreateReviewRequest,
    UpdateReviewRequest,
    ReviewResponse,
    ReviewEligibilityResponse,
)

from app.services.commerce.ReviewService import (
    create_review_service,
    update_my_review_service,
    delete_my_review_service,
    check_review_eligibility_service,
)

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/eligibility/{product_id}", response_model=ReviewEligibilityResponse)
def get_review_eligibility(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    product_id: UUID,
    database: Session = Depends(get_db, scope="function"),
):
    return check_review_eligibility_service(
        current.user_id, current.role, product_id, database
    )


@router.post("", response_model=ReviewResponse)
def create_review(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    data: CreateReviewRequest,
    database: Session = Depends(get_db, scope="function"),
):
    return create_review_service(current.user_id, current.role, data, database)


@router.patch("/{review_id}", response_model=ReviewResponse)
def update_my_review(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    review_id: UUID,
    data: UpdateReviewRequest,
    database: Session = Depends(get_db, scope="function"),
):
    return update_my_review_service(
        current.user_id, current.role, review_id, data, database
    )


@router.delete("/{review_id}")
def delete_my_review(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    review_id: UUID,
    database: Session = Depends(get_db, scope="function"),
):
    delete_my_review_service(current.user_id, current.role, review_id, database)
    return {"success": True}
