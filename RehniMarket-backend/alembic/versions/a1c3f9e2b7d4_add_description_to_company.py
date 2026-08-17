"""add description to company

Revision ID: a1c3f9e2b7d4
Revises: 13f6e1abb5e2
Create Date: 2026-08-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1c3f9e2b7d4'
down_revision: Union[str, Sequence[str], None] = '13f6e1abb5e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'company',
        sa.Column(
            'description',
            sa.Text(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('company', 'description')
