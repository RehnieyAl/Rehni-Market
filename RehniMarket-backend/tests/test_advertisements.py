"""El anuncio es un banner puramente visual: sin title / description / button_text.
Conserva imágenes, estado, orden, targeting y button_link (navegación)."""

from urllib.parse import parse_qs, urlparse

import pytest

from app.models.ModelProduct import Product
from app.services.NasService import get_nas_service
from tests.conftest import auth

_TEXT_FIELDS = {"title", "description", "button_text"}


class _FakeNas:
    """Evita tocar MinIO en los tests; devuelve rutas deterministas."""

    def __init__(self):
        self.deleted = []
        self._n = 0

    def upload_file(self, file, path: str):
        self._n += 1
        return {"success": True, "object_name": f"{path}fake{self._n}.png",
                "path": f"uploads/{path}fake{self._n}.png"}

    def delete_file(self, object_name: str):
        self.deleted.append(object_name)
        return {"success": True}


@pytest.fixture()
def nas(client):
    fake = _FakeNas()
    client.app.dependency_overrides[get_nas_service] = lambda: fake
    yield fake
    client.app.dependency_overrides.pop(get_nas_service, None)


def _png():
    return ("banner.png", b"\x89PNG\r\n\x1a\n", "image/png")


def _create(client, tokens, data=None, *, with_mobile=False):
    files = {"image": _png()}
    if with_mobile:
        files["mobile_image"] = _png()
    return client.post(
        "/admin/dashboard/create-advertisement",
        data=data or {},
        files=files,
        headers=auth(tokens["owner"]),
    )


class TestAdvertisementIsVisualOnly:
    def test_create_without_any_text(self, client, tokens, nas):
        response = _create(client, tokens, {"order": 2})
        assert response.status_code == 200, response.text

        body = response.json()
        assert _TEXT_FIELDS.isdisjoint(body)
        assert body["image_url"].endswith(".png")
        assert body["order"] == 2
        assert body["is_active"] is True
        assert body["button_link"] is None

    def test_text_fields_in_payload_are_ignored(self, client, tokens, nas):
        response = _create(
            client, tokens,
            {"title": "aaaa", "description": "aaaa", "button_text": "a"},
        )
        assert response.status_code == 200, response.text
        assert _TEXT_FIELDS.isdisjoint(response.json())

    def test_response_shape(self, client, tokens, nas):
        body = _create(client, tokens).json()
        assert set(body) == {
            "id", "image_url", "mobile_image_url", "button_link",
            "is_active", "order", "created_at",
            "target_type", "target_product_id", "target_catalog_id",
            "target_company_id", "minimum_discount", "maximum_stock", "max_age_days",
        }

    def test_mobile_image_optional_and_supported(self, client, tokens, nas):
        assert _create(client, tokens).json()["mobile_image_url"] is None
        assert _create(client, tokens, with_mobile=True).json()["mobile_image_url"]


class TestAdvertisementTargeting:
    def test_promotion_still_works(self, client, tokens, nas):
        response = _create(
            client, tokens,
            {"target_type": "PROMOTION", "minimum_discount": 20},
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["target_type"] == "PROMOTION"
        assert body["minimum_discount"] == 20
        assert body["button_link"] == "/products?minDiscount=20"

    def test_manual_advertisement_keeps_button_link(self, client, tokens, nas):
        body = _create(client, tokens, {"button_link": "/products?discount=1"}).json()
        assert body["target_type"] is None
        assert body["button_link"] == "/products?discount=1"

    def test_product_target(self, client, tokens, nas, product):
        body = _create(
            client, tokens,
            {"target_type": "PRODUCT", "target_product_id": str(product.id)},
        ).json()
        assert body["button_link"] == f"/products/{product.id}"


class TestAdvertisementLifecycle:
    def test_update_order_and_status(self, client, tokens, nas):
        ad_id = _create(client, tokens).json()["id"]

        response = client.patch(
            f"/admin/dashboard/update-advertisement/{ad_id}",
            data={"order": 5, "is_active": "false"},
            headers=auth(tokens["owner"]),
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["order"] == 5
        assert body["is_active"] is False
        assert _TEXT_FIELDS.isdisjoint(body)

    def test_public_list_has_no_text(self, client, tokens, nas):
        _create(client, tokens)
        _create(client, tokens, {"target_type": "PROMOTION", "minimum_discount": 10})

        response = client.get("/public/advertisements")
        assert response.status_code == 200
        items = response.json()
        assert len(items) == 2
        for item in items:
            assert _TEXT_FIELDS.isdisjoint(item)
            assert item["image_url"]

    def test_delete_removes_row_and_images(self, client, tokens, nas):
        ad_id = _create(client, tokens, with_mobile=True).json()["id"]

        response = client.delete(
            f"/admin/dashboard/delete-advertisement/{ad_id}",
            headers=auth(tokens["owner"]),
        )
        assert response.status_code == 200, response.text
        assert len(nas.deleted) == 2
        assert client.get("/public/advertisements").json() == []


class TestAdvertisementCategoryDiscount:
    """Descuento del anuncio con target CATEGORY.

    Reutiliza la columna existente `minimum_discount` (sin campo/tabla nueva, sin
    migración) y el filtro `minDiscount` que ya existe. El anuncio NO aplica un
    precio nuevo: solo transporta el % al catálogo como filtro, y el catálogo
    muestra el precio promocional real de cada producto (pricing.resolve_price)."""

    def _cat(self, catalog, **extra):
        return {
            "target_type": "CATEGORY",
            "target_catalog_id": str(catalog.id),
            **extra,
        }

    def test_create_category_without_discount(self, client, tokens, nas, catalog):
        body = _create(client, tokens, self._cat(catalog)).json()

        assert body["target_type"] == "CATEGORY"
        assert body["target_catalog_id"] == str(catalog.id)
        assert body["minimum_discount"] is None
        assert body["button_link"] == f"/products?catalog={catalog.id}"

    def test_create_category_with_discount_carries_min_discount(
        self, client, tokens, nas, catalog
    ):
        response = _create(client, tokens, self._cat(catalog, minimum_discount=20))
        assert response.status_code == 200, response.text

        body = response.json()
        assert body["minimum_discount"] == 20
        # el destino lleva la categoría + el filtro de descuento
        assert body["button_link"] == f"/products?catalog={catalog.id}&minDiscount=20"

    def test_discount_is_persisted_and_reloaded_on_edit(self, client, tokens, nas, catalog):
        ad_id = _create(client, tokens, self._cat(catalog, minimum_discount=15)).json()["id"]

        reloaded = client.get(
            f"/admin/dashboard/get-advertisement/{ad_id}",
            headers=auth(tokens["owner"]),
        ).json()
        assert reloaded["minimum_discount"] == 15
        assert reloaded["button_link"] == f"/products?catalog={catalog.id}&minDiscount=15"

    def test_edit_discount_percentage_updates_link(self, client, tokens, nas, catalog):
        ad_id = _create(client, tokens, self._cat(catalog, minimum_discount=20)).json()["id"]

        response = client.patch(
            f"/admin/dashboard/update-advertisement/{ad_id}",
            data=self._cat(catalog, minimum_discount=35),
            headers=auth(tokens["owner"]),
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["minimum_discount"] == 35
        assert body["button_link"] == f"/products?catalog={catalog.id}&minDiscount=35"

    def test_disable_discount_on_edit_drops_min_discount_from_link(
        self, client, tokens, nas, catalog
    ):
        ad_id = _create(client, tokens, self._cat(catalog, minimum_discount=20)).json()["id"]

        # al desactivar el checkbox el frontend deja de enviar minimum_discount
        response = client.patch(
            f"/admin/dashboard/update-advertisement/{ad_id}",
            data=self._cat(catalog),
            headers=auth(tokens["owner"]),
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["minimum_discount"] is None
        assert body["button_link"] == f"/products?catalog={catalog.id}"

    def test_changing_category_keeps_the_discount_in_the_link(
        self, client, tokens, nas, catalog, db, company
    ):
        from app.models.ModelCatalog import Catalog

        other = Catalog(name="Otra categoría")
        db.add(other)
        db.commit()
        db.refresh(other)

        ad_id = _create(client, tokens, self._cat(catalog, minimum_discount=20)).json()["id"]

        response = client.patch(
            f"/admin/dashboard/update-advertisement/{ad_id}",
            data={
                "target_type": "CATEGORY",
                "target_catalog_id": str(other.id),
                "minimum_discount": 20,
            },
            headers=auth(tokens["owner"]),
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["target_catalog_id"] == str(other.id)
        assert body["button_link"] == f"/products?catalog={other.id}&minDiscount=20"

    @pytest.mark.parametrize("bad_value", [-5, 0, 150, "abc"])
    def test_reject_invalid_percentage(self, client, tokens, nas, catalog, bad_value):
        response = _create(
            client, tokens, self._cat(catalog, minimum_discount=bad_value)
        )
        assert response.status_code == 422, response.text

    def test_requires_admin_or_owner(self, client, tokens, nas, catalog):
        data = self._cat(catalog, minimum_discount=20)

        assert _create(client, tokens, data).status_code == 200  # owner

        admin_response = client.post(
            "/admin/dashboard/create-advertisement",
            data=data,
            files={"image": _png()},
            headers=auth(tokens["admin"]),
        )
        assert admin_response.status_code == 200, admin_response.text
        assert admin_response.json()["minimum_discount"] == 20

        user_response = client.post(
            "/admin/dashboard/create-advertisement",
            data=data,
            files={"image": _png()},
            headers=auth(tokens["user"]),
        )
        assert user_response.status_code == 403

    def test_discount_exposed_on_public_endpoint(self, client, tokens, nas, catalog):
        _create(client, tokens, self._cat(catalog, minimum_discount=25))

        items = client.get("/public/advertisements").json()
        assert len(items) == 1
        assert items[0]["target_type"] == "CATEGORY"
        assert items[0]["minimum_discount"] == 25

    def _make_product(self, db, company, catalog, name, price, **discount):
        product = Product(
            name=name,
            price=price,
            descripcion="d",
            stock=5,
            company_id=company.id,
            catalog_id=catalog.id,
            **discount,
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    def test_clicking_the_ad_link_applies_the_existing_discount_logic(
        self, client, tokens, nas, db, company, catalog
    ):
        """El destino calculado + el catálogo real: los productos de la categoría
        con descuento vigente >= % salen con su precio promocional (pricing.py);
        los que no llegan al % o no tienen descuento quedan fuera. Sin doble
        descuento: cada producto muestra su único descuento propio."""

        on_sale = self._make_product(
            db, company, catalog, "Computador Gamer", 2_000_000,
            discount_enable=True, discount_value=20,
        )
        small_sale = self._make_product(
            db, company, catalog, "Teclado", 100_000,
            discount_enable=True, discount_value=10,
        )
        no_sale = self._make_product(db, company, catalog, "Mouse", 50_000)

        ad = _create(
            client, tokens,
            {"target_type": "CATEGORY", "target_catalog_id": str(catalog.id),
             "minimum_discount": 20},
        ).json()

        # navegar con exactamente los params del enlace del anuncio
        query = parse_qs(urlparse(ad["button_link"]).query)
        response = client.get(
            "/public/products",
            params={
                "catalog_id": query["catalog"][0],
                "min_discount": query["minDiscount"][0],
            },
        )
        assert response.status_code == 200, response.text
        products = {p["id"]: p for p in response.json()["products"]}

        assert str(on_sale.id) in products
        assert str(small_sale.id) not in products  # 10% < 20%
        assert str(no_sale.id) not in products  # sin descuento

        card = products[str(on_sale.id)]
        assert card["discount_enabled"] is True
        assert card["discount_percentage"] == 20
        assert card["price"] == "2000000.00"
        assert card["final_price"] == "1600000.00"  # cálculo de pricing.py, no del anuncio

    def test_ad_link_and_product_detail_show_the_same_price(
        self, client, tokens, nas, db, company, catalog
    ):
        on_sale = self._make_product(
            db, company, catalog, "Laptop", 3_000_000,
            discount_enable=True, discount_value=25,
        )

        _create(
            client, tokens,
            {"target_type": "CATEGORY", "target_catalog_id": str(catalog.id),
             "minimum_discount": 25},
        )

        card = next(
            p for p in client.get(
                "/public/products", params={"catalog_id": str(catalog.id), "min_discount": 25}
            ).json()["products"]
            if p["id"] == str(on_sale.id)
        )
        detail = client.get(f"/public/products/{on_sale.id}").json()

        assert card["final_price"] == "2250000.00"
        assert detail["final_price"] == card["final_price"]
