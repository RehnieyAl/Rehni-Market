"""Orquestador de correos de pedidos: extrae los datos del `Order` y llama a la función
de EmailOrder.py que corresponda. Se llama directo, sin try/except: send_email nunca
revienta el flujo que lo llama."""

from decimal import Decimal

from app.Config import config

from app.models.ModelOrder import Order, OrderStatusEnum

from app.services.NasService import build_media_url

from app.services.email.template.EmailOrder import (
    EmailOrderCreated,
    EmailOrderProcessing,
    EmailOrderShipped,
    EmailOrderDelivered,
    EmailOrderCancelled,
)

# Etiquetas en español por estado, alineadas con ORDER_STATUS_LABEL del frontend.
STATUS_LABELS = {
    OrderStatusEnum.PENDING: "Pendiente",
    OrderStatusEnum.PAID: "Pagado",
    OrderStatusEnum.PROCESSING: "En preparación",
    OrderStatusEnum.SHIPPED: "Enviado",
    OrderStatusEnum.DELIVERED: "Entregado",
    OrderStatusEnum.CANCELLED: "Cancelado",
}


def _format_date(value) -> str:
    # dd/mm/aaaa hh:mm sin depender del locale del sistema.
    return value.strftime("%d/%m/%Y %H:%M") if value else ""


def _reference(order: Order) -> str:
    # Nunca se expone order.id (UUID) al comprador.
    return f"RM-{order.order_number:06d}"


def _build_address(order: Order) -> dict | None:
    # Snapshot guardado en el pedido, nunca order.address en vivo.
    if not order.delivery_address:
        return None

    return {
        "full_name": order.delivery_full_name,
        "phone": order.delivery_phone,
        "address": order.delivery_address,
        "city": order.delivery_city,
        "department": order.delivery_department,
    }


def _build_items(order: Order) -> list[dict]:
    items = []

    for item in order.items:
        image_url = None
        product = item.product

        # Lee la imagen actual del producto (OrderItem no la snapshotea); se omite si no hay.
        if product:
            main_image = next((img for img in product.images if img.is_main), None)

            if main_image:
                image_url = build_media_url(main_image.url)

        items.append(
            {
                "image_url": image_url,
                "name": item.product_name,
                "variant_name": item.variant_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal,
            }
        )

    return items


def send_order_created_email(order: Order) -> None:
    items = _build_items(order)

    EmailOrderCreated(
        to_email=order.user.email,
        buyer_name=order.user.fullName,
        reference=_reference(order),
        status_label=STATUS_LABELS.get(order.status, order.status.value),
        created_at_label=_format_date(order.created_at),
        company_name=order.company.nameCompany,
        address=_build_address(order),
        items=items,
        distinct_products=len(items),
        total_units=sum(item["quantity"] for item in items),
        total=order.total,
    )


def send_order_status_email(
    order: Order,
    reason: str | None = None,
    refunded_amount: Decimal | None = None,
    company_name: str | None = None,
) -> None:
    """Se llama tras cambiar `order.status`. Solo PROCESSING/SHIPPED/DELIVERED/CANCELLED
    disparan correo; `company_name` solo lo pasa el flujo de suspensión de empresa."""

    reference = _reference(order)
    status_label = STATUS_LABELS.get(order.status, order.status.value)
    items = _build_items(order)

    if order.status == OrderStatusEnum.PROCESSING:
        EmailOrderProcessing(
            to_email=order.user.email,
            buyer_name=order.user.fullName,
            reference=reference,
            status_label=status_label,
            updated_at_label=_format_date(order.updated_at),
            items=items,
            total=order.total,
        )

    elif order.status == OrderStatusEnum.SHIPPED:
        EmailOrderShipped(
            to_email=order.user.email,
            buyer_name=order.user.fullName,
            reference=reference,
            status_label=status_label,
            address=_build_address(order),
            items=items,
            total=order.total,
        )

    elif order.status == OrderStatusEnum.DELIVERED:
        EmailOrderDelivered(
            to_email=order.user.email,
            buyer_name=order.user.fullName,
            reference=reference,
            delivered_at_label=_format_date(order.updated_at),
            items=items,
            total=order.total,
            rate_products_url=f"{config.URL_FRONTEND}/user/dashboard?tab=orders",
        )

    elif order.status == OrderStatusEnum.CANCELLED:
        EmailOrderCancelled(
            to_email=order.user.email,
            buyer_name=order.user.fullName,
            reference=reference,
            cancelled_at_label=_format_date(order.updated_at),
            total=order.total,
            reason=reason,
            refunded_amount=refunded_amount,
            company_name=company_name,
        )
