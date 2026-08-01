from sqlalchemy import String,Numeric,Boolean,Text,ForeignKey,Integer,DateTime
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database.Connection import Base

class Catalog(Base):

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