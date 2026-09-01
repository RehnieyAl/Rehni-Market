from datetime import datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import Form
from pydantic import BaseModel, Field


class ProductStatusRequest(BaseModel):
    is_active: bool


class ProductImageResponse(BaseModel):
    id: UUID
    url: str
    is_main: bool

    model_config = {
        "from_attributes": True
    }


class ProductAttributePairResponse(BaseModel):
    attribute_id: UUID
    attribute_name: str
    value: str

    model_config = {
        "from_attributes": True
    }


class ProductColorResponse(BaseModel):
    id: UUID
    name: str
    hex_color: str

    model_config = {
        "from_attributes": True
    }


class ProductDetailResponse(BaseModel):
    id: UUID
    name: str
    price: Decimal
    discount_enable: bool
    discount_value: Decimal
    discount_type: str | None = None
    discount_starts_at: datetime | None = None
    discount_ends_at: datetime | None = None
    applies_tax: bool
    stock: int
    has_variants: bool
    descripcion: str
    is_active: bool
    created_at: datetime
    deleted_at: datetime | None = None

    catalog_id: UUID
    catalog_name: str

    main_color_id: UUID | None
    main_color: ProductColorResponse | None

    images: list[ProductImageResponse]
    attributes: list[ProductAttributePairResponse]


class UpdateProductRequest(BaseModel):
    """PATCH parcial: campo ausente (None) = "no tocar". is_active y has_variants
    no van acá. Las imágenes viajan aparte como parámetros de archivo del router."""

    nameProduct: str | None = Field(default=None, min_length=2, max_length=100)
    catalogId: str | None = None
    priceProduct: float | None = Field(default=None, ge=0)
    discountEnable: bool | None = None
    discountValue: float | None = Field(default=None, ge=0, le=100)
    appliesTax: bool | None = None
    stockProduct: int | None = Field(default=None, ge=0)
    descripcionProduct: str | None = Field(default=None, min_length=1)
    mainColorId: str | None = None
    clearMainColor: bool = False
    technicalSpecProduct: str | None = None
    mainImageId: str | None = None

    @classmethod
    def as_form(
        cls,
        nameProduct: Annotated[str | None, Form()] = None,
        catalogId: Annotated[str | None, Form()] = None,
        priceProduct: Annotated[float | None, Form()] = None,
        discountEnable: Annotated[bool | None, Form()] = None,
        discountValue: Annotated[float | None, Form()] = None,
        appliesTax: Annotated[bool | None, Form()] = None,
        stockProduct: Annotated[int | None, Form()] = None,
        descripcionProduct: Annotated[str | None, Form()] = None,
        mainColorId: Annotated[str | None, Form()] = None,
        clearMainColor: Annotated[bool, Form()] = False,
        technicalSpecProduct: Annotated[str | None, Form()] = None,
        mainImageId: Annotated[str | None, Form()] = None,
    ):
        return cls(
            nameProduct=nameProduct,
            catalogId=catalogId,
            priceProduct=priceProduct,
            discountEnable=discountEnable,
            discountValue=discountValue,
            appliesTax=appliesTax,
            stockProduct=stockProduct,
            descripcionProduct=descripcionProduct,
            mainColorId=mainColorId,
            clearMainColor=clearMainColor,
            technicalSpecProduct=technicalSpecProduct,
            mainImageId=mainImageId,
        )
