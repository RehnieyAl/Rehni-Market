from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

# Mismos 4 valores que BankAccountTypeEnum (ver ModelCompanyBankAccount.py)
# - Literal acá en vez de importar el Enum de SQLAlchemy directo, mismo
# criterio que el resto de los schemas de este proyecto (ver
# UpdateOrderStatusRequest en SchemaOrder.py, que valida contra strings).
BankAccountType = Literal["savings", "checking", "nequi", "daviplata"]


class CreateBankAccountRequest(BaseModel):
    accountHolder: str = Field(min_length=2, max_length=150)
    documentNumber: str = Field(min_length=4, max_length=30)
    bankName: str = Field(min_length=2, max_length=100)
    accountType: BankAccountType
    accountNumber: str = Field(min_length=4, max_length=40)
    isDefault: bool = False


class UpdateBankAccountRequest(BaseModel):
    accountHolder: Optional[str] = Field(default=None, min_length=2, max_length=150)
    documentNumber: Optional[str] = Field(default=None, min_length=4, max_length=30)
    bankName: Optional[str] = Field(default=None, min_length=2, max_length=100)
    accountType: Optional[BankAccountType] = None
    accountNumber: Optional[str] = Field(default=None, min_length=4, max_length=40)
    isDefault: Optional[bool] = None


class BankAccountResponse(BaseModel):
    id: UUID
    accountHolder: str
    documentNumber: str
    bankName: str
    accountType: str
    accountNumber: str
    isDefault: bool
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    model_config = {"from_attributes": True}
