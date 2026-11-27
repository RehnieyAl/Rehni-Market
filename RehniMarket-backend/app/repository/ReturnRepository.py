"""Acceso a datos de reclamaciones de devolución: consultas por comprador, empresa y administración,
bloqueo de la fila al decidir y reembolsos pendientes de descontar en liquidaciones."""
from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.ModelCompany import Company
from app.models.ModelOrder import Order
from app.models.ModelReturnRequest import ReturnRequest, ReturnStatusEnum
from app.models.ModelUser import Users
from app.models.ModelWallet import WalletTransaction
from app.repository.OrderRepository import bogota_month


def create(database: Session, return_request: ReturnRequest) -> ReturnRequest:
    database.add(return_request)
    database.flush()
    return return_request


def _locked(database: Session):
    # FOR UPDATE solo sobre return_requests: dos decisiones simultáneas se serializan aquí y la
    # segunda vuelve a leer el estado ya resuelto.
    return database.query(ReturnRequest).with_for_update(of=ReturnRequest)


def lock_for_company(database: Session, return_id: UUID, company_id: UUID) -> ReturnRequest | None:
    """Scope de empresa: una empresa NUNCA puede leer/decidir la devolución de otra."""

    return (
        _locked(database)
        .filter(ReturnRequest.id == return_id, ReturnRequest.company_id == company_id)
        .first()
    )


def lock_by_id(database: Session, return_id: UUID) -> ReturnRequest | None:
    return _locked(database).filter(ReturnRequest.id == return_id).first()


def lock_for_user(database: Session, return_id: UUID, user_id: UUID) -> ReturnRequest | None:
    return (
        _locked(database)
        .filter(ReturnRequest.id == return_id, ReturnRequest.user_id == user_id)
        .first()
    )


def get_for_company(database: Session, return_id: UUID, company_id: UUID) -> ReturnRequest | None:
    return (
        database.query(ReturnRequest)
        .filter(ReturnRequest.id == return_id, ReturnRequest.company_id == company_id)
        .first()
    )


def get_for_user(database: Session, return_id: UUID, user_id: UUID) -> ReturnRequest | None:
    return (
        database.query(ReturnRequest)
        .filter(ReturnRequest.id == return_id, ReturnRequest.user_id == user_id)
        .first()
    )


def get_by_id(database: Session, return_id: UUID) -> ReturnRequest | None:
    return database.query(ReturnRequest).filter(ReturnRequest.id == return_id).first()


def list_by_order(database: Session, order_id: UUID) -> list[ReturnRequest]:
    return (
        database.query(ReturnRequest)
        .filter(ReturnRequest.order_id == order_id)
        .order_by(ReturnRequest.created_at.desc())
        .all()
    )


def return_exists_for_item(database: Session, order_item_id: UUID) -> bool:
    """Hay una reclamación (en cualquier estado) para este ítem: un rechazo se revisa con
    'Solicitar revisión' sobre la misma reclamación, no abriendo otra."""

    return (
        database.query(ReturnRequest.id)
        .filter(ReturnRequest.order_item_id == order_item_id)
        .first()
        is not None
    )


def other_active_claim_exists(database: Session, return_request: ReturnRequest) -> bool:
    """Otra reclamación no rechazada del mismo ítem. Solo ocurre con datos anteriores a la regla de
    una reclamación por producto, cuando tras un rechazo se abría una nueva."""

    return (
        database.query(ReturnRequest.id)
        .filter(
            ReturnRequest.order_item_id == return_request.order_item_id,
            ReturnRequest.id != return_request.id,
            ReturnRequest.status != ReturnStatusEnum.REJECTED,
        )
        .first()
        is not None
    )


def refund_transaction_id(database: Session, return_id: UUID) -> UUID | None:
    return (
        database.query(WalletTransaction.id)
        .filter(WalletTransaction.return_request_id == return_id)
        .scalar()
    )


def _search_conditions(search: str, *, include_company: bool):
    normalized = search.strip()
    conditions = [
        Users.email.ilike(f"%{normalized}%"),
        Users.fullName.ilike(f"%{normalized}%"),
    ]
    if include_company:
        conditions.append(Company.nameCompany.ilike(f"%{normalized}%"))

    reference_digits = normalized.upper()
    if reference_digits.startswith("RM-"):
        reference_digits = reference_digits[3:]
    reference_digits = reference_digits.lstrip("0")

    if reference_digits.isdigit():
        conditions.append(Order.order_number == int(reference_digits))
    elif normalized.isdigit():
        conditions.append(Order.order_number == int(normalized))

    return or_(*conditions)


def _paginate(query, page: int, limit: int):
    query = query.order_by(ReturnRequest.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    return items, total


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
        query = query.join(Users, ReturnRequest.user_id == Users.id).filter(
            _search_conditions(search, include_company=False)
        )

    return _paginate(query, page, limit)


def list_by_user(database: Session, user_id: UUID, page: int = 1, limit: int = 10):
    query = database.query(ReturnRequest).filter(ReturnRequest.user_id == user_id)
    return _paginate(query, page, limit)


def list_all(
    database: Session,
    status: ReturnStatusEnum | None = None,
    search: str | None = None,
    company_id: UUID | None = None,
    page: int = 1,
    limit: int = 10,
):
    query = (
        database.query(ReturnRequest)
        .join(Order, ReturnRequest.order_id == Order.id)
        .join(Company, ReturnRequest.company_id == Company.id)
        .join(Users, ReturnRequest.user_id == Users.id)
    )

    if status is not None:
        query = query.filter(ReturnRequest.status == status)
    if company_id is not None:
        query = query.filter(ReturnRequest.company_id == company_id)
    if search and search.strip():
        query = query.filter(_search_conditions(search, include_company=True))

    return _paginate(query, page, limit)


def list_company_approved_refunds(
    database: Session, company_id: UUID, lock: bool = False
) -> list[tuple[ReturnRequest, date]]:
    """Reembolsos aprobados de la empresa, ya descontados o no, con el mes de Bogotá de su pedido, del
    más antiguo al más reciente: el orden con el que PayoutService los reparte entre liquidaciones.
    `lock` los bloquea para que dos liquidaciones no descuenten el mismo."""

    query = (
        database.query(ReturnRequest, bogota_month(Order.created_at))
        .join(Order, ReturnRequest.order_id == Order.id)
        .filter(
            ReturnRequest.company_id == company_id,
            ReturnRequest.status == ReturnStatusEnum.APPROVED,
            ReturnRequest.refund_amount.isnot(None),
        )
        .order_by(ReturnRequest.resolved_at.asc(), ReturnRequest.id.asc())
    )
    if lock:
        query = query.with_for_update(of=ReturnRequest)

    return [(refund, month) for refund, month in query.all()]


def sum_refunds_to_adjust(database: Session, company_id: UUID) -> Decimal:
    """Reembolsos aprobados que ninguna liquidación ha descontado todavía."""

    total = (
        database.query(func.coalesce(func.sum(ReturnRequest.refund_amount), 0))
        .filter(
            ReturnRequest.company_id == company_id,
            ReturnRequest.status == ReturnStatusEnum.APPROVED,
            ReturnRequest.payout_adjustment_id.is_(None),
            ReturnRequest.refund_amount.isnot(None),
        )
        .scalar()
    )
    return Decimal(total)
