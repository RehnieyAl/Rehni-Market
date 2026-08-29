from decimal import Decimal
from datetime import date, timedelta

from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.ModelOrder import Order, OrderStatusEnum
from app.models.ModelUser import Users


def create_order(database: Session, order: Order) -> Order:
    database.add(order)
    database.flush()
    return order


def get_user_order(database: Session, order_id: UUID, user_id: UUID) -> Order | None:
    return (
        database.query(Order)
        .filter(Order.id == order_id, Order.user_id == user_id)
        .first()
    )


def get_company_order(database: Session, order_id: UUID, company_id: UUID) -> Order | None:
    return (
        database.query(Order)
        .filter(Order.id == order_id, Order.company_id == company_id)
        .first()
    )


def list_company_orders_by_statuses(
    database: Session, company_id: UUID, statuses: set[OrderStatusEnum]
) -> list[Order]:
    """Pedidos de una empresa en alguno de `statuses` (Order.company_id es columna directa)."""

    return (
        database.query(Order)
        .filter(Order.company_id == company_id, Order.status.in_(statuses))
        .all()
    )


def list_user_orders(database: Session, user_id: UUID, page: int, limit: int):
    query = (
        database.query(Order)
        .filter(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
    )

    total = query.count()
    offset = (page - 1) * limit
    orders = query.offset(offset).limit(limit).all()

    return orders, total


def list_company_orders(
    database: Session,
    company_id: UUID,
    page: int,
    limit: int,
    statuses: list | None = None,
    search: str | None = None,
):
    """`statuses` ya viene como OrderStatusEnum. `search` filtra por referencia
    (order_number), correo o nombre del comprador."""

    query = database.query(Order).filter(Order.company_id == company_id)

    if statuses:
        query = query.filter(Order.status.in_(statuses))

    if search:
        normalized = search.strip()

        query = query.join(Users, Order.user_id == Users.id)

        conditions = [
            Users.email.ilike(f"%{normalized}%"),
            Users.fullName.ilike(f"%{normalized}%"),
        ]

        # Acepta la referencia con o sin prefijo "RM-" y sin ceros a la izquierda.
        reference_digits = normalized.upper()
        if reference_digits.startswith("RM-"):
            reference_digits = reference_digits[3:]
        reference_digits = reference_digits.lstrip("0")

        if reference_digits.isdigit():
            conditions.append(Order.order_number == int(reference_digits))
        elif normalized.isdigit():
            conditions.append(Order.order_number == int(normalized))

        query = query.filter(or_(*conditions))

    query = query.order_by(Order.created_at.desc())

    total = query.count()
    offset = (page - 1) * limit
    orders = query.offset(offset).limit(limit).all()

    return orders, total


def count_company_orders_by_status(
    database: Session, company_id: UUID
) -> dict[OrderStatusEnum, int]:
    """Un solo query agrupado para los contadores de pestañas de "Pedidos"."""

    rows = (
        database.query(Order.status, func.count(Order.id))
        .filter(Order.company_id == company_id)
        .group_by(Order.status)
        .all()
    )

    return {status: count for status, count in rows}


def sum_valid_company_sales(
    database: Session, company_id: UUID, period_start, period_end
) -> Decimal:
    """Suma de Order.total de ventas DELIVERED de una empresa en un periodo.
    Se filtra por created_at: no hay un delivered_at en el modelo."""

    # period_end es inclusivo; se compara contra el inicio del día siguiente.
    period_end_exclusive = period_end + timedelta(days=1)

    total = (
        database.query(func.coalesce(func.sum(Order.total), 0))
        .filter(
            Order.company_id == company_id,
            Order.status == OrderStatusEnum.DELIVERED,
            Order.created_at >= period_start,
            Order.created_at < period_end_exclusive,
        )
        .scalar()
    )

    return Decimal(total)


def list_delivered_sale_months(database: Session, company_id: UUID) -> list[date]:
    """Primer día de cada mes con al menos un pedido DELIVERED de la empresa."""

    month_expr = func.date_trunc("month", Order.created_at)

    rows = (
        database.query(month_expr.label("month"))
        .filter(Order.company_id == company_id, Order.status == OrderStatusEnum.DELIVERED)
        .distinct()
        .order_by(month_expr.desc())
        .all()
    )

    return [row.month.date() for row in rows]
