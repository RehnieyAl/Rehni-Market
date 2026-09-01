from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.Connection import Base

ATTRIBUTE_ROLES = ("product", "variant")
ATTRIBUTE_INPUT_TYPES = ("select", "color", "text", "number")

OPTION_INPUT_TYPES = ("select", "color")


class CatalogAttribute(Base):

    __tablename__ = "catalog_attributes"

    __table_args__ = (
        UniqueConstraint(
            "catalog_id", "name", name="uq_catalog_attribute_catalog_name"
        ),
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

    role: Mapped[str] = mapped_column(String(16), nullable=False)

    input_type: Mapped[str] = mapped_column(
        String(16), nullable=False, default="select"
    )

    unit: Mapped[str | None] = mapped_column(String(24), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
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
        UniqueConstraint(
            "attribute_id", "value", name="uq_catalog_attribute_option_value"
        ),
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

    value: Mapped[str] = mapped_column(String(80), nullable=False)

    hex_color: Mapped[str | None] = mapped_column(String(7), nullable=True)

    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    attribute = relationship("CatalogAttribute", back_populates="options")
