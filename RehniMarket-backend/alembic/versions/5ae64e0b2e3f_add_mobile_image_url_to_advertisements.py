"""add mobile image url to advertisements

Revision ID: 5ae64e0b2e3f
Revises: 9d328d20a813
Create Date: 2026-08-13 01:39:40.405881

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5ae64e0b2e3f'
down_revision: Union[str, Sequence[str], None] = '9d328d20a813'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
