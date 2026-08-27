"""fix foreigh key

Revision ID: 4accfb913e2c
Revises: a7c4f1e9b3d5
Create Date: 2026-08-20 13:06:24.171775

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4accfb913e2c'
down_revision: Union[str, Sequence[str], None] = 'a7c4f1e9b3d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
