"""wallet recharge correction - trazabilidad y anti doble corrección

Agrega wallet_transactions.corrects_transaction_id (FK autorreferencial a
wallet_transactions.id, ON DELETE SET NULL). Solo lo usa la fila de corrección
(type=ADJUSTMENT), que apunta a la recarga RECHARGE original.

Índice único parcial uq_wallet_transaction_correction_per_recharge sobre esa
columna cuando no es NULL: garantía a nivel de BD de que una recarga solo se
corrige una vez (mismo patrón que uq_wallet_transaction_refund_per_order).

No toca datos existentes.

Revision ID: b8d1c4f7a2e9
Revises: a7c4e1f9b2d8
Create Date: 2026-09-08 18:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b8d1c4f7a2e9"
down_revision: Union[str, Sequence[str], None] = "a7c4e1f9b2d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_COLUMN = "corrects_transaction_id"
_FK_NAME = "fk_wallet_transaction_corrects_transaction"
_INDEX_NAME = "uq_wallet_transaction_correction_per_recharge"
_WHERE = sa.text("corrects_transaction_id IS NOT NULL")


def upgrade() -> None:
    op.add_column(
        "wallet_transactions",
        sa.Column(_COLUMN, sa.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        _FK_NAME,
        "wallet_transactions",
        "wallet_transactions",
        [_COLUMN],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        _INDEX_NAME,
        "wallet_transactions",
        [_COLUMN],
        unique=True,
        postgresql_where=_WHERE,
    )


def downgrade() -> None:
    op.drop_index(
        _INDEX_NAME,
        table_name="wallet_transactions",
        postgresql_where=_WHERE,
    )
    op.drop_constraint(_FK_NAME, "wallet_transactions", type_="foreignkey")
    op.drop_column("wallet_transactions", _COLUMN)
