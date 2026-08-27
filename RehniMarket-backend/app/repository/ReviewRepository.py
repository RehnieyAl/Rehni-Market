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
    """
    "Compra verificada" (ver ALCANCE > sistema de reseñas): el usuario
    debe tener al menos un pedido PROPIO, con este producto, ya
    ENTREGADO - no basta con tenerlo en el carrito ni con un pedido
    todavia en camino. Reutiliza OrderStatusEnum.DELIVERED (mismo estado
    terminal que usa OrderService.ALLOWED_TRANSITIONS), no se inventa un
    concepto de "compra verificada" aparte.
    """

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
    # selectinload(Review.user): sin esto, _to_review_response dispara un
    # SELECT a `users` por cada reseña de la pagina (N+1) al leer
    # review.user.fullName/profileImagen - con esto es un unico SELECT
    # adicional con IN (...) para toda la pagina, sin importar `limit`
    # (ver ALCANCE > regla 10: optimizar consultas).
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
    """
    Conteo de reseñas ACTIVAS de un producto agrupado por rating (1-5) -
    para el detalle público (ver ALCANCE > rediseño detalle de producto,
    "Opiniones de compradores"). Un solo query agrupado (GROUP BY rating),
    no un COUNT por estrella - el promedio se deriva de este mismo
    resultado en el servicio (ver publicService/Products.py), sin otro
    query aparte.
    """

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
    """
    Igual que get_product_rating_summary pero para varios productos a la
    vez (AVG + COUNT agrupado por product_id, GROUP BY) - la usan las
    tarjetas de listado publico (ver publicService/Products.py >
    _to_card_response) para no repetir un query por producto en un loop
    (N+1) al armar una pagina completa de tarjetas, mismo criterio
    anti-N+1 que ya usa get_catalogs_service > product_count.
    """

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
    """
    Reputación de empresa = promedio + conteo de TODAS las reseñas
    ACTIVAS de TODOS los productos de esa empresa (ver ALCANCE >
    Calificaciones de empresa, reglas 2-4). Un solo query agregado
    (AVG + COUNT via JOIN a products), no un query por producto - evita
    N+1 sin importar cuantos productos/reseñas tenga la empresa (ver
    regla 10). Se apoya en el indice compuesto
    ix_reviews_product_id_is_active (ver migracion
    e2b6a4c9f107_add_reviews_table.py).
    """

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
