"""El anuncio es un banner puramente visual: sin title / description / button_text.
Conserva imágenes, estado, orden, targeting y button_link (navegación)."""

import pytest

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
    # Cabecera PNG mínima; el contenido no importa, la subida está mockeada.
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
        # El contrato ya no acepta estos campos: llegan como form extra y se descartan.
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
        # button_link lo calcula el targeting, sin depender de ningún texto.
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
        assert len(nas.deleted) == 2  # desktop + mobile
        assert client.get("/public/advertisements").json() == []
