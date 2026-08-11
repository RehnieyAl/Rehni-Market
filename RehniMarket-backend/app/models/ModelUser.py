from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.database.Connection import Base

import uuid

from datetime import datetime, timezone


class Users(Base):

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    fullName: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    tell: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    profileImagen: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    isActive: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roles.id"),
        nullable=False,
    )

    role: Mapped["Role"] = relationship(
        "Role",
        back_populates="users",
    )

    company: Mapped["Company | None"] = relationship(
        "Company",
        back_populates="user",
    )

    codes: Mapped[list["Codes"]] = relationship(
        "Codes",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    refresh_token: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    admin_activities: Mapped[list["AdminActivity"]] = relationship(
        "AdminActivity",
        foreign_keys="AdminActivity.admin_id",
        back_populates="admin",
        cascade="all, delete-orphan",
    )

    target_activities: Mapped[list["AdminActivity"]] = relationship(
        "AdminActivity",
        foreign_keys="AdminActivity.target_user_id",
        back_populates="target_user",
    )

