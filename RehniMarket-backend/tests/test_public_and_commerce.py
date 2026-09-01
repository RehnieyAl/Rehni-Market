from datetime import datetime

import pytest

from app.services.NasService import build_media_url
from tests.conftest import auth


@pytest.fixture()
def axes(make_attribute, catalog):
    color, color_options = make_attribute(
        catalog.id, "Color", "variant", "color", values=("Negro", "Blanco")
    )
    size, size_options = make_attribute(
        catalog.id, "Talla", "variant", "select", values=("40", "41")
    )
    return {
        "color": color, "size": size,
        "negro": color_options[0], "blanco": color_options[1],
        "t40": size_options[0], "t41": size_options[1],
    }


@pytest.fixture()
def brand(make_attribute, catalog):
    attribute, _ = make_attribute(catalog.id, "Marca", "product", "text")
    return attribute


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


class TestPublicCatalogAttributes:
    def test_returns_product_and_variant_attributes(self, client, catalog, axes, brand):
        response = client.get(f"/public/catalogs/{catalog.id}/attributes")
        assert response.status_code == 200
        body = response.json()
        assert [a["name"] for a in body["variant_attributes"]] == ["Color", "Talla"]
        assert [a["name"] for a in body["product_attributes"]] == ["Marca"]
        color = next(a for a in body["variant_attributes"] if a["name"] == "Color")
        assert {o["value"] for o in color["options"]} == {"Negro", "Blanco"}

    def test_inactive_attribute_excluded(self, client, catalog, axes, tokens):
        client.patch(
            f"/admin/dashboard/catalog-attributes/{axes['size'].id}/status",
            json={"is_active": False},
            headers=auth(tokens["owner"]),
        )
        body = client.get(f"/public/catalogs/{catalog.id}/attributes").json()
        assert [a["name"] for a in body["variant_attributes"]] == ["Color"]

    def test_is_public(self, client, catalog):
        assert client.get(f"/public/catalogs/{catalog.id}/attributes").status_code == 200


class TestPublicProductDetail:
    def test_exposes_product_attributes_and_variant_options(
        self, client, tokens, product, axes, brand
    ):
        client.put(
            f"/company/dashboard/products/{product.id}/product-attributes",
            json={"values": [{"attribute_id": str(brand.id), "value": "Nike"}]},
            headers=auth(tokens["company"]),
        )
        _make_variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        )

        detail = client.get(f"/public/products/{product.id}")
        assert detail.status_code == 200
        body = detail.json()
        assert {"attribute": "Marca", "value": "Nike"} in body["attributes"]
        assert len(body["variants"]) == 1
        options = body["variants"][0]["options"]
        assert {o["attribute"]: o["value"] for o in options} == {
            "Color": "Negro", "Talla": "40",
        }

    def test_deleted_variant_not_visible(self, client, tokens, product, axes):
        variant = _make_variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        )
        client.delete(
            f"/company/dashboard/products/{product.id}/variants/{variant['id']}",
            headers=auth(tokens["company"]),
        )
        body = client.get(f"/public/products/{product.id}").json()
        assert body["variants"] == []


class TestProductInitialImage:
    """La imagen inicial de tarjetas y listados sale de la primera variante viva."""

    @staticmethod
    def _add_variant_image(db, variant_id, url, is_main=True):
        from app.models.ModelVariantImage import ProductVariantImage

        db.add(
            ProductVariantImage(variant_id=variant_id, url=url, is_main=is_main)
        )
        db.commit()

    @staticmethod
    def _public_card(client, product_id):
        body = client.get("/public/products").json()
        return next(p for p in body["products"] if p["id"] == str(product_id))

    @staticmethod
    def _dashboard_row(client, tokens, product_id):
        body = client.get(
            "/company/dashboard/get-my-products", headers=auth(tokens["company"])
        ).json()
        return next(p for p in body["products"] if p["id"] == str(product_id))

    def test_public_card_uses_first_live_variant_image(
        self, client, tokens, product, axes, db
    ):
        first = _make_variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        )
        second = _make_variant(
            client, tokens, product.id,
            [str(axes["blanco"].id), str(axes["t41"].id)],
        )
        self._add_variant_image(db, first["id"], "uploads/first.webp")
        self._add_variant_image(db, second["id"], "uploads/second.webp")

        card = self._public_card(client, product.id)
        assert card["image"] == build_media_url("uploads/first.webp")

    def test_public_card_skips_deleted_variant(
        self, client, tokens, product, axes, db
    ):
        deleted = _make_variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        )
        live = _make_variant(
            client, tokens, product.id,
            [str(axes["blanco"].id), str(axes["t41"].id)],
        )
        self._add_variant_image(db, deleted["id"], "uploads/deleted.webp")
        self._add_variant_image(db, live["id"], "uploads/live.webp")

        from app.models.ModelVariant import ProductVariant

        db.query(ProductVariant).filter(
            ProductVariant.id == deleted["id"]
        ).update({"deleted_at": datetime.utcnow()})
        db.commit()

        card = self._public_card(client, product.id)
        assert card["image"] == build_media_url("uploads/live.webp")

    def test_public_card_falls_back_to_product_image(
        self, client, tokens, product, axes, db
    ):
        _make_variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        )

        from app.models.ModelProduct import ProductImage

        db.add(
            ProductImage(
                product_id=product.id, url="uploads/product.webp", is_main=True
            )
        )
        db.commit()

        card = self._public_card(client, product.id)
        assert card["image"] == build_media_url("uploads/product.webp")

    def test_dashboard_list_uses_first_live_variant_image(
        self, client, tokens, product, axes, db
    ):
        first = _make_variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        )
        self._add_variant_image(db, first["id"], "uploads/dash.webp")

        row = self._dashboard_row(client, tokens, product.id)
        assert row["image"] == build_media_url("uploads/dash.webp")


class TestCart:
    def test_cart_line_carries_variant_options_and_prices(
        self, client, tokens, product, axes, buyer_wallet
    ):
        variant = _make_variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
            price=200, discount_enable=True, discount_value=25, discount_type="percent",
        )

        response = client.post(
            "/cart/add",
            json={"productId": str(product.id), "variantId": variant["id"], "quantity": 2},
            headers=auth(tokens["user"]),
        )
        assert response.status_code == 200
        item = response.json()["items"][0]
        assert item["sku"] is None or isinstance(item["sku"], str)
        assert {o["attribute"]: o["value"] for o in item["options"]} == {
            "Color": "Negro", "Talla": "40",
        }
        assert item["basePrice"] == "200.00"
        assert item["unitPrice"] == "150.00"
        assert item["discountPercentage"] == 25

    def test_cart_requires_variant_when_product_has_variants(
        self, client, tokens, product, axes, buyer_wallet
    ):
        _make_variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        )
        response = client.post(
            "/cart/add",
            json={"productId": str(product.id), "quantity": 1},
            headers=auth(tokens["user"]),
        )
        assert response.status_code == 400


class TestCheckoutAndOrders:
    def _checkout(self, client, tokens, product, variant, address, quantity=1):
        client.post(
            "/cart/add",
            json={
                "productId": str(product.id),
                "variantId": variant["id"],
                "quantity": quantity,
            },
            headers=auth(tokens["user"]),
        )
        return client.post(
            "/checkout",
            json={"addressId": str(address.id)},
            headers=auth(tokens["user"]),
        )

    def test_checkout_recomputes_price_and_snapshots_attributes(
        self, client, tokens, product, axes, buyer_wallet, address, monkeypatch
    ):
        monkeypatch.setattr(
            "app.services.commerce.CheckoutService.send_order_created_email",
            lambda order: None,
        )
        variant = _make_variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
            price=200, discount_enable=True, discount_value=50, discount_type="percent",
        )

        response = self._checkout(client, tokens, product, variant, address)
        assert response.status_code == 200, response.text
        item = response.json()["orders"][0]["items"][0]
        assert item["unitPrice"] == "100.00"
        assert item["attributes"] == {"Color": "Negro", "Talla": "40"}

    def test_checkout_rejects_deleted_variant(
        self, client, tokens, product, axes, buyer_wallet, address, monkeypatch, db
    ):
        monkeypatch.setattr(
            "app.services.commerce.CheckoutService.send_order_created_email",
            lambda order: None,
        )
        variant = _make_variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        )
        client.post(
            "/cart/add",
            json={"productId": str(product.id), "variantId": variant["id"], "quantity": 1},
            headers=auth(tokens["user"]),
        )

        from app.models.ModelVariant import ProductVariant
        from datetime import datetime

        db.query(ProductVariant).filter(
            ProductVariant.id == variant["id"]
        ).update({"deleted_at": datetime.utcnow()})
        db.commit()

        response = client.post(
            "/checkout",
            json={"addressId": str(address.id)},
            headers=auth(tokens["user"]),
        )
        assert response.status_code == 409

    def test_order_snapshot_is_frozen(
        self, client, tokens, product, axes, buyer_wallet, address, monkeypatch, db
    ):
        monkeypatch.setattr(
            "app.services.commerce.CheckoutService.send_order_created_email",
            lambda order: None,
        )
        variant = _make_variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        )
        checkout = self._checkout(client, tokens, product, variant, address)
        order_id = checkout.json()["orders"][0]["id"]

        client.patch(
            f"/admin/dashboard/catalog-attribute-options/{axes['negro'].id}",
            json={"value": "Negro Mate"},
            headers=auth(tokens["owner"]),
        )
        client.delete(
            f"/company/dashboard/products/{product.id}/variants/{variant['id']}",
            headers=auth(tokens["company"]),
        )

        detail = client.get(f"/orders/{order_id}", headers=auth(tokens["user"]))
        assert detail.status_code == 200
        assert detail.json()["items"][0]["attributes"] == {
            "Color": "Negro", "Talla": "40",
        }


class TestCheckoutStockDiscount:
    """El stock se descuenta SOLO en el checkout, de forma atómica y segura ante
    concurrencia. Agregar al carrito nunca reserva stock."""

    @staticmethod
    def _variant(client, tokens, product_id, option_ids, stock):
        payload = {"name": "V", "price": 100, "stock": stock, "option_ids": option_ids}
        r = client.post(
            f"/company/dashboard/products/{product_id}/variants",
            json=payload,
            headers=auth(tokens["company"]),
        )
        assert r.status_code == 200, r.text
        return r.json()

    def test_add_to_cart_does_not_touch_stock(
        self, client, tokens, product, axes, buyer_wallet
    ):
        variant = self._variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)], stock=5,
        )

        client.post(
            "/cart/add",
            json={"productId": str(product.id), "variantId": variant["id"], "quantity": 3},
            headers=auth(tokens["user"]),
        )

        r = client.get(f"/public/products/{product.id}")
        stock_in_api = next(
            v["stock"] for v in r.json()["variants"] if v["id"] == variant["id"]
        )
        assert stock_in_api == 5

    def test_checkout_decrements_only_the_bought_quantity(
        self, client, tokens, product, axes, buyer_wallet, address, monkeypatch, db
    ):
        monkeypatch.setattr(
            "app.services.commerce.CheckoutService.send_order_created_email",
            lambda order: None,
        )
        from uuid import UUID
        from app.models.ModelVariant import ProductVariant

        variant = self._variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)], stock=5,
        )

        client.post(
            "/cart/add",
            json={"productId": str(product.id), "variantId": variant["id"], "quantity": 2},
            headers=auth(tokens["user"]),
        )
        r = client.post(
            "/checkout", json={"addressId": str(address.id)}, headers=auth(tokens["user"])
        )
        assert r.status_code == 200, r.text

        db.expire_all()
        assert db.get(ProductVariant, UUID(variant["id"])).stock == 3

    def test_checkout_exact_stock_lands_on_zero(
        self, client, tokens, product, axes, buyer_wallet, address, monkeypatch, db
    ):
        monkeypatch.setattr(
            "app.services.commerce.CheckoutService.send_order_created_email",
            lambda order: None,
        )
        from uuid import UUID
        from app.models.ModelVariant import ProductVariant

        variant = self._variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)], stock=5,
        )
        client.post(
            "/cart/add",
            json={"productId": str(product.id), "variantId": variant["id"], "quantity": 5},
            headers=auth(tokens["user"]),
        )
        r = client.post(
            "/checkout", json={"addressId": str(address.id)}, headers=auth(tokens["user"])
        )
        assert r.status_code == 200, r.text

        db.expire_all()
        assert db.get(ProductVariant, UUID(variant["id"])).stock == 0

    def test_checkout_rejected_when_stock_drops_below_cart_and_nothing_persists(
        self, client, tokens, product, axes, buyer_wallet, address, monkeypatch, db
    ):
        monkeypatch.setattr(
            "app.services.commerce.CheckoutService.send_order_created_email",
            lambda order: None,
        )
        from uuid import UUID
        from app.models.ModelVariant import ProductVariant
        from app.models.ModelOrder import Order
        from app.models.ModelWallet import Wallet, WalletTransaction

        variant = self._variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)], stock=5,
        )
        client.post(
            "/cart/add",
            json={"productId": str(product.id), "variantId": variant["id"], "quantity": 5},
            headers=auth(tokens["user"]),
        )

        db.query(ProductVariant).filter(
            ProductVariant.id == UUID(variant["id"])
        ).update({"stock": 2})
        db.commit()

        r = client.post(
            "/checkout", json={"addressId": str(address.id)}, headers=auth(tokens["user"])
        )
        assert r.status_code == 409
        assert r.json()["detail"]["code"] == "INSUFFICIENT_STOCK"

        db.expire_all()
        assert db.get(ProductVariant, UUID(variant["id"])).stock == 2
        assert db.query(Order).count() == 0
        assert db.get(Wallet, buyer_wallet.id).balance == buyer_wallet.balance
        assert db.query(WalletTransaction).count() == 0

    def test_checkout_over_stock_is_still_blocked_at_cart(
        self, client, tokens, product, axes, buyer_wallet
    ):
        variant = self._variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)], stock=5,
        )
        r = client.post(
            "/cart/add",
            json={"productId": str(product.id), "variantId": variant["id"], "quantity": 6},
            headers=auth(tokens["user"]),
        )
        assert r.status_code == 409
        assert r.json()["detail"]["code"] == "INSUFFICIENT_STOCK"

    def test_checkout_only_touches_the_selected_variant(
        self, client, tokens, product, axes, buyer_wallet, address, monkeypatch, db
    ):
        monkeypatch.setattr(
            "app.services.commerce.CheckoutService.send_order_created_email",
            lambda order: None,
        )
        from uuid import UUID
        from app.models.ModelVariant import ProductVariant

        variant_a = self._variant(
            client, tokens, product.id,
            [str(axes["negro"].id), str(axes["t40"].id)], stock=2,
        )
        variant_b = self._variant(
            client, tokens, product.id,
            [str(axes["blanco"].id), str(axes["t41"].id)], stock=2,
        )

        client.post(
            "/cart/add",
            json={"productId": str(product.id), "variantId": variant_a["id"], "quantity": 1},
            headers=auth(tokens["user"]),
        )
        r = client.post(
            "/checkout", json={"addressId": str(address.id)}, headers=auth(tokens["user"])
        )
        assert r.status_code == 200, r.text

        db.expire_all()
        assert db.get(ProductVariant, UUID(variant_a["id"])).stock == 1
        assert db.get(ProductVariant, UUID(variant_b["id"])).stock == 2

    def test_concurrent_checkout_of_last_unit_lets_only_one_win(
        self, db, engine, users, company, catalog, monkeypatch
    ):
        """stock = 1, dos compradores confirman a la vez: exactamente uno gana,
        el otro recibe INSUFFICIENT_STOCK. Nunca dos pedidos, nunca stock negativo."""

        import threading
        from uuid import UUID

        from fastapi import HTTPException
        from sqlalchemy.orm import sessionmaker

        from app.models.ModelAddress import Address
        from app.models.ModelCart import Cart, CartItem
        from app.models.ModelOrder import Order
        from app.models.ModelProduct import Product
        from app.models.ModelRole import Role
        from app.models.ModelUser import Users
        from app.models.ModelWallet import Wallet
        from app.schemas.SchemaCommerce.SchemaOrder import CheckoutRequest
        from app.services.commerce.CheckoutService import checkout_service
        from app.utils.Security import hash_password

        monkeypatch.setattr(
            "app.services.commerce.CheckoutService.send_order_created_email",
            lambda order: None,
        )

        product = Product(
            name="Última unidad", price=100, descripcion="d", stock=1,
            company_id=company.id, catalog_id=catalog.id,
        )
        db.add(product)

        user_role = db.query(Role).filter(Role.name == "user").first()
        buyer2 = Users(
            fullName="Buyer 2", email="buyer2@test.local",
            hashed_password=hash_password("secret123"), tell="3000000001",
            verified=True, role_id=user_role.id,
        )
        db.add(buyer2)
        db.flush()

        buyer_ids = [users["user"].id, buyer2.id]
        address_by_user: dict = {}

        for uid in buyer_ids:
            db.add(Wallet(user_id=uid, balance=1_000_000))
            addr = Address(
                user_id=uid, label="Casa", full_name="Comprador Test",
                country="Colombia", department="Antioquia", city="Medellín",
                address="Calle 1", phone="3001112222",
            )
            db.add(addr)
            db.flush()
            address_by_user[uid] = addr.id

            cart = Cart(user_id=uid)
            db.add(cart)
            db.flush()
            db.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=1))

        db.commit()
        product_id = product.id

        Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
        barrier = threading.Barrier(len(buyer_ids))
        results: dict = {}

        def worker(uid):
            session = Session()
            try:
                barrier.wait(timeout=10)
                summary = checkout_service(
                    uid, "user",
                    CheckoutRequest(addressId=address_by_user[uid]),
                    session,
                )
                results[uid] = ("ok", summary)
            except HTTPException as exc:
                results[uid] = ("error", exc.detail)
            except Exception as exc:
                results[uid] = ("boom", repr(exc))
            finally:
                session.close()

        threads = [threading.Thread(target=worker, args=(uid,)) for uid in buyer_ids]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=30)

        outcomes = sorted(state for state, _ in results.values())
        assert outcomes == ["error", "ok"], results

        error_detail = next(payload for state, payload in results.values() if state == "error")
        assert error_detail["code"] == "INSUFFICIENT_STOCK"

        db.expire_all()
        assert db.get(Product, product_id).stock == 0
        assert db.query(Order).count() == 1
