"""add company suspension reason, admin activity reason, wallet_transactions.order_id

Revision ID: 1338b2c2d72b
Revises: 4accfb913e2c
Create Date: 2026-08-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '1338b2c2d72b'
down_revision: Union[str, Sequence[str], None] = '4accfb913e2c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # Motivo VIGENTE de suspension (ver ModelCompany.py > Company.
    # suspension_reason) - nullable, sin backfill: empresas ya suspendidas
    # antes de esta migracion no tienen forma de reconstruir el motivo con
    # certeza, quedan en NULL en vez de inventar un valor.
    op.add_column(
        'company', sa.Column('suspension_reason', sa.Text(), nullable=True)
    )

    # Motivo en texto libre del log de actividad admin (ver
    # ModelAdminActivity.py > AdminActivity.reason) - nullable por el
    # mismo motivo (filas historicas sin este dato).
    op.add_column(
        'admin_activities', sa.Column('reason', sa.Text(), nullable=True)
    )

    # Enlaza un movimiento de RehniCoin con el pedido que reembolsa (ver
    # ModelWallet.py > WalletTransaction.order_id) - permite distinguir
    # "pedido cancelado" de "pedido cancelado Y reembolsado" sin depender
    # solo de order.status (ver ALCANCE > Suspension de empresa, doble
    # reembolso). SET NULL en vez de CASCADE: el movimiento es un
    # registro contable, sobrevive aunque el pedido se borrara (en la
    # practica los pedidos nunca se eliminan).
    op.add_column(
        'wallet_transactions',
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=True),
    )

    op.create_foreign_key(
        'fk_wallet_transactions_order_id_orders',
        'wallet_transactions',
        'orders',
        ['order_id'],
        ['id'],
        ondelete='SET NULL',
    )

    # Un pedido nunca puede tener mas de UN movimiento de tipo REFUND -
    # esta es la garantia de idempotencia a nivel de base de datos (ver
    # WalletRepository.has_order_been_refunded, que la revisa antes de
    # cada reembolso, y ALCANCE > "CRITICO: doble reembolso"). Es un
    # indice PARCIAL (solo type='REFUND') porque order_id SI puede
    # repetirse entre movimientos de otro tipo en el futuro - lo que no
    # puede repetirse es el REFUND de un mismo pedido.
    op.create_index(
        'ux_wallet_transactions_order_refund_once',
        'wallet_transactions',
        ['order_id'],
        unique=True,
        postgresql_where=sa.text("type = 'REFUND'"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        'ux_wallet_transactions_order_refund_once',
        table_name='wallet_transactions',
    )
    op.drop_constraint(
        'fk_wallet_transactions_order_id_orders',
        'wallet_transactions',
        type_='foreignkey',
    )
    op.drop_column('wallet_transactions', 'order_id')
    op.drop_column('admin_activities', 'reason')
    op.drop_column('company', 'suspension_reason')
