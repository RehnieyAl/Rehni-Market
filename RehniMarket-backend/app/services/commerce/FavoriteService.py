import traceback
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.repository import FavoriteRepository as repo
from app.repository.CartRepository import get_product_by_id

from app.schemas.SchemaCommerce.SchemaFavorite import (
    AddFavoriteRequest,
    FavoriteResponse,
    FavoriteProductResponse,
)

from app.services.pricing import resolve_product_card_price
from app.services.variants.images import product_display_image_url


def _require_buyer(role: str):
    if role != "user":
        api_error(
            403,
            ErrorCodes.PURCHASE_NOT_ALLOWED,
            "Solo las cuentas de tipo comprador pueden usar favoritos.",
        )


def list_favorites_service(user_id: UUID, role: str, database: Session) -> list[FavoriteResponse]:
    _require_buyer(role)

    favorites = repo.list_favorites(database, user_id)

    result = []

    for favorite in favorites:
        product = favorite.product

        if not product:
            continue

        card_price = resolve_product_card_price(product)

        result.append(
            FavoriteResponse(
                id=favorite.id,
                createdAt=favorite.created_at.isoformat(),
                product=FavoriteProductResponse(
                    id=product.id,
                    name=product.name,
                    image=product_display_image_url(product),
                    companyName=product.company.nameCompany,
                    price=card_price.base_price,
                    finalPrice=card_price.final_price,
                    discountEnabled=card_price.discount_enabled,
                    isActive=product.is_active,
                ),
            )
        )

    return result


def add_favorite_service(
    user_id: UUID, role: str, data: AddFavoriteRequest, database: Session
) -> dict:
    _require_buyer(role)

    try:
        product = get_product_by_id(database, data.productId)

        if not product:
            api_error(404, ErrorCodes.PRODUCT_NOT_FOUND, "Producto no encontrado.")

        existing = repo.get_favorite(database, user_id, data.productId)

        if existing:
            api_error(
                409,
                ErrorCodes.FAVORITE_ALREADY_EXISTS,
                "Este producto ya está en tus favoritos.",
            )

        repo.create_favorite(database, user_id, data.productId)

        database.commit()

        return {"message": "Producto agregado a favoritos."}

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def remove_favorite_service(
    user_id: UUID, role: str, product_id: UUID, database: Session
) -> dict:
    _require_buyer(role)

    try:
        favorite = repo.get_favorite(database, user_id, product_id)

        if not favorite:
            api_error(404, ErrorCodes.FAVORITE_NOT_FOUND, "Favorito no encontrado.")

        repo.delete_favorite(database, favorite)

        database.commit()

        return {"message": "Producto eliminado de favoritos."}

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")
