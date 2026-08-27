"""
PayoutService: único servicio responsable del módulo de liquidaciones
mensuales (ver ALCANCE > Módulo de liquidaciones, Fase 4). Reutilizable
por los routers de empresa (BankAccountRouter no, ese es CRUD aparte) y
admin (ver CompanyPayoutRouter.py / AdminPayoutRouter.py) - ninguno de los
dos routers calcula nada por su cuenta, solo llaman a las funciones de
acá.

Responsabilidades (ver ALCANCE):
- obtener ventas válidas       -> OrderRepository.sum_valid_company_sales
- calcular comisión / neto     -> _calculate_amounts
- generar liquidación          -> generate_company_payout_service
- asociar cuenta bancaria      -> generate_company_payout_service (cuenta
                                   predeterminada de la empresa)
- registrar movimiento RehniCoin -> _create_rehnicoin_movement
"""

import calendar
import traceback
from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.core.PayoutConfig import COMMISSION_PERCENTAGE, REHNICOIN_CONVERSION_RATE

from app.models.ModelCompany import Company
from app.models.ModelCompanyBankAccount import CompanyBankAccount
from app.models.ModelCompanyPayout import CompanyPayout, PayoutStatusEnum
from app.models.ModelRehniCoinMovement import RehniCoinMovement

from app.repository import CompanyRepository
from app.repository import CompanyBankAccountRepository
from app.repository import CompanyPayoutRepository as repo
from app.repository import RehniCoinMovementRepository
from app.repository.OrderRepository import list_delivered_sale_months, sum_valid_company_sales

from app.schemas.SchemaDashboard.SchemaPayout import (
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
    """
    (period_start, period_end) de un mes calendario completo a partir de
    su primer día - mismo criterio que monthToPeriod() del frontend
    (GeneratePayoutModal.tsx), pero ahora resuelto acá porque
    list_available_payout_periods_service es quien decide qué meses
    existen, no el frontend.
    """

    last_day = calendar.monthrange(month_start.year, month_start.month)[1]

    return month_start, date(month_start.year, month_start.month, last_day)


def _calculate_amounts(gross_sales: Decimal) -> tuple[Decimal, Decimal]:
    """
    (commission_amount, net_amount) a partir de gross_sales y la comisión
    configurada (ver app/core/PayoutConfig.py - nunca un 0.05 suelto acá).
    """

    commission_amount = (gross_sales * COMMISSION_PERCENTAGE).quantize(Decimal("0.01"))
    net_amount = gross_sales - commission_amount

    return commission_amount, net_amount


def _create_rehnicoin_movement(
    database: Session, company_id: UUID, payout_id: UUID, net_amount: Decimal
) -> RehniCoinMovement:
    """
    Registra la conversión del neto de la liquidación a RehniCoin, SOLO
    como auditoría (ver ModelRehniCoinMovement.py) - no acredita el Wallet
    real de ningún usuario.
    """

    movement = RehniCoinMovement(
        company_id=company_id,
        payout_id=payout_id,
        amount_cop=net_amount,
        rehni_coins=(net_amount * REHNICOIN_CONVERSION_RATE).quantize(Decimal("0.01")),
        conversion_rate=REHNICOIN_CONVERSION_RATE,
    )

    return RehniCoinMovementRepository.create_movement(database, movement)


@dataclass
class _PayoutCalculation:
    """
    Resultado de validar + calcular una liquidación, SIN persistir nada
    (ver _resolve_payout_preview) - tanto generate_company_payout_service
    como get_payout_preview_service parten de este mismo objeto, así el
    cálculo (y las validaciones que lo condicionan) viven en un solo
    lugar (ver ALCANCE > mejora "vista previa", regla "no duplicar
    cálculos").
    """

    company: Company
    bank_account: CompanyBankAccount
    gross_sales: Decimal
    commission_amount: Decimal
    net_amount: Decimal


def _resolve_payout_preview(
    database: Session, company_id: UUID, period_start: date, period_end: date
) -> _PayoutCalculation:
    """
    Corre EXACTAMENTE las mismas validaciones y el mismo cálculo que
    generate_company_payout_service (existencia de la empresa, liquidación
    duplicada para el periodo, cuenta bancaria predeterminada, ventas
    válidas > 0, comisión/neto) pero sin crear ni comitear nada - se usa
    tanto para generar de verdad como para la vista previa
    (GET /admin/payouts/preview, ver get_payout_preview_service). Lanza
    los mismos api_error de siempre (PAYOUT_ALREADY_EXISTS/
    PAYOUT_NO_BANK_ACCOUNT/PAYOUT_NO_VALID_SALES) - el frontend ya sabe
    mostrar un mensaje amigable para cada uno (ver ErrorCode.ts).
    """

    if period_end < period_start:
        api_error(422, ErrorCodes.PAYOUT_INVALID_PERIOD, "El periodo seleccionado no es válido.")

    company = _get_company_or_404(database, company_id)

    existing = repo.get_payout_by_period(database, company.id, period_start, period_end)

    if existing:
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

    gross_sales = sum_valid_company_sales(database, company.id, period_start, period_end)

    if gross_sales <= 0:
        api_error(
            422,
            ErrorCodes.PAYOUT_NO_VALID_SALES,
            "No hay ventas válidas (pedidos entregados) en el periodo solicitado.",
        )

    commission_amount, net_amount = _calculate_amounts(gross_sales)

    return _PayoutCalculation(
        company=company,
        bank_account=bank_account,
        gross_sales=gross_sales,
        commission_amount=commission_amount,
        net_amount=net_amount,
    )


def _to_bank_account_summary(bank_account) -> PayoutBankAccountSummary:
    return PayoutBankAccountSummary(
        bankName=bank_account.bank_name,
        accountType=bank_account.account_type.value,
        accountNumber=bank_account.account_number,
        lastFourDigits=bank_account.account_number[-4:],
    )


def _to_response(payout: CompanyPayout) -> CompanyPayoutResponse:
    movement = payout.rehnicoin_movement

    return CompanyPayoutResponse(
        id=payout.id,
        companyId=payout.company_id,
        companyName=payout.company.nameCompany if payout.company else None,
        periodStart=payout.period_start,
        periodEnd=payout.period_end,
        grossSales=payout.gross_sales,
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
    )


# ==============================
# GENERAR LIQUIDACIÓN (admin/owner - ver AdminPayoutRouter.py)
# ==============================
def generate_company_payout_service(
    data: GeneratePayoutRequest, database: Session
) -> CompanyPayoutResponse:
    try:
        calc = _resolve_payout_preview(database, data.companyId, data.periodStart, data.periodEnd)

        payout = CompanyPayout(
            company_id=calc.company.id,
            period_start=data.periodStart,
            period_end=data.periodEnd,
            gross_sales=calc.gross_sales,
            commission_percentage=COMMISSION_PERCENTAGE,
            commission_amount=calc.commission_amount,
            net_amount=calc.net_amount,
            payout_status=PayoutStatusEnum.PENDING,
            bank_account_id=calc.bank_account.id,
        )

        repo.create_payout(database, payout)
        database.flush()

        _create_rehnicoin_movement(database, calc.company.id, payout.id, calc.net_amount)

        database.commit()

        payout = repo.get_payout_by_id(database, payout.id)

        return _to_response(payout)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


# ==============================
# PERIODOS DISPONIBLES (admin/owner) - ver ALCANCE > selector "Mes a
# liquidar" ya no es texto libre, solo ofrece meses reales con ventas
# pendientes de liquidar.
# ==============================
def list_available_payout_periods_service(
    company_id: UUID, database: Session
) -> list[PayoutAvailablePeriodResponse]:
    company = _get_company_or_404(database, company_id)

    month_starts = list_delivered_sale_months(database, company.id)

    periods: list[PayoutAvailablePeriodResponse] = []

    for month_start in month_starts:
        period_start, period_end = _month_period(month_start)

        # Ya liquidado para ese periodo exacto (cualquier estado, no solo
        # PAID) - no debe volver a ofrecerse (ver ALCANCE > regla 4).
        if repo.get_payout_by_period(database, company.id, period_start, period_end):
            continue

        periods.append(PayoutAvailablePeriodResponse(periodStart=period_start, periodEnd=period_end))

    return periods


# ==============================
# VISTA PREVIA (admin/owner) - ver ALCANCE > mejora "vista previa" del
# GeneratePayoutModal. Mismas validaciones/cálculo que generate_company_
# payout_service (via _resolve_payout_preview), CERO escritura en BD -
# ni siquiera abre una transacción propia, es de solo lectura.
# ==============================
def get_payout_preview_service(
    company_id: UUID, period_start: date, period_end: date, database: Session
) -> PayoutPreviewResponse:
    calc = _resolve_payout_preview(database, company_id, period_start, period_end)

    return PayoutPreviewResponse(
        companyId=calc.company.id,
        companyName=calc.company.nameCompany,
        periodStart=period_start,
        periodEnd=period_end,
        grossSales=calc.gross_sales,
        commissionPercentage=COMMISSION_PERCENTAGE,
        commissionAmount=calc.commission_amount,
        netAmount=calc.net_amount,
        bankAccount=_to_bank_account_summary(calc.bank_account),
    )


# ==============================
# MARCAR COMO PAGADA (admin/owner)
# ==============================
def mark_payout_paid_service(payout_id: UUID, database: Session) -> CompanyPayoutResponse:
    try:
        payout = repo.get_payout_by_id(database, payout_id)

        if not payout:
            api_error(404, ErrorCodes.PAYOUT_NOT_FOUND, "Liquidación no encontrada.")

        if payout.payout_status == PayoutStatusEnum.PAID:
            api_error(409, ErrorCodes.PAYOUT_ALREADY_PAID, "Esta liquidación ya fue pagada.")

        payout.payout_status = PayoutStatusEnum.PAID
        payout.paid_at = datetime.now(timezone.utc)

        database.commit()
        database.refresh(payout)

        payout = repo.get_payout_by_id(database, payout.id)

        # Correo automático al pasar a PAID (ver ALCANCE > Fase 5) - sin
        # try/except: send_email nunca revienta el flujo que lo llama (ver
        # EmailService.py), así que un error de SMTP nunca puede tumbar el
        # cambio de estado que ya se guardó correctamente (mismo criterio
        # que OrderEmailService.py).
        send_payout_processed_email(payout)

        return _to_response(payout)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


# ==============================
# EMPRESA (ver ALCANCE > Fase 6)
# ==============================
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

    gross_sales_accumulated, commission_accumulated = repo.sum_company_payouts(
        database, company.id
    )
    net_balance = repo.sum_pending_net_amount(database, company.id)

    today = date.today()
    last_day = calendar.monthrange(today.year, today.month)[1]
    next_payout_date = date(today.year, today.month, last_day)

    return CompanyBalanceResponse(
        grossSalesAccumulated=gross_sales_accumulated,
        commissionAccumulated=commission_accumulated,
        netBalance=net_balance,
        nextPayoutDate=next_payout_date,
    )


# ==============================
# ADMIN (ver ALCANCE > Fase 7)
# ==============================
def list_admin_payouts_service(
    database: Session, page: int = 1, limit: int = 10, status: str | None = None
) -> CompanyPayoutsPaginatedResponse:
    status_enum = None

    if status:
        try:
            status_enum = PayoutStatusEnum(status)
        except ValueError:
            api_error(422, ErrorCodes.VALIDATION_ERROR, "Estado de liquidación inválido.")

    payouts, total = repo.list_all_payouts(database, page, limit, status_enum)

    return CompanyPayoutsPaginatedResponse(
        items=[_to_response(p) for p in payouts],
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
