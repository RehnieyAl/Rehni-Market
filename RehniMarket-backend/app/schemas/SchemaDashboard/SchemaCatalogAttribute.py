from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

AttributeRole = Literal["product", "variant"]
AttributeInputType = Literal["select", "color", "text", "number"]

HEX_PATTERN = r"^#[0-9A-Fa-f]{6}$"


class CatalogAttributeOptionResponse(BaseModel):
    id: UUID
    value: str
    hex_color: str | None = None
    position: int

    model_config = ConfigDict(from_attributes=True)


class CatalogAttributeResponse(BaseModel):
    id: UUID
    catalog_id: UUID
    name: str
    role: str
    input_type: str
    unit: str | None = None
    is_active: bool
    position: int
    options: list[CatalogAttributeOptionResponse] = []

    model_config = ConfigDict(from_attributes=True)


class CreateCatalogAttributeRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    role: AttributeRole
    input_type: AttributeInputType = "select"
    unit: str | None = Field(default=None, max_length=24)
    position: int = Field(default=0, ge=0)


class UpdateCatalogAttributeRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    role: AttributeRole | None = None
    input_type: AttributeInputType | None = None
    unit: str | None = Field(default=None, max_length=24)
    position: int | None = Field(default=None, ge=0)


class CatalogAttributeStatusRequest(BaseModel):
    is_active: bool


class CreateAttributeOptionRequest(BaseModel):
    value: str = Field(min_length=1, max_length=80)
    hex_color: str | None = Field(default=None, pattern=HEX_PATTERN)
    position: int = Field(default=0, ge=0)


class UpdateAttributeOptionRequest(BaseModel):
    value: str | None = Field(default=None, min_length=1, max_length=80)
    hex_color: str | None = Field(default=None, pattern=HEX_PATTERN)
    position: int | None = Field(default=None, ge=0)
