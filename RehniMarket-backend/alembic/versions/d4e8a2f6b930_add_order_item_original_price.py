"""add order_items.original_unit_price (discount snapshot)

Revision ID: d4e8a2f6b930
Revises: c39a7f2d81e6
Create Date: 2026-08-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e8a2f6b930'
down_revision: Union[str, Sequence[str], None] = 'c39a7f2d81e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Nullable, sin backfill: para order_items ya existentes no hay forma
    # de reconstruir el precio original con certeza (ver ALCANCE >
    # Detalle de pedido - Descuentos) - se dejan en NULL en vez de
    # inventar un valor, y el frontend simplemente omite la línea de
    # descuento para esos ítems.
    op.add_column(
        'order_items', sa.Column('original_unit_price', sa.Numeric(precision=10, scale=2), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('order_items', 'original_unit_price')
