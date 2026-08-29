from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CreateAddressRequest(BaseModel):
    # Nombre de referencia ("Casa", "Oficina"); requerido en direcciones nuevas.
    label: str = Field(min_length=2, max_length=60)
    fullName: str = Field(min_length=2, max_length=150)
    country: str = Field(min_length=2, max_length=60)
    department: str = Field(min_length=2, max_length=60)
    city: str = Field(min_length=2, max_length=60)
    address: str = Field(min_length=5, max_length=150)
    postalCode: Optional[str] = Field(default=None, max_length=15)
    phone: str = Field(min_length=7, max_length=20)
    additionalInstructions: Optional[str] = Field(default=None, max_length=255)
    isDefault: bool = False


class UpdateAddressRequest(BaseModel):
    label: Optional[str] = Field(default=None, min_length=2, max_length=60)
    fullName: Optional[str] = Field(default=None, min_length=2, max_length=150)
    country: Optional[str] = Field(default=None, min_length=2, max_length=60)
    department: Optional[str] = Field(default=None, min_length=2, max_length=60)
    city: Optional[str] = Field(default=None, min_length=2, max_length=60)
    address: Optional[str] = Field(default=None, min_length=5, max_length=150)
    postalCode: Optional[str] = Field(default=None, max_length=15)
    phone: Optional[str] = Field(default=None, min_length=7, max_length=20)
    additionalInstructions: Optional[str] = Field(default=None, max_length=255)


class AddressResponse(BaseModel):
    id: UUID
    label: str | None
    fullName: str | None
    country: str
    department: str
    city: str
    address: str
    postalCode: str | None
    phone: str
    additionalInstructions: str | None
    isDefault: bool
    createdAt: datetime

    model_config = {"from_attributes": True}
