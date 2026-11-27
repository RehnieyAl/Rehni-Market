"""Modelo ORM de especificaciones de un producto (tabla product_specifications)."""

from sqlalchemy import Text,ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.dbconexion import Base

class ProductSpecification(Base):

    __tablename__ = "product_specifications"


    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )


    value: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )


    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=False
    )


    specification_template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("specification_templates.id"),
        nullable=False
    )


    product = relationship(
        "Product",
        back_populates="specifications"
    )


    template = relationship(
        "SpecificationTemplate",
        back_populates="product_specifications"
    )
    