"""wallet refund idempotency - un solo reembolso por pedido

Índice único parcial sobre wallet_transactions(order_id) para movimientos de tipo
REFUND. Es la garantía a nivel de base de datos contra el doble reembolso al
cancelar un pedido (el chequeo en la aplicación, has_order_been_refunded, ya
existía y asumía este índice). No toca datos existentes.

Revision ID: c3d5e7f9a1b2
Revises: a1b2c3d4e5f6
Create Date: 2026-08-31 20:45:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3d5e7f9a1b2"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_INDEX_NAME = "uq_wallet_transaction_refund_per_order"
_WHERE = sa.text("type = 'REFUND' AND order_id IS NOT NULL")


def upgrade() -> None:
    op.create_index(
        _INDEX_NAME,
        "wallet_transactions",
        ["order_id"],
        unique=True,
        postgresql_where=_WHERE,
    )


def downgrade() -> None:
    op.drop_index(
        _INDEX_NAME,
        table_name="wallet_transactions",
        postgresql_where=_WHERE,
    )
