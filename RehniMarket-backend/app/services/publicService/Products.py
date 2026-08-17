from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import and_, case, func, or_
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelCatalog import Catalog, SpecificationTemplate
from app.models.ModelColor import ColorVariant
from app.models.ModelProduct import Product
from app.models.ModelVariant import ProductVariant

from app.schemas.SchemaPublic import (
    PublicProductCardResponse,
    PublicProductDetailResponse,
    PublicProductImageResponse,
    PublicProductSpecificationResponse,
    PublicProductColorResponse,
    PublicProductVariantResponse,
    PublicProductsPaginatedResponse,
)

from app.services.NasService import build_media_url


def get_catalogs_service(database: Session):
    """
    Categorías públicas (ver ALCANCE > Módulo completo de Categorías):
    - Solo `is_active=True` (una categoría desactivada no debe aparecer
      en el storefront, aunque siga existiendo para sus productos).
    - Ordenadas por `display_order ASC` (no alfabético).
    - `image_url` es la imagen real subida por admin/owner (ver
      ModelCatalog.py > Catalog.image_url) - ya no se calcula a partir
      de un producto representativo (ese hack se elimina: ahora sí
      existe una imagen propia de la categoría).
    - `product_count`: un ÚNICO query agregado (GROUP BY) para TODOS los
      catálogos a la vez (antes: 2 queries POR catálogo en un loop, ver
      ALCANCE > Rendimiento/N+1). Cuenta solo productos activos, visibles
      y con stock válido (mismo criterio que _has_visible_stock, ver
      abajo - una sola fuente de verdad de esa regla).
    """

    catalogs = (
        database.query(Catalog)
        .filter(Catalog.is_active.is_(True))
        .order_by(Catalog.display_order.asc(), Catalog.name.asc())
        .all()
    )

    counts = dict(
        database.query(Product.catalog_id, func.count(Product.id))
        .filter(Product.is_active.is_(True), _has_visible_stock())
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
        catalog_id=product.catalog_id,
        catalog_name=product.catalog.name,
        price=product.price,
        discount_enabled=discount_enabled,
        discount_percentage=discount_percentage,
        final_price=final_price,
        stock=product.stock,
    )


def _has_visible_stock():
    """
    Condicion de visibilidad por stock (ver ALCANCE > Reglas de negocio de
    visibilidad de productos/variantes):

    - Producto SIN variantes (has_variants=False): visible solo si
      Product.stock > 0.
    - Producto CON variantes (has_variants=True): visible si existe AL
      MENOS UNA variante con stock > 0 - Product.stock no es el campo
      relevante en ese caso (cada variante tiene su propio stock, ver
      ModelVariant.py). Antes el filtro usaba Product.stock sin importar
      has_variants, lo que podia ocultar productos con variantes
      disponibles o mostrar productos con todas las variantes agotadas.

    Se usa tanto en el listado publico (get_daily_products_service) como,
    a futuro, en cualquier otro endpoint de listado publico que se agregue
    - es la UNICA fuente de verdad de esta regla, para no duplicarla.
    """

    return or_(
        and_(Product.has_variants.is_(False), Product.stock > 0),
        and_(
            Product.has_variants.is_(True),
            Product.variants.any(ProductVariant.stock > 0),
        ),
    )


def get_daily_products_service(database: Session, limit: int = 8) -> list[PublicProductCardResponse]:
    """
    "Productos del dia" (ver Home publico) - MISMO endpoint que reutilizan
    catalogo publico, destacados/recomendados, recientes y la busqueda del
    navbar (no existe otro endpoint publico de "varios productos" - ver
    ALCANCE > CONSISTENCIA GLOBAL), asi que esta unica funcion determina
    la visibilidad para todos esos lugares a la vez.

    No existe todavia un concepto de producto destacado/featured en el
    modelo actual (revisado Product/ModelProduct.py) - se implementa con
    la regla mas simple y coherente con lo que ya existe: productos
    activos, visibles por stock (ver _has_visible_stock), los mas
    recientes primero.
    """

    products = (
        database.query(Product)
        .filter(Product.is_active.is_(True), _has_visible_stock())
        .order_by(Product.created_at.desc())
        .limit(limit)
        .all()
    )

    return [_to_card_response(product) for product in products]


# Valores validos de `sort` para list_public_products_service (ver
# ALCANCE > catalogo publico > Ordenamiento). Cualquier otro valor (o
# ninguno) cae en "relevance" - no se rompe la busqueda por un sort
# invalido en la URL.
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
    """
    Catalogo publico completo con filtros reales (ver ALCANCE > pagina
    Categorias + filtros de catalogo: Categoria, Precio, Descuento,
    Disponibilidad, Ordenamiento). Unico listado publico de productos con
    paginacion - antes solo existia /products/daily (limite fijo de 24,
    sin filtros, ver get_daily_products_service), que el frontend usaba
    como sustituto temporal (ver TODO en ProductsList.tsx / navbar.tsx,
    ya resueltos por este endpoint).

    Por defecto (sin filtro de disponibilidad) se incluyen productos
    agotados - "Disponibilidad" es un filtro real, no algo ya aplicado de
    entrada (a diferencia de get_daily_products_service, que si oculta
    agotados porque ahi no hay forma de pedirlos de vuelta).

    El precio (min_price/max_price) y el orden por precio se evaluan
    sobre el PRECIO FINAL (con descuento aplicado, ver
    _compute_price_fields) via una expresion SQL equivalente - no sobre
    el precio base -, para que coincida con lo que la tarjeta le muestra
    al comprador.

    min_discount/max_stock/days: filtros agregados para que los anuncios
    dinamicos por reglas (PROMOTION/BLACK_FRIDAY/CYBER_DAYS/LIQUIDATION/
    NEW_RELEASE, ver AdvertisementTargeting.py) resuelvan a resultados
    reales via SQL - ninguno carga productos de mas para despues filtrar
    en memoria/frontend (ver ALCANCE > Rendimiento).
    """

    final_price_expr = case(
        (
            and_(Product.discount_enable.is_(True), Product.discount_value > 0),
            Product.price - (Product.price * Product.discount_value / 100),
        ),
        else_=Product.price,
    )

    query = database.query(Product).filter(Product.is_active.is_(True))

    if search:
        query = query.filter(Product.name.ilike(f"%{search.strip()}%"))

    if catalog_id:
        query = query.filter(Product.catalog_id == catalog_id)

    if min_price is not None:
        query = query.filter(final_price_expr >= min_price)

    if max_price is not None:
        query = query.filter(final_price_expr <= max_price)

    if discount:
        query = query.filter(Product.discount_enable.is_(True), Product.discount_value > 0)

    if in_stock:
        query = query.filter(_has_visible_stock())

    if min_discount is not None:
        # >=, no solo "tiene algun descuento" (eso ya lo cubre `discount`
        # arriba) - mismo campo que ya usa _compute_price_fields.
        query = query.filter(
            Product.discount_enable.is_(True), Product.discount_value >= min_discount
        )

    if max_stock is not None:
        # LIQUIDACION (ver ALCANCE): Product.stock, no el stock de
        # variantes - mismo campo que ya usa _has_visible_stock para
        # productos sin variantes. Un producto con variantes puede tener
        # Product.stock en 0 aunque tenga variantes con stock (ver
        # ModelProduct.py) - se documenta la limitacion, no se resuelve
        # aca para no complicar el filtro con una regla que el propio
        # modelo de datos no expone de forma agregada.
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
        products=[_to_card_response(product) for product in products],
    )


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

    # CompanyLogo se guarda como object_name (sin el bucket "uploads/"
    # incluido) - mismo patron que company_dashboard_me_service (ver
    # app/services/DashboardService/company/Dashboard.py).
    company_logo = (
        build_media_url(f"uploads/{product.company.CompanyLogo}")
        if product.company.CompanyLogo
        else None
    )

    return PublicProductDetailResponse(
        id=product.id,
        name=product.name,
        descripcion=product.descripcion,
        catalog_name=product.catalog.name,
        company_name=product.company.nameCompany,
        company_id=product.company.id,
        company_logo=company_logo,
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
