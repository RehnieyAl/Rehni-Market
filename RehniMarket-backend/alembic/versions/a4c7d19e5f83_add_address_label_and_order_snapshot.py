"""add address label/full_name/instructions and order delivery snapshot

Revision ID: a4c7d19e5f83
Revises: e2b6a4c9f107
Create Date: 2026-08-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a4c7d19e5f83'
down_revision: Union[str, Sequence[str], None] = 'e2b6a4c9f107'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # =================================================
    # DIRECCIONES: nombre de referencia + nombre completo del
    # destinatario + indicaciones adicionales (ver ALCANCE > Modal de
    # direcciones). Nullable: filas existentes no tienen estos datos, no
    # se inventan - se exigen a nivel de Pydantic para direcciones NUEVAS
    # (ver SchemaAddress.py > CreateAddressRequest).
    # =================================================
    op.add_column('addresses', sa.Column('label', sa.String(length=60), nullable=True))
    op.add_column('addresses', sa.Column('full_name', sa.String(length=150), nullable=True))
    op.add_column(
        'addresses', sa.Column('additional_instructions', sa.String(length=255), nullable=True)
    )

    # =================================================
    # PEDIDOS: snapshot de la dirección de entrega en el momento del
    # checkout (ver ModelOrder.py > Order) - mismo criterio que
    # order_items.product_name/unit_price.
    # =================================================
    op.add_column('orders', sa.Column('delivery_label', sa.String(length=60), nullable=True))
    op.add_column(
        'orders', sa.Column('delivery_full_name', sa.String(length=150), nullable=True)
    )
    op.add_column('orders', sa.Column('delivery_phone', sa.String(length=20), nullable=True))
    op.add_column(
        'orders', sa.Column('delivery_address', sa.String(length=150), nullable=True)
    )
    op.add_column('orders', sa.Column('delivery_city', sa.String(length=60), nullable=True))
    op.add_column(
        'orders', sa.Column('delivery_department', sa.String(length=60), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('orders', 'delivery_department')
    op.drop_column('orders', 'delivery_city')
    op.drop_column('orders', 'delivery_address')
    op.drop_column('orders', 'delivery_phone')
    op.drop_column('orders', 'delivery_full_name')
    op.drop_column('orders', 'delivery_label')

    op.drop_column('addresses', 'additional_instructions')
    op.drop_column('addresses', 'full_name')
    op.drop_column('addresses', 'label')
