"""add catalog category fields (description, image_url, display_order, is_active)

Revision ID: c39a7f2d81e6
Revises: b81f4d0c6e29
Create Date: 2026-08-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c39a7f2d81e6'
down_revision: Union[str, Sequence[str], None] = 'b81f4d0c6e29'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column('catalog', sa.Column('description', sa.String(length=500), nullable=True))
    op.add_column('catalog', sa.Column('image_url', sa.String(length=255), nullable=True))

    # server_default='0'/'true' para que las categorías ya existentes
    # queden con un valor real (no NULL) sin tener que backfillear a
    # mano - display_order=0 (van primero, se reordenan luego desde el
    # panel admin) e is_active=true (siguen visibles, mismo
    # comportamiento que tenían antes de que existiera este concepto).
    op.add_column(
        'catalog',
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
    )
    op.add_column(
        'catalog',
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('catalog', 'is_active')
    op.drop_column('catalog', 'display_order')
    op.drop_column('catalog', 'image_url')
    op.drop_column('catalog', 'description')
