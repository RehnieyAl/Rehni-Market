import traceback
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelProduct import Product
from app.models.ModelReview import Review

from app.repository import ReviewRepository as repo

from app.schemas.SchemaCommerce.SchemaReview import (
    CreateReviewRequest,
    UpdateReviewRequest,
    ReviewResponse,
    ReviewsPaginatedResponse,
    ReviewEligibilityResponse,
)

from app.services.NasService import build_media_url


def _require_buyer(role: str):
    """Solo USER puede escribir/editar/eliminar reseñas; se revalida acá igual que en compras."""

    if role != "user":
        api_error(403, ErrorCodes.PURCHASE_NOT_ALLOWED, "Esta cuenta no puede escribir reseñas.")


def _to_review_response(review: Review) -> ReviewResponse:
    buyer = review.user

    buyer_photo = (
        build_media_url(f"uploads/{buyer.profileImagen}") if buyer.profileImagen else None
    )

    return ReviewResponse(
        id=review.id,
        productId=review.product_id,
        rating=review.rating,
        comment=review.comment,
        createdAt=review.created_at,
        updatedAt=review.updated_at,
        buyerName=buyer.fullName,
        buyerPhoto=buyer_photo,
    )


def check_review_eligibility_service(
    user_id: UUID, role: str, product_id: UUID, database: Session
) -> ReviewEligibilityResponse:
    if role != "user":
        return ReviewEligibilityResponse(
            can_review=False, already_reviewed=False, my_review_id=None
        )

    existing = repo.get_review_by_user_and_product(database, user_id, product_id)

    if existing:
        return ReviewEligibilityResponse(
            can_review=False, already_reviewed=True, my_review_id=existing.id
        )

    can_review = repo.has_delivered_purchase(database, user_id, product_id)

    return ReviewEligibilityResponse(
        can_review=can_review, already_reviewed=False, my_review_id=None
    )


def create_review_service(
    user_id: UUID, role: str, data: CreateReviewRequest, database: Session
) -> ReviewResponse:
    _require_buyer(role)

    try:
        product = database.query(Product).filter(Product.id == data.productId).first()

        if not product:
            api_error(404, ErrorCodes.PRODUCT_NOT_FOUND, "Producto no encontrado.")

        if repo.get_review_by_user_and_product(database, user_id, data.productId):
            api_error(
                409,
                ErrorCodes.REVIEW_ALREADY_EXISTS,
                "Ya reseñaste este producto. Edita tu reseña en vez de crear otra.",
            )

        if not repo.has_delivered_purchase(database, user_id, data.productId):
            api_error(
                403,
                ErrorCodes.REVIEW_NOT_ELIGIBLE,
                "Solo puedes reseñar productos que ya te hayan entregado.",
            )

        review = Review(
            user_id=user_id,
            product_id=data.productId,
            rating=data.rating,
            comment=data.comment,
        )

        repo.create_review(database, review)

        database.commit()
        database.refresh(review)

        return _to_review_response(review)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def update_my_review_service(
    user_id: UUID, role: str, review_id: UUID, data: UpdateReviewRequest, database: Session
) -> ReviewResponse:
    _require_buyer(role)

    try:
        review = repo.get_review_by_id(database, review_id)

        if not review or not review.is_active:
            api_error(404, ErrorCodes.REVIEW_NOT_FOUND, "Reseña no encontrada.")

        if review.user_id != user_id:
            api_error(403, ErrorCodes.FORBIDDEN, "No puedes editar la reseña de otro usuario.")

        if data.rating is not None:
            review.rating = data.rating

        if data.comment is not None:
            review.comment = data.comment

        database.commit()
        database.refresh(review)

        return _to_review_response(review)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def delete_my_review_service(user_id: UUID, role: str, review_id: UUID, database: Session) -> None:
    _require_buyer(role)

    try:
        review = repo.get_review_by_id(database, review_id)

        if not review or not review.is_active:
            api_error(404, ErrorCodes.REVIEW_NOT_FOUND, "Reseña no encontrada.")

        if review.user_id != user_id:
            api_error(403, ErrorCodes.FORBIDDEN, "No puedes eliminar la reseña de otro usuario.")

        # Soft-delete: se desactiva, no se borra. Promedios y listados solo cuentan activas.
        review.is_active = False

        database.commit()

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def list_product_reviews_service(
    database: Session, product_id: UUID, page: int = 1, limit: int = 10
) -> ReviewsPaginatedResponse:
    reviews, total = repo.list_product_reviews(database, product_id, page, limit)

    return ReviewsPaginatedResponse(
        items=[_to_review_response(review) for review in reviews],
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit if total else 0,
    )
