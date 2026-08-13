"""add discount to product variants

Revision ID: 13f6e1abb5e2
Revises: 5ae64e0b2e3f
Create Date: 2026-08-13 02:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '13f6e1abb5e2'
down_revision: Union[str, Sequence[str], None] = '5ae64e0b2e3f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'product_variants',
        sa.Column(
            'discount_enable',
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        'product_variants',
        sa.Column(
            'discount_value',
            sa.Numeric(precision=10, scale=2),
            nullable=False,
            server_default='0',
        ),
    )

    # El server_default solo existe para poder agregar la columna NOT NULL
    # sin romper filas ya existentes - el ORM (ModelVariant.py) sigue
    # controlando el default a nivel de aplicacion, igual que en
    # products.discount_enable/discount_value.
    op.alter_column('product_variants', 'discount_enable', server_default=None)
    op.alter_column('product_variants', 'discount_value', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('product_variants', 'discount_value')
    op.drop_column('product_variants', 'discount_enable')
