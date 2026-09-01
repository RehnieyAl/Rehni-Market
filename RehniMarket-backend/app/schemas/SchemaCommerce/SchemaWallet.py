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


class WalletRechargeHistoryPaginatedResponse(BaseModel):
    items: list[WalletRechargeHistoryItemResponse]
    total: int
    page: int
    limit: int
    total_pages: int
