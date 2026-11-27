"""Checkout del comprador: valida carrito y saldo, descuenta stock (con espejo del padre), cobra RehniCoin y crea un pedido por empresa."""
import logging
from collections import defaultdict
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelOrder import Order, OrderItem
from app.models.ModelAddress import Address
from app.models.ModelProduct import Product
from app.models.ModelVariant import ProductVariant
from app.models.ModelWallet import Wallet

from app.repository import CartRepository as cart_repo
from app.repository import OrderRepository as order_repo
from app.repository import WalletRepository as wallet_repo

from app.schemas.SchemaCommerce.SchemaOrder import CheckoutRequest, CheckoutSummaryResponse

from app.services.commerce.CartService import get_or_create_cart, _require_buyer
from app.services.commerce.OrderService import _to_order_response
from app.services.commerce.WalletService import charge_wallet
from app.services.pricing import resolve_price
from app.services.variants import attributes as attrs
from app.services.email.OrderEmailService import send_order_created_email

from app.core.TaxConfig import compute_tax
from app.services.variants.stock import sync_parent_stock

logger = logging.getLogger(__name__)


def _get_checkout_address(database: Session, user_id: UUID, address_id) -> Address:
    if address_id is None:
        api_error(
            400,
            ErrorCodes.ADDRESS_REQUIRED,
            "Debes registrar una dirección para continuar con la compra.",
        )

    address = (
        database.query(Address)
        .filter(Address.id == address_id, Address.user_id == user_id)
        .first()
    )

    if not address:
        api_error(404, ErrorCodes.ADDRESS_NOT_FOUND, "Dirección no encontrada.")

    if not address.full_name or not address.phone:
        api_error(
            400,
            ErrorCodes.ADDRESS_REQUIRED,
            "Debes registrar una dirección para continuar con la compra.",
        )

    return address


def _checkout_entry(cart_item) -> dict:
    """Valida que el producto y la variante sigan disponibles y fija el precio de compra."""
    product = cart_item.product

    if (
        not product
        or not product.is_active
        or not product.company
        or not product.company.CompanyStatus
    ):
        api_error(
            409,
            ErrorCodes.PRODUCT_NOT_FOUND,
            f"El producto '{product.name if product else cart_item.product_id}' ya no está disponible.",
        )

    variant = cart_item.variant

    if variant is not None and (
        variant.deleted_at is not None or variant.product_id != product.id
    ):
        api_error(
            409,
            ErrorCodes.PRODUCT_NOT_FOUND,
            f"Una variante de '{product.name}' ya no está disponible.",
        )

    price = resolve_price(product, variant)

    return {
        "cart_item": cart_item,
        "product": product,
        "variant": variant,
        "unit_price": price.final_price,
        "original_unit_price": price.base_price if price.discount_enabled else None,
        "applies_tax": product.applies_tax,
    }


def _company_totals(entries) -> tuple[Decimal, Decimal, Decimal]:
    """(subtotal, IVA, total) de los ítems de una empresa; el IVA solo sobre productos gravados."""
    subtotal = sum(
        (entry["unit_price"] * entry["cart_item"].quantity for entry in entries),
        Decimal("0"),
    )

    taxable_subtotal = sum(
        (
            entry["unit_price"] * entry["cart_item"].quantity
            for entry in entries
            if entry["applies_tax"]
        ),
        Decimal("0"),
    )

    tax = compute_tax(taxable_subtotal)

    return subtotal, tax, subtotal + tax


def _line_taxes(entries, order_tax: Decimal) -> list[Decimal]:
    """IVA de cada línea, cuya suma es exactamente el IVA cobrado en el pedido (calculado sobre el
    total gravado). El centavo de redondeo va a la última línea gravada. Se guarda en OrderItem
    para reembolsar lo cobrado aunque el producto cambie después de la venta."""

    taxes = [
        compute_tax(entry["unit_price"] * entry["cart_item"].quantity) if entry["applies_tax"] else Decimal("0")
        for entry in entries
    ]
    taxable = [index for index, entry in enumerate(entries) if entry["applies_tax"]]
    if taxable:
        taxes[taxable[-1]] += order_tax - sum(taxes, Decimal("0"))
    return taxes


def _lock_wallet_for(database: Session, user_id: UUID, amount: Decimal) -> Wallet:
    wallet = wallet_repo.lock_wallet_by_user_id(database, user_id)

    if Decimal(wallet.balance) < amount:
        api_error(
            402,
            ErrorCodes.INSUFFICIENT_BALANCE,
            "Tu saldo de RehniCoin no alcanza para completar la compra.",
        )

    return wallet


def _decrement_stock(database: Session, cart_items) -> None:
    """Descuenta stock con UPDATE condicional; en orden fijo para que dos compras no se bloqueen."""
    stock_decrements = [
        (
            ProductVariant if cart_item.variant_id is not None else Product,
            cart_item.variant_id if cart_item.variant_id is not None else cart_item.product_id,
            cart_item.quantity,
            cart_item.product.name,
        )
        for cart_item in cart_items
    ]

    stock_decrements.sort(key=lambda row: (row[0].__name__, str(row[1])))

    for model, target_id, quantity, product_name in stock_decrements:
        affected = database.execute(
            update(model)
            .where(model.id == target_id, model.stock >= quantity)
            .values(stock=model.stock - quantity)
            .execution_options(synchronize_session=False)
        ).rowcount

        if affected == 0:
            api_error(
                409,
                ErrorCodes.INSUFFICIENT_STOCK,
                f"'{product_name}' ya no tiene suficiente stock disponible.",
            )

    sync_parent_stock(
        database,
        (cart_item.product_id for cart_item in cart_items if cart_item.variant_id is not None),
    )


def _create_company_order(database: Session, user_id: UUID, address: Address, company_id, entries, totals) -> Order:
    subtotal, tax, total = totals

    order = Order(
        user_id=user_id,
        company_id=company_id,
        address_id=address.id,
        delivery_label=address.label,
        delivery_full_name=address.full_name,
        delivery_phone=address.phone,
        delivery_address=address.address,
        delivery_city=address.city,
        delivery_department=address.department,
        subtotal=subtotal,
        tax=tax,
        total=total,
    )

    order_repo.create_order(database, order)

    for entry, line_tax in zip(entries, _line_taxes(entries, tax)):
        product = entry["product"]
        variant = entry["variant"]
        cart_item = entry["cart_item"]
        unit_price = entry["unit_price"]

        database.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                variant_id=variant.id if variant else None,
                product_name=product.name,
                variant_name=variant.name if variant else None,
                attributes_snapshot=(
                    attrs.variant_snapshot(variant) or None
                    if variant
                    else None
                ),
                unit_price=unit_price,
                original_unit_price=entry["original_unit_price"],
                quantity=cart_item.quantity,
                subtotal=unit_price * cart_item.quantity,
                tax_amount=line_tax,
            )
        )

    return order


def checkout_service(
    user_id: UUID, role: str, data: CheckoutRequest, database: Session
) -> CheckoutSummaryResponse:
    _require_buyer(role)

    try:
        cart = get_or_create_cart(database, user_id)

        if not cart.items:
            api_error(400, ErrorCodes.CART_EMPTY, "Tu carrito está vacío.")

        address = _get_checkout_address(database, user_id, data.addressId)

        items_by_company: dict[UUID, list] = defaultdict(list)
        for cart_item in cart.items:
            entry = _checkout_entry(cart_item)
            items_by_company[entry["product"].company_id].append(entry)

        per_company_totals = {
            company_id: _company_totals(entries) for company_id, entries in items_by_company.items()
        }
        grand_total = sum((totals[2] for totals in per_company_totals.values()), Decimal("0"))

        wallet = _lock_wallet_for(database, user_id, grand_total)
        _decrement_stock(database, cart.items)

        created_orders = [
            _create_company_order(database, user_id, address, company_id, entries, per_company_totals[company_id])
            for company_id, entries in items_by_company.items()
        ]

        charge_wallet(
            database,
            user_id,
            grand_total,
            description=f"Compra de {len(cart.items)} producto(s) en RehniMarket",
        )

        cart_repo.clear_cart_items(database, cart.id)

        database.commit()

        for order in created_orders:
            database.refresh(order)
            send_order_created_email(order)

        return CheckoutSummaryResponse(
            orders=[_to_order_response(order) for order in created_orders],
            subtotal=sum((t[0] for t in per_company_totals.values()), Decimal("0")),
            tax=sum((t[1] for t in per_company_totals.values()), Decimal("0")),
            total=grand_total,
            walletBalance=Decimal(wallet.balance),
        )

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        logger.exception("Error inesperado")
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")
