from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import and_, case, func, or_
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelCatalog import Catalog, SpecificationTemplate
from app.models.ModelCatalogAttribute import CatalogAttribute
from app.models.ModelColor import ColorVariant
from app.models.ModelCompany import Company, CompanyCertificateEnum
from app.models.ModelProduct import Product
from app.models.ModelVariant import ProductVariant

from app.repository.ReviewRepository import get_product_rating_summary, get_products_rating_summary

from app.schemas.SchemaPublic import (
    PublicAttributePairResponse,
    PublicCatalogAttributesResponse,
    PublicProductCardResponse,
    PublicProductDetailResponse,
    PublicProductImageResponse,
    PublicProductSpecificationResponse,
    PublicProductColorResponse,
    PublicProductVariantResponse,
    PublicProductsPaginatedResponse,
    PublicRatingDistributionResponse,
    PublicVariantOptionResponse,
)

from app.services.NasService import build_media_url
from app.services.pricing import resolve_price, resolve_product_card_price
from app.services.variants import attributes as attrs
from app.services.variants.images import product_display_image_url

# "Novedades": ventana de antigüedad para considerar un producto como nuevo.
NEW_PRODUCT_WINDOW_DAYS = 30


def get_catalogs_service(database: Session):
    """Categorías públicas: solo is_active, ordenadas por display_order ASC.
    `product_count` es un único query agregado con el mismo criterio de visibilidad
    que _is_publicly_visible/_has_visible_stock."""

    catalogs = (
        database.query(Catalog)
        .filter(Catalog.is_active.is_(True))
        .order_by(Catalog.display_order.asc(), Catalog.name.asc())
        .all()
    )

    counts = dict(
        database.query(Product.catalog_id, func.count(Product.id))
        .join(Product.company)
        .filter(_is_publicly_visible(), _has_visible_stock())
        .group_by(Product.catalog_id)
        .all()
    )

    return [
        {
            "id": catalog.id,
            "name": catalog.name,
            "product_count": counts.get(catalog.id, 0),
            "image_url": build_media_url(catalog.image_url) if catalog.image_url else None,
        }
        for catalog in catalogs
    ]


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


def _to_card_response(
    product: Product, rating_summary: tuple[float | None, int] = (None, 0)
) -> PublicProductCardResponse:
    # Precio de la tarjeta = variante viva más barata por precio final efectivo
    # (incluye descuentos propios de variante). Ver pricing.resolve_product_card_price.
    price = resolve_product_card_price(product)

    average_rating, review_count = rating_summary

    return PublicProductCardResponse(
        id=product.id,
        name=product.name,
        # Imagen inicial = primera variante viva con imágenes (ver services/variants/images.py).
        image=product_display_image_url(product),
        company_name=product.company.nameCompany,
        catalog_id=product.catalog_id,
        catalog_name=product.catalog.name,
        price=price.base_price,
        discount_enabled=price.discount_enabled,
        discount_percentage=price.discount_percentage,
        final_price=price.final_price,
        stock=product.stock,
        average_rating=average_rating,
        review_count=review_count,
    )


def _to_card_responses(database: Session, products: list[Product]) -> list[PublicProductCardResponse]:
    """Arma tarjetas con un solo query agregado de calificaciones (no uno por producto)."""

    ratings = get_products_rating_summary(database, [product.id for product in products])

    return [
        _to_card_response(product, ratings.get(product.id, (None, 0))) for product in products
    ]


def _has_visible_stock():
    """Visibilidad por stock: sin variantes, Product.stock > 0; con variantes,
    al menos una variante con stock > 0."""

    return or_(
        and_(Product.has_variants.is_(False), Product.stock > 0),
        and_(
            Product.has_variants.is_(True),
            Product.variants.any(
                and_(ProductVariant.stock > 0, ProductVariant.deleted_at.is_(None))
            ),
        ),
    )


def _is_publicly_visible():
    """Visibilidad pública: producto activo, no eliminado y de empresa no suspendida
    (CompanyStatus se lee en vivo). Requiere además `.join(Product.company)` en la consulta."""

    return and_(
        Product.is_active.is_(True),
        Product.deleted_at.is_(None),
        Company.CompanyStatus.is_(True),
    )


def _discount_window_open(entity_start, entity_end, now):
    """La ventana de descuento está vigente: sin fecha = siempre; con fecha = dentro del rango."""

    return and_(
        or_(entity_start.is_(None), entity_start <= now),
        or_(entity_end.is_(None), entity_end >= now),
    )


def _variant_offer_active():
    """Variante viva, con stock y con un descuento propio vigente (> 0)."""

    now = datetime.utcnow()
    return and_(
        ProductVariant.deleted_at.is_(None),
        ProductVariant.stock > 0,
        ProductVariant.discount_enable.is_(True),
        ProductVariant.discount_value > 0,
        _discount_window_open(
            ProductVariant.discount_starts_at, ProductVariant.discount_ends_at, now
        ),
    )


def _has_active_offer():
    """Un producto está "en oferta" si:
      - alguna variante viva con stock tiene descuento propio vigente, o
      - el producto padre tiene descuento vigente y existe al menos una variante
        viva con stock a la que aplicárselo (fallback variante→producto).
    Descuentos de variante eliminada o sin stock no cuentan."""

    now = datetime.utcnow()
    product_discount_active = and_(
        Product.discount_enable.is_(True),
        Product.discount_value > 0,
        _discount_window_open(
            Product.discount_starts_at, Product.discount_ends_at, now
        ),
    )
    live_in_stock_variant = and_(
        ProductVariant.deleted_at.is_(None), ProductVariant.stock > 0
    )

    return or_(
        Product.variants.any(_variant_offer_active()),
        and_(product_discount_active, Product.variants.any(live_in_stock_variant)),
    )


def list_public_offers_service(
    database: Session, page: int = 1, limit: int = 24
) -> PublicProductsPaginatedResponse:
    """Productos realmente en oferta (ver _has_active_offer): descuento vigente en
    al menos una variante viva con stock, o descuento del producto padre aplicable.
    Más recientes primero. Misma tarjeta y misma imagen inicial que el resto del sitio."""

    query = (
        database.query(Product)
        .join(Product.company)
        .filter(_is_publicly_visible(), _has_visible_stock(), _has_active_offer())
        .order_by(Product.created_at.desc())
    )

    total = query.count()
    products = query.offset((page - 1) * limit).limit(limit).all()

    return PublicProductsPaginatedResponse(
        page=page,
        limit=limit,
        total=total,
        total_pages=(total + limit - 1) // limit if total else 0,
        products=_to_card_responses(database, products),
    )


def list_public_new_products_service(
    database: Session, page: int = 1, limit: int = 24
) -> PublicProductsPaginatedResponse:
    """"Novedades": productos publicados en los últimos NEW_PRODUCT_WINDOW_DAYS días
    (Product.created_at), visibles y con stock, ordenados de más reciente a más antiguo.
    Cada producto aparece una sola vez (una fila por Product, no por variante)."""

    cutoff = datetime.utcnow() - timedelta(days=NEW_PRODUCT_WINDOW_DAYS)

    query = (
        database.query(Product)
        .join(Product.company)
        .filter(
            _is_publicly_visible(),
            _has_visible_stock(),
            Product.created_at >= cutoff,
        )
        .order_by(Product.created_at.desc())
    )

    total = query.count()
    products = query.offset((page - 1) * limit).limit(limit).all()

    return PublicProductsPaginatedResponse(
        page=page,
        limit=limit,
        total=total,
        total_pages=(total + limit - 1) // limit if total else 0,
        products=_to_card_responses(database, products),
    )


def get_daily_products_service(database: Session, limit: int = 8) -> list[PublicProductCardResponse]:
    """"Productos del día": productos visibles por stock, los más recientes primero.
    No hay concepto de "featured" en el modelo."""

    products = (
        database.query(Product)
        .join(Product.company)
        .filter(_is_publicly_visible(), _has_visible_stock())
        .order_by(Product.created_at.desc())
        .limit(limit)
        .all()
    )

    return _to_card_responses(database, products)


# Valores válidos de `sort`; cualquier otro cae en "relevance".
SORT_PRICE_ASC = "price_asc"
SORT_PRICE_DESC = "price_desc"
SORT_DISCOUNT = "discount"
SORT_RELEVANCE = "relevance"


def list_public_products_service(
    database: Session,
    search: str | None = None,
    catalog_id: UUID | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    discount: bool | None = None,
    in_stock: bool | None = None,
    min_discount: int | None = None,
    max_stock: int | None = None,
    days: int | None = None,
    sort: str | None = None,
    page: int = 1,
    limit: int = 24,
) -> PublicProductsPaginatedResponse:
    """Catálogo público con filtros (categoría, precio, descuento, disponibilidad, orden).
    Por defecto incluye agotados; "Disponibilidad" es un filtro real. El precio y el orden
    por precio se evalúan sobre el precio final vía SQL. min_discount/max_stock/days
    alimentan los anuncios dinámicos por reglas, todo resuelto en SQL."""

    final_price_expr = case(
        (
            and_(Product.discount_enable.is_(True), Product.discount_value > 0),
            Product.price - (Product.price * Product.discount_value / 100),
        ),
        else_=Product.price,
    )

    query = database.query(Product).join(Product.company).filter(_is_publicly_visible())

    if search:
        query = query.filter(Product.name.ilike(f"%{search.strip()}%"))

    if catalog_id:
        query = query.filter(Product.catalog_id == catalog_id)

    if min_price is not None:
        query = query.filter(final_price_expr >= min_price)

    if max_price is not None:
        query = query.filter(final_price_expr <= max_price)

    if discount:
        # "Solo con descuento": misma definición que /public/products/offers
        # (descuento vigente en una variante viva con stock, o del producto padre).
        query = query.filter(_has_active_offer())

    if in_stock:
        query = query.filter(_has_visible_stock())

    if min_discount is not None:
        query = query.filter(
            Product.discount_enable.is_(True), Product.discount_value >= min_discount
        )

    if max_stock is not None:
        # LIQUIDACIÓN: usa Product.stock, no el stock de variantes (limitación conocida).
        query = query.filter(Product.stock <= max_stock)

    if days is not None:
        cutoff = datetime.utcnow() - timedelta(days=days)
        query = query.filter(Product.created_at >= cutoff)

    if sort == SORT_PRICE_ASC:
        query = query.order_by(final_price_expr.asc())
    elif sort == SORT_PRICE_DESC:
        query = query.order_by(final_price_expr.desc())
    elif sort == SORT_DISCOUNT:
        query = query.order_by(Product.discount_value.desc(), Product.created_at.desc())
    else:
        query = query.order_by(Product.created_at.desc())

    total = query.count()
    offset = (page - 1) * limit
    products = query.offset(offset).limit(limit).all()

    return PublicProductsPaginatedResponse(
        page=page,
        limit=limit,
        total=total,
        total_pages=(total + limit - 1) // limit if total else 0,
        products=_to_card_responses(database, products),
    )


def _to_color_response(color) -> PublicProductColorResponse | None:
    if not color:
        return None

    return PublicProductColorResponse(name=color.name, hex_color=color.hex_color)


def _to_image_responses(images) -> list[PublicProductImageResponse]:
    # La imagen principal va primero: la galería la usa como imagen activa por defecto.
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


def _to_variant_option_responses(variant) -> list[PublicVariantOptionResponse]:
    return [
        PublicVariantOptionResponse(
            attribute=link.attribute.name,
            value=link.option.value,
            hex_color=link.option.hex_color,
        )
        for link in sorted(
            variant.options,
            key=lambda link: (link.attribute.position, link.attribute.name),
        )
    ]


def _to_public_variant_response(product, variant) -> PublicProductVariantResponse:
    price = resolve_price(product, variant)

    return PublicProductVariantResponse(
        id=variant.id,
        name=variant.name,
        sku=variant.sku,
        price=variant.price,
        discount_enabled=price.discount_enabled,
        discount_percentage=price.discount_percentage,
        final_price=price.final_price,
        stock=variant.stock,
        options=_to_variant_option_responses(variant),
        color=_to_color_response(variant.color),
        images=_to_image_responses(variant.images),
        specifications=_to_specification_responses(variant.specifications),
    )


def get_public_product_detail_service(database: Session, product_id: UUID) -> PublicProductDetailResponse:

    product = (
        database.query(Product)
        .join(Product.company)
        .filter(Product.id == product_id, _is_publicly_visible())
        .first()
    )

    if not product:
        api_error(404, ErrorCodes.PRODUCT_NOT_FOUND, "Producto no encontrado")

    # Precio "Desde" (antes de elegir variante) = misma variante más barata que la
    # tarjeta del catálogo, para que card y detalle muestren lo mismo.
    card_price = resolve_product_card_price(product)

    variants = [
        _to_public_variant_response(product, variant)
        for variant in product.variants
        if variant.deleted_at is None
    ]

    # CompanyLogo se guarda como object_name.
    company_logo = (
        build_media_url(f"uploads/{product.company.CompanyLogo}")
        if product.company.CompanyLogo
        else None
    )

    # Un solo query agrupado por rating; el promedio se deriva de ahí.
    rating_counts = get_product_rating_summary(database, product.id)
    review_count = sum(rating_counts.values())
    average_rating = (
        sum(rating * count for rating, count in rating_counts.items()) / review_count
        if review_count
        else None
    )

    return PublicProductDetailResponse(
        id=product.id,
        name=product.name,
        descripcion=product.descripcion,
        catalog_name=product.catalog.name,
        catalog_id=product.catalog.id,
        company_name=product.company.nameCompany,
        company_id=product.company.id,
        company_logo=company_logo,
        company_is_verified=(
            product.company.CompanyCertificateStatus == CompanyCertificateEnum.APPROVED
        ),
        is_active=product.is_active,
        price=card_price.base_price,
        discount_enabled=card_price.discount_enabled,
        discount_percentage=card_price.discount_percentage,
        final_price=card_price.final_price,
        stock=product.stock,
        average_rating=average_rating,
        review_count=review_count,
        rating_distribution=PublicRatingDistributionResponse(
            five=rating_counts.get(5, 0),
            four=rating_counts.get(4, 0),
            three=rating_counts.get(3, 0),
            two=rating_counts.get(2, 0),
            one=rating_counts.get(1, 0),
        ),
        color=_to_color_response(product.main_color),
        images=_to_image_responses(product.images),
        attributes=[
            PublicAttributePairResponse(attribute=pair["attribute"], value=pair["value"])
            for pair in attrs.product_attribute_pairs(product)
        ],
        specifications=_to_specification_responses(product.specifications),
        variants=variants,
    )


def get_catalog_attributes_public_service(database: Session, catalog_id: UUID):
    catalog = database.get(Catalog, catalog_id)

    if not catalog:
        api_error(404, ErrorCodes.CATALOG_NOT_FOUND, "Catálogo no encontrado")

    attributes = (
        database.query(CatalogAttribute)
        .filter(
            CatalogAttribute.catalog_id == catalog_id,
            CatalogAttribute.is_active.is_(True),
        )
        .order_by(CatalogAttribute.position.asc(), CatalogAttribute.name.asc())
        .all()
    )

    return PublicCatalogAttributesResponse(
        product_attributes=[a for a in attributes if a.role == "product"],
        variant_attributes=[a for a in attributes if a.role == "variant"],
    )
