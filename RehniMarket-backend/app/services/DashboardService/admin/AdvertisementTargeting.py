"""Traduce `target_type` + su configuración en la URL del frontend a la que apunta
el botón del anuncio, usando solo rutas/parámetros que ProductsList.tsx ya entiende.
PROMOTION/BLACK_FRIDAY/CYBER_DAYS son la misma rama (filtro minDiscount). CATEGORY
usa `catalog` y, si el anuncio lleva descuento configurado, además `minDiscount`
(mismo filtro reutilizado, no aplica un precio nuevo). No toca la BD."""

from uuid import UUID

from app.models.ModelAdvertisement import AdvertisementTargetType


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
    """URL calculada, o None si target_type es None o falta la configuración mínima para ese tipo."""

    if target_type is None:
        return None

    if target_type == AdvertisementTargetType.PRODUCT:
        return f"/products/{target_product_id}" if target_product_id else None

    if target_type == AdvertisementTargetType.CATEGORY:
        if not target_catalog_id:
            return None

        params = [f"catalog={target_catalog_id}"]

        # El descuento configurado en el anuncio de categoría se transporta como
        # el mismo filtro `minDiscount` que usan los anuncios de promoción: al
        # abrir la categoría el catálogo muestra sus productos con descuento
        # vigente >= ese %, con su precio promocional real (pricing.resolve_price).
        if minimum_discount:
            params.append(f"minDiscount={minimum_discount}")

        return f"/products?{'&'.join(params)}"

    if target_type == AdvertisementTargetType.COMPANY:
        return f"/company/{target_company_id}" if target_company_id else None

    if target_type in _DISCOUNT_THRESHOLD_TYPES:
        return f"/products?minDiscount={minimum_discount}" if minimum_discount else None

    if target_type == AdvertisementTargetType.LIQUIDATION:
        params = []

        if minimum_discount:
            params.append(f"minDiscount={minimum_discount}")

        if maximum_stock is not None:
            params.append(f"maxStock={maximum_stock}")

        return f"/products?{'&'.join(params)}" if params else None

    if target_type == AdvertisementTargetType.NEW_RELEASE:
        return f"/products?days={max_age_days}" if max_age_days else None

    return None
