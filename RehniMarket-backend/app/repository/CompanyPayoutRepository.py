from decimal import Decimal
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.ModelCompanyPayout import CompanyPayout, PayoutStatusEnum


def _with_relations(query):
    # joinedload de bank_account/rehnicoin_movement/company: evita el N+1 al armar CompanyPayoutResponse.
    return query.options(
        joinedload(CompanyPayout.bank_account),
        joinedload(CompanyPayout.rehnicoin_movement),
        joinedload(CompanyPayout.company),
    )


def get_payout_by_id(database: Session, payout_id: UUID) -> CompanyPayout | None:
    return _with_relations(
        database.query(CompanyPayout).filter(CompanyPayout.id == payout_id)
    ).first()


def get_company_payout(
    database: Session, company_id: UUID, payout_id: UUID
) -> CompanyPayout | None:
    return _with_relations(
        database.query(CompanyPayout).filter(
            CompanyPayout.id == payout_id, CompanyPayout.company_id == company_id
        )
    ).first()


def get_payout_by_period(
    database: Session, company_id: UUID, period_start, period_end
) -> CompanyPayout | None:
    return (
        database.query(CompanyPayout)
        .filter(
            CompanyPayout.company_id == company_id,
            CompanyPayout.period_start == period_start,
            CompanyPayout.period_end == period_end,
        )
        .first()
    )


def list_company_payouts(database: Session, company_id: UUID, page: int, limit: int):
    query = _with_relations(
        database.query(CompanyPayout).filter(CompanyPayout.company_id == company_id)
    ).order_by(CompanyPayout.period_start.desc())

    total = query.count()
    offset = (page - 1) * limit
    payouts = query.offset(offset).limit(limit).all()

    return payouts, total


def list_all_payouts(
    database: Session, page: int, limit: int, status: PayoutStatusEnum | None = None
):
    query = _with_relations(database.query(CompanyPayout))

    if status is not None:
        query = query.filter(CompanyPayout.payout_status == status)

    query = query.order_by(CompanyPayout.created_at.desc())

    total = query.count()
    offset = (page - 1) * limit
    payouts = query.offset(offset).limit(limit).all()

    return payouts, total


def create_payout(database: Session, payout: CompanyPayout) -> CompanyPayout:
    database.add(payout)
    database.flush()
    return payout


def sum_company_payouts(database: Session, company_id: UUID) -> tuple[Decimal, Decimal]:
    """(gross_sales, commission_amount) acumulados de todas las liquidaciones de la empresa."""

    row = (
        database.query(
            func.coalesce(func.sum(CompanyPayout.gross_sales), 0),
            func.coalesce(func.sum(CompanyPayout.commission_amount), 0),
        )
        .filter(CompanyPayout.company_id == company_id)
        .one()
    )

    return Decimal(row[0]), Decimal(row[1])


def sum_pending_net_amount(database: Session, company_id: UUID) -> Decimal:
    """Suma de net_amount de las liquidaciones aún no PAID (pendiente de recibir)."""

    total = (
        database.query(func.coalesce(func.sum(CompanyPayout.net_amount), 0))
        .filter(
            CompanyPayout.company_id == company_id,
            CompanyPayout.payout_status != PayoutStatusEnum.PAID,
        )
        .scalar()
    )

    return Decimal(total)
