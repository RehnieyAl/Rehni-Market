"""Acceso a datos de liquidaciones: consultas por empresa y periodo, listado del owner y sumas de saldo."""

from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import case, func
from sqlalchemy.orm import Session, joinedload

from app.models.ModelCompany import Company
from app.models.ModelCompanyPayout import CompanyPayout, PayoutStatusEnum


def _with_relations(query):
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


def list_payout_periods(
    database: Session, company_id: UUID | None = None
) -> list[tuple[UUID, date, date, UUID]]:
    """(company_id, period_start, period_end, id) de las liquidaciones generadas, de una empresa o de todas."""

    query = database.query(
        CompanyPayout.company_id, CompanyPayout.period_start, CompanyPayout.period_end, CompanyPayout.id
    )
    if company_id is not None:
        query = query.filter(CompanyPayout.company_id == company_id)

    return [tuple(row) for row in query.all()]


def list_company_payouts(database: Session, company_id: UUID, page: int, limit: int):
    query = _with_relations(
        database.query(CompanyPayout).filter(CompanyPayout.company_id == company_id)
    ).order_by(CompanyPayout.period_start.desc())

    total = query.count()
    offset = (page - 1) * limit
    payouts = query.offset(offset).limit(limit).all()

    return payouts, total


def list_all_payouts_by_urgency(
    database: Session, fetch: int, status: PayoutStatusEnum | None = None
) -> tuple[list[CompanyPayout], int]:
    """Las primeras `fetch` liquidaciones: sin pagar de la fecha límite más antigua a la más lejana
    (vencidas primero) y luego las pagadas de la más reciente a la más antigua. El desempate
    (nombre con collation "C", company_id, period_start) es el mismo que aplica PayoutService en
    Python para intercalar las liquidaciones por generar."""

    query = database.query(CompanyPayout).join(Company, Company.id == CompanyPayout.company_id)

    if status is not None:
        query = query.filter(CompanyPayout.payout_status == status)

    total = query.count()

    is_paid = CompanyPayout.payout_status == PayoutStatusEnum.PAID
    payouts = (
        _with_relations(query)
        .order_by(
            case((is_paid, 1), else_=0),
            case((~is_paid, CompanyPayout.period_end)).asc(),
            case((is_paid, CompanyPayout.period_end)).desc(),
            Company.nameCompany.collate("C"),
            CompanyPayout.company_id,
            CompanyPayout.period_start,
        )
        .limit(fetch)
        .all()
    )

    return payouts, total


def lock_payout(database: Session, payout_id: UUID) -> CompanyPayout | None:
    """Bloquea la fila para que dos confirmaciones simultáneas no la marquen pagada dos veces."""

    return (
        database.query(CompanyPayout)
        .filter(CompanyPayout.id == payout_id)
        .with_for_update()
        .first()
    )


def create_payout(database: Session, payout: CompanyPayout) -> CompanyPayout:
    database.add(payout)
    database.flush()
    return payout


def sum_company_payouts(database: Session, company_id: UUID) -> tuple[Decimal, Decimal]:
    """(gross_sales, commission_amount) acumulados de las liquidaciones de la empresa (gross_sales ya
    viene neto de los reembolsos de devoluciones descontados)."""

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
