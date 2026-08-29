from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class GeneratePayoutRequest(BaseModel):
    """Body de POST /admin/payouts/generate; único endpoint que crea liquidaciones."""

    companyId: UUID
    periodStart: date
    periodEnd: date

    @model_validator(mode="after")
    def _validate_period(self):
        if self.periodEnd < self.periodStart:
            raise ValueError("periodEnd no puede ser anterior a periodStart.")

        return self


class PayoutBankAccountSummary(BaseModel):
    """`accountNumber` va completo: admin/owner lo necesita para la transferencia.
    `lastFourDigits` es para vistas compactas y correos (canal externo)."""

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
    """Proyección de lo que generaría POST /admin/payouts/generate, sin persistir nada."""

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
    """Un mes con ventas DELIVERED de la empresa y sin liquidación generada aún."""

    periodStart: date
    periodEnd: date


class CompanyPayoutsPaginatedResponse(BaseModel):
    items: list[CompanyPayoutResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class CompanyBalanceResponse(BaseModel):
    """- grossSalesAccumulated / commissionAccumulated: suma histórica de todas las liquidaciones.
    - netBalance: suma de netAmount de las liquidaciones aún no PAID.
    - nextPayoutDate: proyección informativa (último día del mes), no hay job automático."""

    grossSalesAccumulated: Decimal
    commissionAccumulated: Decimal
    netBalance: Decimal
    nextPayoutDate: date
