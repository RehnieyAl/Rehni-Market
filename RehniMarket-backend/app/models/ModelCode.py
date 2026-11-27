"""Modelo ORM de códigos de un solo uso: verificación de correo y recuperación de contraseña (tabla event_codes)."""

from sqlalchemy import String, Enum, ForeignKey, DateTime, Index, Integer
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timedelta
from app.core.dbconexion import Base
from enum import Enum as typerEnum
from sqlalchemy.dialects.postgresql import UUID
import uuid

class TypeCode(str, typerEnum):
    RESET_PASSWORD = "resetPassword"
    VERIFY_EMAIL = "verifyEmail"
    CHANGE_EMAIL = "changeEmail"
class Codes(Base):
    __tablename__ = "event_codes"
    __table_args__ = (
    Index("idx_codes_user_type","user_id","type"),)
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True, 
        default=uuid.uuid4
    )

    code: Mapped[str] = mapped_column(
        String(10), 
        nullable=False
    )

    type: Mapped[TypeCode] = mapped_column(
        Enum(TypeCode, name="type_code_enum")
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow    
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.utcnow() + timedelta(minutes=15)
    )

    failed_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        unique=False,
        nullable=False
    )

    user: Mapped["Users"] = relationship(
        "Users",
        back_populates="codes"
    )
