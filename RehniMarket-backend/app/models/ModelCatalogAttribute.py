from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.Connection import Base


ATTRIBUTE_ROLES = ("variant", "spec")
ATTRIBUTE_INPUT_TYPES = ("option", "color", "text", "number")


class CatalogAttribute(Base):

    __tablename__ = "catalog_attributes"

    __table_args__ = (
        # Un mismo nombre de atributo no se repite dentro de una categoria.
        UniqueConstraint("catalog_id", "name", name="uq_catalog_attribute_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    catalog_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("catalog.id"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(80), nullable=False)

    # "variant" | "spec" - ver docstring del modulo.
    role: Mapped[str] = mapped_column(String(16), nullable=False)

    # "option" | "color" | "text" | "number"
    input_type: Mapped[str] = mapped_column(String(16), nullable=False, default="option")

    # Unidad opcional para mostrar junto al valor ("GB", "MHz", "\"").
    unit: Mapped[str | None] = mapped_column(String(24), nullable=True)

    # Solo aplica a role="spec": si el valor es obligatorio al publicar.
    # (En el modelo viejo `SpecificationTemplate.required` existia pero
    # NUNCA se validaba - ver auditoria. Aca si se validara.)
    required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Orden de aparicion en formularios y en el detalle publico.
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Solo un atributo de variante por categoria deberia marcarse como
    # "el que define la galeria de imagenes" (tipicamente Color). Si
    # ninguno lo marca, las imagenes se resuelven por variante completa
    # (comportamiento actual). Ver ProductVariantImage.
    image_defining: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Traza al modelo viejo (transicion). NULL para atributos nuevos.
    legacy_template_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    catalog = relationship("Catalog", back_populates="attributes")

    options: Mapped[list["CatalogAttributeOption"]] = relationship(
        "CatalogAttributeOption",
        back_populates="attribute",
        cascade="all, delete-orphan",
        order_by="CatalogAttributeOption.position",
    )


class CatalogAttributeOption(Base):

    __tablename__ = "catalog_attribute_options"

    __table_args__ = (
        UniqueConstraint("attribute_id", "value", name="uq_catalog_attribute_option_value"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    attribute_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("catalog_attributes.id"),
        nullable=False,
        index=True,
    )

    # Etiqueta visible ("Verde", "256 GB", "PlayStation 5").
    label: Mapped[str] = mapped_column(String(80), nullable=False)

    # Valor normalizado/canonico (para comparar y para combo_key).
    value: Mapped[str] = mapped_column(String(80), nullable=False)

    # Solo para input_type="color".
    hex: Mapped[str | None] = mapped_column(String(7), nullable=True)

    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Traza al color viejo (transicion). NULL salvo opciones migradas
    # desde `color_variants`.
    legacy_color_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    attribute = relationship("CatalogAttribute", back_populates="options")

    variant_links: Mapped[list["VariantOption"]] = relationship(
        "VariantOption",
        back_populates="option",
        cascade="all, delete-orphan",
    )
