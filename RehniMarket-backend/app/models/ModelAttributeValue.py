"""Valores de atributos role="spec". Reemplazan a ProductSpecification /
VariantSpecification apuntando a un CatalogAttribute en vez de a una
SpecificationTemplate; los role="variant" van por VariantOption."""

from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.Connection import Base


class ProductAttributeValue(Base):

    __tablename__ = "product_attribute_values"

    __table_args__ = (
        UniqueConstraint("product_id", "attribute_id", name="uq_product_attribute_value"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True
    )

    attribute_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("catalog_attributes.id"), nullable=False
    )

    value: Mapped[str] = mapped_column(Text, nullable=False)

    product = relationship("Product", back_populates="attribute_values")
    attribute = relationship("CatalogAttribute")


class VariantAttributeValue(Base):

    __tablename__ = "variant_attribute_values"

    __table_args__ = (
        UniqueConstraint("variant_id", "attribute_id", name="uq_variant_attribute_value"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_variants.id"), nullable=False, index=True
    )

    attribute_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("catalog_attributes.id"), nullable=False
    )

    value: Mapped[str] = mapped_column(Text, nullable=False)

    variant = relationship("ProductVariant", back_populates="attribute_values")
    attribute = relationship("CatalogAttribute")
