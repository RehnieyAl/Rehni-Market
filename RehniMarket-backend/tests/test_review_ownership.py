"""Propiedad de reseñas: el dueño edita y elimina la suya; otro comprador o una empresa no pueden.

Regresión: el `sub` del JWT llega como texto y review.user_id es UUID; la comparación directa
respondía 403 incluso al propio autor.
"""

import pytest

from app.models.ModelOrder import OrderStatusEnum
from tests.conftest import auth
from tests.factories import make_user, place_order, silence_emails


@pytest.fixture()
def review(client, db, tokens, product, address, buyer_wallet, monkeypatch):
    silence_emails(monkeypatch)
    place_order(client, tokens["user"], db, product, address, quantity=1,
                status=OrderStatusEnum.DELIVERED)

    created = client.post(
        "/reviews",
        json={"productId": str(product.id), "rating": 4, "comment": "Bueno"},
        headers=auth(tokens["user"]),
    )
    assert created.status_code == 200, created.text
    return created.json()


def test_owner_can_edit_own_review(client, tokens, review):
    response = client.patch(
        f"/reviews/{review['id']}",
        json={"rating": 5, "comment": "Mejor de lo esperado"},
        headers=auth(tokens["user"]),
    )

    assert response.status_code == 200, response.text
    assert response.json()["rating"] == 5
    assert response.json()["comment"] == "Mejor de lo esperado"


def test_owner_can_delete_own_review(client, tokens, product, review):
    response = client.delete(f"/reviews/{review['id']}", headers=auth(tokens["user"]))
    assert response.status_code == 200, response.text

    listed = client.get(f"/public/products/{product.id}/reviews").json()
    assert all(item["id"] != review["id"] for item in listed["items"])

    eligibility = client.get(
        f"/reviews/eligibility/{product.id}", headers=auth(tokens["user"])
    ).json()
    assert eligibility["already_reviewed"] is False


def test_buyer_can_review_again_after_deleting(client, tokens, product, review):
    client.delete(f"/reviews/{review['id']}", headers=auth(tokens["user"]))

    again = client.post(
        "/reviews",
        json={"productId": str(product.id), "rating": 2, "comment": "Cambié de opinión"},
        headers=auth(tokens["user"]),
    )

    assert again.status_code == 200, again.text
    assert again.json()["rating"] == 2
    listed = client.get(f"/public/products/{product.id}/reviews").json()["items"]
    assert [item["comment"] for item in listed] == ["Cambié de opinión"]

    duplicate = client.post(
        "/reviews",
        json={"productId": str(product.id), "rating": 5},
        headers=auth(tokens["user"]),
    )
    assert duplicate.status_code == 409


def test_deleted_review_cannot_be_deleted_again(client, tokens, review):
    client.delete(f"/reviews/{review['id']}", headers=auth(tokens["user"]))

    again = client.delete(f"/reviews/{review['id']}", headers=auth(tokens["user"]))
    assert again.status_code == 404
    assert again.json()["detail"]["code"] == "REVIEW_NOT_FOUND"


def test_other_buyer_cannot_edit_or_delete(client, db, review):
    _, other_token = make_user(db, "user", "otro@test.local", tell="3000000077")

    edited = client.patch(
        f"/reviews/{review['id']}", json={"rating": 1}, headers=auth(other_token)
    )
    deleted = client.delete(f"/reviews/{review['id']}", headers=auth(other_token))

    assert edited.status_code == 403
    assert edited.json()["detail"]["code"] == "FORBIDDEN"
    assert deleted.status_code == 403
    assert deleted.json()["detail"]["code"] == "FORBIDDEN"


def test_company_cannot_edit_or_delete(client, tokens, review):
    edited = client.patch(
        f"/reviews/{review['id']}", json={"rating": 1}, headers=auth(tokens["company"])
    )
    deleted = client.delete(f"/reviews/{review['id']}", headers=auth(tokens["company"]))

    assert edited.status_code == 403
    assert deleted.status_code == 403


def test_review_still_requires_delivered_purchase(client, db, product):
    _, other_token = make_user(db, "user", "sincompra@test.local", tell="3000000066")

    response = client.post(
        "/reviews",
        json={"productId": str(product.id), "rating": 5},
        headers=auth(other_token),
    )

    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "REVIEW_NOT_ELIGIBLE"
