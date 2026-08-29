"""upgrade table product

Revision ID: d72ef7fa597e
Revises: 29fe206320ce
Create Date: 2026-08-28 21:17:48.479554

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd72ef7fa597e'
down_revision: Union[str, Sequence[str], None] = '29fe206320ce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
