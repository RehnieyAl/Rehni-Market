"""Acceso a datos de pedidos: creación, consultas del comprador y de la empresa, y sumas de ventas para liquidaciones."""

from decimal import Decimal
from datetime import date

from sqlalchemy import Date, cast, func, or_
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.BusinessCalendar import BOGOTA_TZ_NAME
from app.models.ModelCompany import Company
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


def bogota_month(column):
    """Primer día del mes calendario de America/Bogota de un timestamptz: el cierre mensual de las
    liquidaciones es a medianoche de Colombia, no de UTC."""

    return cast(func.date_trunc("month", func.timezone(BOGOTA_TZ_NAME, column)), Date)


def _unsettled_sales():
    return (Order.status == OrderStatusEnum.DELIVERED, Order.payout_id.is_(None))


def list_unsettled_sales_by_month(
    database: Session, company_id: UUID | None = None
) -> list[tuple[UUID, str, date, Decimal]]:
    """(company_id, nombre, mes de Bogotá, total) de las ventas DELIVERED aún sin liquidación, de una
    empresa o de todas."""

    month = bogota_month(Order.created_at)
    query = (
        database.query(Order.company_id, Company.nameCompany, month.label("month"), func.sum(Order.total))
        .join(Company, Company.id == Order.company_id)
        .filter(*_unsettled_sales())
    )
    if company_id is not None:
        query = query.filter(Order.company_id == company_id)

    rows = query.group_by(Order.company_id, Company.nameCompany, month).all()

    return [(row[0], row[1], row[2], Decimal(row[3])) for row in rows]


def lock_unsettled_company_orders(database: Session, company_id: UUID) -> list[Order]:
    """Ventas DELIVERED sin liquidar de la empresa, bloqueadas mientras se generan sus liquidaciones."""

    return (
        database.query(Order)
        .filter(Order.company_id == company_id, *_unsettled_sales())
        .order_by(Order.created_at, Order.id)
        .with_for_update(of=Order)
        .all()
    )


def sum_unsettled_company_sales(database: Session, company_id: UUID) -> Decimal:
    total = (
        database.query(func.coalesce(func.sum(Order.total), 0))
        .filter(Order.company_id == company_id, *_unsettled_sales())
        .scalar()
    )

    return Decimal(total)
