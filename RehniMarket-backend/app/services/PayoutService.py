"""Único servicio del módulo de liquidaciones mensuales. Los routers de empresa
y admin solo llaman a estas funciones, no calculan nada por su cuenta."""

import logging
import calendar
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core import BusinessCalendar
from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.core.PayoutConfig import (
    COMMISSION_PERCENTAGE,
    CONSIGNMENT_BUSINESS_DAYS,
    REHNICOIN_CONVERSION_RATE,
)

from app.models.ModelCompany import Company
from app.models.ModelCompanyBankAccount import CompanyBankAccount
from app.models.ModelCompanyPayout import CompanyPayout, PayoutStatusEnum
from app.models.ModelRehniCoinMovement import RehniCoinMovement
from app.models.ModelReturnRequest import ReturnRequest

from app.repository import CompanyRepository
from app.repository import CompanyBankAccountRepository
from app.repository import CompanyPayoutRepository as repo
from app.repository import RehniCoinMovementRepository
from app.repository import ReturnRepository
from app.repository.OrderRepository import (
    list_unsettled_sales_by_month,
    lock_unsettled_company_orders,
    sum_unsettled_company_sales,
)

from app.schemas.SchemaDashboard.SchemaPayout import (
    AdminPayoutListItemResponse,
    AdminPayoutsPaginatedResponse,
    GeneratePayoutRequest,
    CompanyPayoutResponse,
    CompanyPayoutsPaginatedResponse,
    CompanyBalanceResponse,
    PayoutAvailablePeriodResponse,
    PayoutBankAccountSummary,
    PayoutPreviewResponse,
    RehniCoinMovementResponse,
)

from app.services.email.PayoutEmailService import send_payout_processed_email

logger = logging.getLogger(__name__)


def _get_company_for_user(database: Session, user_id: UUID) -> Company:
    company = CompanyRepository.get_company_by_user_id(database, user_id)

    if not company:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "No se encontró una empresa para este usuario.")

    return company


def _get_company_or_404(database: Session, company_id: UUID) -> Company:
    company = CompanyRepository.get_company_by_id(database, company_id)

    if not company:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada.")

    return company


def _month_period(month_start: date) -> tuple[date, date]:
    """(period_start, period_end) del mes calendario que empieza en `month_start`."""

    last_day = calendar.monthrange(month_start.year, month_start.month)[1]

    return month_start, date(month_start.year, month_start.month, last_day)


def consignment_deadline(period_end: date) -> date:
    """Fecha límite para consignar: el quinto día hábil (Colombia) posterior al cierre del periodo."""

    return BusinessCalendar.nth_business_day_after(period_end, CONSIGNMENT_BUSINESS_DAYS)


def _is_overdue(status: PayoutStatusEnum, deadline: date, today: date) -> bool:
    return status != PayoutStatusEnum.PAID and today > deadline


def _ensure_period_closed(period_end: date) -> None:
    # Un mes abierto aún puede recibir ventas: liquidarlo antes de tiempo las dejaría fuera de todo
    # pago, porque las ventas posteriores caerían en un periodo ya liquidado.
    if period_end >= BusinessCalendar.today_bogota():
        api_error(
            422,
            ErrorCodes.PAYOUT_INVALID_PERIOD,
            "El periodo aún no ha cerrado: se liquida desde el día siguiente a su último día.",
        )


def _calculate_amounts(gross_sales: Decimal) -> tuple[Decimal, Decimal]:
    """(commission_amount, net_amount) con la comisión de PayoutConfig."""

    commission_amount = (gross_sales * COMMISSION_PERCENTAGE).quantize(Decimal("0.01"))
    net_amount = gross_sales - commission_amount

    return commission_amount, net_amount


def _create_rehnicoin_movement(
    database: Session, company_id: UUID, payout_id: UUID, net_amount: Decimal
) -> RehniCoinMovement:
    """Registra la conversión del neto a RehniCoin como auditoría; no acredita ningún Wallet real."""

    movement = RehniCoinMovement(
        company_id=company_id,
        payout_id=payout_id,
        amount_cop=net_amount,
        rehni_coins=(net_amount * REHNICOIN_CONVERSION_RATE).quantize(Decimal("0.01")),
        conversion_rate=REHNICOIN_CONVERSION_RATE,
    )

    return RehniCoinMovementRepository.create_movement(database, movement)


@dataclass
class _PlannedPayout:
    """Liquidación mensual calculada sin persistir. La comparten el listado, la vista previa y la
    generación: el importe que se muestra es el que se genera."""

    period_start: date
    period_end: date
    # Meses de Bogotá de las ventas que entran: el propio y los de ventas rezagadas de meses ya liquidados.
    sale_months: frozenset[date]
    # Ventas entregadas antes de descontar devoluciones.
    sales: Decimal
    refunds: list
    refunds_amount: Decimal
    commission_amount: Decimal
    net_amount: Decimal

    @property
    def net_sales(self) -> Decimal:
        return self.sales - self.refunds_amount


def _next_month(month_start: date) -> date:
    return _month_period(month_start)[1] + timedelta(days=1)


def _target_month(sale_month: date, liquidated_months: set[date]) -> date:
    """Mes en que se liquida una venta: el suyo si aún no tiene liquidación; si ya la tiene (se entregó
    después de liquidarlo o quedó fuera de la ventana UTC de una liquidación anterior al cierre en hora
    de Bogotá), el primer mes siguiente sin liquidación."""

    target = sale_month
    while target in liquidated_months:
        target = _next_month(target)
    return target


def _group_sales_by_target(
    sales_by_month: dict[date, Decimal], payout_periods: list[tuple[date, date, UUID]], today: date
) -> dict[date, tuple[Decimal, frozenset[date]]]:
    """Ventas sin liquidar agrupadas por el mes cerrado en que se liquidan (solo meses con ventas > 0)."""

    liquidated = {start for start, end, _ in payout_periods if (start, end) == _month_period(start)}
    sales_by_target: dict[date, Decimal] = defaultdict(Decimal)
    months_by_target: dict[date, set[date]] = defaultdict(set)

    for sale_month, total in sales_by_month.items():
        target = _target_month(sale_month, liquidated)
        sales_by_target[target] += total
        months_by_target[target].add(sale_month)

    return {
        target: (sales, frozenset(months_by_target[target]))
        for target, sales in sales_by_target.items()
        if sales > 0 and _month_period(target)[1] < today
    }


def _plan_company_payouts(
    sales_by_month: dict[date, Decimal],
    payout_periods: list[tuple[date, date, UUID]],
    refunds: list[tuple[ReturnRequest, date]],
    today: date,
) -> dict[date, _PlannedPayout]:
    """Liquidaciones pendientes de una empresa, en orden cronológico. Cada reembolso aprobado se
    descuenta una sola vez: en el primer mes pendiente no anterior al de su pedido donde cabe sin
    dejar la base negativa; el primero que no cabe corta y los siguientes pasan al mes siguiente.
    Un reembolso que ya descontó una liquidación de un mes posterior (generada fuera de orden) corta
    igual que cortaba cuando se calculó esa liquidación: generar en otro orden no cambia los importes."""

    payout_month = {payout_id: start for start, _, payout_id in payout_periods}
    reserved: set[UUID] = set()
    plan: dict[date, _PlannedPayout] = {}

    for target, (sales, sale_months) in sorted(_group_sales_by_target(sales_by_month, payout_periods, today).items()):
        selected: list = []
        refunds_amount = Decimal("0")

        for refund, order_month in refunds:
            if order_month > target or refund.id in reserved:
                continue
            if refund.payout_adjustment_id is not None:
                if payout_month[refund.payout_adjustment_id] < target:
                    continue
                break
            amount = Decimal(refund.refund_amount)
            if refunds_amount + amount > sales:
                break
            selected.append(refund)
            refunds_amount += amount

        reserved.update(refund.id for refund in selected)
        commission_amount, net_amount = _calculate_amounts(sales - refunds_amount)
        period_start, period_end = _month_period(target)
        plan[target] = _PlannedPayout(
            period_start=period_start,
            period_end=period_end,
            sale_months=sale_months,
            sales=sales,
            refunds=selected,
            refunds_amount=refunds_amount,
            commission_amount=commission_amount,
            net_amount=net_amount,
        )

    return plan


def _company_payout_periods(database: Session, company_id: UUID) -> list[tuple[date, date, UUID]]:
    return [(start, end, payout_id) for _, start, end, payout_id in repo.list_payout_periods(database, company_id)]


def _load_company_plan(database: Session, company_id: UUID, today: date) -> dict[date, _PlannedPayout]:
    sales_by_month = {
        month: total for _, _, month, total in list_unsettled_sales_by_month(database, company_id)
    }
    return _plan_company_payouts(
        sales_by_month,
        _company_payout_periods(database, company_id),
        ReturnRepository.list_company_approved_refunds(database, company_id),
        today,
    )


def _validate_monthly_request(
    database: Session, company: Company, period_start: date, period_end: date
) -> CompanyBankAccount:
    """Validaciones previas a calcular: mes calendario completo y cerrado, sin liquidación previa y con
    cuenta bancaria predeterminada."""

    if period_end < period_start or (period_start, period_end) != _month_period(period_start):
        api_error(
            422, ErrorCodes.PAYOUT_INVALID_PERIOD, "El periodo debe ser un mes calendario completo."
        )

    _ensure_period_closed(period_end)

    if repo.get_payout_by_period(database, company.id, period_start, period_end):
        api_error(
            409,
            ErrorCodes.PAYOUT_ALREADY_EXISTS,
            "Ya existe una liquidación generada para esta empresa en este periodo.",
        )

    bank_account = CompanyBankAccountRepository.get_default_bank_account(database, company.id)

    if not bank_account:
        api_error(
            422,
            ErrorCodes.PAYOUT_NO_BANK_ACCOUNT,
            "La empresa no tiene una cuenta bancaria predeterminada registrada.",
        )

    return bank_account


def _planned_or_422(plan: dict[date, _PlannedPayout], period_start: date) -> _PlannedPayout:
    planned = plan.get(period_start)

    if planned is None:
        api_error(
            422,
            ErrorCodes.PAYOUT_NO_VALID_SALES,
            "No hay ventas válidas (pedidos entregados) en el periodo solicitado.",
        )

    return planned


def _to_bank_account_summary(bank_account) -> PayoutBankAccountSummary:
    return PayoutBankAccountSummary(
        bankName=bank_account.bank_name,
        accountType=bank_account.account_type.value,
        accountNumber=bank_account.account_number,
        lastFourDigits=bank_account.account_number[-4:],
    )


def _to_response(payout: CompanyPayout) -> CompanyPayoutResponse:
    movement = payout.rehnicoin_movement
    deadline = consignment_deadline(payout.period_end)

    return CompanyPayoutResponse(
        id=payout.id,
        companyId=payout.company_id,
        companyName=payout.company.nameCompany if payout.company else None,
        periodStart=payout.period_start,
        periodEnd=payout.period_end,
        grossSales=payout.gross_sales,
        refundsAmount=payout.refunds_amount,
        commissionPercentage=payout.commission_percentage,
        commissionAmount=payout.commission_amount,
        netAmount=payout.net_amount,
        payoutStatus=payout.payout_status.value,
        bankAccount=_to_bank_account_summary(payout.bank_account),
        rehniCoinMovement=(
            RehniCoinMovementResponse(
                amountCop=movement.amount_cop,
                rehniCoins=movement.rehni_coins,
                conversionRate=movement.conversion_rate,
                createdAt=movement.created_at,
            )
            if movement
            else None
        ),
        paidAt=payout.paid_at,
        createdAt=payout.created_at,
        consignmentDeadline=deadline,
        isOverdue=_is_overdue(payout.payout_status, deadline, BusinessCalendar.today_bogota()),
    )


def generate_company_payout_service(
    data: GeneratePayoutRequest, database: Session
) -> CompanyPayoutResponse:
    try:
        company = CompanyRepository.lock_company(database, data.companyId)

        if not company:
            api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada.")

        bank_account = _validate_monthly_request(database, company, data.periodStart, data.periodEnd)

        # Con la empresa bloqueada, las ventas y los reembolsos se leen y se enlazan en la misma
        # transacción: dos generaciones simultáneas de la empresa no pueden tomar los mismos.
        orders = lock_unsettled_company_orders(database, company.id)
        sales_by_month: dict[date, Decimal] = defaultdict(Decimal)
        for order in orders:
            sales_by_month[BusinessCalendar.bogota_month_start(order.created_at)] += order.total

        plan = _plan_company_payouts(
            sales_by_month,
            _company_payout_periods(database, company.id),
            ReturnRepository.list_company_approved_refunds(database, company.id, lock=True),
            BusinessCalendar.today_bogota(),
        )
        planned = _planned_or_422(plan, data.periodStart)

        payout = CompanyPayout(
            company_id=company.id,
            period_start=data.periodStart,
            period_end=data.periodEnd,
            gross_sales=planned.net_sales,
            refunds_amount=planned.refunds_amount,
            commission_percentage=COMMISSION_PERCENTAGE,
            commission_amount=planned.commission_amount,
            net_amount=planned.net_amount,
            payout_status=PayoutStatusEnum.PENDING,
            bank_account_id=bank_account.id,
        )

        repo.create_payout(database, payout)
        database.flush()

        for order in orders:
            if BusinessCalendar.bogota_month_start(order.created_at) in planned.sale_months:
                order.payout_id = payout.id

        for return_request in planned.refunds:
            return_request.payout_adjustment_id = payout.id

        _create_rehnicoin_movement(database, company.id, payout.id, planned.net_amount)

        database.commit()

        payout = repo.get_payout_by_id(database, payout.id)

        return _to_response(payout)

    except HTTPException:
        database.rollback()
        raise

    except IntegrityError:
        # Dos generaciones simultáneas del mismo periodo: uq_payout_company_period deja pasar solo una.
        database.rollback()
        api_error(
            409,
            ErrorCodes.PAYOUT_ALREADY_EXISTS,
            "Ya existe una liquidación generada para esta empresa en este periodo.",
        )

    except Exception:
        database.rollback()
        logger.exception("Error inesperado")
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def list_available_payout_periods_service(
    company_id: UUID, database: Session
) -> list[PayoutAvailablePeriodResponse]:
    company = _get_company_or_404(database, company_id)

    plan = _load_company_plan(database, company.id, BusinessCalendar.today_bogota())

    return [
        PayoutAvailablePeriodResponse(periodStart=planned.period_start, periodEnd=planned.period_end)
        for _, planned in sorted(plan.items(), reverse=True)
    ]


def get_payout_preview_service(
    company_id: UUID, period_start: date, period_end: date, database: Session
) -> PayoutPreviewResponse:
    company = _get_company_or_404(database, company_id)
    bank_account = _validate_monthly_request(database, company, period_start, period_end)
    planned = _planned_or_422(
        _load_company_plan(database, company.id, BusinessCalendar.today_bogota()), period_start
    )

    return PayoutPreviewResponse(
        companyId=company.id,
        companyName=company.nameCompany,
        periodStart=period_start,
        periodEnd=period_end,
        grossSales=planned.net_sales,
        refundsAmount=planned.refunds_amount,
        commissionPercentage=COMMISSION_PERCENTAGE,
        commissionAmount=planned.commission_amount,
        netAmount=planned.net_amount,
        bankAccount=_to_bank_account_summary(bank_account),
    )


def mark_payout_paid_service(payout_id: UUID, database: Session) -> CompanyPayoutResponse:
    try:
        payout = repo.lock_payout(database, payout_id)

        if not payout:
            api_error(404, ErrorCodes.PAYOUT_NOT_FOUND, "Liquidación no encontrada.")

        if payout.payout_status == PayoutStatusEnum.PAID:
            api_error(409, ErrorCodes.PAYOUT_ALREADY_PAID, "Esta liquidación ya fue pagada.")

        payout.payout_status = PayoutStatusEnum.PAID
        payout.paid_at = datetime.now(timezone.utc)

        database.commit()
        database.refresh(payout)

        payout = repo.get_payout_by_id(database, payout.id)

        send_payout_processed_email(payout)

        return _to_response(payout)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        logger.exception("Error inesperado")
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def list_company_payouts_service(
    user_id: UUID, database: Session, page: int = 1, limit: int = 10
) -> CompanyPayoutsPaginatedResponse:
    company = _get_company_for_user(database, user_id)

    payouts, total = repo.list_company_payouts(database, company.id, page, limit)

    return CompanyPayoutsPaginatedResponse(
        items=[_to_response(p) for p in payouts],
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit if total else 0,
    )


def get_company_payout_detail_service(
    user_id: UUID, payout_id: UUID, database: Session
) -> CompanyPayoutResponse:
    company = _get_company_for_user(database, user_id)

    payout = repo.get_company_payout(database, company.id, payout_id)

    if not payout:
        api_error(404, ErrorCodes.PAYOUT_NOT_FOUND, "Liquidación no encontrada.")

    return _to_response(payout)


def get_company_balance_service(user_id: UUID, database: Session) -> CompanyBalanceResponse:
    company = _get_company_for_user(database, user_id)

    liquidated_gross, liquidated_commission = repo.sum_company_payouts(database, company.id)
    pending_payouts_net = repo.sum_pending_net_amount(database, company.id)

    # Las liquidaciones las genera el owner por periodo: sin sumar las ventas entregadas que aún no
    # se liquidan, una empresa con ventas veía todo en cero hasta su primera liquidación.
    # Los reembolsos de devoluciones aún no descontados en una liquidación restan de lo pendiente.
    unliquidated_gross = sum_unsettled_company_sales(database, company.id) - ReturnRepository.sum_refunds_to_adjust(
        database, company.id
    )
    unliquidated_commission, unliquidated_net = _calculate_amounts(unliquidated_gross)

    gross_sales_accumulated = liquidated_gross + unliquidated_gross
    commission_accumulated = liquidated_commission + unliquidated_commission
    net_balance = pending_payouts_net + unliquidated_net

    today = date.today()
    last_day = calendar.monthrange(today.year, today.month)[1]
    next_payout_date = date(today.year, today.month, last_day)

    return CompanyBalanceResponse(
        grossSalesAccumulated=gross_sales_accumulated,
        commissionAccumulated=commission_accumulated,
        netBalance=net_balance,
        nextPayoutDate=next_payout_date,
    )


@dataclass(frozen=True)
class _PendingGeneration:
    """Mes cerrado con ventas entregadas y sin liquidación generada (fila «por generar»)."""

    company_id: UUID
    company_name: str
    period_start: date
    period_end: date


def _urgency_key(is_paid: bool, period_end: date, company_name: str, company_id: UUID, period_start: date):
    """Mismo orden que CompanyPayoutRepository.list_all_payouts_by_urgency: los nombres se comparan
    por punto de código, como la collation "C" de PostgreSQL."""

    period_key = -period_end.toordinal() if is_paid else period_end.toordinal()
    return (is_paid, period_key, company_name, company_id.int, period_start.toordinal())


def _list_pending_generations(database: Session, today: date) -> list[_PendingGeneration]:
    """Meses por generar de todas las empresas, con la misma agrupación de ventas que su plan."""

    sales: dict[UUID, dict[date, Decimal]] = defaultdict(dict)
    names: dict[UUID, str] = {}
    for company_id, company_name, month, total in list_unsettled_sales_by_month(database):
        sales[company_id][month] = total
        names[company_id] = company_name

    periods: dict[UUID, list[tuple[date, date, UUID]]] = defaultdict(list)
    for company_id, start, end, payout_id in repo.list_payout_periods(database):
        periods[company_id].append((start, end, payout_id))

    pending: list[_PendingGeneration] = []
    for company_id, sales_by_month in sales.items():
        for target in _group_sales_by_target(sales_by_month, periods[company_id], today):
            period_start, period_end = _month_period(target)
            pending.append(_PendingGeneration(company_id, names[company_id], period_start, period_end))

    return pending


def _planned_items(
    database: Session, company_id: UUID, company_name: str, today: date
) -> dict[date, AdminPayoutListItemResponse]:
    bank_account = CompanyBankAccountRepository.get_default_bank_account(database, company_id)
    items: dict[date, AdminPayoutListItemResponse] = {}

    for period_start, planned in _load_company_plan(database, company_id, today).items():
        deadline = consignment_deadline(planned.period_end)
        items[period_start] = AdminPayoutListItemResponse(
            companyId=company_id,
            companyName=company_name,
            periodStart=planned.period_start,
            periodEnd=planned.period_end,
            grossSales=planned.net_sales,
            refundsAmount=planned.refunds_amount,
            commissionPercentage=COMMISSION_PERCENTAGE,
            commissionAmount=planned.commission_amount,
            netAmount=planned.net_amount,
            payoutStatus=PayoutStatusEnum.PENDING.value,
            bankAccount=_to_bank_account_summary(bank_account) if bank_account else None,
            consignmentDeadline=deadline,
            isOverdue=_is_overdue(PayoutStatusEnum.PENDING, deadline, today),
            isGenerated=False,
        )

    return items


def list_admin_payouts_service(
    database: Session, page: int = 1, limit: int = 10, status: str | None = None
) -> AdminPayoutsPaginatedResponse:
    """Liquidaciones generadas más los meses cerrados aún por generar (como pendientes, sin crear
    registros), ordenadas por urgencia de consignación y paginadas en el servidor."""

    status_enum = None

    if status:
        try:
            status_enum = PayoutStatusEnum(status)
        except ValueError:
            api_error(422, ErrorCodes.VALIDATION_ERROR, "Estado de liquidación inválido.")

    today = BusinessCalendar.today_bogota()
    offset = (page - 1) * limit

    # Intercalar dos listas ya ordenadas: los primeros offset+limit de la mezcla salen de los
    # primeros offset+limit de cada una, así nunca se cargan todas las liquidaciones.
    payouts, payouts_total = repo.list_all_payouts_by_urgency(database, offset + limit, status_enum)
    pending = (
        _list_pending_generations(database, today)
        if status_enum in (None, PayoutStatusEnum.PENDING)
        else []
    )

    rows: list[tuple[tuple, CompanyPayout | _PendingGeneration]] = [
        (
            _urgency_key(
                payout.payout_status == PayoutStatusEnum.PAID,
                payout.period_end,
                payout.company.nameCompany,
                payout.company_id,
                payout.period_start,
            ),
            payout,
        )
        for payout in payouts
    ]
    rows.extend(
        (_urgency_key(False, p.period_end, p.company_name, p.company_id, p.period_start), p)
        for p in pending
    )
    rows.sort(key=lambda row: row[0])
    page_rows = [row for _, row in rows[offset : offset + limit]]

    estimates: dict[UUID, dict[date, AdminPayoutListItemResponse]] = {}
    for row in page_rows:
        if isinstance(row, _PendingGeneration) and row.company_id not in estimates:
            estimates[row.company_id] = _planned_items(database, row.company_id, row.company_name, today)

    items = [
        estimates[row.company_id][row.period_start]
        if isinstance(row, _PendingGeneration)
        else AdminPayoutListItemResponse(**_to_response(row).model_dump())
        for row in page_rows
    ]

    total = payouts_total + len(pending)

    return AdminPayoutsPaginatedResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit if total else 0,
    )


def get_admin_payout_detail_service(payout_id: UUID, database: Session) -> CompanyPayoutResponse:
    payout = repo.get_payout_by_id(database, payout_id)

    if not payout:
        api_error(404, ErrorCodes.PAYOUT_NOT_FOUND, "Liquidación no encontrada.")

    return _to_response(payout)
