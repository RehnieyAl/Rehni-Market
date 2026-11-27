"""Modelo ORM de roles: user, company, admin y owner (tabla roles)."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.dbconexion import Base

class Role(Base):
    __tablename__ = "roles"
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

    users: Mapped[list["Users"]] = relationship(
        "Users",
        back_populates="role"
    )

    
