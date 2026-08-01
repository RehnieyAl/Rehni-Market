from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database.Connection import Base


class ProductVariantImage(Base):

    __tablename__ = "product_variant_images"

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
        default=False,
        nullable=False
    )

    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id"),
        nullable=False
    )

    variant = relationship(
        "ProductVariant",
        back_populates="images"
    )