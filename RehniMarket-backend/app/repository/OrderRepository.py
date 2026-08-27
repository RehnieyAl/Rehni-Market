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
    """
    Pedidos de una empresa en alguno de `statuses` - usado por la
    suspensión de empresa (ver OrderService.
    cancel_and_refund_company_orders_for_suspension) para encontrar
    únicamente PENDING/PAID/PROCESSING, la relación real es Order.
    company_id (columna directa, ver ModelOrder.py > Order - el pedido ya
    sabe a qué empresa pertenece desde el checkout, no hace falta pasar
    por OrderItem/Product para deducirlo).
    """

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
    """
    `statuses` ya viene convertido a OrderStatusEnum (ver
    OrderService.list_company_orders_service) - varios valores a la vez
    para las pestañas del dashboard de empresa. `search` filtra por
    referencia (order_number), correo o nombre del comprador (join con
    Users, ver ALCANCE > Refactor Pedidos Empresa, punto 6).
    """

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

        # Referencia amigable "RM-000001" (ver OrderService >
        # _to_order_response): se acepta con o sin el prefijo "RM-" y con
        # o sin los ceros a la izquierda (ej. "RM-000001", "000001", "1").
        reference_digits = normalized.upper()
        if reference_digits.startswith("RM-"):
            reference_digits = reference_digits[3:]
        reference_digits = reference_digits.lstrip("0")

        if reference_digits.isdigit():
            conditions.append(Order.order_number == int(reference_digits))
        elif normalized.isdigit():
            # El caso "0" puro (order_number nunca es 0, el IDENTITY
            # empieza en 1) - se deja pasar sin romper, simplemente no
            # matchea nada.
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
    """
    Un solo query agrupado (en vez de un .count() por estado, ver
    OrderService.get_company_order_status_counts_service) para armar los
    contadores de las pestañas de "Pedidos" en el dashboard de empresa.
    """

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
    """
    Suma de Order.total de ventas VÁLIDAS de una empresa dentro de un
    periodo, para el módulo de liquidaciones (ver PayoutService.py).

    "Válida" = DELIVERED únicamente (ver ALCANCE > Módulo de liquidaciones,
    Fase "Reglas de negocio": solo cuentan pedidos completados/entregados/
    finalizados). Este sistema no tiene un estado "rechazado" ni
    "reembolsado" propio (ver ModelOrder.py > OrderStatusEnum) - CANCELLED
    ya cubre esa exclusión, y el resto de estados (PENDING/PAID/PROCESSING/
    SHIPPED) todavía no son una venta finalizada, así que tampoco cuentan.
    Mismo criterio que OrderStatusCountsResponse.completed, que ya trata
    DELIVERED como "completado" (ver OrderService.py).

    Se filtra por `created_at` (fecha del pedido): no existe un
    `delivered_at` separado en el modelo, así que el periodo de la
    liquidación se ancla a cuándo se hizo el pedido, no a cuándo pasó a
    DELIVERED.
    """

    # period_end es INCLUSIVO (ej. 2026-01-01 a 2026-01-31 debe contar todo
    # el 31) pero Order.created_at es un timestamp - comparar con
    # `< period_end` (medianoche) dejaría fuera todo ese último día. Se
    # compara contra el inicio del día SIGUIENTE en su lugar.
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
    """
    Primer día de cada mes calendario en el que la empresa tiene al menos
    un pedido DELIVERED (ver ALCANCE > selector "Mes a liquidar" -
    PayoutService.list_available_payout_periods_service). Mismo criterio
    de "venta válida" que sum_valid_company_sales (DELIVERED únicamente,
    por created_at) - un query agrupado por mes en vez de que el frontend
    adivine qué meses probar.
    """

    month_expr = func.date_trunc("month", Order.created_at)

    rows = (
        database.query(month_expr.label("month"))
        .filter(Order.company_id == company_id, Order.status == OrderStatusEnum.DELIVERED)
        .distinct()
        .order_by(month_expr.desc())
        .all()
    )

    return [row.month.date() for row in rows]
