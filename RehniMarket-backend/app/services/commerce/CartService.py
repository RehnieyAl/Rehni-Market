import traceback
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelCart import CartItem

from app.repository import CartRepository as repo

from app.schemas.SchemaCommerce.SchemaCart import (
    AddCartItemRequest,
    UpdateCartItemRequest,
    CartResponse,
    CartItemResponse,
    CartItemColorResponse,
)

from app.services.NasService import build_media_url
# Mismo cálculo de precio final que el catálogo público.
from app.services.publicService.Products import _compute_price_fields


def _require_buyer(role: str):
    if role != "user":
        api_error(
            403,
            ErrorCodes.PURCHASE_NOT_ALLOWED,
            "Solo las cuentas de tipo comprador pueden realizar compras.",
        )


def get_or_create_cart(database: Session, user_id: UUID):
    cart = repo.get_cart_by_user_id(database, user_id)

    if not cart:
        cart = repo.create_cart(database, user_id)
        database.commit()
        database.refresh(cart)

    return cart


def _to_item_response(item: CartItem) -> CartItemResponse:
    entity = item.variant if item.variant_id else item.product

    final_price, _, _ = _compute_price_fields(entity)

    images = item.variant.images if item.variant_id else item.product.images
    main_image = next((image for image in images if image.is_main), None)

    color = item.variant.color if item.variant_id else item.product.main_color

    available_stock = item.variant.stock if item.variant_id else item.product.stock

    return CartItemResponse(
        id=item.id,
        productId=item.product_id,
        variantId=item.variant_id,
        name=item.product.name,
        variantName=item.variant.name if item.variant_id else None,
        image=build_media_url(main_image.url) if main_image else None,
        color=(
            CartItemColorResponse(name=color.name, hex_color=color.hex_color)
            if color
            else None
        ),
        companyId=item.product.company_id,
        companyName=item.product.company.nameCompany,
        unitPrice=final_price,
        quantity=item.quantity,
        subtotal=final_price * item.quantity,
        availableStock=available_stock,
    )


def _to_cart_response(cart) -> CartResponse:
    items = [_to_item_response(item) for item in cart.items]

    return CartResponse(
        id=cart.id,
        items=items,
        subtotal=sum((item.subtotal for item in items), Decimal("0")),
        totalItems=sum(item.quantity for item in items),
    )


def get_cart_service(user_id: UUID, role: str, database: Session) -> CartResponse:
    _require_buyer(role)

    cart = get_or_create_cart(database, user_id)

    return _to_cart_response(cart)


def add_to_cart_service(
    user_id: UUID, role: str, data: AddCartItemRequest, database: Session
) -> CartResponse:
    _require_buyer(role)

    try:
        product = repo.get_product_by_id(database, data.productId)

        # Producto de empresa suspendida: se trata igual que "no encontrado".
        if not product or not product.is_active or not product.company or not product.company.CompanyStatus:
            api_error(404, ErrorCodes.PRODUCT_NOT_FOUND, "Producto no encontrado.")

        variant = None

        if data.variantId is not None:
            variant = repo.get_variant_by_id(database, data.variantId)

            if not variant or variant.product_id != product.id:
                api_error(404, ErrorCodes.VARIANT_NOT_FOUND, "Variante no encontrada.")

        elif product.has_variants and product.main_color_id is None:
            # Solo se exige variante si el producto tiene variantes y no tiene color base propio;
            # con color base, el producto base es una elección válida.
            api_error(
                400,
                ErrorCodes.VALIDATION_ERROR,
                "Este producto requiere seleccionar una variante.",
            )

        available_stock = variant.stock if variant else product.stock

        if available_stock <= 0:
            api_error(
                409, ErrorCodes.PRODUCT_OUT_OF_STOCK, "Producto sin stock disponible."
            )

        cart = get_or_create_cart(database, user_id)

        existing = repo.get_cart_item(
            database, cart.id, product.id, variant.id if variant else None
        )

        new_quantity = (existing.quantity if existing else 0) + data.quantity

        if new_quantity > available_stock:
            api_error(
                409,
                ErrorCodes.INSUFFICIENT_STOCK,
                f"Solo hay {available_stock} unidades disponibles.",
            )

        if existing:
            existing.quantity = new_quantity
        else:
            database.add(
                CartItem(
                    cart_id=cart.id,
                    product_id=product.id,
                    variant_id=variant.id if variant else None,
                    quantity=data.quantity,
                )
            )

        database.commit()

        return get_cart_service(user_id, role, database)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def update_cart_item_service(
    user_id: UUID,
    role: str,
    item_id: UUID,
    data: UpdateCartItemRequest,
    database: Session,
) -> CartResponse:
    _require_buyer(role)

    try:
        cart = get_or_create_cart(database, user_id)

        item = repo.get_cart_item_owned(database, cart.id, item_id)

        if not item:
            api_error(404, ErrorCodes.CART_ITEM_NOT_FOUND, "Producto no encontrado en el carrito.")

        available_stock = item.variant.stock if item.variant_id else item.product.stock

        if data.quantity > available_stock:
            api_error(
                409,
                ErrorCodes.INSUFFICIENT_STOCK,
                f"Solo hay {available_stock} unidades disponibles.",
            )

        item.quantity = data.quantity

        database.commit()

        return get_cart_service(user_id, role, database)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def remove_cart_item_service(
    user_id: UUID, role: str, item_id: UUID, database: Session
) -> CartResponse:
    _require_buyer(role)

    try:
        cart = get_or_create_cart(database, user_id)

        item = repo.get_cart_item_owned(database, cart.id, item_id)

        if not item:
            api_error(404, ErrorCodes.CART_ITEM_NOT_FOUND, "Producto no encontrado en el carrito.")

        database.delete(item)
        database.commit()

        return get_cart_service(user_id, role, database)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def clear_cart_service(user_id: UUID, role: str, database: Session) -> CartResponse:
    _require_buyer(role)

    try:
        cart = get_or_create_cart(database, user_id)

        repo.clear_cart_items(database, cart.id)

        database.commit()

        return get_cart_service(user_id, role, database)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")
