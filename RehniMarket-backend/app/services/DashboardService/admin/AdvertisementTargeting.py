"""Traduce `target_type` + su configuración en la URL del frontend a la que apunta
el botón del anuncio, usando solo rutas/parámetros que ProductsList.tsx ya entiende.
PROMOTION/BLACK_FRIDAY/CYBER_DAYS son la misma rama (filtro minDiscount). No toca la BD."""

from uuid import UUID

from app.models.ModelAdvertisement import AdvertisementTargetType


# Tipos que comparten el mecanismo de umbral mínimo de descuento.
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
        return f"/products?catalog={target_catalog_id}" if target_catalog_id else None

    if target_type == AdvertisementTargetType.COMPANY:
        return f"/company/{target_company_id}" if target_company_id else None

    if target_type in _DISCOUNT_THRESHOLD_TYPES:
        # Filtro por discount_value >= minimum_discount.
        return f"/products?minDiscount={minimum_discount}" if minimum_discount else None

    if target_type == AdvertisementTargetType.LIQUIDATION:
        # minimum_discount y/o maximum_stock.
        params = []

        if minimum_discount:
            params.append(f"minDiscount={minimum_discount}")

        if maximum_stock is not None:
            params.append(f"maxStock={maximum_stock}")

        return f"/products?{'&'.join(params)}" if params else None

    if target_type == AdvertisementTargetType.NEW_RELEASE:
        return f"/products?days={max_age_days}" if max_age_days else None

    return None
