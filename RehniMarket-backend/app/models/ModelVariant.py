from sqlalchemy import String, Numeric, Boolean, ForeignKey, Integer, DateTime, Index
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database.Connection import Base


class ProductVariant(Base):

    __tablename__ = "product_variants"

    __table_args__ = (
        Index(
            "uq_variant_product_combo_active",
            "product_id",
            "combo_key",
            unique=True,
            postgresql_where="deleted_at IS NULL AND combo_key IS NOT NULL",
        ),
        Index(
            "uq_variant_product_sku_active",
            "product_id",
            "sku",
            unique=True,
            postgresql_where="deleted_at IS NULL AND sku IS NOT NULL",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    sku: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True
    )

    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        default=0
    )

    stock: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    combo_key: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True
    )

    discount_enable: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    discount_value: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        default=0,
        nullable=False
    )

    discount_type: Mapped[str | None] = mapped_column(
        String(8),
        nullable=True
    )

    discount_starts_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    discount_ends_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        default=None
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=False
    )

    color_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("color_variants.id"),
        nullable=True
    )

    color = relationship(
        "ColorVariant",
        back_populates="variants"
    )

    product = relationship(
        "Product",
        back_populates="variants"
    )

    images = relationship(
        "ProductVariantImage",
        back_populates="variant",
        cascade="all, delete"
    )

    specifications = relationship(
        "VariantSpecification",
        back_populates="variant",
        cascade="all, delete"
    )

    options = relationship(
        "VariantOption",
        back_populates="variant",
        cascade="all, delete-orphan"
    )

    attribute_values = relationship(
        "VariantAttributeValue",
        back_populates="variant",
        cascade="all, delete-orphan"
    )
