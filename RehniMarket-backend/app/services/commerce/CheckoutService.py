import traceback
from collections import defaultdict
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelOrder import Order, OrderItem
from app.models.ModelAddress import Address

from app.repository import CartRepository as cart_repo
from app.repository import OrderRepository as order_repo

from app.schemas.SchemaCommerce.SchemaOrder import CheckoutRequest, CheckoutSummaryResponse

from app.services.commerce.CartService import get_or_create_cart, _require_buyer
from app.services.commerce.OrderService import _to_order_response
from app.services.commerce.WalletService import charge_wallet, get_or_create_wallet
from app.services.publicService.Products import _compute_price_fields
from app.services.email.OrderEmailService import send_order_created_email

# Impuesto aplicado sobre el subtotal de cada pedido - IVA estandar de
# Colombia (mismo mercado que el resto del proyecto: precios en COP,
# NIT/DV de empresa, locale es-CO en el frontend). No es un valor
# inventado por producto/pedido: es una tasa fija y explicita, igual para
# todo el checkout.
TAX_RATE = Decimal("0.19")


def checkout_service(
    user_id: UUID, role: str, data: CheckoutRequest, database: Session
) -> CheckoutSummaryResponse:
    _require_buyer(role)

    try:
        cart = get_or_create_cart(database, user_id)

        if not cart.items:
            api_error(400, ErrorCodes.CART_EMPTY, "Tu carrito está vacío.")

        # =================================================
        # DIRECCIÓN OBLIGATORIA (ver ALCANCE > compra obligatoria con
        # dirección) - antes era opcional (`if data.addressId is not
        # None`), lo que permitía crear pedidos sin dirección de entrega.
        # Se valida: existe dirección seleccionada, existe (nombre
        # completo), existe teléfono - mismo código/mensaje pedidos por
        # el frontend para que AddressSelectionModal.tsx pueda
        # reaccionar puntualmente a este error.
        # =================================================

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

        # =================================================
        # VALIDAR STOCK / PRODUCTO ACTIVO Y AGRUPAR POR EMPRESA
        # (ver ALCANCE > Fase 2: "Un pedido pertenece a una sola
        # empresa" - se revalida todo de nuevo aqui, no se confia en lo
        # que ya se valido al agregar al carrito, porque pudo cambiar
        # desde entonces).
        # =================================================

        items_by_company: dict[UUID, list] = defaultdict(list)

        for cart_item in cart.items:
            product = cart_item.product

            if not product or not product.is_active:
                api_error(
                    409,
                    ErrorCodes.PRODUCT_NOT_FOUND,
                    f"El producto '{product.name if product else cart_item.product_id}' ya no está disponible.",
                )

            variant = cart_item.variant

            available_stock = variant.stock if variant else product.stock

            if cart_item.quantity > available_stock:
                api_error(
                    409,
                    ErrorCodes.INSUFFICIENT_STOCK,
                    f"'{product.name}' ya no tiene suficiente stock disponible.",
                )

            priced_entity = variant if variant else product
            unit_price, _, discount_enabled = _compute_price_fields(priced_entity)

            items_by_company[product.company_id].append(
                {
                    "cart_item": cart_item,
                    "product": product,
                    "variant": variant,
                    "unit_price": unit_price,
                    # Snapshot del precio ANTES del descuento (ver ALCANCE
                    # > Detalle de pedido - Descuentos) - solo si de
                    # verdad había un descuento activo en este instante,
                    # si no queda en None (ver ModelOrder.py >
                    # OrderItem.original_unit_price).
                    "original_unit_price": priced_entity.price if discount_enabled else None,
                }
            )

        # =================================================
        # CALCULAR TOTAL GLOBAL Y COBRAR UNA SOLA VEZ EN REHNICOIN
        # =================================================

        grand_total = Decimal("0")
        per_company_totals: dict[UUID, tuple[Decimal, Decimal, Decimal]] = {}

        for company_id, entries in items_by_company.items():
            subtotal = sum(
                (entry["unit_price"] * entry["cart_item"].quantity for entry in entries),
                Decimal("0"),
            )

            tax = (subtotal * TAX_RATE).quantize(Decimal("0.01"))
            total = subtotal + tax

            per_company_totals[company_id] = (subtotal, tax, total)
            grand_total += total

        wallet = get_or_create_wallet(database, user_id)

        if Decimal(wallet.balance) < grand_total:
            api_error(
                402,
                ErrorCodes.INSUFFICIENT_BALANCE,
                "Tu saldo de RehniCoin no alcanza para completar la compra.",
            )

        # =================================================
        # CREAR UN PEDIDO POR EMPRESA + DESCONTAR STOCK
        # =================================================

        created_orders = []

        for company_id, entries in items_by_company.items():
            subtotal, tax, total = per_company_totals[company_id]

            order = Order(
                user_id=user_id,
                company_id=company_id,
                address_id=address.id,
                # Snapshot de la direccion en este instante (ver ALCANCE >
                # "el pedido debe conservar estos datos incluso si el
                # usuario modifica la direccion despues" y ModelOrder.py >
                # Order.delivery_*).
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
                        unit_price=unit_price,
                        original_unit_price=entry["original_unit_price"],
                        quantity=cart_item.quantity,
                        subtotal=unit_price * cart_item.quantity,
                    )
                )

                if variant:
                    variant.stock -= cart_item.quantity
                else:
                    product.stock -= cart_item.quantity

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
            # Correo "Pedido recibido" (ver ALCANCE > Correos de
            # pedidos) - uno por pedido creado, ya que el checkout puede
            # partir el carrito en varios pedidos (uno por empresa).
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
