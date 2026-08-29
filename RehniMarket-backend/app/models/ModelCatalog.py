from sqlalchemy import String,Numeric,Boolean,Text,ForeignKey,Integer,DateTime
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database.Connection import Base

class Catalog(Base):
    """`description`/`image_url`/`display_order`/`is_active` nullable/con default
    en BD por categorías creadas antes de esta migración."""

    __tablename__ = "catalog"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )


    name: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True
    )


    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )


    # object_name en NAS, no URL absoluta.
    image_url: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )


    # Orden en el catálogo público (ASC), no alfabético.
    display_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )


    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )


    products = relationship(
        "Product",
        back_populates="catalog"
    )


    specifications = relationship(
        "SpecificationTemplate",
        back_populates="catalog",
        cascade="all, delete"
    )


    attributes = relationship(
        "CatalogAttribute",
        back_populates="catalog",
        cascade="all, delete-orphan",
        order_by="CatalogAttribute.position"
    )

class SpecificationTemplate(Base):

    __tablename__ = "specification_templates"


    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )


    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )


    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )


    required: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )


    catalog_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("catalog.id"),
        nullable=False
    )


    catalog = relationship(
        "Catalog",
        back_populates="specifications"
    )


    product_specifications = relationship(
        "ProductSpecification",
        back_populates="template",
        cascade="all, delete"
    )

    variant_specifications = relationship(
    "VariantSpecification",
    back_populates="template",
    cascade="all, delete"
    )