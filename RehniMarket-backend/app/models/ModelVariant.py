from sqlalchemy import String,Numeric,Boolean,Text,ForeignKey,Integer,DateTime
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database.Connection import Base

class ProductVariant(Base):

    __tablename__ = "product_variants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    price: Mapped[Decimal] = mapped_column(
        Numeric(10,2),
        default=0
    )

    stock: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=False
    )

    color_id: Mapped[uuid.UUID] = mapped_column(
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

