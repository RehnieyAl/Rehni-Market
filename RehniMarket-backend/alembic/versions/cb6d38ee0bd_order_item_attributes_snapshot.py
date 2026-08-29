"""order item attributes snapshot

Revision ID: cb6d38ee0bd
Revises: b6f8fd31fbe
Create Date: 2026-08-29 03:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "cb6d38ee0bd"
down_revision: Union[str, Sequence[str], None] = "b6f8fd31fbe"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "order_items",
        sa.Column("attributes_snapshot", JSONB(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("order_items", "attributes_snapshot")
