from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database.Connection import Base
import uuid

class ColorVariant(Base):

    __tablename__ = "color_variants"

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

    hex_color: Mapped[str] = mapped_column(
        String(7),   # #FF0000
        nullable=False
    )

    variants = relationship(
        "ProductVariant",
        back_populates="color",
        cascade="all"
    )