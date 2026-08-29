from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.models.ModelReview import Review
from app.models.ModelOrder import Order, OrderItem, OrderStatusEnum
from app.models.ModelProduct import Product


def get_review_by_user_and_product(
    database: Session, user_id: UUID, product_id: UUID
) -> Review | None:
    return (
        database.query(Review)
        .filter(Review.user_id == user_id, Review.product_id == product_id)
        .first()
    )


def get_review_by_id(database: Session, review_id: UUID) -> Review | None:
    return database.query(Review).filter(Review.id == review_id).first()


def has_delivered_purchase(database: Session, user_id: UUID, product_id: UUID) -> bool:
    """Compra verificada: el usuario tiene al menos un pedido propio DELIVERED con este producto."""

    return (
        database.query(OrderItem.id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(
            Order.user_id == user_id,
            Order.status == OrderStatusEnum.DELIVERED,
            OrderItem.product_id == product_id,
        )
        .first()
        is not None
    )


def create_review(database: Session, review: Review) -> Review:
    database.add(review)
    database.flush()
    return review


def list_product_reviews(database: Session, product_id: UUID, page: int, limit: int):
    # selectinload(Review.user): evita el N+1 al leer review.user en _to_review_response.
    query = (
        database.query(Review)
        .options(selectinload(Review.user))
        .filter(Review.product_id == product_id, Review.is_active.is_(True))
        .order_by(Review.created_at.desc())
    )

    total = query.count()
    offset = (page - 1) * limit
    reviews = query.offset(offset).limit(limit).all()

    return reviews, total


def get_product_rating_summary(database: Session, product_id: UUID) -> dict[int, int]:
    """Conteo de reseñas activas de un producto agrupado por rating (un solo GROUP BY)."""

    rows = (
        database.query(Review.rating, func.count(Review.id))
        .filter(Review.product_id == product_id, Review.is_active.is_(True))
        .group_by(Review.rating)
        .all()
    )

    return {rating: count for rating, count in rows}


def get_products_rating_summary(
    database: Session, product_ids: list[UUID]
) -> dict[UUID, tuple[float | None, int]]:
    """Como get_product_rating_summary pero para varios productos (AVG + COUNT por product_id)."""

    if not product_ids:
        return {}

    rows = (
        database.query(Review.product_id, func.avg(Review.rating), func.count(Review.id))
        .filter(Review.product_id.in_(product_ids), Review.is_active.is_(True))
        .group_by(Review.product_id)
        .all()
    )

    return {
        product_id: (float(average_rating) if average_rating is not None else None, count)
        for product_id, average_rating, count in rows
    }


def get_company_rating(database: Session, company_id: UUID) -> tuple[float | None, int]:
    """Promedio + conteo de todas las reseñas activas de los productos de la empresa
    (un solo AVG + COUNT vía JOIN a products)."""

    average_rating, total_reviews = (
        database.query(func.avg(Review.rating), func.count(Review.id))
        .join(Product, Review.product_id == Product.id)
        .filter(Product.company_id == company_id, Review.is_active.is_(True))
        .one()
    )

    return (
        float(average_rating) if average_rating is not None else None,
        total_reviews or 0,
    )
