"""platform contact and code attempts

- platform_settings: una sola fila (CHECK id = 1) con el correo y el teléfono institucionales y si
  cada uno se publica. Se crea vacía: no se copian datos del owner ni de ninguna cuenta.
- event_codes.failed_attempts: intentos fallidos por código (los códigos vigentes empiezan en 0).

Revision ID: f1c3e5a7b9d2
Revises: e9a1b3c5d7f2
Create Date: 2026-11-25 23:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f1c3e5a7b9d2"
down_revision: Union[str, Sequence[str], None] = "e9a1b3c5d7f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "platform_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("contact_email", sa.String(length=254), nullable=True),
        sa.Column("contact_phone", sa.String(length=20), nullable=True),
        sa.Column("email_public", sa.Boolean(), nullable=False),
        sa.Column("phone_public", sa.Boolean(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_by", sa.UUID(), nullable=True),
        sa.CheckConstraint("id = 1", name="ck_platform_settings_singleton"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.add_column(
        "event_codes",
        sa.Column("failed_attempts", sa.Integer(), server_default="0", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("event_codes", "failed_attempts")
    op.drop_table("platform_settings")
