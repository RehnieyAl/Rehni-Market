"""add wallet audit fields (created_at, created_by, adjustment type)

Revision ID: c5d8e3a71f42
Revises: f3a9c1d8e2b6
Create Date: 2026-08-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5d8e3a71f42'
down_revision: Union[str, Sequence[str], None] = 'f3a9c1d8e2b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # Nuevo tipo de movimiento (ajuste manual) - se agrega al ENUM ya
    # existente en vez de recrearlo (ver ModelWallet.py > WalletTransactionType).
    op.execute("ALTER TYPE wallettransactiontype ADD VALUE IF NOT EXISTS 'ADJUSTMENT'")

    # wallets.created_at no existia (solo updated_at) - server_default
    # necesario porque ya hay filas existentes en la tabla.
    op.add_column(
        'wallets',
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('now()'),
        ),
    )

    # Auditoria de quien realizo cada movimiento (ver ALCANCE > AUDITORIA).
    # Nulo para no romper movimientos ya existentes (PURCHASE generados
    # por checkout, sin admin/owner asociado).
    op.add_column(
        'wallet_transactions',
        sa.Column('created_by', sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        'fk_wallet_transactions_created_by_users',
        'wallet_transactions',
        'users',
        ['created_by'],
        ['id'],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        'fk_wallet_transactions_created_by_users',
        'wallet_transactions',
        type_='foreignkey',
    )
    op.drop_column('wallet_transactions', 'created_by')
    op.drop_column('wallets', 'created_at')

    # No se puede quitar un valor de un ENUM en Postgres sin recrear el
    # tipo - se deja tal cual en el downgrade (mismo criterio ya usado en
    # otras migraciones de este proyecto para cambios de ENUM).
