from sqlalchemy import String, Boolean, Text, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from enum import Enum as PyEnum

from app.database.Connection import Base


class AdvertisementTargetType(str, PyEnum):
    """target_type None = anuncio manual clásico (usa button_link tal cual).
    PROMOTION/BLACK_FRIDAY/CYBER_DAYS comparten resolver (filtro minDiscount)."""

    PRODUCT = "PRODUCT"
    CATEGORY = "CATEGORY"
    COMPANY = "COMPANY"
    PROMOTION = "PROMOTION"
    BLACK_FRIDAY = "BLACK_FRIDAY"
    CYBER_DAYS = "CYBER_DAYS"
    LIQUIDATION = "LIQUIDATION"
    NEW_RELEASE = "NEW_RELEASE"


class Advertisement(Base):

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

    # Escritorio/tablet. Recomendado: 1920x600 px.
    image_url: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    # Móvil. Recomendado: 1080x1000 px.
    mobile_image_url: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    button_text: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    # Con target_type != None lo calcula el backend; con None se usa tal cual lo escribió el admin.
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

    # Anuncios dinámicos por reglas. Todas nullable: un anuncio manual no usa ninguna.
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

    # PROMOTION / BLACK_FRIDAY / CYBER_DAYS / LIQUIDATION - % mínimo de descuento.
    minimum_discount: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # LIQUIDATION - stock máximo. Combinable con minimum_discount o solo.
    maximum_stock: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # NEW_RELEASE - productos creados en los últimos N días.
    max_age_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
