from dataclasses import dataclass
from datetime import datetime
from decimal import ROUND_HALF_UP, Decimal

_CENTS = Decimal("0.01")

DISCOUNT_PERCENT = "percent"
DISCOUNT_FIXED = "fixed"
DISCOUNT_TYPES = (DISCOUNT_PERCENT, DISCOUNT_FIXED)


@dataclass
class PriceResult:
    base_price: Decimal
    final_price: Decimal
    discount_enabled: bool
    discount_percentage: int | None
    source: str | None


def _as_decimal(value) -> Decimal:
    amount = value if isinstance(value, Decimal) else Decimal(str(value or 0))
    return amount.quantize(_CENTS, rounding=ROUND_HALF_UP)


def discount_is_active(entity, now: datetime) -> bool:
    if not getattr(entity, "discount_enable", False):
        return False

    value = _as_decimal(getattr(entity, "discount_value", 0))
    if value <= 0:
        return False

    starts_at = getattr(entity, "discount_starts_at", None)
    ends_at = getattr(entity, "discount_ends_at", None)

    if starts_at is not None and now < starts_at:
        return False

    if ends_at is not None and now > ends_at:
        return False

    return True


def _apply_discount(base_price: Decimal, entity) -> tuple[Decimal, int]:
    discount_type = getattr(entity, "discount_type", None) or DISCOUNT_PERCENT
    value = _as_decimal(getattr(entity, "discount_value", 0))

    if discount_type == DISCOUNT_FIXED:
        final_price = base_price - value
    else:
        final_price = base_price - (base_price * value / 100)

    if final_price < 0:
        final_price = Decimal("0")

    final_price = final_price.quantize(_CENTS, rounding=ROUND_HALF_UP)

    percentage = 0
    if base_price > 0:
        percentage = int(round((base_price - final_price) / base_price * 100))

    return final_price, percentage


def resolve_price(product, variant=None, *, now: datetime | None = None) -> PriceResult:
    """Descuento de variante vigente → descuento de producto vigente → precio base.
    El precio base es el de la variante cuando hay variante."""

    now = now or datetime.utcnow()
    base_price = _as_decimal(
        variant.price if variant is not None else product.price
    )

    if variant is not None and discount_is_active(variant, now):
        final_price, percentage = _apply_discount(base_price, variant)
        return PriceResult(base_price, final_price, True, percentage, "variant")

    if product is not None and discount_is_active(product, now):
        final_price, percentage = _apply_discount(base_price, product)
        return PriceResult(base_price, final_price, True, percentage, "product")

    return PriceResult(base_price, base_price, False, None, None)


def resolve_entity_price(entity, *, now: datetime | None = None) -> PriceResult:
    now = now or datetime.utcnow()
    base_price = _as_decimal(entity.price)

    if discount_is_active(entity, now):
        final_price, percentage = _apply_discount(base_price, entity)
        return PriceResult(base_price, final_price, True, percentage, None)

    return PriceResult(base_price, base_price, False, None, None)


def resolve_product_card_price(product, *, now: datetime | None = None) -> PriceResult:
    """Precio representativo de un producto para tarjetas/listados públicos.

    Toma la variante VIVA con el menor precio final efectivo (`resolve_price`
    variante→producto) y devuelve SU precio: es la misma variante "más barata"
    que espeja `_sync_product_pricing`, pero además expone su descuento efectivo
    —incluidos los descuentos propios de variante, que `resolve_entity_price`
    (solo nivel producto) no veía—. Sin variantes vivas (datos legacy) cae al
    precio del producto con su descuento propio.
    """

    now = now or datetime.utcnow()
    live = [
        variant
        for variant in getattr(product, "variants", [])
        if variant.deleted_at is None
    ]

    if not live:
        return resolve_entity_price(product, now=now)

    cheapest = min(
        live, key=lambda variant: resolve_price(product, variant, now=now).final_price
    )
    return resolve_price(product, cheapest, now=now)
