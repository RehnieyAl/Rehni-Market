from sqlalchemy import String, Boolean, Integer, DateTime, ForeignKey, Enum
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

    image_url: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    mobile_image_url: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

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

    target_type: Mapped[AdvertisementTargetType | None] = mapped_column(
        Enum(AdvertisementTargetType, name="advertisementtargettype"),
        nullable=True,
    )

    target_product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )

    target_catalog_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("catalog.id", ondelete="SET NULL"), nullable=True
    )

    target_company_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("company.id", ondelete="SET NULL"), nullable=True
    )

    minimum_discount: Mapped[int | None] = mapped_column(Integer, nullable=True)

    maximum_stock: Mapped[int | None] = mapped_column(Integer, nullable=True)

    max_age_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
