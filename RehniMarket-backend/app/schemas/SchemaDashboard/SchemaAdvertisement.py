from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import Form
from pydantic import BaseModel, Field

from app.models.ModelAdvertisement import AdvertisementTargetType


class AdvertisementResponse(BaseModel):
    id: UUID

    title: str

    description: str | None

    # Imagen para desktop/tablet
    image_url: str

    # Imagen específica para móvil
    mobile_image_url: str | None

    button_text: str | None

    # Calculado por el backend cuando target_type no es None (ver
    # AdvertisementTargeting.py) - el admin ya no lo escribe a mano en
    # ese caso. Anuncios manuales clásicos (target_type=None, incluye
    # todos los anteriores a esta funcionalidad) siguen mostrando el
    # valor que el admin escribió, sin cambios (ver ALCANCE >
    # compatibilidad con anuncios antiguos).
    button_link: str | None

    is_active: bool

    order: int

    created_at: datetime

    # Anuncios dinámicos por reglas (ver ALCANCE). None en los 3
    # target_* cuando no aplican al target_type elegido.
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
    """
    Datos del anuncio.

    El anuncio se envía como multipart/form-data porque las imágenes
    se reciben como UploadFile directamente desde el router.
    """

    title: str = Field(
        min_length=2,
        max_length=150
    )

    description: str | None = Field(
        default=None,
        max_length=2000
    )

    button_text: str | None = Field(
        default=None,
        max_length=50
    )

    # Solo se usa cuando target_type es None (anuncio manual clásico) -
    # con un target_type distinto, este valor se ignora y el backend
    # calcula el destino real (ver AdvertisementService.py).
    button_link: str | None = Field(
        default=None,
        max_length=255
    )

    order: int = Field(
        default=0,
        ge=0
    )

    is_active: bool = True

    # =================================================
    # ANUNCIOS DINÁMICOS POR REGLAS (ver ALCANCE)
    # =================================================
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
        title: Annotated[str, Form()],
        description: Annotated[str | None, Form()] = None,
        button_text: Annotated[str | None, Form()] = None,
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
            title=title,
            description=description,
            button_text=button_text,
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
    """
    PATCH parcial del anuncio.

    Los campos que no se envían conservan su valor actual.

    Las imágenes se reciben por separado desde el router como UploadFile
    opcionales.
    """

    title: str | None = Field(
        default=None,
        min_length=2,
        max_length=150
    )

    description: str | None = Field(
        default=None,
        max_length=2000
    )

    button_text: str | None = Field(
        default=None,
        max_length=50
    )

    button_link: str | None = Field(
        default=None,
        max_length=255
    )

    order: int | None = Field(
        default=None,
        ge=0
    )

    is_active: bool | None = None

    # Permite eliminar la imagen móvil actual sin subir una nueva (PATCH
    # parcial). Si se envía una imagen móvil nueva en el mismo request,
    # esta bandera se ignora y la nueva imagen reemplaza a la anterior.
    remove_mobile_image: bool = False

    # =================================================
    # ANUNCIOS DINÁMICOS POR REGLAS (ver ALCANCE)
    # =================================================
    # `clear_target` (no `target_type: None`): un PATCH parcial no puede
    # distinguir "no envié este campo" de "lo quiero limpiar" solo con
    # Optional - mismo problema que remove_mobile_image de arriba, misma
    # solución (bandera explícita, ver AdvertisementService.py).
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
        title: Annotated[str | None, Form()] = None,
        description: Annotated[str | None, Form()] = None,
        button_text: Annotated[str | None, Form()] = None,
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
            title=title,
            description=description,
            button_text=button_text,
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
