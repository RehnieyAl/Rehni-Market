"""add mobile_image_url to advertisements

Revision ID: 9d328d20a813
Revises: 5160955502e0
Create Date: 2026-08-12 03:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9d328d20a813'
down_revision: Union[str, Sequence[str], None] = '5160955502e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'advertisements',
        sa.Column('mobile_image_url', sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('advertisements', 'mobile_image_url')
