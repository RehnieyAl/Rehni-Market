"""El catálogo público filtra, ordena y pagina por el mismo precio final que muestra la tarjeta.

Regresión: el orden y los filtros de precio usaban Product.price/discount del padre, mientras la
tarjeta muestra la variante viva más barata con su descuento (resolve_product_card_price).
"""

from datetime import datetime, timedelta
from decimal import Decimal

import pytest

from app.models.ModelProduct import Product
from app.models.ModelVariant import ProductVariant
from app.services.pricing import resolve_product_card_price

# nombre → (precio padre, descuento padre, [variantes]); variante = (precio, descuento propio, viva)
# descuento = (tipo, valor, inicio, fin) o None.
FUTURE = (datetime.utcnow() + timedelta(days=5), None)
SCENARIOS = {
    "sin-variantes": (500, None, []),
    "dos-variantes": (300, None, [(300, None, True), (200, None, True)]),
    "descuento-variante": (400, None, [(400, ("percent", 60, None, None), True)]),
    "descuento-padre": (900, ("percent", 10, None, None), [(1000, None, True), (900, None, True)]),
    "variante-borrada": (100, None, [(100, None, False), (700, None, True)]),
    "monto-fijo": (250, None, [(250, ("fixed", 100, None, None), True)]),
    "espejo-viejo": (50, None, [(600, None, True)]),
    "descuento-futuro": (350, None, [(350, ("percent", 50, *FUTURE), True)]),
    "variante-gana-al-padre": (
        800,
        ("percent", 20, None, None),
        [(1000, ("percent", 50, None, None), True), (800, None, True)],
    ),
}
EXPECTED_FINAL = {
    "sin-variantes": Decimal("500"),
    "dos-variantes": Decimal("200"),
    "descuento-variante": Decimal("160"),
    "descuento-padre": Decimal("810"),
    "variante-borrada": Decimal("700"),
    "monto-fijo": Decimal("150"),
    "espejo-viejo": Decimal("600"),
    "descuento-futuro": Decimal("350"),
    "variante-gana-al-padre": Decimal("500"),
}


def _apply_discount(entity, discount):
    if discount is None:
        return
    kind, value, starts_at, ends_at = discount
    entity.discount_enable = True
    entity.discount_type = kind
    entity.discount_value = value
    entity.discount_starts_at = starts_at
    entity.discount_ends_at = ends_at


@pytest.fixture()
def catalog_products(db, company, catalog):
    created = {}
    for name, (price, discount, variants) in SCENARIOS.items():
        product = Product(
            name=name,
            price=price,
            descripcion="desc",
            stock=5,
            company_id=company.id,
            catalog_id=catalog.id,
            has_variants=bool(variants),
        )
        _apply_discount(product, discount)
        db.add(product)
        db.flush()
        for index, (variant_price, variant_discount, alive) in enumerate(variants):
            variant = ProductVariant(
                product_id=product.id,
                name=f"{name}-{index}",
                price=variant_price,
                stock=5,
                deleted_at=None if alive else datetime.utcnow(),
            )
            _apply_discount(variant, variant_discount)
            db.add(variant)
        created[name] = product
    db.commit()
    for product in created.values():
        db.refresh(product)
    return created


def _all_pages(client, **params):
    cards, page = [], 1
    while True:
        body = client.get("/public/products", params={**params, "page": page, "limit": 4}).json()
        cards.extend(body["products"])
        if page >= body["total_pages"]:
            return cards, body["total"]
        page += 1


def test_card_shows_the_expected_effective_price(client, catalog_products):
    cards, _ = _all_pages(client)
    by_name = {card["name"]: Decimal(card["final_price"]) for card in cards}
    assert by_name == EXPECTED_FINAL


def test_sql_price_matches_python_card_price(db, catalog_products):
    for name, product in catalog_products.items():
        assert resolve_product_card_price(product).final_price == EXPECTED_FINAL[name], name


@pytest.mark.parametrize("sort,reverse", [("price_asc", False), ("price_desc", True)])
def test_sort_by_price_spans_all_pages(client, catalog_products, sort, reverse):
    cards, total = _all_pages(client, sort=sort)

    prices = [Decimal(card["final_price"]) for card in cards]
    assert prices == sorted(prices, reverse=reverse)
    assert total == len(SCENARIOS)
    assert len({card["id"] for card in cards}) == len(SCENARIOS)


def test_price_range_uses_the_shown_price(client, catalog_products):
    cards, total = _all_pages(client, min_price=160, max_price=500)

    names = {card["name"] for card in cards}
    assert names == {
        "descuento-variante",
        "dos-variantes",
        "descuento-futuro",
        "sin-variantes",
        "variante-gana-al-padre",
    }
    assert total == len(names)
    assert "espejo-viejo" not in names


def test_sort_by_discount_uses_the_shown_percentage(client, catalog_products):
    cards, _ = _all_pages(client, sort="discount")

    percentages = [card["discount_percentage"] or 0 for card in cards]
    assert percentages == sorted(percentages, reverse=True)
    assert [card["name"] for card in cards[:4]] == [
        "descuento-variante",
        "variante-gana-al-padre",
        "monto-fijo",
        "descuento-padre",
    ]


def test_min_discount_uses_the_shown_percentage(client, catalog_products):
    cards, total = _all_pages(client, min_discount=45)

    assert {card["name"] for card in cards} == {"descuento-variante", "variante-gana-al-padre"}
    assert total == 2
