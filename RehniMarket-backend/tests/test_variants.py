import pytest
from sqlalchemy.exc import IntegrityError

from tests.conftest import auth

ATTR_BASE = "/admin/dashboard/catalog-attributes"


def _url(product_id, suffix=""):
    return f"/company/dashboard/products/{product_id}{suffix}"


@pytest.fixture()
def axes(make_attribute, catalog):
    color, color_options = make_attribute(
        catalog.id, "Color", "variant", "color", values=("Negro", "Blanco")
    )
    size, size_options = make_attribute(
        catalog.id, "Talla", "variant", "select", values=("40", "41")
    )
    return {
        "color": color,
        "size": size,
        "negro": color_options[0],
        "blanco": color_options[1],
        "t40": size_options[0],
        "t41": size_options[1],
    }


@pytest.fixture()
def brand(make_attribute, catalog):
    attribute, _ = make_attribute(catalog.id, "Marca", "product", "text")
    return attribute


def _create(client, token, product_id, option_ids, **extra):
    payload = {"name": "V", "price": 120, "stock": 5, "option_ids": option_ids}
    payload.update(extra)
    return client.post(
        _url(product_id, "/variants"), json=payload, headers=auth(token)
    )


class TestProductAttributes:
    def test_assign_and_read_product_attribute(self, client, tokens, product, brand):
        response = client.put(
            _url(product.id, "/product-attributes"),
            json={"values": [{"attribute_id": str(brand.id), "value": "Nike"}]},
            headers=auth(tokens["company"]),
        )
        assert response.status_code == 200
        assert response.json() == [
            {"attribute_id": str(brand.id), "name": "Marca", "value": "Nike"}
        ]

    def test_variant_axis_rejected_as_product_attribute(
        self, client, tokens, product, axes
    ):
        response = client.put(
            _url(product.id, "/product-attributes"),
            json={"values": [{"attribute_id": str(axes["color"].id), "value": "x"}]},
            headers=auth(tokens["company"]),
        )
        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "PRODUCT_ATTRIBUTE_INVALID"

    def test_inactive_attribute_rejected(self, client, tokens, product, brand):
        client.patch(
            f"{ATTR_BASE}/{brand.id}/status",
            json={"is_active": False},
            headers=auth(tokens["owner"]),
        )
        response = client.put(
            _url(product.id, "/product-attributes"),
            json={"values": [{"attribute_id": str(brand.id), "value": "Nike"}]},
            headers=auth(tokens["company"]),
        )
        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "CATALOG_ATTRIBUTE_INACTIVE"


class TestVariantCrud:
    def test_create_variant_with_color_and_size(self, client, tokens, product, axes):
        response = _create(
            client, tokens["company"], product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        )
        assert response.status_code == 200
        body = response.json()
        assert body["combo_key"]
        assert {o["attribute_name"] for o in body["options"]} == {"Color", "Talla"}

    def test_update_variant_options(self, client, tokens, product, axes):
        created = _create(
            client, tokens["company"], product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        ).json()

        response = client.patch(
            _url(product.id, f"/variants/{created['id']}"),
            json={"option_ids": [str(axes["blanco"].id), str(axes["t41"].id)]},
            headers=auth(tokens["company"]),
        )
        assert response.status_code == 200
        values = {o["value"] for o in response.json()["options"]}
        assert values == {"Blanco", "41"}
        assert response.json()["combo_key"] != created["combo_key"]

    def test_duplicate_combination_rejected(self, client, tokens, product, axes):
        _create(
            client, tokens["company"], product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        )
        duplicate = _create(
            client, tokens["company"], product.id,
            [str(axes["t40"].id), str(axes["negro"].id)],
        )
        assert duplicate.status_code == 409
        assert duplicate.json()["detail"]["code"] == "VARIANT_COMBINATION_DUPLICATE"

    def test_incomplete_combination_rejected(self, client, tokens, product, axes):
        response = _create(
            client, tokens["company"], product.id, [str(axes["negro"].id)]
        )
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "VARIANT_COMBINATION_INVALID"

    def test_product_role_option_rejected_as_axis(
        self, client, tokens, product, axes, make_attribute, catalog
    ):
        _, material_options = make_attribute(
            catalog.id, "Material", "product", "select", values=("Cuero",)
        )
        response = _create(
            client, tokens["company"], product.id,
            [str(axes["negro"].id), str(axes["t40"].id), str(material_options[0].id)],
        )
        assert response.status_code == 409

    def test_option_from_other_catalog_rejected(
        self, client, tokens, product, axes, make_attribute, db
    ):
        from app.models.ModelCatalog import Catalog

        other = Catalog(name="Audio")
        db.add(other)
        db.commit()
        db.refresh(other)
        _, foreign_options = make_attribute(
            other.id, "Color", "variant", "color", values=("Rojo",)
        )

        response = _create(
            client, tokens["company"], product.id,
            [str(foreign_options[0].id), str(axes["t40"].id)],
        )
        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "VARIANT_OPTION_MISMATCH"

    def test_unknown_option_rejected(self, client, tokens, product, axes):
        response = _create(
            client, tokens["company"], product.id,
            ["00000000-0000-0000-0000-000000000000", str(axes["t40"].id)],
        )
        assert response.status_code == 404

    def test_inactive_axis_rejected(self, client, tokens, product, axes):
        client.patch(
            f"{ATTR_BASE}/{axes['color'].id}/status",
            json={"is_active": False},
            headers=auth(tokens["owner"]),
        )
        response = _create(
            client, tokens["company"], product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        )
        assert response.status_code == 409
        assert response.json()["detail"]["code"] in {
            "CATALOG_ATTRIBUTE_INACTIVE",
            "VARIANT_OPTION_MISMATCH",
        }

    def test_soft_delete_hides_variant_and_allows_recreate(
        self, client, tokens, product, axes
    ):
        created = _create(
            client, tokens["company"], product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        ).json()

        deleted = client.delete(
            _url(product.id, f"/variants/{created['id']}"),
            headers=auth(tokens["company"]),
        )
        assert deleted.status_code == 200

        active = client.get(
            _url(product.id, "/variants"), headers=auth(tokens["company"])
        )
        assert active.json() == []

        with_deleted = client.get(
            _url(product.id, "/variants?include_deleted=true"),
            headers=auth(tokens["company"]),
        )
        assert with_deleted.json()[0]["deleted_at"] is not None

        recreated = _create(
            client, tokens["company"], product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        )
        assert recreated.status_code == 200

    def test_cannot_edit_deleted_variant(self, client, tokens, product, axes):
        created = _create(
            client, tokens["company"], product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        ).json()
        client.delete(
            _url(product.id, f"/variants/{created['id']}"),
            headers=auth(tokens["company"]),
        )
        response = client.patch(
            _url(product.id, f"/variants/{created['id']}"),
            json={"price": 99},
            headers=auth(tokens["company"]),
        )
        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "VARIANT_ALREADY_DELETED"

    def test_db_rejects_duplicate_active_combo(self, db, product, axes):
        from app.models.ModelVariant import ProductVariant

        db.add(
            ProductVariant(
                name="a", price=10, stock=1, product_id=product.id, combo_key="dup"
            )
        )
        db.commit()
        db.add(
            ProductVariant(
                name="b", price=10, stock=1, product_id=product.id, combo_key="dup"
            )
        )
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()


class TestVariantDiscounts:
    def test_variant_discount_in_effective_price(self, client, tokens, product, axes):
        response = _create(
            client, tokens["company"], product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
            price=200, discount_enable=True, discount_value=25, discount_type="percent",
        )
        assert response.status_code == 200
        assert response.json()["effective_price"] == "150.00"
        assert response.json()["discount_source"] == "variant"

    def test_product_discount_applies_when_variant_has_none(
        self, client, tokens, product, axes
    ):
        client.put(
            _url(product.id, "/discount"),
            json={"discount_enable": True, "discount_value": 10, "discount_type": "percent"},
            headers=auth(tokens["company"]),
        )
        response = _create(
            client, tokens["company"], product.id,
            [str(axes["negro"].id), str(axes["t40"].id)], price=200,
        )
        assert response.json()["effective_price"] == "180.00"
        assert response.json()["discount_source"] == "product"


class TestGenerate:
    def test_cartesian_product(self, client, tokens, product, axes):
        response = client.post(
            _url(product.id, "/variants/generate"),
            json={},
            headers=auth(tokens["company"]),
        )
        assert response.status_code == 200
        combos = response.json()
        assert len(combos) == 4
        pairs = {
            tuple(sorted(o["value"] for o in combo["options"])) for combo in combos
        }
        assert ("40", "Negro") in pairs
        assert all(combo["exists"] is False for combo in combos)

    def test_generate_marks_existing(self, client, tokens, product, axes):
        _create(
            client, tokens["company"], product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        )
        response = client.post(
            _url(product.id, "/variants/generate"),
            json={},
            headers=auth(tokens["company"]),
        )
        existing = [c for c in response.json() if c["exists"]]
        assert len(existing) == 1

    def test_generate_rejects_product_role_axis(
        self, client, tokens, product, axes, brand
    ):
        response = client.post(
            _url(product.id, "/variants/generate"),
            json={"attribute_ids": [str(brand.id)]},
            headers=auth(tokens["company"]),
        )
        assert response.status_code == 409

    def test_generate_rejects_inactive_axis(self, client, tokens, product, axes):
        client.patch(
            f"{ATTR_BASE}/{axes['color'].id}/status",
            json={"is_active": False},
            headers=auth(tokens["owner"]),
        )
        response = client.post(
            _url(product.id, "/variants/generate"),
            json={"attribute_ids": [str(axes["color"].id)]},
            headers=auth(tokens["company"]),
        )
        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "CATALOG_ATTRIBUTE_INACTIVE"


class TestAttributeGuard:
    def test_cannot_delete_attribute_in_use(self, client, tokens, product, axes):
        _create(
            client, tokens["company"], product.id,
            [str(axes["negro"].id), str(axes["t40"].id)],
        )
        response = client.delete(
            f"{ATTR_BASE}/{axes['color'].id}", headers=auth(tokens["owner"])
        )
        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "CATALOG_ATTRIBUTE_IN_USE"

    def test_can_delete_unused_attribute(self, client, tokens, axes):
        response = client.delete(
            f"{ATTR_BASE}/{axes['size'].id}", headers=auth(tokens["owner"])
        )
        assert response.status_code == 200
