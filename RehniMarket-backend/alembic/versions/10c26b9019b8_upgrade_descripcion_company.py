"""upgrade descripcion company

Revision ID: 10c26b9019b8
Revises: a1c3f9e2b7d4
Create Date: 2026-08-16 20:31:30.915557

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '10c26b9019b8'
down_revision: Union[str, Sequence[str], None] = 'a1c3f9e2b7d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
