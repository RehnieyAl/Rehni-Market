"""Modelo ORM de la configuración institucional de la plataforma (tabla platform_settings, una sola fila)."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.dbconexion import Base

SINGLETON_ID = 1


class PlatformSetting(Base):
    """Contacto público de Rehni Market. Independiente de cualquier cuenta: no se deriva del
    correo o teléfono del owner ni de las empresas. Solo el owner lo modifica."""

    __tablename__ = "platform_settings"
    __table_args__ = (CheckConstraint(f"id = {SINGLETON_ID}", name="ck_platform_settings_singleton"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=SINGLETON_ID)

    contact_email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email_public: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    phone_public: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
