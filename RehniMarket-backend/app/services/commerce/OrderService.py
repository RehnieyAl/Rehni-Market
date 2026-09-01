import traceback
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelCompany import Company
from app.models.ModelOrder import Order, OrderStatusEnum
from app.models.ModelProduct import Product
from app.models.ModelShippingCarrier import ShippingCarrier
from app.models.ModelUser import Users
from app.models.ModelVariant import ProductVariant

from app.repository import OrderRepository as repo
from app.repository import WalletRepository as wallet_repo

from app.schemas.SchemaCommerce.SchemaOrder import (
    OrderResponse,
    OrderItemResponse,
    OrderAddressResponse,
    OrdersPaginatedResponse,
    OrderStatusCountsResponse,
    OrderShippingCarrierResponse,
    SetOrderShippingRequest,
)

from app.services.NasService import build_media_url
from app.services.commerce.WalletService import refund_wallet
from app.services.email.OrderEmailService import send_order_status_email


ALLOWED_TRANSITIONS: dict[OrderStatusEnum, set[OrderStatusEnum]] = {
    OrderStatusEnum.PENDING: {OrderStatusEnum.PROCESSING, OrderStatusEnum.CANCELLED},
    OrderStatusEnum.PAID: {OrderStatusEnum.PROCESSING, OrderStatusEnum.CANCELLED},
    OrderStatusEnum.PROCESSING: {OrderStatusEnum.SHIPPED},
    OrderStatusEnum.SHIPPED: {OrderStatusEnum.DELIVERED},
    OrderStatusEnum.DELIVERED: set(),
    OrderStatusEnum.CANCELLED: set(),
}

CANCELLABLE_STATUSES = {OrderStatusEnum.PENDING, OrderStatusEnum.PAID}

REFUNDABLE_ON_SUSPENSION_STATUSES = {
    OrderStatusEnum.PENDING,
    OrderStatusEnum.PAID,
    OrderStatusEnum.PROCESSING,
}


def _restore_stock_for_order(database: Session, order: Order) -> None:
    for item in order.items:
        if item.variant_id:
            variant = (
                database.query(ProductVariant)
                .filter(ProductVariant.id == item.variant_id)
                .first()
            )

            if variant:
                variant.stock += item.quantity
        else:
            product = (
                database.query(Product)
                .filter(Product.id == item.product_id)
                .first()
            )

            if product:
                product.stock += item.quantity


def _to_order_response(order: Order) -> OrderResponse:
    items = [
        OrderItemResponse(
            id=item.id,
            productId=item.product_id,
            variantId=item.variant_id,
            productName=item.product_name,
            variantName=item.variant_name,
            attributes=item.attributes_snapshot or None,
            unitPrice=item.unit_price,
            originalUnitPrice=item.original_unit_price,
            quantity=item.quantity,
            subtotal=item.subtotal,
        )
        for item in order.items
    ]

    buyer = order.user

    buyer_photo = (
        build_media_url(f"uploads/{buyer.profileImagen}") if buyer.profileImagen else None
    )

    delivery_address = (
        OrderAddressResponse(
            label=order.delivery_label,
            fullName=order.delivery_full_name,
            department=order.delivery_department,
            city=order.delivery_city,
            address=order.delivery_address,
            phone=order.delivery_phone,
        )
        if order.delivery_address
        else None
    )

    buyer_phone = order.delivery_phone or buyer.tell

    shipping_carrier = (
        OrderShippingCarrierResponse(
            id=order.shipping_carrier.id,
            name=order.shipping_carrier.name,
            trackingUrl=order.shipping_carrier.tracking_url,
        )
        if order.shipping_carrier
        else None
    )

    return OrderResponse(
        id=order.id,
        reference=f"RM-{order.order_number:06d}",
        status=order.status.value,
        companyId=order.company_id,
        companyName=order.company.nameCompany,
        subtotal=order.subtotal,
        tax=order.tax,
        total=order.total,
        createdAt=order.created_at,
        items=items,
        firstItemName=items[0].productName if items else None,
        totalItems=sum(item.quantity for item in items),
        buyerName=buyer.fullName,
        buyerEmail=buyer.email,
        buyerPhoto=buyer_photo,
        buyerPhone=buyer_phone,
        deliveryAddress=delivery_address,
        shippingCarrier=shipping_carrier,
        trackingNumber=order.tracking_number,
    )


def list_my_orders_service(
    user_id: UUID, role: str, database: Session, page: int = 1, limit: int = 10
) -> OrdersPaginatedResponse:
    if role != "user":
        api_error(403, ErrorCodes.PURCHASE_NOT_ALLOWED, "Esta cuenta no tiene pedidos.")

    orders, total = repo.list_user_orders(database, user_id, page, limit)

    return OrdersPaginatedResponse(
        items=[_to_order_response(order) for order in orders],
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit if total else 0,
    )


def get_my_order_detail_service(
    user_id: UUID, role: str, order_id: UUID, database: Session
) -> OrderResponse:
    if role != "user":
        api_error(403, ErrorCodes.PURCHASE_NOT_ALLOWED, "Esta cuenta no tiene pedidos.")

    order = repo.get_user_order(database, order_id, user_id)

    if not order:
        api_error(404, ErrorCodes.ORDER_NOT_FOUND, "Pedido no encontrado.")

    return _to_order_response(order)


def cancel_my_order_service(
    user_id: UUID, role: str, order_id: UUID, database: Session
) -> OrderResponse:
    if role != "user":
        api_error(403, ErrorCodes.PURCHASE_NOT_ALLOWED, "Esta cuenta no tiene pedidos.")

    try:
        order = repo.get_user_order(database, order_id, user_id)

        if not order:
            api_error(404, ErrorCodes.ORDER_NOT_FOUND, "Pedido no encontrado.")

        if order.status == OrderStatusEnum.CANCELLED:
            api_error(
                409,
                ErrorCodes.ORDER_ALREADY_CANCELLED,
                "Este pedido ya fue cancelado y reembolsado.",
            )

        if order.status not in CANCELLABLE_STATUSES:
            api_error(
                409,
                ErrorCodes.INVALID_ORDER_STATUS_TRANSITION,
                "Este pedido ya está en preparación y no se puede cancelar.",
            )

        refunded_amount = Decimal("0")

        if (
            order.total > Decimal("0")
            and not wallet_repo.has_order_been_refunded(database, order.id)
        ):
            refund_wallet(
                database,
                order.user_id,
                order.total,
                description=(
                    f"Reembolso por cancelación del pedido RM-{order.order_number:06d}."
                ),
                order_id=order.id,
            )
            refunded_amount = order.total

        _restore_stock_for_order(database, order)

        order.status = OrderStatusEnum.CANCELLED

        database.commit()
        database.refresh(order)

        send_order_status_email(
            order,
            reason="Cancelación solicitada por el comprador.",
            refunded_amount=refunded_amount if refunded_amount > Decimal("0") else None,
        )

        return _to_order_response(order)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def _resolve_company(database: Session, user_id: UUID):
    user = database.query(Users).filter(Users.id == user_id).first()

    if not user or not user.company:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada.")

    return user.company


def list_company_orders_service(
    user_id: UUID,
    database: Session,
    page: int = 1,
    limit: int = 10,
    statuses: list[str] | None = None,
    search: str | None = None,
) -> OrdersPaginatedResponse:
    """Pedidos de la empresa; filtra por varios estados a la vez y busca por
    referencia/correo/nombre del comprador."""

    company = _resolve_company(database, user_id)

    valid_statuses: list[OrderStatusEnum] | None = None

    if statuses:
        valid_statuses = []
        for raw in statuses:
            try:
                valid_statuses.append(OrderStatusEnum(raw))
            except ValueError:
                continue

    orders, total = repo.list_company_orders(
        database, company.id, page, limit, valid_statuses, search
    )

    return OrdersPaginatedResponse(
        items=[_to_order_response(order) for order in orders],
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit if total else 0,
    )


def get_company_order_detail_service(
    user_id: UUID, order_id: UUID, database: Session
) -> OrderResponse:
    company = _resolve_company(database, user_id)

    order = repo.get_company_order(database, order_id, company.id)

    if not order:
        api_error(404, ErrorCodes.ORDER_NOT_FOUND, "Pedido no encontrado.")

    return _to_order_response(order)


def get_company_order_status_counts_service(
    user_id: UUID, database: Session
) -> OrderStatusCountsResponse:
    """Contadores por pestaña: PENDIENTES = PENDING, EN PROCESO = PROCESSING + SHIPPED,
    COMPLETADOS = DELIVERED, CANCELADOS = CANCELLED."""

    company = _resolve_company(database, user_id)

    counts = repo.count_company_orders_by_status(database, company.id)

    return OrderStatusCountsResponse(
        all=sum(counts.values()),
        pending=counts.get(OrderStatusEnum.PENDING, 0),
        inProgress=(
            counts.get(OrderStatusEnum.PROCESSING, 0)
            + counts.get(OrderStatusEnum.SHIPPED, 0)
        ),
        completed=counts.get(OrderStatusEnum.DELIVERED, 0),
        cancelled=counts.get(OrderStatusEnum.CANCELLED, 0),
    )


def update_company_order_status_service(
    user_id: UUID, order_id: UUID, new_status: str, database: Session
) -> OrderResponse:
    company = _resolve_company(database, user_id)

    try:
        order = repo.get_company_order(database, order_id, company.id)

        if not order:
            api_error(404, ErrorCodes.ORDER_NOT_FOUND, "Pedido no encontrado.")

        try:
            target = OrderStatusEnum(new_status)
        except ValueError:
            api_error(400, ErrorCodes.VALIDATION_ERROR, "Estado de pedido inválido.")

        allowed = ALLOWED_TRANSITIONS.get(order.status, set())

        if target not in allowed:
            api_error(
                409,
                ErrorCodes.INVALID_ORDER_STATUS_TRANSITION,
                f"No se puede pasar de '{order.status.value}' a '{target.value}'.",
            )

        order.status = target

        database.commit()
        database.refresh(order)

        send_order_status_email(order)

        return _to_order_response(order)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def set_company_order_shipping_service(
    user_id: UUID,
    order_id: UUID,
    data: SetOrderShippingRequest,
    database: Session,
) -> OrderResponse:
    """La empresa asigna transportadora + guía a uno de SUS pedidos. No cambia el
    estado del pedido: solo completa la información de envío del estado SHIPPED."""

    company = _resolve_company(database, user_id)

    try:
        order = repo.get_company_order(database, order_id, company.id)

        if not order:
            api_error(404, ErrorCodes.ORDER_NOT_FOUND, "Pedido no encontrado.")

        carrier = database.get(ShippingCarrier, data.shippingCarrierId)

        if not carrier:
            api_error(
                404,
                ErrorCodes.SHIPPING_CARRIER_NOT_FOUND,
                "Transportadora no encontrada.",
            )

        if not carrier.is_active and order.shipping_carrier_id != carrier.id:
            api_error(
                409,
                ErrorCodes.SHIPPING_CARRIER_INACTIVE,
                "La transportadora seleccionada está inactiva.",
            )

        order.shipping_carrier_id = carrier.id
        order.tracking_number = data.trackingNumber

        database.commit()
        database.refresh(order)

        return _to_order_response(order)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def cancel_and_refund_company_orders_for_suspension(
    database: Session, company: Company, reason: str
) -> list[Order]:
    """Cancela y reembolsa (RehniCoin) los pedidos de `company` en PENDING/PAID/PROCESSING.
    El monto es siempre order.total (snapshot del checkout) y se devuelve el stock de cada
    ítem por la misma relación con que se descontó. No hace commit ni envía correos: los
    controla el llamador (todo debe ser una sola transacción). Devuelve los pedidos afectados."""

    orders = repo.list_company_orders_by_statuses(
        database, company.id, REFUNDABLE_ON_SUSPENSION_STATUSES
    )

    refunded_orders: list[Order] = []

    for order in orders:
        if wallet_repo.has_order_been_refunded(database, order.id):
            continue

        refund_wallet(
            database,
            order.user_id,
            order.total,
            description=(
                f"Reembolso por suspensión de la empresa {company.nameCompany} "
                f"(pedido RM-{order.order_number:06d})."
            ),
            order_id=order.id,
        )

        order.status = OrderStatusEnum.CANCELLED

        _restore_stock_for_order(database, order)

        refunded_orders.append(order)

    return refunded_orders
