"""Modelo ORM del catálogo de bancos que administra la plataforma (tabla banks); lo usan las cuentas de las empresas."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.dbconexion import Base


def normalize_bank_name(name: str) -> str:
    """Clave de unicidad: sin espacios sobrantes y en minúsculas ("Banco  de Bogotá " = "banco de bogotá")."""
    return " ".join(name.split()).lower()


class Bank(Base):
    __tablename__ = "banks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # UNIQUE sobre el nombre normalizado: evita duplicados por mayúsculas o espacios.
    normalized_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    # Ruta del objeto en MinIO con el prefijo del bucket ("uploads/banks/<uuid>.png"), como las categorías.
    logo: Mapped[str | None] = mapped_column(String(255), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
