"""Modelo ORM de seguidores de empresas: un comprador sigue a una empresa (tabla company_followers)."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.dbconexion import Base


class CompanyFollower(Base):
    __tablename__ = "company_followers"

    # La UNIQUE compuesta es la garantía contra duplicados aun con peticiones concurrentes;
    # su índice (user_id, company_id) también resuelve "¿lo sigo?". El de company_id
    # sostiene el conteo de seguidores del perfil público.
    __table_args__ = (
        UniqueConstraint("user_id", "company_id", name="uq_company_follower_user_company"),
        Index("ix_company_followers_company_id", "company_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("company.id", ondelete="CASCADE"), nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
