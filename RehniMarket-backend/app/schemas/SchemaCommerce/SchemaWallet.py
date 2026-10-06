from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class RechargeWalletRequest(BaseModel):
    userId: UUID
    amount: Decimal = Field(gt=0)
    description: str | None = Field(default=None, max_length=255)


class RechargeWalletByEmailRequest(BaseModel):
    """Body de POST /admin/wallet/recharge; identifica al usuario por email."""

    email: EmailStr
    amount: Decimal = Field(gt=0)
    description: str | None = Field(default=None, max_length=255)


class CorrectRechargeRequest(BaseModel):
    """Body de POST /admin/wallet/recharge/{transaction_id}/correction.

    `newAmount` es la cantidad CORRECTA que debió recargarse; el servicio calcula
    el ajuste (newAmount - cantidad original) y lo aplica como un movimiento
    type=ADJUSTMENT vinculado a la recarga original."""

    newAmount: Decimal = Field(gt=0)
    reason: str = Field(min_length=3, max_length=255)


class WalletTransactionResponse(BaseModel):
    id: UUID
    type: str
    amount: Decimal
    description: str | None
    createdAt: datetime

    model_config = {"from_attributes": True}


class WalletResponse(BaseModel):
    balance: Decimal


class RechargeWalletByEmailResponse(BaseModel):
    """Saldo actualizado + datos del usuario recargado, para la confirmación en pantalla."""

    balance: Decimal
    userName: str
    userEmail: str


class CorrectRechargeResponse(BaseModel):
    """Resultado de corregir una recarga: saldo nuevo del usuario + detalle del ajuste."""

    balance: Decimal
    userName: str
    userEmail: str
    originalAmount: Decimal
    newAmount: Decimal
    adjustment: Decimal
    correctionTransactionId: UUID


class WalletTransactionsPaginatedResponse(BaseModel):
    items: list[WalletTransactionResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class WalletRechargeHistoryItemResponse(BaseModel):
    """Fila del historial de recargas: solo type=RECHARGE hechas por un admin/owner."""

    id: UUID
    createdAt: datetime
    userName: str
    userEmail: str
    amount: Decimal
    description: str | None
    createdByName: str | None
    createdByEmail: str | None
    isCorrected: bool = False


class WalletRechargeHistoryPaginatedResponse(BaseModel):
    items: list[WalletRechargeHistoryItemResponse]
    total: int
    page: int
    limit: int
    total_pages: int
