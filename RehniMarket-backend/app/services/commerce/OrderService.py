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
)

from app.services.NasService import build_media_url
from app.services.commerce.WalletService import refund_wallet
from app.services.email.OrderEmailService import send_order_status_email


# Grafo de transiciones permitidas (ver ALCANCE > Fase 5 - Dashboard
# Empresa > Pedidos): PENDING/PAID equivalen a "pagado, pendiente de
# procesar" (ver ModelOrder.py) - ambos pueden avanzar a PROCESSING. No
# se permite ningun salto que no este listado aqui (ej. PENDING directo a
# SHIPPED).
ALLOWED_TRANSITIONS: dict[OrderStatusEnum, set[OrderStatusEnum]] = {
    OrderStatusEnum.PENDING: {OrderStatusEnum.PROCESSING, OrderStatusEnum.CANCELLED},
    OrderStatusEnum.PAID: {OrderStatusEnum.PROCESSING, OrderStatusEnum.CANCELLED},
    OrderStatusEnum.PROCESSING: {OrderStatusEnum.SHIPPED},
    OrderStatusEnum.SHIPPED: {OrderStatusEnum.DELIVERED},
    OrderStatusEnum.DELIVERED: set(),
    OrderStatusEnum.CANCELLED: set(),
}

CANCELLABLE_STATUSES = {OrderStatusEnum.PENDING, OrderStatusEnum.PAID}

# Estados que SÍ se cancelan y reembolsan automáticamente cuando se
# suspende la empresa (ver ALCANCE > Suspensión de empresa - REGLA DE
# REEMBOLSO). SHIPPED/DELIVERED/CANCELLED quedan fuera a propósito:
# - SHIPPED: ya salió de la empresa, no hay nada que la empresa
#   suspendida pueda seguir haciendo con él, y una devolución de un
#   pedido en camino es un proceso propio (post-venta) que este sistema
#   no tiene implementado - no se inventa uno acá.
# - DELIVERED: pedido finalizado, parte del historial.
# - CANCELLED: ya está cancelado, se ignora (evita reprocesarlo).
REFUNDABLE_ON_SUSPENSION_STATUSES = {
    OrderStatusEnum.PENDING,
    OrderStatusEnum.PAID,
    OrderStatusEnum.PROCESSING,
}


def _to_order_response(order: Order) -> OrderResponse:
    items = [
        OrderItemResponse(
            id=item.id,
            productId=item.product_id,
            variantId=item.variant_id,
            productName=item.product_name,
            variantName=item.variant_name,
            unitPrice=item.unit_price,
            originalUnitPrice=item.original_unit_price,
            quantity=item.quantity,
            subtotal=item.subtotal,
        )
        for item in order.items
    ]

    buyer = order.user

    # profileImagen se guarda como object_name (sin el bucket "uploads/"
    # incluido) - mismo patron que MeService.py > get_my_info_service.
    buyer_photo = (
        build_media_url(f"uploads/{buyer.profileImagen}") if buyer.profileImagen else None
    )

    # Snapshot del pedido (ver ModelOrder.py > Order.delivery_*), NUNCA
    # la direccion en vivo (order.address) - si el usuario la edita o
    # elimina despues, este pedido no debe cambiar (ver ALCANCE > "el
    # pedido debe conservar estos datos"). Pedidos de antes de esta
    # migracion no tienen snapshot (delivery_address es None): se
    # muestran sin direccion en vez de leer una que ya no representa lo
    # que realmente se envio.
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

    # Telefono de contacto para la entrega: el de la direccion (mas
    # relevante para el envio) si existe, si no el del usuario (ver
    # ALCANCE > Refactor Pedidos Empresa, punto 7 - "Telefono").
    buyer_phone = order.delivery_phone or buyer.tell

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
    )


# ==============================
# COMPRADOR
# ==============================

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

        if order.status not in CANCELLABLE_STATUSES:
            api_error(
                409,
                ErrorCodes.INVALID_ORDER_STATUS_TRANSITION,
                "Este pedido ya está en preparación y no se puede cancelar.",
            )

        order.status = OrderStatusEnum.CANCELLED

        database.commit()
        database.refresh(order)

        # Correo "Pedido cancelado" (ver ALCANCE > Correos de pedidos).
        # No hay reembolso de RehniCoin implementado todavía en este
        # flujo (ver ALCANCE) - se envía sin `refunded_amount`, esa
        # sección simplemente no aparece en el correo.
        send_order_status_email(order)

        return _to_order_response(order)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


# ==============================
# EMPRESA
# ==============================

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
    """
    Pedidos de la empresa - soporta filtro por varios estados a la vez
    (para las pestañas Pendientes/En proceso/Completados del dashboard,
    ver Orders.tsx) y busqueda por referencia/correo/nombre del comprador
    (ver ALCANCE > Refactor Pedidos Empresa, punto 6).
    """

    company = _resolve_company(database, user_id)

    # Mismo patron que update_company_order_status_service: se convierten
    # los strings crudos a OrderStatusEnum aca, no en el repositorio -
    # valores invalidos se ignoran en vez de romper el listado.
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
    """
    Contadores para las pestañas de "Pedidos" (ver ALCANCE > Refactor
    Pedidos Empresa - pantalla única con filtros: [TODOS] [PENDIENTES]
    [EN PROCESO] [COMPLETADOS] [CANCELADOS]). Se agrupan aquí, no en el
    repositorio, para mantener el mapeo pestaña -> OrderStatusEnum en un
    solo lugar junto al resto de las reglas de pedidos:
      - PENDIENTES  = PENDING (no incluye PAID: ese estado nunca se
        asigna en este sistema, ver ModelOrder.py > Order, el pago
        siempre ocurre en el checkout).
      - EN PROCESO  = PROCESSING + SHIPPED.
      - COMPLETADOS = DELIVERED.
      - CANCELADOS  = CANCELLED.
    """

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

        # Correo de cambio de estado (ver ALCANCE > Correos de pedidos) -
        # cubre PROCESSING/SHIPPED/DELIVERED/CANCELLED (esta misma ruta
        # es la que usa la empresa para cancelar, ver ALLOWED_TRANSITIONS
        # más arriba). send_order_status_email no hace nada para
        # cualquier otro target.
        send_order_status_email(order)

        return _to_order_response(order)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


# ==============================
# SUSPENSIÓN DE EMPRESA (ADMIN)
# ==============================

def cancel_and_refund_company_orders_for_suspension(
    database: Session, company: Company, reason: str
) -> list[Order]:
    """
    Cancela y reembolsa (RehniCoin) los pedidos de `company` que todavía
    están en PENDING/PAID/PROCESSING (ver REFUNDABLE_ON_SUSPENSION_
    STATUSES) - se llama desde CompanyService.update_company_status_
    service SOLO cuando CompanyStatus pasa de true a false (ver ALCANCE >
    Suspensión de empresa, punto 6: nunca al desbloquear ni al repetir
    una suspensión ya vigente).

    Relación usada para encontrar los pedidos: Order.company_id
    (columna directa del pedido, ver ModelOrder.py) - NO se pasa por
    Product.company_id/OrderItem, un pedido ya sabe a qué empresa
    pertenece desde el checkout.

    El monto reembolsado es SIEMPRE order.total, el snapshot histórico de
    lo que el comprador realmente pagó en el checkout (ver
    CheckoutService.checkout_service) - nunca se recalcula con precios
    actuales de producto/variante.

    Además del reembolso, se devuelve el stock de cada OrderItem (ver
    ALCANCE > BUG 1 - suspensión de empresa): checkout_service descontó
    `variant.stock`/`product.stock` según hubiera o no variante
    seleccionada (ver CheckoutService.checkout_service) - acá se hace
    exactamente lo inverso, sobre la MISMA relación que se usó para
    descontar (OrderItem.variant_id si existe, si no OrderItem.
    product_id), para no sumarle stock al producto equivocado. Reutiliza
    el mismo guard de idempotencia de arriba (has_order_been_refunded):
    como la devolución de stock vive en la misma rama que nunca se
    reejecuta para un pedido ya reembolsado, no hace falta un segundo
    mecanismo para evitar sumar stock dos veces.

    NO hace commit ni envía los correos de cancelación - eso lo controla
    el llamador (ver ALCANCE > punto 5: bloqueo de empresa + cancelación
    + reembolso deben ser una sola transacción atómica; los correos,
    igual que en checkout_service/update_company_order_status_service, se
    envían después, una vez que ya se confirmó que todo se guardó bien).

    Devuelve los pedidos efectivamente cancelados/reembolsados en esta
    ejecución (para el mensaje de feedback al admin y para poder enviar
    el correo de cada uno después del commit).
    """

    orders = repo.list_company_orders_by_statuses(
        database, company.id, REFUNDABLE_ON_SUSPENSION_STATUSES
    )

    refunded_orders: list[Order] = []

    for order in orders:
        # Doble reembolso (ver ALCANCE > punto 4, CRÍTICO): nunca se
        # confía solo en order.status == CANCELLED para decidir si ya se
        # reembolsó - un pedido pudo cancelarse por otro motivo sin
        # pasar por acá. Se verifica el ledger de RehniCoin (ver
        # WalletRepository.has_order_been_refunded), que es lo único que
        # de verdad certifica que YA se acreditó el saldo para este
        # pedido puntual. Si la suspensión se vuelve a ejecutar (empresa
        # ya estaba en false, o una re-ejecución cualquiera), este
        # `continue` es lo que hace que el proceso sea idempotente.
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

        # Devolver stock (ver ALCANCE > BUG 1): misma relación que
        # descontó checkout_service - variante si el ítem tenía una
        # seleccionada, si no el producto base.
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

        refunded_orders.append(order)

    return refunded_orders
