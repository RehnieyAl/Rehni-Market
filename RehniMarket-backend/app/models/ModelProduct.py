from sqlalchemy import String,Numeric,Boolean,Text,ForeignKey,Integer,DateTime
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database.Connection import Base

class Product(Base):

    __tablename__ = "products"


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
        default=0,
        nullable=False
    )


    discount_enable: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )


    discount_value: Mapped[Decimal] = mapped_column(
        Numeric(10,2),
        default=0
    )


    stock: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    has_variants: Mapped[bool] = mapped_column(
    Boolean,
    default=False,
    nullable=False
    )


    descripcion: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )


    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )


    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )


    # Soft-delete de la empresa (ver ALCANCE > EMPRESA -> ELIMINAR
    # PRODUCTO). NULL = producto nunca eliminado (activo o simplemente
    # desactivado con el toggle Activo/Inactivo, ver
    # change_product_status_service). Con fecha = eliminado por la
    # empresa (ver delete_product_service) - un estado distinto e
    # independiente de is_active, que ambos flujos comparten:
    #
    #   is_active=True,  deleted_at=NULL     -> activo
    #   is_active=False, deleted_at=NULL     -> desactivado (toggle)
    #   is_active=False, deleted_at=<fecha>  -> eliminado
    #
    # El registro de Product NUNCA se borra fisicamente - ver
    # delete_product_service, que documenta por que (FKs de OrderItem/
    # Review/Favorite/Report sin CASCADE, para no perder historial).
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        default=None,
    )


    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("company.id"),
        nullable=False
    )


    catalog_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("catalog.id"),
        nullable=False
    )


    # Color principal del producto. Es completamente independiente del
    # color de cada variante (ProductVariant.color_id) - no existe (ni debe
    # existir) ninguna regla que exija que coincidan.
    main_color_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("color_variants.id"),
        nullable=True
    )



    company = relationship(
        "Company",
        back_populates="products"
    )


    catalog = relationship(
        "Catalog",
        back_populates="products"
    )


    main_color = relationship(
        "ColorVariant",
        back_populates="products"
    )


    images = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete"
    )


    variants = relationship(
        "ProductVariant",
        back_populates="product",
        cascade="all, delete"
    )


    specifications = relationship(
        "ProductSpecification",
        back_populates="product",
        cascade="all, delete"
    )


    reviews = relationship(
        "Review",
        back_populates="product",
        cascade="all, delete"
    )



class ProductImage(Base):

    __tablename__ = "product_images"


    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )


    url: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )


    is_main: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )


    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=False
    )


    product = relationship(
        "Product",
        back_populates="images"
    )

