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

    # Descuento propio de la variante; discount_value es un porcentaje (0-100).
    discount_enable: bool
    discount_value: Decimal

    stock: int
    product_id: UUID

    # Opcional solo por variantes legadas sin color (color_id es nullable).
    color: VariantColorResponse | None

    main_image_url: str | None


class VariantDetailResponse(VariantResponse):
    images: list[VariantImageResponse]
    specifications: list[VariantSpecificationResponse]


class CreateVariantRequest(BaseModel):
    """multipart/form-data: imágenes iniciales opcionales + `specifications` como
    string JSON [{specificationTemplateId, value}, ...]."""

    name: str = Field(min_length=1, max_length=100)
    price: float = Field(ge=0)
    stock: int = Field(ge=0)
    # Obligatorio: cada variante tiene un color.
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
    """PATCH parcial: campo ausente (None) = "no tocar". Imágenes y specs tienen
    sus propios endpoints; el descuento solo se activa/edita después de creada."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    price: float | None = Field(default=None, ge=0)
    discountEnable: bool | None = None
    # Porcentaje de descuento (0-100), no un monto absoluto.
    discountValue: float | None = Field(default=None, ge=0, le=100)
    stock: int | None = Field(default=None, ge=0)
    colorId: str | None = None


class VariantSpecificationRequest(BaseModel):
    specificationTemplateId: str
    value: str = Field(min_length=1)


class VariantSpecificationUpdateRequest(BaseModel):
    value: str = Field(min_length=1)
