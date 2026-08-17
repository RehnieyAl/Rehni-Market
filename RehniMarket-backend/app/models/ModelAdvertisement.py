from sqlalchemy import String, Boolean, Text, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from enum import Enum as PyEnum

from app.database.Connection import Base


class AdvertisementTargetType(str, PyEnum):
    """
    Anuncios dinámicos por reglas (ver ALCANCE > Anuncios dinámicos).
    `None` (columna target_type sin valor) = anuncio MANUAL clásico,
    compatible con los anuncios creados antes de esto: usa `button_link`
    tal cual lo escribió el admin, sin ninguna regla (ver
    AdvertisementService.py > resolve_advertisement_destination).

    PROMOTION/BLACK_FRIDAY/CYBER_DAYS comparten el mismo mecanismo real
    (filtro `minDiscount` del catálogo público) - la diferencia entre
    ellos es solo la etiqueta/título sugerido en el panel admin, no la
    lógica (ver AdvertisementTargeting.py, un único resolver para los 4).
    """

    PRODUCT = "PRODUCT"
    CATEGORY = "CATEGORY"
    COMPANY = "COMPANY"
    PROMOTION = "PROMOTION"
    BLACK_FRIDAY = "BLACK_FRIDAY"
    CYBER_DAYS = "CYBER_DAYS"
    LIQUIDATION = "LIQUIDATION"
    NEW_RELEASE = "NEW_RELEASE"


class Advertisement(Base):
    """
    Anuncio administrado por ADMIN/OWNER y mostrado en el Hero
    del Home público.
    """

    __tablename__ = "advertisements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    # Imagen principal para escritorio/tablet.
    # Recomendado: 1920x600 px.
    image_url: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    # Imagen específica para móvil.
    # Recomendado: 1080x1000 px.
    mobile_image_url: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    button_text: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    # Cuando target_type NO es None, este valor lo calcula el backend
    # (ver resolve_advertisement_destination) usando rutas/parámetros
    # reales del catálogo público - el admin ya no lo escribe a mano.
    # Cuando target_type ES None (anuncio manual clásico, incluye todos
    # los anuncios creados antes de esta migración), se sigue usando tal
    # cual el admin lo escribió - compatibilidad total hacia atrás.
    button_link: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    # =================================================
    # ANUNCIOS DINÁMICOS POR REGLAS (ver ALCANCE)
    # =================================================
    # Todas nullable a propósito: un anuncio manual clásico (target_type
    # None) no usa ninguna de estas. Columnas explícitas (no JSON), mismo
    # criterio que el resto del proyecto.

    target_type: Mapped[AdvertisementTargetType | None] = mapped_column(
        Enum(AdvertisementTargetType, name="advertisementtargettype"),
        nullable=True,
    )

    # PRODUCT
    target_product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )

    # CATEGORY
    target_catalog_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("catalog.id", ondelete="SET NULL"), nullable=True
    )

    # COMPANY
    target_company_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("company.id", ondelete="SET NULL"), nullable=True
    )

    # PROMOTION / BLACK_FRIDAY / CYBER_DAYS / LIQUIDATION - porcentaje
    # mínimo de descuento (ej. 20, 30, 15...).
    minimum_discount: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # LIQUIDATION - stock máximo (ej. 5). Puede combinarse con
    # minimum_discount o usarse solo (ver ALCANCE > "y/o").
    maximum_stock: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # NEW_RELEASE - productos creados en los últimos N días (ej. 30).
    max_age_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
