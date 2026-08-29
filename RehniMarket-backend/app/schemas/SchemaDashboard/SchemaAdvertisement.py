from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import Form
from pydantic import BaseModel, Field

from app.models.ModelAdvertisement import AdvertisementTargetType


class AdvertisementResponse(BaseModel):
    id: UUID

    image_url: str
    mobile_image_url: str | None

    # Con target_type != None lo calcula el backend; con None se usa lo que escribió el admin.
    button_link: str | None

    is_active: bool

    order: int

    created_at: datetime

    target_type: AdvertisementTargetType | None
    target_product_id: UUID | None
    target_catalog_id: UUID | None
    target_company_id: UUID | None
    minimum_discount: int | None
    maximum_stock: int | None
    max_age_days: int | None

    model_config = {
        "from_attributes": True
    }


class CreateAdvertisementRequest(BaseModel):
    """multipart/form-data: las imágenes llegan como UploadFile desde el router.
    El anuncio es un banner visual: no tiene texto (título/descripción/botón)."""

    # Solo se usa con target_type None; con otro valor lo calcula el backend.
    button_link: str | None = Field(
        default=None,
        max_length=255
    )

    order: int = Field(
        default=0,
        ge=0
    )

    is_active: bool = True

    target_type: AdvertisementTargetType | None = None
    target_product_id: UUID | None = None
    target_catalog_id: UUID | None = None
    target_company_id: UUID | None = None
    minimum_discount: int | None = Field(default=None, ge=0, le=100)
    maximum_stock: int | None = Field(default=None, ge=0)
    max_age_days: int | None = Field(default=None, ge=1)

    @classmethod
    def as_form(
        cls,
        button_link: Annotated[str | None, Form()] = None,
        order: Annotated[int, Form()] = 0,
        is_active: Annotated[bool, Form()] = True,
        target_type: Annotated[AdvertisementTargetType | None, Form()] = None,
        target_product_id: Annotated[UUID | None, Form()] = None,
        target_catalog_id: Annotated[UUID | None, Form()] = None,
        target_company_id: Annotated[UUID | None, Form()] = None,
        minimum_discount: Annotated[int | None, Form()] = None,
        maximum_stock: Annotated[int | None, Form()] = None,
        max_age_days: Annotated[int | None, Form()] = None,
    ):
        return cls(
            button_link=button_link,
            order=order,
            is_active=is_active,
            target_type=target_type,
            target_product_id=target_product_id,
            target_catalog_id=target_catalog_id,
            target_company_id=target_company_id,
            minimum_discount=minimum_discount,
            maximum_stock=maximum_stock,
            max_age_days=max_age_days,
        )


class UpdateAdvertisementRequest(BaseModel):
    """PATCH parcial; los campos ausentes conservan su valor."""

    button_link: str | None = Field(
        default=None,
        max_length=255
    )

    order: int | None = Field(
        default=None,
        ge=0
    )

    is_active: bool | None = None

    # Elimina la imagen móvil actual sin subir otra; se ignora si llega una nueva.
    remove_mobile_image: bool = False

    # clear_target como bandera explícita: un PATCH parcial no distingue "no enviado" de "limpiar".
    target_type: AdvertisementTargetType | None = None
    clear_target: bool = False
    target_product_id: UUID | None = None
    target_catalog_id: UUID | None = None
    target_company_id: UUID | None = None
    minimum_discount: int | None = Field(default=None, ge=0, le=100)
    maximum_stock: int | None = Field(default=None, ge=0)
    max_age_days: int | None = Field(default=None, ge=1)

    @classmethod
    def as_form(
        cls,
        button_link: Annotated[str | None, Form()] = None,
        order: Annotated[int | None, Form()] = None,
        is_active: Annotated[bool | None, Form()] = None,
        remove_mobile_image: Annotated[bool, Form()] = False,
        target_type: Annotated[AdvertisementTargetType | None, Form()] = None,
        clear_target: Annotated[bool, Form()] = False,
        target_product_id: Annotated[UUID | None, Form()] = None,
        target_catalog_id: Annotated[UUID | None, Form()] = None,
        target_company_id: Annotated[UUID | None, Form()] = None,
        minimum_discount: Annotated[int | None, Form()] = None,
        maximum_stock: Annotated[int | None, Form()] = None,
        max_age_days: Annotated[int | None, Form()] = None,
    ):
        return cls(
            button_link=button_link,
            order=order,
            is_active=is_active,
            remove_mobile_image=remove_mobile_image,
            target_type=target_type,
            clear_target=clear_target,
            target_product_id=target_product_id,
            target_catalog_id=target_catalog_id,
            target_company_id=target_company_id,
            minimum_discount=minimum_discount,
            maximum_stock=maximum_stock,
            max_age_days=max_age_days,
        )


class AdvertisementStatusRequest(BaseModel):
    is_active: bool
