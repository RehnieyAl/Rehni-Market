"""Apartados públicos Ofertas (/public/products/offers) y Novedades (/public/products/new).

Ambos reutilizan la tarjeta (_to_card_response) y la imagen inicial
(product_display_image_url). La lógica propia:
  - Ofertas: descuento vigente en una variante viva con stock, o del producto padre.
  - Novedades: Product.created_at dentro de NEW_PRODUCT_WINDOW_DAYS, más nuevo primero.
"""

from datetime import datetime, timedelta

import pytest

from app.models.ModelProduct import Product
from app.models.ModelVariant import ProductVariant
from app.models.ModelVariantImage import ProductVariantImage
from app.services.publicService.Products import NEW_PRODUCT_WINDOW_DAYS
from tests.conftest import auth


@pytest.fixture()
def axes(make_attribute, catalog):
    color, color_opts = make_attribute(
        catalog.id, "Color", "variant", "color", values=("Negro", "Blanco")
    )
    size, size_opts = make_attribute(
        catalog.id, "Talla", "variant", "select", values=("40", "41")
    )
    return {
        "negro": color_opts[0], "blanco": color_opts[1],
        "t40": size_opts[0], "t41": size_opts[1],
    }


def _combo(axes, color, size):
    return [str(axes[color].id), str(axes[size].id)]


def _make_variant(client, tokens, product_id, option_ids, **extra):
    payload = {"name": "V", "price": 100, "stock": 10, "option_ids": option_ids}
    payload.update(extra)
    r = client.post(
        f"/company/dashboard/products/{product_id}/variants",
        json=payload,
        headers=auth(tokens["company"]),
    )
    assert r.status_code == 200, r.text
    return r.json()


def _second_product(db, company, catalog, name="Otro", **overrides):
    data = dict(
        name=name, price=100, descripcion="d", stock=0,
        company_id=company.id, catalog_id=catalog.id,
    )
    data.update(overrides)
    product = Product(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def _offer_ids(client):
    body = client.get("/public/products/offers").json()
    return [p["id"] for p in body["products"]], body


def _new_ids(client):
    body = client.get("/public/products/new").json()
    return [p["id"] for p in body["products"]], body


class TestOffers:
    def test_product_without_discount_is_excluded(self, client, tokens, product, axes):
        _make_variant(client, tokens, product.id, _combo(axes, "negro", "t40"))

        ids, _ = _offer_ids(client)
        assert str(product.id) not in ids

    def test_product_with_one_discounted_variant_appears_once(
        self, client, tokens, product, axes
    ):
        _make_variant(client, tokens, product.id, _combo(axes, "negro", "t40"))
        _make_variant(
            client, tokens, product.id, _combo(axes, "blanco", "t41"),
            price=100, discount_enable=True, discount_value=20, discount_type="percent",
        )

        ids, _ = _offer_ids(client)
        assert ids.count(str(product.id)) == 1

    def test_deleted_variant_discount_does_not_count(self, client, tokens, product, axes):
        good = _make_variant(client, tokens, product.id, _combo(axes, "negro", "t40"))
        disc = _make_variant(
            client, tokens, product.id, _combo(axes, "blanco", "t41"),
            discount_enable=True, discount_value=30, discount_type="percent",
        )
        client.delete(
            f"/company/dashboard/products/{product.id}/variants/{disc['id']}",
            headers=auth(tokens["company"]),
        )
        assert good  # el producto sigue siendo comprable, pero ya no está en oferta

        ids, _ = _offer_ids(client)
        assert str(product.id) not in ids

    def test_out_of_stock_variant_discount_does_not_count(
        self, client, tokens, product, axes
    ):
        _make_variant(client, tokens, product.id, _combo(axes, "negro", "t40"))
        _make_variant(
            client, tokens, product.id, _combo(axes, "blanco", "t41"),
            stock=0, discount_enable=True, discount_value=25, discount_type="percent",
        )

        ids, _ = _offer_ids(client)
        assert str(product.id) not in ids

    def test_card_price_reflects_best_variant_deal(self, client, tokens, product, axes):
        # Variante A: 500 sin descuento. Variante B: 400 con 20% -> final 320 (la más barata).
        _make_variant(
            client, tokens, product.id, _combo(axes, "negro", "t40"), price=500,
        )
        _make_variant(
            client, tokens, product.id, _combo(axes, "blanco", "t41"),
            price=400, discount_enable=True, discount_value=20, discount_type="percent",
        )

        ids, body = _offer_ids(client)
        card = next(p for p in body["products"] if p["id"] == str(product.id))
        assert card["discount_enabled"] is True
        assert card["discount_percentage"] == 20
        assert card["price"] == "400.00"
        assert card["final_price"] == "320.00"

    def test_product_level_discount_puts_product_in_offers(
        self, client, tokens, product, axes, db
    ):
        _make_variant(client, tokens, product.id, _combo(axes, "negro", "t40"))
        db.query(Product).filter(Product.id == product.id).update(
            {"discount_enable": True, "discount_value": 15}
        )
        db.commit()

        ids, _ = _offer_ids(client)
        assert str(product.id) in ids


class TestNewProducts:
    def test_recent_product_appears_once(self, client, tokens, product, axes):
        _make_variant(client, tokens, product.id, _combo(axes, "negro", "t40"))
        _make_variant(client, tokens, product.id, _combo(axes, "blanco", "t41"))

        ids, _ = _new_ids(client)
        assert ids.count(str(product.id)) == 1

    def test_old_product_is_excluded(self, client, tokens, product, axes, db):
        _make_variant(client, tokens, product.id, _combo(axes, "negro", "t40"))
        old = datetime.utcnow() - timedelta(days=NEW_PRODUCT_WINDOW_DAYS + 5)
        db.query(Product).filter(Product.id == product.id).update({"created_at": old})
        db.commit()

        ids, _ = _new_ids(client)
        assert str(product.id) not in ids

    def test_descending_order_by_created_at(
        self, client, tokens, product, axes, db, company, catalog
    ):
        _make_variant(client, tokens, product.id, _combo(axes, "negro", "t40"))

        newer = _second_product(db, company, catalog, name="Más nuevo")
        _make_variant(client, tokens, newer.id, _combo(axes, "blanco", "t41"))

        db.query(Product).filter(Product.id == product.id).update(
            {"created_at": datetime.utcnow() - timedelta(days=3)}
        )
        db.query(Product).filter(Product.id == newer.id).update(
            {"created_at": datetime.utcnow()}
        )
        db.commit()

        ids, _ = _new_ids(client)
        assert ids.index(str(newer.id)) < ids.index(str(product.id))


class TestSharedCardBehaviour:
    def _card(self, client, product_id):
        body = client.get("/public/products/new").json()
        return next(p for p in body["products"] if p["id"] == str(product_id))

    def _add_image(self, db, variant_id, url, is_main=True):
        db.add(ProductVariantImage(variant_id=variant_id, url=url, is_main=is_main))
        db.commit()

    def test_card_image_is_first_live_variant_image(self, client, tokens, product, axes, db):
        first = _make_variant(client, tokens, product.id, _combo(axes, "negro", "t40"))
        _make_variant(client, tokens, product.id, _combo(axes, "blanco", "t41"))
        self._add_image(db, first["id"], "uploads/first.webp")

        assert self._card(client, product.id)["image"].endswith("first.webp")

    def test_card_image_ignores_deleted_variant(self, client, tokens, product, axes, db):
        gone = _make_variant(client, tokens, product.id, _combo(axes, "negro", "t40"))
        live = _make_variant(client, tokens, product.id, _combo(axes, "blanco", "t41"))
        self._add_image(db, gone["id"], "uploads/gone.webp")
        self._add_image(db, live["id"], "uploads/live.webp")
        db.query(ProductVariant).filter(ProductVariant.id == gone["id"]).update(
            {"deleted_at": datetime.utcnow()}
        )
        db.commit()

        assert self._card(client, product.id)["image"].endswith("live.webp")

    def test_no_legacy_fields_in_card(self, client, tokens, product, axes):
        _make_variant(client, tokens, product.id, _combo(axes, "negro", "t40"))

        for body in (
            client.get("/public/products/offers").json(),
            client.get("/public/products/new").json(),
        ):
            for card in body["products"]:
                assert "color" not in card
                assert "main_color" not in card
                assert "specifications" not in card

    def test_product_detail_still_works(self, client, tokens, product, axes):
        _make_variant(
            client, tokens, product.id, _combo(axes, "negro", "t40"),
            price=400, discount_enable=True, discount_value=20, discount_type="percent",
        )

        detail = client.get(f"/public/products/{product.id}")
        assert detail.status_code == 200
        body = detail.json()
        assert len(body["variants"]) == 1
        # "Desde" del detalle = mismo mejor precio de variante que la tarjeta.
        assert body["price"] == "400.00"
        assert body["final_price"] == "320.00"
        assert body["discount_enabled"] is True

    def test_normal_catalog_still_lists_products(self, client, tokens, product, axes):
        _make_variant(client, tokens, product.id, _combo(axes, "negro", "t40"))

        body = client.get("/public/products").json()
        assert any(p["id"] == str(product.id) for p in body["products"])
