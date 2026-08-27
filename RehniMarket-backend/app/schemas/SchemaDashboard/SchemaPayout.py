from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class GeneratePayoutRequest(BaseModel):
    """
    Body de POST /admin/payouts/generate (ver AdminPayoutRouter.py) - único
    endpoint que crea liquidaciones nuevas, exclusivo admin/owner (ver
    ALCANCE > Módulo de liquidaciones, gap de "generar" no cubierto por el
    listado original de endpoints).
    """

    companyId: UUID
    periodStart: date
    periodEnd: date

    @model_validator(mode="after")
    def _validate_period(self):
        if self.periodEnd < self.periodStart:
            raise ValueError("periodEnd no puede ser anterior a periodStart.")

        return self


class PayoutBankAccountSummary(BaseModel):
    """
    Cuenta bancaria asociada a una liquidación (ver
    PayoutService._to_bank_account_summary). `accountNumber` viene
    completo a propósito: quien procesa el pago (admin/owner) lo necesita
    para hacer la transferencia real, y la empresa ya puede verlo completo
    de todas formas en GET /company/bank-accounts (es su propia cuenta).
    `lastFourDigits` se mantiene para vistas compactas y para
    EmailPayoutProcessed, que sí solo muestra los últimos 4 dígitos por
    ser un correo (canal externo, ver EmailPayout.py).
    """

    bankName: str
    accountType: str
    accountNumber: str
    lastFourDigits: str


class RehniCoinMovementResponse(BaseModel):
    amountCop: Decimal
    rehniCoins: Decimal
    conversionRate: Decimal
    createdAt: datetime


class CompanyPayoutResponse(BaseModel):
    id: UUID
    companyId: UUID
    companyName: Optional[str] = None

    periodStart: date
    periodEnd: date

    grossSales: Decimal
    commissionPercentage: Decimal
    commissionAmount: Decimal
    netAmount: Decimal

    payoutStatus: str

    bankAccount: PayoutBankAccountSummary
    rehniCoinMovement: Optional[RehniCoinMovementResponse] = None

    paidAt: Optional[datetime] = None
    createdAt: datetime


class PayoutPreviewResponse(BaseModel):
    """
    GET /admin/payouts/preview (ver AdminPayoutRouter.py) - misma
    validación/cálculo que POST /admin/payouts/generate
    (PayoutService._resolve_payout_preview), sin persistir nada. No tiene
    `id`/`payoutStatus`/`createdAt`: todavía no existe ninguna liquidación,
    es solo la proyección de lo que se generaría con estos parámetros.
    """

    companyId: UUID
    companyName: str

    periodStart: date
    periodEnd: date

    grossSales: Decimal
    commissionPercentage: Decimal
    commissionAmount: Decimal
    netAmount: Decimal

    bankAccount: PayoutBankAccountSummary


class PayoutAvailablePeriodResponse(BaseModel):
    """
    GET /admin/payouts/available-periods (ver AdminPayoutRouter.py) - un
    mes calendario en el que la empresa tiene ventas DELIVERED y que
    TODAVÍA no tiene una liquidación generada (ver
    PayoutService.list_available_payout_periods_service). Reemplaza al
    selector de mes libre del frontend: el admin ya no puede elegir un
    periodo sin ventas o ya liquidado.
    """

    periodStart: date
    periodEnd: date


class CompanyPayoutsPaginatedResponse(BaseModel):
    items: list[CompanyPayoutResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class CompanyBalanceResponse(BaseModel):
    """
    GET /company/balance (ver ALCANCE > Fase 6). Definiciones (ver
    PayoutService.get_company_balance_service):
    - grossSalesAccumulated / commissionAccumulated: suma histórica de
      TODAS las liquidaciones ya generadas para la empresa (lifetime).
    - netBalance: suma de netAmount de las liquidaciones que TODAVÍA no
      están en PAID - lo que la empresa tiene pendiente de recibir.
    - nextPayoutDate: proyección informativa (último día del mes en
      curso) - no hay un job programado que genere liquidaciones
      automáticamente en este sistema, es solo el corte mensual esperado.
    """

    grossSalesAccumulated: Decimal
    commissionAccumulated: Decimal
    netBalance: Decimal
    nextPayoutDate: date
