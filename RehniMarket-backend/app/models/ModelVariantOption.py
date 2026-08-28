"""
Tabla puente variante <-> valor de atributo.

Una `ProductVariant` tiene una fila por cada eje de variante del producto:

    ProductVariant #1  ->  (Color -> Verde), (Talla -> 40)
    ProductVariant #2  ->  (Color -> Verde), (Talla -> 41)
    ProductVariant #3  ->  (Color -> Negro), (Talla -> 40)

Reglas (validadas en el servicio, ver app/services/variants/):
  - a lo sumo UNA opcion por atributo por variante (garantizado tambien
    por uq_variant_option_attribute mas abajo);
  - la variante debe cubrir EXACTAMENTE los ejes role="variant" del
    catalogo del producto;
  - la combinacion completa se resume en ProductVariant.combo_key, con
    UNIQUE(product_id, combo_key) -> no hay dos variantes iguales.
"""

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
