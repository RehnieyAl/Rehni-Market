"""Crear y editar productos desde el panel de empresa (create-product y update-my-product): campos,
descuento, imágenes, imagen principal, color, categoría y aislamiento entre empresas."""

import uuid
from decimal import Decimal

import pytest

from app.models.ModelCatalog import Catalog
from app.models.ModelColor import ColorVariant
from app.models.ModelProduct import Product, ProductImage
from app.services.NasService import get_nas_service
from tests.conftest import auth
from tests.factories import make_company, make_user, valid_png

CREATE_URL = "/company/dashboard/create-product"
UPDATE_URL = "/company/dashboard/update-my-product/{product_id}"


class _FakeNas:
    def __init__(self):
        self.deleted = []
        self._n = 0

    def upload_file(self, file, path: str):
        self._n += 1
        return {"success": True, "object_name": f"{path}img{self._n}.png", "path": f"uploads/{path}img{self._n}.png"}

    def delete_file(self, object_name: str):
        self.deleted.append(object_name)
        return {"success": True}


@pytest.fixture()
def nas(client):
    fake = _FakeNas()
    client.app.dependency_overrides[get_nas_service] = lambda: fake
    yield fake
    client.app.dependency_overrides.pop(get_nas_service, None)


@pytest.fixture()
def color(db):
    color = ColorVariant(name="Rojo", hex_color="#FF0000")
    db.add(color)
    db.commit()
    db.refresh(color)
    return color


def _png(name):
    return ("imagesProduct", (name, valid_png(), "image/png"))


def _create(client, token, catalog, files=(), **fields):
    form = {
        "nameProduct": "Zapato rojo",
        "catalogId": str(catalog.id),
        "priceProduct": "100",
        "stockProduct": "5",
        "descripcionProduct": "Cómodo",
        "technicalSpecProduct": "[]",
        **fields,
    }
    return client.post(CREATE_URL, data=form, files=list(files) or None, headers=auth(token))


def _update(client, token, product_id, files=(), **fields):
    return client.patch(
        UPDATE_URL.format(product_id=product_id),
        data={k: str(v) for k, v in fields.items()},
        files=list(files) or None,
        headers=auth(token),
    )


def _images(db, product_id):
    db.expire_all()
    return db.query(ProductImage).filter(ProductImage.product_id == product_id).order_by(ProductImage.id).all()


class TestCreateProduct:
    def test_creates_product_with_first_image_as_main(self, client, tokens, db, company, catalog, nas, color):
        response = _create(client, tokens["company"], catalog, [_png("a.png"), _png("b.png")], mainColorId=str(color.id))

        assert response.status_code == 200
        body = response.json()
        assert body["message"] == "Producto creado correctamente"
        assert body["catalog"] == catalog.name
        product = db.get(Product, uuid.UUID(body["product_id"]))
        assert product.company_id == company.id
        assert product.main_color_id == color.id
        assert [image.is_main for image in _images(db, product.id)].count(True) == 1

    @pytest.mark.parametrize(
        "fields, code",
        [
            ({"catalogId": str(uuid.uuid4())}, "CATALOG_NOT_FOUND"),
            ({"mainColorId": str(uuid.uuid4())}, "COLOR_NOT_FOUND"),
        ],
    )
    def test_unknown_references_return_404(self, client, tokens, company, catalog, nas, fields, code):
        response = _create(client, tokens["company"], catalog, **fields)

        assert response.status_code == 404
        assert response.json()["detail"]["code"] == code


class TestUpdateProduct:
    def test_updates_only_sent_fields(self, client, tokens, db, product, nas):
        response = _update(
            client, tokens["company"], product.id,
            nameProduct="Zapato azul", priceProduct=150, stockProduct=9, descripcionProduct="Nuevo", appliesTax=False,
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Producto actualizado correctamente"
        db.refresh(product)
        assert (product.name, product.price, product.stock, product.descripcion, product.applies_tax) == (
            "Zapato azul", Decimal("150"), 9, "Nuevo", False,
        )

    def test_enabling_discount_without_value_is_rejected(self, client, tokens, product, nas):
        response = _update(client, tokens["company"], product.id, discountEnable=True)

        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "VALIDATION_ERROR"

    def test_enabling_discount_with_value(self, client, tokens, db, product, nas):
        response = _update(client, tokens["company"], product.id, discountEnable=True, discountValue=10)

        assert response.status_code == 200
        db.refresh(product)
        assert product.discount_enable is True

    def test_new_images_and_explicit_main_image(self, client, tokens, db, product, nas):
        _update(client, tokens["company"], product.id, files=[_png("a.png"), _png("b.png")])
        images = _images(db, product.id)
        assert len(images) == 2
        assert sum(image.is_main for image in images) == 1, "sin principal se marca la primera"

        second = next(image for image in images if not image.is_main)
        response = _update(client, tokens["company"], product.id, mainImageId=second.id)

        assert response.status_code == 200
        assert [image.id for image in _images(db, product.id) if image.is_main] == [second.id]

    def test_deleting_the_main_image_promotes_another(self, client, tokens, db, product, nas):
        _update(client, tokens["company"], product.id, files=[_png("a.png"), _png("b.png")])
        main = next(image for image in _images(db, product.id) if image.is_main)

        response = _update(client, tokens["company"], product.id, imagesToDeleted=main.id)

        assert response.status_code == 200
        remaining = _images(db, product.id)
        assert len(remaining) == 1 and remaining[0].is_main
        assert nas.deleted == [main.url.removeprefix("uploads/")]

    def test_unknown_main_image_returns_404(self, client, tokens, product, nas):
        response = _update(client, tokens["company"], product.id, mainImageId=uuid.uuid4())

        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "PRODUCT_IMAGE_NOT_FOUND"

    def test_color_can_be_set_and_cleared(self, client, tokens, db, product, nas, color):
        _update(client, tokens["company"], product.id, mainColorId=color.id)
        db.refresh(product)
        assert product.main_color_id == color.id

        _update(client, tokens["company"], product.id, clearMainColor=True)
        db.refresh(product)
        assert product.main_color_id is None

    def test_changing_catalog_reports_the_new_one(self, client, tokens, db, product, nas):
        other = Catalog(name="Deportes")
        db.add(other)
        db.commit()

        response = _update(client, tokens["company"], product.id, catalogId=other.id)

        assert response.status_code == 200
        assert response.json()["catalog"] == "Deportes"

    def test_another_company_cannot_edit_the_product(self, client, db, product, nas):
        owner, other_token = make_user(db, "company", "empresa.dos@test.local")
        make_company(db, owner, "Segunda Co", "800197268")

        response = _update(client, other_token, product.id, nameProduct="Robado")

        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "PRODUCT_NOT_FOUND"
