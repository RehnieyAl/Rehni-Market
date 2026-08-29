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
    # Combinación comprada, congelada al checkout: {"Color": "Negro", "Talla": "40"}.
    attributes: dict[str, str] | None = None
    # Precio final ya con descuento.
    unitPrice: Decimal
    # Precio antes del descuento, snapshot al comprar. None si no había descuento.
    originalUnitPrice: Decimal | None = None
    quantity: int
    subtotal: Decimal

    model_config = {"from_attributes": True}


class OrderAddressResponse(BaseModel):
    """Snapshot de la dirección guardado en el pedido; no se lee de Address en vivo."""

    label: str | None
    fullName: str
    department: str
    city: str
    address: str
    phone: str


class OrderResponse(BaseModel):
    id: UUID
    # Referencia legible ("RM-000001"); el frontend nunca muestra `id` al usuario.
    reference: str
    status: str
    companyId: UUID
    companyName: str
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    createdAt: datetime
    items: list[OrderItemResponse]

    # Resumen liviano para listados.
    firstItemName: str | None = None
    totalItems: int = 0

    # El mismo schema sirve para el lado comprador y el lado empresa.
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
    """Un OrderResponse por empresa presente en el carrito, más los totales agregados."""

    orders: list[OrderResponse]
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    walletBalance: Decimal


class OrderStatusCountsResponse(BaseModel):
    """Conteos por pestaña: inProgress = PROCESSING + SHIPPED, completed = DELIVERED."""

    all: int
    pending: int
    inProgress: int
    completed: int
    cancelled: int

