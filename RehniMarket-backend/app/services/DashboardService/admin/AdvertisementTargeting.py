"""
Motor de reglas de anuncios dinámicos (ver ALCANCE > Anuncios dinámicos
por reglas). Un único punto que traduce `target_type` + su configuración
en la URL real del frontend a la que debe apuntar el botón del anuncio -
usando exclusivamente rutas/parámetros que YA existen y ya entiende
ProductsList.tsx (catalog, discount, minDiscount, maxStock, days), nunca
un concepto de "campaign" inventado (eso hubiera duplicado la regla "qué
es Black Friday" en el backend Y en el frontend).

PROMOTION, BLACK_FRIDAY y CYBER_DAYS son literalmente la misma rama
(filtro minDiscount) - la única diferencia entre esos 3 tipos es la
etiqueta/título que se le sugiere al admin en el panel (ver
SchemaAdvertisement.py), no la lógica de destino.

No toca la base de datos: es pura construcción de string a partir de los
valores ya resueltos por AdvertisementService.py (que sí valida contra la
BD que target_product_id/target_catalog_id/target_company_id existan
antes de llegar acá).
"""

from uuid import UUID

from app.models.ModelAdvertisement import AdvertisementTargetType


# Tipos que comparten el mismo mecanismo (umbral mínimo de descuento) -
# ver docstring del módulo.
_DISCOUNT_THRESHOLD_TYPES = {
    AdvertisementTargetType.PROMOTION,
    AdvertisementTargetType.BLACK_FRIDAY,
    AdvertisementTargetType.CYBER_DAYS,
}


def resolve_advertisement_destination(
    target_type: AdvertisementTargetType | None,
    target_product_id: UUID | None,
    target_catalog_id: UUID | None,
    target_company_id: UUID | None,
    minimum_discount: int | None,
    maximum_stock: int | None,
    max_age_days: int | None,
) -> str | None:
    """
    Devuelve la URL calculada, o None si `target_type` es None (anuncio
    manual clásico - el caller conserva el `button_link` que el admin
    escribió, ver ALCANCE > compatibilidad con anuncios antiguos) o si
    falta la configuración mínima para ese tipo (ej. PRODUCT sin
    target_product_id todavía).
    """

    if target_type is None:
        return None

    if target_type == AdvertisementTargetType.PRODUCT:
        return f"/products/{target_product_id}" if target_product_id else None

    if target_type == AdvertisementTargetType.CATEGORY:
        return f"/products?catalog={target_catalog_id}" if target_catalog_id else None

    if target_type == AdvertisementTargetType.COMPANY:
        return f"/company/{target_company_id}" if target_company_id else None

    if target_type in _DISCOUNT_THRESHOLD_TYPES:
        # PROMOTION / BLACK_FRIDAY / CYBER_DAYS - mismo mecanismo real:
        # productos con discount_value >= minimum_discount (ver
        # publicService/Products.py > list_public_products_service >
        # min_discount).
        return f"/products?minDiscount={minimum_discount}" if minimum_discount else None

    if target_type == AdvertisementTargetType.LIQUIDATION:
        # Permite una regla, la otra, o ambas combinadas (ver ALCANCE >
        # LIQUIDACIÓN: "minimum_discount y/o maximum_stock").
        params = []

        if minimum_discount:
            params.append(f"minDiscount={minimum_discount}")

        if maximum_stock is not None:
            params.append(f"maxStock={maximum_stock}")

        return f"/products?{'&'.join(params)}" if params else None

    if target_type == AdvertisementTargetType.NEW_RELEASE:
        return f"/products?days={max_age_days}" if max_age_days else None

    return None
