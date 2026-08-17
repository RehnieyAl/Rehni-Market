from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.Connection import get_db

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


# Estatica ("/reviews/eligibility/{product_id}") - va antes de
# "/reviews/{review_id}" para que FastAPI no intente interpretar
# "eligibility" como un UUID (mismo criterio que
# CompanyRouter.py > /dashboard/orders/status-counts).
@router.get("/eligibility/{product_id}", response_model=ReviewEligibilityResponse)
def get_review_eligibility(request: Request, product_id: UUID, database: Session = Depends(get_db)):
    return check_review_eligibility_service(
        request.state.user_id, request.state.role, product_id, database
    )


@router.post("", response_model=ReviewResponse)
def create_review(request: Request, data: CreateReviewRequest, database: Session = Depends(get_db)):
    return create_review_service(request.state.user_id, request.state.role, data, database)


@router.patch("/{review_id}", response_model=ReviewResponse)
def update_my_review(
    request: Request, review_id: UUID, data: UpdateReviewRequest, database: Session = Depends(get_db)
):
    return update_my_review_service(
        request.state.user_id, request.state.role, review_id, data, database
    )


@router.delete("/{review_id}")
def delete_my_review(request: Request, review_id: UUID, database: Session = Depends(get_db)):
    delete_my_review_service(request.state.user_id, request.state.role, review_id, database)
    return {"success": True}
