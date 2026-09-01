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


    applies_tax: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
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
        default=True,
        nullable=False
    )


    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )


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


    attribute_values = relationship(
        "ProductAttributeValue",
        back_populates="product",
        cascade="all, delete-orphan"
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
