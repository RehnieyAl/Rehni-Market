from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.database.Connection import Base


class ShippingCarrier(Base):
    """
    Transportadora del catálogo global (ver ALCANCE > Transportadoras) -
    administrada exclusivamente por Admin/Owner (ver AdminCompanyRouters.py),
    la Empresa solo puede leer las activas (ver publicService/
    ShippingCarriers.py > GET /public/shipping-carriers) y asignarlas a
    sus propios pedidos (ver Order.shipping_carrier_id).

    Mismo patrón que Catalog (ver ModelCatalog.py): `is_active` con
    desactivación en vez de borrado físico - una transportadora inactiva
    deja de ofrecerse para NUEVAS asignaciones, pero los pedidos que ya
    la referencian (Order.shipping_carrier_id) conservan la relación
    intacta para siempre (nunca se borra físicamente una transportadora,
    ver ALCANCE > "no romper referencias históricas").

    `tracking_url` es la única fuente de verdad del enlace de seguimiento
    (ver ALCANCE > "la URL de seguimiento pertenece a la transportadora,
    NO debe duplicarse en cada Order") - como el registro nunca se borra,
    no hace falta guardar una copia histórica en el pedido: el FK
    `Order.shipping_carrier_id` sigue siendo válido y resoluble para
    siempre.
    """

    __tablename__ = "shipping_carriers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    name: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)

    tracking_url: Mapped[str] = mapped_column(String(255), nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    orders = relationship("Order", back_populates="shipping_carrier")
