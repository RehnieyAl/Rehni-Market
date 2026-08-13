from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import Form
from pydantic import BaseModel, Field


class VariantColorResponse(BaseModel):
    id: UUID
    name: str
    hex_color: str

    model_config = {
        "from_attributes": True
    }


class VariantImageResponse(BaseModel):
    id: UUID
    url: str
    is_main: bool

    model_config = {
        "from_attributes": True
    }


class VariantSpecificationResponse(BaseModel):
    id: UUID
    specification_template_id: UUID
    value: str

    model_config = {
        "from_attributes": True
    }


class VariantResponse(BaseModel):
    id: UUID
    name: str
    price: Decimal

    # Descuento propio de la variante (independiente del descuento del
    # producto base) - mismos valores crudos que ProductDetailResponse
    # (discount_value es un PORCENTAJE 0-100, no un monto absoluto). El
    # precio final calculado (final_price) solo se expone en las
    # respuestas publicas (ver PublicProductVariantResponse en
    # SchemaPublic.py), igual que ya pasa con el producto base.
    discount_enable: bool
    discount_value: Decimal

    stock: int
    product_id: UUID

    # Cada variante tiene exactamente un color (ver ALCANCE > COLOR). Se
    # deja opcional en la respuesta unicamente por si existen variantes
    # legadas sin color asignado (color_id es nullable a nivel de columna).
    color: VariantColorResponse | None

    main_image_url: str | None


class VariantDetailResponse(VariantResponse):
    images: list[VariantImageResponse]
    specifications: list[VariantSpecificationResponse]


class CreateVariantRequest(BaseModel):
    """
    Creacion de variante. Viaja como multipart/form-data (igual que
    create-product) para poder aceptar imagenes iniciales opcionales en el
    mismo request, ademas de las especificaciones - que llegan como un
    string JSON con el mismo formato que technicalSpecProduct:
    [{specificationTemplateId, value}, ...]
    """

    name: str = Field(min_length=1, max_length=100)
    price: float = Field(ge=0)
    stock: int = Field(ge=0)
    # Obligatorio: cada variante debe tener exactamente un color.
    colorId: str = Field(min_length=1)
    specifications: str | None = None

    @classmethod
    def as_form(
        cls,
        name: Annotated[str, Form()],
        price: Annotated[float, Form()],
        stock: Annotated[int, Form()],
        colorId: Annotated[str, Form()],
        specifications: Annotated[str | None, Form()] = None,
    ):
        return cls(
            name=name,
            price=price,
            stock=stock,
            colorId=colorId,
            specifications=specifications,
        )


class UpdateVariantRequest(BaseModel):
    """
    PATCH parcial: un campo ausente (None) significa "no tocar". No
    incluye imagenes ni especificaciones - esas tienen sus propios
    endpoints dedicados (ver ALCANCE > IMAGENES / ESPECIFICACIONES).

    No hay flujo de creacion con descuento (igual que CreateProductRequest
    para el producto base) - el descuento de una variante solo se puede
    activar/editar despues de creada, con este mismo PATCH.
    """

    name: str | None = Field(default=None, min_length=1, max_length=100)
    price: float | None = Field(default=None, ge=0)
    discountEnable: bool | None = None
    # Porcentaje de descuento (0-100), no un monto absoluto en pesos - ver
    # _compute_price_fields en app/services/publicService/Products.py.
    discountValue: float | None = Field(default=None, ge=0, le=100)
    stock: int | None = Field(default=None, ge=0)
    colorId: str | None = None


class VariantSpecificationRequest(BaseModel):
    specificationTemplateId: str
    value: str = Field(min_length=1)


class VariantSpecificationUpdateRequest(BaseModel):
    value: str = Field(min_length=1)
