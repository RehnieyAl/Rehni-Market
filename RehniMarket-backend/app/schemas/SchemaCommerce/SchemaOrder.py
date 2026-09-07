from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.schemas.SchemaCommerce.SchemaReturn import OrderItemReturnResponse


class CheckoutRequest(BaseModel):
    addressId: UUID | None = None


class OrderItemResponse(BaseModel):
    id: UUID
    productId: UUID
    variantId: UUID | None
    productName: str
    variantName: str | None
    attributes: dict[str, str] | None = None
    unitPrice: Decimal
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


class OrderShippingCarrierResponse(BaseModel):
    """Datos mínimos de la transportadora asignada a un pedido; `trackingUrl` se
    usa en el frontend para armar el enlace de seguimiento (comprador)."""

    id: UUID
    name: str
    trackingUrl: str


class OrderResponse(BaseModel):
    id: UUID
    reference: str
    status: str
    companyId: UUID
    companyName: str
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    createdAt: datetime
    items: list[OrderItemResponse]

    shippingCarrier: OrderShippingCarrierResponse | None = None
    trackingNumber: str | None = None

    firstItemName: str | None = None
    totalItems: int = 0

    buyerName: str
    buyerEmail: str
    buyerPhoto: str | None = None
    buyerPhone: str | None = None
    deliveryAddress: OrderAddressResponse | None = None

    returns: list[OrderItemReturnResponse] = []


class OrdersPaginatedResponse(BaseModel):
    items: list[OrderResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class UpdateOrderStatusRequest(BaseModel):
    status: str


class SetOrderShippingRequest(BaseModel):
    """La empresa asigna transportadora + guía a uno de sus pedidos. No cambia el
    estado del pedido (eso sigue por PATCH /orders/{id}/status)."""

    shippingCarrierId: UUID
    trackingNumber: str

    @field_validator("trackingNumber")
    @classmethod
    def validate_tracking_number(cls, value: str) -> str:
        value = value.strip()

        if len(value) < 3:
            raise ValueError("El número de guía debe tener al menos 3 caracteres.")

        if len(value) > 80:
            raise ValueError("El número de guía no debe exceder los 80 caracteres.")

        return value


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
