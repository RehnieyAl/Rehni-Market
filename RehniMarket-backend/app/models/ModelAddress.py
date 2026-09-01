from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.database.Connection import Base


class Address(Base):
    """`label`/`full_name`/`additional_instructions` son nullable en BD (filas
    previas a estas columnas) pero obligatorios al crear vía Pydantic."""

    __tablename__ = "addresses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    label: Mapped[str | None] = mapped_column(String(60), nullable=True)

    full_name: Mapped[str | None] = mapped_column(String(150), nullable=True)

    country: Mapped[str] = mapped_column(String(60), nullable=False)
    department: Mapped[str] = mapped_column(String(60), nullable=False)
    city: Mapped[str] = mapped_column(String(60), nullable=False)
    address: Mapped[str] = mapped_column(String(150), nullable=False)
    postal_code: Mapped[str | None] = mapped_column(String(15), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)

    additional_instructions: Mapped[str | None] = mapped_column(String(255), nullable=True)

    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("Users", back_populates="addresses")
