"""
Orquestador de correos de pedidos (ver ALCANCE > Correos de pedidos):
extrae los datos reales del `Order` (ORM) y llama a la función de
EmailOrder.py que corresponda. Centraliza el mapeo estado -> correo en un
solo lugar para no repetirlo en CheckoutService.py y en los 2 puntos de
OrderService.py donde cambia el estado (empresa y comprador).

Mismo criterio de integración que el resto de correos existentes (ver
CompanyService.py > update_certificate_status_service): se llama directo,
sin try/except - send_email ya nunca revienta el flujo que lo llama (ver
EmailService.py), así que un error de SMTP nunca puede tumbar un
checkout/cambio de estado que ya se guardó correctamente.
"""

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

# Mismas etiquetas que ORDER_STATUS_LABEL en el frontend (ver
# features/orders/utils/orderStatus.ts) - una sola fuente de verdad de
# texto en español por estado, del lado del backend, para no repetirla en
# cada función de EmailOrder.py.
STATUS_LABELS = {
    OrderStatusEnum.PENDING: "Pendiente",
    OrderStatusEnum.PAID: "Pagado",
    OrderStatusEnum.PROCESSING: "En preparación",
    OrderStatusEnum.SHIPPED: "Enviado",
    OrderStatusEnum.DELIVERED: "Entregado",
    OrderStatusEnum.CANCELLED: "Cancelado",
}


def _format_date(value) -> str:
    # dd/mm/aaaa hh:mm, sin depender del locale del sistema (no siempre
    # está el paquete es_CO.UTF-8 instalado en el contenedor) - simple e
    # inequívoco para un correo transaccional.
    return value.strftime("%d/%m/%Y %H:%M") if value else ""


def _reference(order: Order) -> str:
    # Nunca se expone order.id (UUID) al comprador - ver ALCANCE >
    # REFERENCIA DE PEDIDO. Mismo formato que
    # OrderService._to_order_response.
    return f"RM-{order.order_number:06d}"


def _build_address(order: Order) -> dict | None:
    # Snapshot guardado en el pedido (ver ModelOrder.py > Order.delivery_*
    # y ALCANCE > "el pedido debe conservar estos datos incluso si el
    # usuario modifica la dirección después") - NUNCA order.address en
    # vivo, mismo criterio que OrderService._to_order_response.
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

        # El producto pudo cambiar/perder su imagen desde la compra -
        # esto lee la imagen ACTUAL, no una guardada en el pedido
        # (OrderItem no la snapshotea, ver ModelOrder.py). Se omite sin
        # inventar una URL si no hay imagen o el producto ya no existe.
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
) -> None:
    """
    Se llama después de cambiar `order.status` (empresa: ver
    OrderService.update_company_order_status_service - cubre
    PROCESSING/SHIPPED/DELIVERED/CANCELLED; comprador: ver
    OrderService.cancel_my_order_service - CANCELLED). PENDING no pasa
    por acá (correo propio en send_order_created_email) y PAID nunca se
    asigna en este sistema (ver ModelOrder.py > Order) - ningún otro
    estado dispara un correo.
    """

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
            # Preparado para integrarse con el módulo de reseñas (ver
            # ALCANCE > PEDIDO ENTREGADO): apunta a "Mis pedidos", desde
            # donde el comprador llega a cada producto entregado y
            # reseñarlo (ver features/public/reviews/components/ReviewsSection.tsx).
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
        )
