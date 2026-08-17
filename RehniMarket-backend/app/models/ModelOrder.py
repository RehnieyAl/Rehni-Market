from sqlalchemy import String, Numeric, Integer, ForeignKey, DateTime, Enum, Identity
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from app.database.Connection import Base


class OrderStatusEnum(str, PyEnum):
    PENDING = "pending"
    PAID = "paid"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(Base):
    """
    Un pedido pertenece a UNA sola empresa: el checkout parte el carrito
    en un pedido por empresa presente en él (ver CheckoutService), para
    que cada empresa gestione solo lo suyo (ver ALCANCE > Fase 5 -
    Dashboard Empresa > Pedidos).

    El pago se hace con RehniCoin (billetera simulada, ver ModelWallet.py)
    en el momento del checkout - por eso el pedido nace en PENDING
    (pagado, pendiente de que la empresa lo procese), no en un estado
    "sin pagar": no existe ningun flujo de pago diferido en este sistema.
    """

    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Numero de referencia amigable ("RM-000001", formateado en
    # OrderService._to_order_response) - el UUID de `id` nunca se le
    # muestra al comprador ni a la empresa (ver ALCANCE > Refactor
    # Pedidos Empresa, punto 5). IDENTITY (no la PK) porque `id` ya es la
    # clave primaria UUID usada en todas las relaciones/FKs existentes;
    # esta columna es solo para mostrar un numero secuencial legible.
    order_number: Mapped[int] = mapped_column(
        Integer, Identity(start=1, increment=1), unique=True, nullable=False
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("company.id"), nullable=False
    )

    address_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("addresses.id"), nullable=True
    )

    # Snapshot de la dirección de entrega EN EL MOMENTO DEL CHECKOUT (ver
    # CheckoutService.checkout_service) - mismo criterio que OrderItem
    # con product_name/unit_price (ver docstring de OrderItem más abajo):
    # si el usuario edita o elimina la dirección después, el pedido no
    # debe cambiar retroactivamente (ver ALCANCE > "El pedido debe
    # conservar estos datos incluso si el usuario modifica la dirección
    # después"). `address_id` se conserva solo como referencia/trazo, ya
    # NO se lee en vivo para armar la respuesta del pedido (ver
    # OrderService._to_order_response).
    delivery_label: Mapped[str | None] = mapped_column(String(60), nullable=True)
    delivery_full_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    delivery_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    delivery_address: Mapped[str | None] = mapped_column(String(150), nullable=True)
    delivery_city: Mapped[str | None] = mapped_column(String(60), nullable=True)
    delivery_department: Mapped[str | None] = mapped_column(String(60), nullable=True)

    status: Mapped[OrderStatusEnum] = mapped_column(
        Enum(OrderStatusEnum), nullable=False, default=OrderStatusEnum.PENDING
    )

    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    tax: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("Users", back_populates="orders")
    company = relationship("Company")
    address = relationship("Address")

    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    """
    Snapshot del producto en el momento de la compra (product_name /
    unit_price): si la empresa edita el producto despues, el pedido no
    debe cambiar retroactivamente.
    """

    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )

    variant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_variants.id"), nullable=True
    )

    product_name: Mapped[str] = mapped_column(String(150), nullable=False)
    variant_name: Mapped[str | None] = mapped_column(String(150), nullable=True)

    # Precio FINAL (con descuento ya aplicado) - lo que realmente se
    # cobró (ver CheckoutService._compute_price_fields). No es el precio
    # base del producto/variante.
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Precio ANTES del descuento, snapshot al momento del checkout (ver
    # ALCANCE > Detalle de pedido - Descuentos). None cuando el
    # producto/variante no tenía descuento activo en ese momento (no hay
    # nada que restar) o en pedidos creados antes de esta columna - en
    # ambos casos el frontend simplemente no muestra la línea de
    # descuento, nunca infiere un valor a partir del precio ACTUAL del
    # producto (podría haber cambiado desde la compra).
    original_unit_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")
