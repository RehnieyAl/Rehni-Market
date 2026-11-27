"""Esquemas de las cuentas bancarias de la empresa. Las respuestas nunca incluyen el número completo:
solo los últimos dígitos (el número completo lo ve el administrador en la liquidación)."""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

BankAccountType = Literal["savings", "checking", "nequi", "daviplata"]


class CreateBankAccountRequest(BaseModel):
    accountHolder: str = Field(min_length=2, max_length=150)
    documentNumber: str = Field(min_length=4, max_length=30)
    bankId: UUID
    accountType: BankAccountType
    accountNumber: str = Field(min_length=4, max_length=40)
    isDefault: bool = False


class UpdateBankAccountRequest(BaseModel):
    """Campos omitidos o nulos no cambian: el número solo se reemplaza si se envía uno nuevo."""

    accountHolder: Optional[str] = Field(default=None, min_length=2, max_length=150)
    documentNumber: Optional[str] = Field(default=None, min_length=4, max_length=30)
    bankId: Optional[UUID] = None
    accountType: Optional[BankAccountType] = None
    accountNumber: Optional[str] = Field(default=None, min_length=4, max_length=40)
    isDefault: Optional[bool] = None


class BankAccountResponse(BaseModel):
    id: UUID
    accountHolder: str
    documentNumber: str
    bankId: Optional[UUID]
    bankName: str
    bankLogoUrl: Optional[str]
    accountType: str
    lastFourDigits: str
    isDefault: bool
    createdAt: datetime
    updatedAt: Optional[datetime] = None
