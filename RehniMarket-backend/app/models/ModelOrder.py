from sqlalchemy import String, Numeric, Integer, ForeignKey, DateTime, Enum, Identity
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB, UUID
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
    """Un pedido pertenece a una sola empresa (el checkout parte el carrito por empresa).
    Nace en PENDING: el pago con RehniCoin ocurre en el checkout, no hay pago diferido."""

    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

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

    delivery_label: Mapped[str | None] = mapped_column(String(60), nullable=True)
    delivery_full_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    delivery_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    delivery_address: Mapped[str | None] = mapped_column(String(150), nullable=True)
    delivery_city: Mapped[str | None] = mapped_column(String(60), nullable=True)
    delivery_department: Mapped[str | None] = mapped_column(String(60), nullable=True)

    status: Mapped[OrderStatusEnum] = mapped_column(
        Enum(OrderStatusEnum), nullable=False, default=OrderStatusEnum.PENDING
    )

    shipping_carrier_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shipping_carriers.id"), nullable=True
    )
    tracking_number: Mapped[str | None] = mapped_column(String(80), nullable=True)

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
    shipping_carrier = relationship("ShippingCarrier", back_populates="orders")

    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    """Snapshot del producto al comprar: el pedido no cambia si la empresa lo edita después."""

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

    attributes_snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    original_unit_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")
