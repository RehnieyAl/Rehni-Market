"""Schemas de gestión de atributos de catálogo (Admin/Owner). Ver ModelCatalogAttribute.py."""

from uuid import UUID

from pydantic import BaseModel, Field


class CatalogAttributeOptionResponse(BaseModel):
    id: UUID
    label: str
    value: str
    hex: str | None = None
    position: int

    model_config = {"from_attributes": True}


class CatalogAttributeResponse(BaseModel):
    id: UUID
    catalog_id: UUID
    name: str
    role: str
    input_type: str
    unit: str | None = None
    required: bool
    position: int
    image_defining: bool
    options: list[CatalogAttributeOptionResponse] = []

    model_config = {"from_attributes": True}


class CreateCatalogAttributeRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    role: str  # "variant" | "spec" - validado en el servicio
    input_type: str = "option"  # "option" | "color" | "text" | "number"
    unit: str | None = Field(default=None, max_length=24)
    required: bool = False
    position: int = Field(default=0, ge=0)
    image_defining: bool = False


class UpdateCatalogAttributeRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    role: str | None = None
    input_type: str | None = None
    unit: str | None = Field(default=None, max_length=24)
    required: bool | None = None
    position: int | None = Field(default=None, ge=0)
    image_defining: bool | None = None


class CreateAttributeOptionRequest(BaseModel):
    label: str = Field(min_length=1, max_length=80)
    value: str | None = Field(default=None, max_length=80)
    hex: str | None = Field(default=None, max_length=7)
    position: int = Field(default=0, ge=0)


class UpdateAttributeOptionRequest(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=80)
    value: str | None = Field(default=None, max_length=80)
    hex: str | None = Field(default=None, max_length=7)
    position: int | None = Field(default=None, ge=0)
