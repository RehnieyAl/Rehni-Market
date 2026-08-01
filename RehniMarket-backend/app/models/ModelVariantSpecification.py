from sqlalchemy import Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database.Connection import Base


class VariantSpecification(Base):

    __tablename__ = "variant_specifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    value: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id"),
        nullable=False
    )

    specification_template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("specification_templates.id"),
        nullable=False
    )

    variant = relationship(
        "ProductVariant",
        back_populates="specifications"
    )

    template = relationship(
        "SpecificationTemplate",
        back_populates="variant_specifications"
    )