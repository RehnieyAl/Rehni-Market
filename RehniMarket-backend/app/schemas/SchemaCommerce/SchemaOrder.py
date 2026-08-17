from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class CheckoutRequest(BaseModel):
    addressId: UUID | None = None


class OrderItemResponse(BaseModel):
    id: UUID
    productId: UUID
    variantId: UUID | None
    productName: str
    variantName: str | None
    # Precio FINAL (con descuento ya aplicado) - lo que realmente se pagó.
    unitPrice: Decimal
    # Precio ANTES del descuento, snapshot del momento de la compra (ver
    # ModelOrder.py > OrderItem.original_unit_price). None cuando no
    # había descuento activo en ese momento, o en pedidos de antes de
    # que existiera esta columna - en ambos casos NO hay descuento que
    # mostrar, nunca se infiere a partir del precio actual del producto.
    originalUnitPrice: Decimal | None = None
    quantity: int
    subtotal: Decimal

    model_config = {"from_attributes": True}


class OrderAddressResponse(BaseModel):
    """
    Snapshot de la dirección de entrega GUARDADO EN EL PEDIDO (ver
    ModelOrder.py > Order.delivery_* y ALCANCE > "el pedido debe
    conservar estos datos incluso si el usuario modifica la dirección
    después") - no se lee desde Address en vivo. No es AddressResponse
    completo (SchemaAddress.py): aquí no hace falta id/isDefault/
    createdAt/country/postalCode, solo lo que la empresa necesita para
    enviar el pedido (ver ALCANCE > Detalle pedido empresa).
    """

    label: str | None
    fullName: str
    department: str
    city: str
    address: str
    phone: str


class OrderResponse(BaseModel):
    id: UUID
    # Numero de referencia amigable ("RM-000001") - el frontend nunca
    # debe mostrar `id` (UUID) al usuario (ver ALCANCE > punto 5).
    reference: str
    status: str
    companyId: UUID
    companyName: str
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    createdAt: datetime
    items: list[OrderItemResponse]

    # Resumen liviano para listados (evita repetir todos los items) - el
    # primer producto representa al pedido en la tarjeta/tabla.
    firstItemName: str | None = None
    totalItems: int = 0

    # Datos del comprador (ver ALCANCE > Refactor Pedidos Empresa, puntos
    # 4 y 7) - se reutiliza el mismo OrderResponse tanto para el lado
    # comprador (ve sus propios datos) como para el lado empresa (ve los
    # datos de quien le compro), para no duplicar el schema.
    buyerName: str
    buyerEmail: str
    buyerPhoto: str | None = None
    buyerPhone: str | None = None
    deliveryAddress: OrderAddressResponse | None = None


class OrdersPaginatedResponse(BaseModel):
    items: list[OrderResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class UpdateOrderStatusRequest(BaseModel):
    status: str


class CheckoutSummaryResponse(BaseModel):
    """
    Resumen de checkout (ver ALCANCE > Fase 2): uno por empresa presente
    en el carrito, mas los totales agregados.
    """

    orders: list[OrderResponse]
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    walletBalance: Decimal


class OrderStatusCountsResponse(BaseModel):
    """
    Conteos para las pestañas de "Pedidos" en el dashboard de empresa
    (ver ALCANCE > Refactor Pedidos Empresa - pantalla única con
    filtros). Ya vienen agrupados por pestaña (no por OrderStatusEnum
    crudo) para que el frontend no tenga que conocer el mapeo
    pestaña -> estados: `inProgress` = PROCESSING + SHIPPED, `completed`
    = DELIVERED. `all` es el total sin filtrar.
    """

    all: int
    pending: int
    inProgress: int
    completed: int
    cancelled: int

