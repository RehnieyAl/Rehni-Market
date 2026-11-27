"""Product.stock (espejo) sigue a la suma de variantes vivas tras comprar, cancelar y en compras concurrentes.

Regresión: el checkout y la cancelación solo movían ProductVariant.stock; la tarjeta pública
mostraba el stock viejo del padre (en producción, 2 unidades con la única variante en 0).
"""

import threading

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import sessionmaker

from app.models.ModelAddress import Address
from app.models.ModelCart import Cart, CartItem
from app.models.ModelOrder import Order
from app.models.ModelProduct import Product
from app.models.ModelVariant import ProductVariant
from app.models.ModelWallet import Wallet
from app.schemas.SchemaCommerce.SchemaOrder import CheckoutRequest
from app.services.commerce.CheckoutService import checkout_service
from tests.conftest import auth
from tests.factories import VALID_ADDRESS, make_user, silence_emails


@pytest.fixture()
def variant_product(db, company, catalog):
    product = Product(
        name="Audífonos", price=100, descripcion="d", stock=7, has_variants=True,
        company_id=company.id, catalog_id=catalog.id,
    )
    db.add(product)
    db.flush()
    variants = [
        ProductVariant(product_id=product.id, name="Negro", price=100, stock=3),
        ProductVariant(product_id=product.id, name="Blanco", price=120, stock=4),
    ]
    db.add_all(variants)
    db.commit()
    return product, variants


def _stocks(db, product, variants):
    db.expire_all()
    return db.get(Product, product.id).stock, [db.get(ProductVariant, v.id).stock for v in variants]


def _buy(client, token, address, product, variant, quantity):
    added = client.post(
        "/cart/add",
        json={"productId": str(product.id), "variantId": str(variant.id), "quantity": quantity},
        headers=auth(token),
    )
    assert added.status_code == 200, added.text
    response = client.post("/checkout", json={"addressId": str(address.id)}, headers=auth(token))
    assert response.status_code == 200, response.text
    return response.json()["orders"][0]


def test_checkout_updates_parent_stock(
    client, db, tokens, address, buyer_wallet, variant_product, monkeypatch
):
    silence_emails(monkeypatch)
    product, variants = variant_product

    _buy(client, tokens["user"], address, product, variants[0], 2)

    assert _stocks(db, product, variants) == (5, [1, 4])
    card = client.get("/public/products", params={"search": "Audífonos"}).json()["products"][0]
    assert card["stock"] == 5


def test_selling_out_every_variant_leaves_parent_at_zero(
    client, db, tokens, address, buyer_wallet, variant_product, monkeypatch
):
    silence_emails(monkeypatch)
    product, variants = variant_product

    _buy(client, tokens["user"], address, product, variants[0], 3)
    _buy(client, tokens["user"], address, product, variants[1], 4)

    assert _stocks(db, product, variants) == (0, [0, 0])
    catalogs = client.get("/public/catalogs").json()
    assert all(catalog["product_count"] == 0 for catalog in catalogs)


def test_cancel_restores_variant_and_parent_stock(
    client, db, tokens, address, buyer_wallet, variant_product, monkeypatch
):
    silence_emails(monkeypatch)
    product, variants = variant_product
    order = _buy(client, tokens["user"], address, product, variants[1], 3)

    cancelled = client.patch(f"/orders/{order['id']}/cancel", headers=auth(tokens["user"]))

    assert cancelled.status_code == 200, cancelled.text
    assert _stocks(db, product, variants) == (7, [3, 4])


def test_cancel_restores_stock_of_products_without_variants(
    client, db, tokens, address, buyer_wallet, product, monkeypatch
):
    silence_emails(monkeypatch)
    db.query(Product).filter(Product.id == product.id).update({"stock": 5})
    db.commit()
    client.post(
        "/cart/add", json={"productId": str(product.id), "quantity": 2}, headers=auth(tokens["user"])
    )
    order = client.post(
        "/checkout", json={"addressId": str(address.id)}, headers=auth(tokens["user"])
    ).json()["orders"][0]
    db.expire_all()
    assert db.get(Product, product.id).stock == 3

    client.patch(f"/orders/{order['id']}/cancel", headers=auth(tokens["user"]))

    db.expire_all()
    assert db.get(Product, product.id).stock == 5


def test_concurrent_checkouts_of_different_variants_keep_the_mirror_exact(
    db, engine, users, variant_product, monkeypatch
):
    """Dos compradores pagan a la vez variantes distintas del mismo producto: ambos ganan y el
    padre termina con la suma real (sin perder el descuento del otro)."""

    silence_emails(monkeypatch)
    product, variants = variant_product
    second, _ = make_user(db, "user", "buyer2@test.local", tell="3000000001")
    buyers = [(users["user"].id, variants[0]), (second.id, variants[1])]

    addresses = {}
    for user_id, variant in buyers:
        db.add(Wallet(user_id=user_id, balance=1_000_000))
        address = Address(
            user_id=user_id,
            label=VALID_ADDRESS["label"],
            full_name=VALID_ADDRESS["fullName"],
            country=VALID_ADDRESS["country"],
            department=VALID_ADDRESS["department"],
            city=VALID_ADDRESS["city"],
            address=VALID_ADDRESS["address"],
            phone=VALID_ADDRESS["phone"],
        )
        db.add(address)
        db.flush()
        addresses[user_id] = address.id
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.flush()
        db.add(CartItem(cart_id=cart.id, product_id=product.id, variant_id=variant.id, quantity=2))
    db.commit()

    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    barrier = threading.Barrier(len(buyers))
    results = {}

    def worker(user_id):
        session = Session()
        try:
            barrier.wait(timeout=10)
            checkout_service(user_id, "user", CheckoutRequest(addressId=addresses[user_id]), session)
            results[user_id] = "ok"
        except HTTPException as exc:
            results[user_id] = exc.detail
        except Exception as exc:
            results[user_id] = repr(exc)
        finally:
            session.close()

    threads = [threading.Thread(target=worker, args=(user_id,)) for user_id, _ in buyers]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=30)

    assert list(results.values()) == ["ok", "ok"], results
    assert _stocks(db, product, variants) == (3, [1, 2])
    assert db.query(Order).count() == 2
