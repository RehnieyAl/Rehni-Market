"""Movimientos de stock atómicos (compra y restitución) y espejo Product.stock = suma de variantes vivas.

Lo usan CheckoutService (descuento) y OrderService (restitución al cancelar o suspender una empresa).
"""
from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.ModelProduct import Product
from app.models.ModelVariant import ProductVariant


def restore_stock(database: Session, model, target_id, quantity: int) -> None:
    """Suma en SQL (stock = stock + n) en vez de leer y reescribir el valor: un checkout
    concurrente sobre la misma fila no puede perder su descuento."""

    database.execute(
        update(model)
        .where(model.id == target_id)
        .values(stock=model.stock + quantity)
        .execution_options(synchronize_session=False)
    )


def sync_parent_stock(database: Session, product_ids: Iterable[UUID]) -> None:
    """Recalcula Product.stock de los productos con variantes a partir de sus variantes vivas.

    Antes la compra y la cancelación solo movían ProductVariant.stock y el padre conservaba
    un valor viejo: la tarjeta pública mostraba unidades que ya no existían.
    """

    ids = sorted({UUID(str(product_id)) for product_id in product_ids})
    if not ids:
        return

    # Bloquea los padres en orden fijo y en una sentencia aparte: así el UPDATE de abajo
    # toma una instantánea nueva que ya incluye lo que confirmó otro checkout que esperaba
    # el mismo candado, y dos compras concurrentes no se bloquean mutuamente.
    database.execute(
        select(Product.id)
        .where(Product.id.in_(ids), Product.has_variants.is_(True))
        .order_by(Product.id)
        .with_for_update()
    )

    live_stock = (
        select(func.coalesce(func.sum(ProductVariant.stock), 0))
        .where(ProductVariant.product_id == Product.id, ProductVariant.deleted_at.is_(None))
        .correlate(Product)
        .scalar_subquery()
    )

    database.execute(
        update(Product)
        .where(Product.id.in_(ids), Product.has_variants.is_(True))
        .values(stock=live_stock)
        .execution_options(synchronize_session=False)
    )
