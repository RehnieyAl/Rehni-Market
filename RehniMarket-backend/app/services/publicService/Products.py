from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelCatalog import Catalog, SpecificationTemplate
from app.models.ModelColor import ColorVariant
from app.models.ModelProduct import Product

from app.schemas.SchemaPublic import (
    PublicProductCardResponse,
    PublicProductDetailResponse,
    PublicProductImageResponse,
    PublicProductSpecificationResponse,
    PublicProductColorResponse,
    PublicProductVariantResponse,
)

from app.services.NasService import build_media_url


def get_catalogs_service(database: Session):
    catalogs = (database.query(Catalog).order_by(Catalog.name.asc()).all())

    return [{"id": str(catalog.id),"name": catalog.name,}for catalog in catalogs]


def get_colors_service(database: Session):
    colors = (database.query(ColorVariant).order_by(ColorVariant.name.asc()).all())

    return colors


def get_specifications_by_catalog_service(catalog_id: UUID,database: Session,):

    return (
        database.query(SpecificationTemplate)
        .filter(
            SpecificationTemplate.catalog_id == catalog_id
        )
        .order_by(SpecificationTemplate.name.asc())
        .all()
    )


# ==========================
# PRODUCTOS PÚBLICOS
# ==========================

def _compute_price_fields(entity):
    """
    Unica fuente de verdad del precio final y el porcentaje de descuento -
    el frontend nunca recalcula esto (ver Home > "Productos del dia").

    Generica a proposito: funciona tanto para un Product como para un
    ProductVariant, porque ambos modelos exponen los mismos tres atributos
    (price, discount_enable, discount_value) con el mismo significado -
    cada variante tiene su propio descuento, independiente del descuento
    del producto base (ver ModelVariant.py).

    discount_value es un PORCENTAJE (0-100), no un monto absoluto en pesos
    (validado con ge=0/le=100 en discountValue - ver SchemaProduct.py /
    SchemaVariant.py). El formulario de la empresa lo etiqueta "Porcentaje
    de descuento (%)" - ver ProductEdit.tsx / VariantModal.tsx.

    final_price = price - (price * discount_value / 100)
    """

    price = entity.price

    if not entity.discount_enable or not entity.discount_value or entity.discount_value <= 0:
        return price, None, False

    discount_percentage = int(round(entity.discount_value))

    final_price = price - (price * entity.discount_value / 100)

    if final_price < 0:
        final_price = Decimal("0")

    return final_price, discount_percentage, True


def _to_card_response(product: Product) -> PublicProductCardResponse:
    main_image = next((image for image in product.images if image.is_main), None)

    final_price, discount_percentage, discount_enabled = _compute_price_fields(product)

    return PublicProductCardResponse(
        id=product.id,
        name=product.name,
        image=build_media_url(main_image.url) if main_image else None,
        company_name=product.company.nameCompany,
        price=product.price,
        discount_enabled=discount_enabled,
        discount_percentage=discount_percentage,
        final_price=final_price,
    )


def get_daily_products_service(database: Session, limit: int = 8) -> list[PublicProductCardResponse]:
    """
    "Productos del dia" (ver Home publico). No existe todavia un concepto
    de producto destacado/featured en el modelo actual (revisado
    Product/ModelProduct.py) - se implementa con la regla mas simple y
    coherente con lo que ya existe: productos activos, con stock
    disponible, los mas recientes primero.
    """

    products = (
        database.query(Product)
        .filter(Product.is_active.is_(True), Product.stock > 0)
        .order_by(Product.created_at.desc())
        .limit(limit)
        .all()
    )

    return [_to_card_response(product) for product in products]


def _to_color_response(color) -> PublicProductColorResponse | None:
    if not color:
        return None

    return PublicProductColorResponse(name=color.name, hex_color=color.hex_color)


def _to_image_responses(images) -> list[PublicProductImageResponse]:
    # La imagen principal (is_main) va primero - la galeria publica la usa
    # como imagen activa por defecto (ver ProductGallery.tsx).
    ordered = sorted(images, key=lambda image: not image.is_main)

    return [
        PublicProductImageResponse(id=image.id, url=build_media_url(image.url), is_main=image.is_main)
        for image in ordered
    ]


def _to_specification_responses(specifications) -> list[PublicProductSpecificationResponse]:
    return [
        PublicProductSpecificationResponse(
            name=specification.template.name,
            value=specification.value,
        )
        for specification in specifications
    ]


def _to_public_variant_response(variant) -> PublicProductVariantResponse:
    final_price, discount_percentage, discount_enabled = _compute_price_fields(variant)

    return PublicProductVariantResponse(
        id=variant.id,
        name=variant.name,
        price=variant.price,
        discount_enabled=discount_enabled,
        discount_percentage=discount_percentage,
        final_price=final_price,
        stock=variant.stock,
        color=_to_color_response(variant.color),
        images=_to_image_responses(variant.images),
        specifications=_to_specification_responses(variant.specifications),
    )


def get_public_product_detail_service(database: Session, product_id: UUID) -> PublicProductDetailResponse:

    product = (
        database.query(Product)
        .filter(Product.id == product_id, Product.is_active.is_(True))
        .first()
    )

    if not product:
        api_error(404, ErrorCodes.PRODUCT_NOT_FOUND, "Producto no encontrado")

    final_price, discount_percentage, discount_enabled = _compute_price_fields(product)

    variants = [_to_public_variant_response(variant) for variant in product.variants]

    return PublicProductDetailResponse(
        id=product.id,
        name=product.name,
        descripcion=product.descripcion,
        catalog_name=product.catalog.name,
        company_name=product.company.nameCompany,
        is_active=product.is_active,
        price=product.price,
        discount_enabled=discount_enabled,
        discount_percentage=discount_percentage,
        final_price=final_price,
        stock=product.stock,
        color=_to_color_response(product.main_color),
        images=_to_image_responses(product.images),
        specifications=_to_specification_responses(product.specifications),
        variants=variants,
    )
