from typing import Annotated
from uuid import UUID

from fastapi import Form
from pydantic import BaseModel, Field


class CreateCatalogRequest(BaseModel):
    """
    multipart/form-data (mismo criterio que CreateAdvertisementRequest,
    ver SchemaAdvertisement.py) - la imagen se recibe como UploadFile
    directamente desde el router, no puede viajar en JSON.
    """

    name: str = Field(..., min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    display_order: int = Field(default=0, ge=0)
    is_active: bool = True

    @classmethod
    def as_form(
        cls,
        name: Annotated[str, Form()],
        description: Annotated[str | None, Form()] = None,
        display_order: Annotated[int, Form()] = 0,
        is_active: Annotated[bool, Form()] = True,
    ):
        return cls(
            name=name,
            description=description,
            display_order=display_order,
            is_active=is_active,
        )


class UpdateCatalogRequest(BaseModel):
    """PATCH parcial - un campo ausente conserva su valor actual."""

    name: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    display_order: int | None = Field(default=None, ge=0)
    is_active: bool | None = None

    # Elimina la imagen actual sin subir una nueva (mismo motivo que
    # remove_mobile_image en Advertisement: un target ausente es
    # ambiguo entre "no la toques" y "bórrala").
    remove_image: bool = False

    @classmethod
    def as_form(
        cls,
        name: Annotated[str | None, Form()] = None,
        description: Annotated[str | None, Form()] = None,
        display_order: Annotated[int | None, Form()] = None,
        is_active: Annotated[bool | None, Form()] = None,
        remove_image: Annotated[bool, Form()] = False,
    ):
        return cls(
            name=name,
            description=description,
            display_order=display_order,
            is_active=is_active,
            remove_image=remove_image,
        )


class CatalogResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    image_url: str | None
    display_order: int
    is_active: bool

    # Productos ACTIVOS del catálogo (ver ALCANCE > "Contador de
    # productos" - mismos criterios que _has_visible_stock del catálogo
    # público) - calculado en get_catalogs_service con un único query
    # agregado, no es una columna del modelo.
    product_count: int = 0

    model_config = {
        "from_attributes": True
    }


class CatalogStatusRequest(BaseModel):
    is_active: bool


class CreateSpecificationRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    type: str = Field(default="text", min_length=2, max_length=50)
    required: bool = False

class UpdateSpecificationRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    type: str = Field(default="text", min_length=2, max_length=50)
    required: bool = False

class SpecificationResponse(BaseModel):
    id: UUID
    name: str
    type: str
    required: bool
    catalog_id: UUID
    model_config = {
        "from_attributes": True
    }
