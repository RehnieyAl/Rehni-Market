from datetime import datetime, timezone
from enum import Enum as PyEnum
import uuid

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.Connection import Base


class AdminActivityAction(str, PyEnum):
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_UPGRADED = "user_upgraded"
    USER_BLOCKED = "user_blocked"
    USER_UNBLOCKED = "user_unblocked"
    USER_DELETED = "user_deleted"

    COMPANY_CREATED = "company_created"
    COMPANY_APPROVED = "company_approved"
    COMPANY_REJECTED = "company_rejected"
    COMPANY_BLOCKED = "company_blocked"
    COMPANY_UNBLOCKED = "company_unblocked"


class AdminActivity(Base):
    __tablename__ = "admin_activities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    admin_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    action: Mapped[AdminActivityAction] = mapped_column(
        Enum(
            AdminActivityAction,
            name="admin_activity_action",
            values_callable=lambda enum_class: [
                item.value for item in enum_class
            ],
        ),
        nullable=False,
    )

    target_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    target_company_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "company.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    # Motivo en texto libre (admin/owner). Campo general del log; hoy solo lo llena COMPANY_BLOCKED.
    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    admin: Mapped["Users"] = relationship(
        "Users",
        foreign_keys=[admin_id],
        back_populates="admin_activities",
    )

    target_user: Mapped["Users | None"] = relationship(
        "Users",
        foreign_keys=[target_user_id],
        back_populates="target_activities",
    )

    target_company: Mapped["Company | None"] = relationship(
        "Company",
        foreign_keys=[target_company_id],
        back_populates="target_activities",
    )

