from sqlalchemy import String,Numeric,Boolean,Text,ForeignKey,Integer,DateTime
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database.Connection import Base

class Catalog(Base):
    """
    Categoría del marketplace (ver ALCANCE > Módulo completo de
    Categorías). `description`/`image_url`/`display_order`/`is_active`
    nullable/con default a nivel de BD para no romper categorías creadas
    antes de esta migración - todas quedan con display_order=0,
    is_active=True (visibles, mismo comportamiento de antes, donde no
    había ningún concepto de "inactiva") y description/image_url en
    None.
    """

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


    # Imagen real subida por admin/owner (mismo flujo NAS que productos y
    # anuncios, ver CatalogService.py) - object_name, no URL absoluta
    # (mismo criterio que Product.images/Advertisement.image_url).
    image_url: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )


    # Orden de aparición en el catálogo público (ver ALCANCE > "Orden de
    # categorías") - las categorías públicas se listan por
    # display_order ASC, no alfabéticamente.
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