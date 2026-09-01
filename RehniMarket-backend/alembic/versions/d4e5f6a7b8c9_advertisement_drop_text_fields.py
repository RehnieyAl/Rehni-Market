"""advertisement: drop title / description / button_text

El anuncio pasa a ser un banner puramente visual (imagen + targeting).
Se eliminan físicamente las columnas de texto que ya no usa el sistema.

Revision ID: d4e5f6a7b8c9
Revises: cb6d38ee0bd
Create Date: 2026-08-29 13:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "cb6d38ee0bd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("advertisements", "button_text")
    op.drop_column("advertisements", "description")
    op.drop_column("advertisements", "title")


def downgrade() -> None:
    op.add_column(
        "advertisements",
        sa.Column("title", sa.String(length=150), nullable=False, server_default=""),
    )
    op.alter_column("advertisements", "title", server_default=None)
    op.add_column(
        "advertisements",
        sa.Column("description", sa.Text(), nullable=True),
    )
    op.add_column(
        "advertisements",
        sa.Column("button_text", sa.String(length=50), nullable=True),
    )
