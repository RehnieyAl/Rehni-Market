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


class ProductSpecificationResponse(BaseModel):
    id: UUID
    specification_template_id: UUID
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
    stock: int
    has_variants: bool
    descripcion: str
    is_active: bool
    created_at: datetime
    # None = nunca eliminado (activo o solo desactivado con el toggle,
    # ver ModelProduct.py > Product.deleted_at). Con fecha = eliminado
    # por la empresa - así el dashboard puede distinguir "Inactivo" de
    # "Eliminado" en vez de tratarlos como el mismo estado.
    deleted_at: datetime | None = None

    catalog_id: UUID
    catalog_name: str

    # Color principal del producto (independiente del color de cada
    # variante). Puede no tener ninguno asignado.
    main_color_id: UUID | None
    main_color: ProductColorResponse | None

    images: list[ProductImageResponse]
    specifications: list[ProductSpecificationResponse]


class UpdateProductRequest(BaseModel):
    """
    PATCH parcial: todos los campos son opcionales. Un campo ausente
    (None) significa "no tocar" - no se pierde lo que ya existia.

    No incluye is_active (ya tiene su propio endpoint dedicado,
    change-status-my-product, para no duplicar el mismo campo por dos
    caminos distintos) ni has_variants (bandera interna, no la gestiona
    la empresa directamente).

    Las imagenes (imagesProduct / imagesToDeleted) viajan aparte, como
    parametros de archivo del router - no pueden ir dentro de un schema
    de Form.
    """

    nameProduct: str | None = Field(default=None, min_length=2, max_length=100)
    catalogId: str | None = None
    priceProduct: float | None = Field(default=None, ge=0)
    discountEnable: bool | None = None
    # Porcentaje de descuento (0-100), no un monto absoluto en pesos - ver
    # _compute_price_fields en app/services/publicService/Products.py.
    discountValue: float | None = Field(default=None, ge=0, le=100)
    stockProduct: int | None = Field(default=None, ge=0)
    descripcionProduct: str | None = Field(default=None, min_length=1)
    # mainColorId ausente -> no tocar el color principal.
    # mainColorId con un id -> asignar ese color.
    # clearMainColor=True -> quitar el color principal (dejarlo en null).
    # (Un mainColorId="" NO sirve para "limpiar": FastAPI resuelve un
    # campo Form vacio como si no se hubiera enviado para tipos
    # Optional[str], asi que necesita su propia bandera explicita.)
    mainColorId: str | None = None
    clearMainColor: bool = False
    # Mismo formato que en creacion: string JSON con
    # [{specificationTemplateId, value}, ...]
    technicalSpecProduct: str | None = None
    # Id de una imagen YA EXISTENTE del producto que debe pasar a ser la
    # principal (is_main=True), sin necesidad de borrarla y volver a
    # subirla. Ausente -> no tocar cual imagen es la principal (salvo el
    # ajuste automatico si la que era principal se elimino).
    mainImageId: str | None = None

    @classmethod
    def as_form(
        cls,
        nameProduct: Annotated[str | None, Form()] = None,
        catalogId: Annotated[str | None, Form()] = None,
        priceProduct: Annotated[float | None, Form()] = None,
        discountEnable: Annotated[bool | None, Form()] = None,
        discountValue: Annotated[float | None, Form()] = None,
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
            stockProduct=stockProduct,
            descripcionProduct=descripcionProduct,
            mainColorId=mainColorId,
            clearMainColor=clearMainColor,
            technicalSpecProduct=technicalSpecProduct,
            mainImageId=mainImageId,
        )
