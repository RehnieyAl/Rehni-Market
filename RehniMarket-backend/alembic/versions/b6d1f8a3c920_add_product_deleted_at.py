"""add products.deleted_at (company soft-delete)

Revision ID: b6d1f8a3c920
Revises: a5c7e9d2f114
Create Date: 2026-08-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b6d1f8a3c920'
down_revision: Union[str, Sequence[str], None] = 'a5c7e9d2f114'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Nullable, sin backfill: NULL significa "nunca eliminado" (activo o
    # simplemente desactivado con el toggle existente) - distinto e
    # independiente de is_active (ver ModelProduct.py > Product.
    # deleted_at). Los productos ya inactivos antes de esta migración se
    # quedan con deleted_at NULL (siguen leyéndose como "desactivados",
    # no como "eliminados") porque no hay forma de reconstruir con
    # certeza cuáles de ellos fueron realmente eliminados por la empresa.
    op.add_column(
        'products', sa.Column('deleted_at', sa.DateTime(), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('products', 'deleted_at')
