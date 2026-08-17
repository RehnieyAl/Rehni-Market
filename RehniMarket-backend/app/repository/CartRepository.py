from sqlalchemy.orm import Session
from uuid import UUID

from app.models.ModelCart import Cart, CartItem
from app.models.ModelProduct import Product
from app.models.ModelVariant import ProductVariant


def get_cart_by_user_id(database: Session, user_id: UUID) -> Cart | None:
    return database.query(Cart).filter(Cart.user_id == user_id).first()


def create_cart(database: Session, user_id: UUID) -> Cart:
    cart = Cart(user_id=user_id)
    database.add(cart)
    database.flush()
    return cart


def get_product_by_id(database: Session, product_id: UUID) -> Product | None:
    return database.query(Product).filter(Product.id == product_id).first()


def get_variant_by_id(database: Session, variant_id: UUID) -> ProductVariant | None:
    return database.query(ProductVariant).filter(ProductVariant.id == variant_id).first()


def get_cart_item(
    database: Session, cart_id: UUID, product_id: UUID, variant_id: UUID | None
) -> CartItem | None:
    return (
        database.query(CartItem)
        .filter(
            CartItem.cart_id == cart_id,
            CartItem.product_id == product_id,
            CartItem.variant_id == variant_id,
        )
        .first()
    )


def get_cart_item_owned(database: Session, cart_id: UUID, item_id: UUID) -> CartItem | None:
    return (
        database.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.cart_id == cart_id)
        .first()
    )


def clear_cart_items(database: Session, cart_id: UUID) -> None:
    database.query(CartItem).filter(CartItem.cart_id == cart_id).delete()
