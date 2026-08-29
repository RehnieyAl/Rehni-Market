"""Tabla puente variante <-> opción de atributo: una fila por eje de variante.
A lo sumo una opción por atributo (uq_variant_option_pair); la combinación
completa se resume en ProductVariant.combo_key."""

from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.Connection import Base


class VariantOption(Base):

    __tablename__ = "variant_options"

    __table_args__ = (
        UniqueConstraint(
            "variant_id", "attribute_option_id", name="uq_variant_option_pair"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_variants.id"), nullable=False, index=True
    )

    attribute_option_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("catalog_attribute_options.id"), nullable=False
    )

    variant = relationship("ProductVariant", back_populates="options")
    option = relationship("CatalogAttributeOption", back_populates="variant_links")
