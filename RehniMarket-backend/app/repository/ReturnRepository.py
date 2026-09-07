from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.ModelOrder import Order
from app.models.ModelReturnRequest import ReturnRequest, ReturnStatusEnum
from app.models.ModelUser import Users


def create(database: Session, return_request: ReturnRequest) -> ReturnRequest:
    database.add(return_request)
    database.flush()
    return return_request


def get_by_id(database: Session, return_id: UUID) -> ReturnRequest | None:
    return (
        database.query(ReturnRequest)
        .filter(ReturnRequest.id == return_id)
        .first()
    )


def get_for_company(
    database: Session, return_id: UUID, company_id: UUID
) -> ReturnRequest | None:
    """Scope de empresa: una empresa NUNCA puede leer/decidir la devolución de otra."""

    return (
        database.query(ReturnRequest)
        .filter(
            ReturnRequest.id == return_id,
            ReturnRequest.company_id == company_id,
        )
        .first()
    )


def list_by_order(database: Session, order_id: UUID) -> list[ReturnRequest]:
    return (
        database.query(ReturnRequest)
        .filter(ReturnRequest.order_id == order_id)
        .order_by(ReturnRequest.created_at.desc())
        .all()
    )


def active_return_exists_for_item(database: Session, order_item_id: UUID) -> bool:
    """Hay una devolución PENDING o APPROVED para este ítem (una sola activa por ítem;
    tras un rechazo se puede volver a solicitar)."""

    return (
        database.query(ReturnRequest.id)
        .filter(
            ReturnRequest.order_item_id == order_item_id,
            ReturnRequest.status != ReturnStatusEnum.REJECTED,
        )
        .first()
        is not None
    )


def list_by_company(
    database: Session,
    company_id: UUID,
    status: ReturnStatusEnum | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 10,
):
    query = (
        database.query(ReturnRequest)
        .join(Order, ReturnRequest.order_id == Order.id)
        .filter(ReturnRequest.company_id == company_id)
    )

    if status is not None:
        query = query.filter(ReturnRequest.status == status)

    if search and search.strip():
        normalized = search.strip()

        query = query.join(Users, ReturnRequest.user_id == Users.id)

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

    query = query.order_by(ReturnRequest.created_at.desc())

    total = query.count()
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()

    return items, total


def count_pending_by_company(database: Session, company_id: UUID) -> int:
    return (
        database.query(ReturnRequest.id)
        .filter(
            ReturnRequest.company_id == company_id,
            ReturnRequest.status == ReturnStatusEnum.PENDING,
        )
        .count()
    )
