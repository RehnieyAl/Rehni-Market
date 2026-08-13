from sqlalchemy import String, Boolean, Text, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from app.database.Connection import Base


class Advertisement(Base):
    """
    Anuncio administrado por ADMIN/OWNER y mostrado en el Hero
    del Home público.
    """

    __tablename__ = "advertisements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    # Imagen principal para escritorio/tablet.
    # Recomendado: 1920x600 px.
    image_url: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    # Imagen específica para móvil.
    # Recomendado: 1080x1000 px.
    mobile_image_url: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    button_text: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    button_link: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )