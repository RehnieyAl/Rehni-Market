from tests.conftest import auth

ATTR_BASE = "/admin/dashboard/catalog-attributes"


def _create_attribute(client, token, catalog_id, **overrides):
    payload = {"name": "Talla", "role": "variant", "input_type": "select"}
    payload.update(overrides)
    return client.post(
        f"/admin/dashboard/catalogs/{catalog_id}/catalog-attributes",
        json=payload,
        headers=auth(token),
    )


class TestPermissions:
    def test_anonymous_is_rejected(self, client, catalog):
        response = client.get(
            f"/admin/dashboard/catalogs/{catalog.id}/catalog-attributes"
        )
        assert response.status_code == 401

    def test_admin_can_manage(self, client, catalog, tokens):
        response = _create_attribute(client, tokens["admin"], catalog.id)
        assert response.status_code == 201

    def test_owner_can_manage(self, client, catalog, tokens):
        response = _create_attribute(client, tokens["owner"], catalog.id)
        assert response.status_code == 201

    def test_company_is_forbidden(self, client, catalog, tokens):
        response = _create_attribute(client, tokens["company"], catalog.id)
        assert response.status_code == 403

    def test_user_is_forbidden(self, client, catalog, tokens):
        response = _create_attribute(client, tokens["user"], catalog.id)
        assert response.status_code == 403


class TestAttributeCrud:
    def test_create_product_and_variant_attributes(self, client, catalog, tokens):
        product_attr = _create_attribute(
            client, tokens["admin"], catalog.id, name="Marca", role="product",
            input_type="text",
        )
        variant_attr = _create_attribute(
            client, tokens["admin"], catalog.id, name="Color", role="variant",
            input_type="color",
        )
        assert product_attr.json()["role"] == "product"
        assert variant_attr.json()["role"] == "variant"

    def test_get_attribute(self, client, catalog, tokens):
        created = _create_attribute(client, tokens["admin"], catalog.id).json()
        response = client.get(
            f"{ATTR_BASE}/{created['id']}", headers=auth(tokens["admin"])
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Talla"
        assert response.json()["options"] == []

    def test_update_attribute(self, client, catalog, tokens):
        created = _create_attribute(client, tokens["admin"], catalog.id).json()
        response = client.patch(
            f"{ATTR_BASE}/{created['id']}",
            json={"name": "Numero de calzado", "position": 3},
            headers=auth(tokens["admin"]),
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Numero de calzado"
        assert response.json()["position"] == 3

    def test_activate_and_deactivate_attribute(self, client, catalog, tokens):
        created = _create_attribute(client, tokens["admin"], catalog.id).json()

        off = client.patch(
            f"{ATTR_BASE}/{created['id']}/status",
            json={"is_active": False},
            headers=auth(tokens["admin"]),
        )
        assert off.json()["is_active"] is False

        on = client.patch(
            f"{ATTR_BASE}/{created['id']}/status",
            json={"is_active": True},
            headers=auth(tokens["admin"]),
        )
        assert on.json()["is_active"] is True

    def test_delete_attribute_removes_its_options(self, client, catalog, tokens):
        created = _create_attribute(client, tokens["admin"], catalog.id).json()
        client.post(
            f"{ATTR_BASE}/{created['id']}/options",
            json={"value": "40"},
            headers=auth(tokens["admin"]),
        )

        deleted = client.delete(
            f"{ATTR_BASE}/{created['id']}", headers=auth(tokens["admin"])
        )
        assert deleted.status_code == 200

        missing = client.get(
            f"{ATTR_BASE}/{created['id']}", headers=auth(tokens["admin"])
        )
        assert missing.status_code == 404


class TestCatalogAssociation:
    def test_attribute_is_scoped_to_its_catalog(self, client, catalog, tokens, db):
        from app.models.ModelCatalog import Catalog

        other = Catalog(name="Audio")
        db.add(other)
        db.commit()
        db.refresh(other)

        _create_attribute(client, tokens["admin"], catalog.id, name="Talla")

        this_catalog = client.get(
            f"/admin/dashboard/catalogs/{catalog.id}/catalog-attributes",
            headers=auth(tokens["admin"]),
        )
        other_catalog = client.get(
            f"/admin/dashboard/catalogs/{other.id}/catalog-attributes",
            headers=auth(tokens["admin"]),
        )
        assert len(this_catalog.json()) == 1
        assert other_catalog.json() == []

    def test_list_filters_by_role(self, client, catalog, tokens):
        _create_attribute(
            client, tokens["admin"], catalog.id, name="Marca", role="product",
            input_type="text",
        )
        _create_attribute(
            client, tokens["admin"], catalog.id, name="Color", role="variant",
            input_type="color",
        )

        variants = client.get(
            f"/admin/dashboard/catalogs/{catalog.id}/catalog-attributes?role=variant",
            headers=auth(tokens["admin"]),
        )
        assert [a["name"] for a in variants.json()] == ["Color"]

    def test_unknown_catalog_is_404(self, client, tokens):
        response = client.get(
            "/admin/dashboard/catalogs/00000000-0000-0000-0000-000000000000/catalog-attributes",
            headers=auth(tokens["admin"]),
        )
        assert response.status_code == 404


class TestOptions:
    def test_create_and_list_options(self, client, catalog, tokens):
        attr = _create_attribute(client, tokens["admin"], catalog.id).json()

        for value in ("40", "41", "42"):
            created = client.post(
                f"{ATTR_BASE}/{attr['id']}/options",
                json={"value": value},
                headers=auth(tokens["admin"]),
            )
            assert created.status_code == 201

        detail = client.get(
            f"{ATTR_BASE}/{attr['id']}", headers=auth(tokens["admin"])
        )
        assert [o["value"] for o in detail.json()["options"]] == ["40", "41", "42"]

    def test_update_option(self, client, catalog, tokens):
        attr = _create_attribute(client, tokens["admin"], catalog.id).json()
        option = client.post(
            f"{ATTR_BASE}/{attr['id']}/options",
            json={"value": "40"},
            headers=auth(tokens["admin"]),
        ).json()

        response = client.patch(
            f"/admin/dashboard/catalog-attribute-options/{option['id']}",
            json={"value": "40 EU", "position": 1},
            headers=auth(tokens["admin"]),
        )
        assert response.status_code == 200
        assert response.json()["value"] == "40 EU"

    def test_delete_option(self, client, catalog, tokens):
        attr = _create_attribute(client, tokens["admin"], catalog.id).json()
        option = client.post(
            f"{ATTR_BASE}/{attr['id']}/options",
            json={"value": "40"},
            headers=auth(tokens["admin"]),
        ).json()

        deleted = client.delete(
            f"/admin/dashboard/catalog-attribute-options/{option['id']}",
            headers=auth(tokens["admin"]),
        )
        assert deleted.status_code == 200

        detail = client.get(
            f"{ATTR_BASE}/{attr['id']}", headers=auth(tokens["admin"])
        )
        assert detail.json()["options"] == []

    def test_color_option_stores_hex(self, client, catalog, tokens):
        attr = _create_attribute(
            client, tokens["admin"], catalog.id, name="Color", input_type="color"
        ).json()
        response = client.post(
            f"{ATTR_BASE}/{attr['id']}/options",
            json={"value": "Negro", "hex_color": "#000000"},
            headers=auth(tokens["admin"]),
        )
        assert response.status_code == 201
        assert response.json()["hex_color"] == "#000000"


class TestValidations:
    def test_duplicate_attribute_name_is_rejected(self, client, catalog, tokens):
        _create_attribute(client, tokens["admin"], catalog.id, name="Talla")
        duplicate = _create_attribute(
            client, tokens["admin"], catalog.id, name="talla"
        )
        assert duplicate.status_code == 409
        assert duplicate.json()["detail"]["code"] == "CATALOG_ATTRIBUTE_ALREADY_EXISTS"

    def test_duplicate_option_value_is_rejected(self, client, catalog, tokens):
        attr = _create_attribute(client, tokens["admin"], catalog.id).json()
        client.post(
            f"{ATTR_BASE}/{attr['id']}/options",
            json={"value": "40"},
            headers=auth(tokens["admin"]),
        )
        duplicate = client.post(
            f"{ATTR_BASE}/{attr['id']}/options",
            json={"value": "40"},
            headers=auth(tokens["admin"]),
        )
        assert duplicate.status_code == 409
        assert (
            duplicate.json()["detail"]["code"]
            == "CATALOG_ATTRIBUTE_OPTION_ALREADY_EXISTS"
        )

    def test_invalid_role_is_rejected(self, client, catalog, tokens):
        response = _create_attribute(
            client, tokens["admin"], catalog.id, role="banner"
        )
        assert response.status_code == 422

    def test_options_not_allowed_on_text_attribute(self, client, catalog, tokens):
        attr = _create_attribute(
            client, tokens["admin"], catalog.id, name="Marca", role="product",
            input_type="text",
        ).json()
        response = client.post(
            f"{ATTR_BASE}/{attr['id']}/options",
            json={"value": "Nike"},
            headers=auth(tokens["admin"]),
        )
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "CATALOG_ATTRIBUTE_TYPE_MISMATCH"

    def test_color_option_requires_hex(self, client, catalog, tokens):
        attr = _create_attribute(
            client, tokens["admin"], catalog.id, name="Color", input_type="color"
        ).json()
        response = client.post(
            f"{ATTR_BASE}/{attr['id']}/options",
            json={"value": "Negro"},
            headers=auth(tokens["admin"]),
        )
        assert response.status_code == 422

    def test_cannot_switch_type_while_options_exist(self, client, catalog, tokens):
        attr = _create_attribute(client, tokens["admin"], catalog.id).json()
        client.post(
            f"{ATTR_BASE}/{attr['id']}/options",
            json={"value": "40"},
            headers=auth(tokens["admin"]),
        )
        response = client.patch(
            f"{ATTR_BASE}/{attr['id']}",
            json={"input_type": "text"},
            headers=auth(tokens["admin"]),
        )
        assert response.status_code == 409

    def test_unknown_attribute_is_404(self, client, tokens):
        response = client.get(
            f"{ATTR_BASE}/00000000-0000-0000-0000-000000000000",
            headers=auth(tokens["admin"]),
        )
        assert response.status_code == 404
