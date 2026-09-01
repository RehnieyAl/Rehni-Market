import traceback
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

from app.schemas.SchemaCommerce.SchemaOrder import CheckoutRequest, CheckoutSummaryResponse

from app.services.commerce.CartService import get_or_create_cart, _require_buyer
from app.services.commerce.OrderService import _to_order_response
from app.services.commerce.WalletService import charge_wallet, get_or_create_wallet
from app.services.pricing import resolve_price
from app.services.variants import attributes as attrs
from app.services.email.OrderEmailService import send_order_created_email

from app.core.TaxConfig import compute_tax


def checkout_service(
    user_id: UUID, role: str, data: CheckoutRequest, database: Session
) -> CheckoutSummaryResponse:
    _require_buyer(role)

    try:
        cart = get_or_create_cart(database, user_id)

        if not cart.items:
            api_error(400, ErrorCodes.CART_EMPTY, "Tu carrito está vacío.")

        if data.addressId is None:
            api_error(
                400,
                ErrorCodes.ADDRESS_REQUIRED,
                "Debes registrar una dirección para continuar con la compra.",
            )

        address = (
            database.query(Address)
            .filter(Address.id == data.addressId, Address.user_id == user_id)
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

        items_by_company: dict[UUID, list] = defaultdict(list)

        for cart_item in cart.items:
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

            items_by_company[product.company_id].append(
                {
                    "cart_item": cart_item,
                    "product": product,
                    "variant": variant,
                    "unit_price": price.final_price,
                    "original_unit_price": price.base_price if price.discount_enabled else None,
                    "applies_tax": product.applies_tax,
                }
            )

        grand_total = Decimal("0")
        per_company_totals: dict[UUID, tuple[Decimal, Decimal, Decimal]] = {}

        for company_id, entries in items_by_company.items():
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
            total = subtotal + tax

            per_company_totals[company_id] = (subtotal, tax, total)
            grand_total += total

        get_or_create_wallet(database, user_id)
        wallet = (
            database.query(Wallet)
            .filter(Wallet.user_id == user_id)
            .with_for_update()
            .populate_existing()
            .first()
        )

        if Decimal(wallet.balance) < grand_total:
            api_error(
                402,
                ErrorCodes.INSUFFICIENT_BALANCE,
                "Tu saldo de RehniCoin no alcanza para completar la compra.",
            )

        stock_decrements: list[tuple] = []
        for cart_item in cart.items:
            if cart_item.variant_id is not None:
                stock_decrements.append(
                    (
                        ProductVariant,
                        cart_item.variant_id,
                        cart_item.quantity,
                        cart_item.product.name,
                    )
                )
            else:
                stock_decrements.append(
                    (
                        Product,
                        cart_item.product_id,
                        cart_item.quantity,
                        cart_item.product.name,
                    )
                )

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

        created_orders = []

        for company_id, entries in items_by_company.items():
            subtotal, tax, total = per_company_totals[company_id]

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

            for entry in entries:
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
                    )
                )

            created_orders.append(order)

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
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")
