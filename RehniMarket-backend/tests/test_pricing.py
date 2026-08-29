from datetime import datetime, timedelta
from decimal import Decimal
from types import SimpleNamespace

from app.services.pricing import resolve_price


def _entity(**kwargs):
    base = {
        "price": Decimal("100"),
        "discount_enable": False,
        "discount_value": Decimal("0"),
        "discount_type": None,
        "discount_starts_at": None,
        "discount_ends_at": None,
    }
    base.update(kwargs)
    return SimpleNamespace(**base)


def test_no_discount_uses_base_price():
    product = _entity()
    variant = _entity(price=Decimal("120"))

    result = resolve_price(product, variant)

    assert result.final_price == Decimal("120")
    assert result.discount_enabled is False
    assert result.source is None


def test_variant_discount_wins_over_product_discount():
    product = _entity(discount_enable=True, discount_value=Decimal("50"))
    variant = _entity(
        price=Decimal("200"), discount_enable=True, discount_value=Decimal("10")
    )

    result = resolve_price(product, variant)

    assert result.source == "variant"
    assert result.final_price == Decimal("180")


def test_falls_back_to_product_discount_when_variant_has_none():
    product = _entity(discount_enable=True, discount_value=Decimal("25"))
    variant = _entity(price=Decimal("200"))

    result = resolve_price(product, variant)

    assert result.source == "product"
    assert result.final_price == Decimal("150")


def test_fixed_discount_type():
    product = _entity()
    variant = _entity(
        price=Decimal("200"),
        discount_enable=True,
        discount_value=Decimal("30"),
        discount_type="fixed",
    )

    result = resolve_price(product, variant)

    assert result.final_price == Decimal("170")


def test_expired_variant_discount_falls_back_to_product():
    now = datetime(2026, 6, 1)
    product = _entity(discount_enable=True, discount_value=Decimal("20"))
    variant = _entity(
        price=Decimal("100"),
        discount_enable=True,
        discount_value=Decimal("50"),
        discount_ends_at=now - timedelta(days=1),
    )

    result = resolve_price(product, variant, now=now)

    assert result.source == "product"
    assert result.final_price == Decimal("80")


def test_future_discount_is_not_active():
    now = datetime(2026, 6, 1)
    product = _entity()
    variant = _entity(
        price=Decimal("100"),
        discount_enable=True,
        discount_value=Decimal("50"),
        discount_starts_at=now + timedelta(days=2),
    )

    result = resolve_price(product, variant, now=now)

    assert result.discount_enabled is False
    assert result.final_price == Decimal("100")


def test_product_only_pricing_without_variant():
    product = _entity(discount_enable=True, discount_value=Decimal("10"))

    result = resolve_price(product)

    assert result.source == "product"
    assert result.final_price == Decimal("90")
