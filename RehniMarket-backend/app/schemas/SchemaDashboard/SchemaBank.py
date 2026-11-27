"""Esquemas del catálogo de bancos: formularios del administrador y respuestas para admin y empresas."""

from datetime import datetime
from typing import Annotated, Optional
from uuid import UUID

from fastapi import Form
from pydantic import BaseModel, Field, field_validator


def _clean_name(value: Optional[str]) -> Optional[str]:
    if value is None:
        return value
    value = " ".join(value.split())
    if len(value) < 2:
        raise ValueError("El nombre del banco debe tener al menos 2 caracteres.")
    return value


class CreateBankRequest(BaseModel):
    name: str = Field(max_length=100)
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return _clean_name(value)

    @classmethod
    def as_form(
        cls,
        name: Annotated[str, Form()],
        is_active: Annotated[bool, Form()] = True,
    ):
        return cls(name=name, is_active=is_active)


class UpdateBankRequest(BaseModel):
    name: Optional[str] = Field(default=None, max_length=100)
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: Optional[str]) -> Optional[str]:
        return _clean_name(value)

    @classmethod
    def as_form(
        cls,
        name: Annotated[str | None, Form()] = None,
        is_active: Annotated[bool | None, Form()] = None,
    ):
        return cls(name=name, is_active=is_active)


class BankOptionResponse(BaseModel):
    """Banco activo que una empresa puede elegir para su cuenta."""

    id: UUID
    name: str
    logoUrl: Optional[str]


class AdminBankResponse(BankOptionResponse):
    isActive: bool
    accountsCount: int
    createdAt: datetime
    updatedAt: Optional[datetime]
