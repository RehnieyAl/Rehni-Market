"""Schemas de liquidaciones a empresas: generación, vista previa, listado del owner (con las pendientes de
generar), detalle y saldo de la empresa."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, model_validator


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
    refundsAmount: Decimal = Decimal("0")
    commissionPercentage: Decimal
    commissionAmount: Decimal
    netAmount: Decimal

    payoutStatus: str

    bankAccount: PayoutBankAccountSummary
    rehniCoinMovement: Optional[RehniCoinMovementResponse] = None

    paidAt: Optional[datetime] = None
    createdAt: datetime

    # Quinto día hábil (Colombia) tras el cierre del periodo; isOverdue solo es un indicador visual,
    # no cambia payoutStatus.
    consignmentDeadline: date
    isOverdue: bool = False


class AdminPayoutListItemResponse(CompanyPayoutResponse):
    """Fila del listado del owner. Con isGenerated=false es un mes cerrado con ventas que aún no se
    liquida: sin id ni registro, con importes estimados por el mismo cálculo de la generación y
    bankAccount nulo si la empresa no tiene cuenta predeterminada."""

    id: Optional[UUID] = None
    isGenerated: bool = True
    bankAccount: Optional[PayoutBankAccountSummary] = None
    createdAt: Optional[datetime] = None


class PayoutPreviewResponse(BaseModel):
    """Proyección de lo que generaría POST /admin/payouts/generate, sin persistir nada."""

    companyId: UUID
    companyName: str

    periodStart: date
    periodEnd: date

    grossSales: Decimal
    refundsAmount: Decimal = Decimal("0")
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


class AdminPayoutsPaginatedResponse(BaseModel):
    items: list[AdminPayoutListItemResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class CompanyBalanceResponse(BaseModel):
    """- grossSalesAccumulated / commissionAccumulated: liquidaciones + ventas entregadas aún sin liquidar.
    - netBalance: netAmount de las liquidaciones aún no PAID + neto de las ventas aún sin liquidar.
    - nextPayoutDate: proyección informativa (último día del mes), no hay job automático."""

    grossSalesAccumulated: Decimal
    commissionAccumulated: Decimal
    netBalance: Decimal
    nextPayoutDate: date
