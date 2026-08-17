from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.ModelOrder import Order, OrderStatusEnum
from app.models.ModelUser import Users


def create_order(database: Session, order: Order) -> Order:
    database.add(order)
    database.flush()
    return order


def get_order_by_id(database: Session, order_id: UUID) -> Order | None:
    return database.query(Order).filter(Order.id == order_id).first()


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


def get_last_user_order(database: Session, user_id: UUID) -> Order | None:
    return (
        database.query(Order)
        .filter(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
        .first()
    )


def count_pending_user_orders(database: Session, user_id: UUID) -> int:
    return (
        database.query(Order)
        .filter(
            Order.user_id == user_id,
            Order.status.in_(
                [
                    OrderStatusEnum.PENDING,
                    OrderStatusEnum.PAID,
                    OrderStatusEnum.PROCESSING,
                    OrderStatusEnum.SHIPPED,
                ]
            ),
        )
        .count()
    )


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
