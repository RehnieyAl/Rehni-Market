from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import Form
from pydantic import BaseModel, Field


class AdvertisementResponse(BaseModel):
    id: UUID

    title: str

    description: str | None

    # Imagen para desktop/tablet
    image_url: str

    # Imagen específica para móvil
    mobile_image_url: str | None

    button_text: str | None

    button_link: str | None

    is_active: bool

    order: int

    created_at: datetime

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

    button_link: str | None = Field(
        default=None,
        max_length=255
    )

    order: int = Field(
        default=0,
        ge=0
    )

    is_active: bool = True

    @classmethod
    def as_form(
        cls,
        title: Annotated[str, Form()],
        description: Annotated[str | None, Form()] = None,
        button_text: Annotated[str | None, Form()] = None,
        button_link: Annotated[str | None, Form()] = None,
        order: Annotated[int, Form()] = 0,
        is_active: Annotated[bool, Form()] = True,
    ):
        return cls(
            title=title,
            description=description,
            button_text=button_text,
            button_link=button_link,
            order=order,
            is_active=is_active,
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
    ):
        return cls(
            title=title,
            description=description,
            button_text=button_text,
            button_link=button_link,
            order=order,
            is_active=is_active,
            remove_mobile_image=remove_mobile_image,
        )


class AdvertisementStatusRequest(BaseModel):
    is_active: bool