"""add payout module (bank accounts, company payouts, rehnicoin movements)

Revision ID: a7c4f1e9b3d5
Revises: d4e8a2f6b930
Create Date: 2026-08-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a7c4f1e9b3d5'
down_revision: Union[str, Sequence[str], None] = 'd4e8a2f6b930'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # =================================================
    # CUENTAS BANCARIAS DE EMPRESA
    # =================================================
    # El tipo ENUM se crea automaticamente como parte del propio
    # CREATE TABLE (mismo patron que f3a9c1d8e2b6_add_commerce_tables.py) -
    # no se llama .create() aparte, o Postgres lo intenta crear dos veces.
    # Los labels son el NOMBRE del miembro de Python (SAVINGS, no
    # "savings") - SQLAlchemy Enum guarda por default el .name del
    # PyEnum, no su .value (mismo comportamiento ya usado por
    # orderstatusenum/wallettransactiontype en esa misma migracion).
    bank_account_type_enum = postgresql.ENUM(
        'SAVINGS', 'CHECKING', 'NEQUI', 'DAVIPLATA',
        name='bankaccounttypeenum',
    )

    op.create_table(
        'company_bank_accounts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('account_holder', sa.String(length=150), nullable=False),
        sa.Column('document_number', sa.String(length=30), nullable=False),
        sa.Column('bank_name', sa.String(length=100), nullable=False),
        sa.Column('account_type', bank_account_type_enum, nullable=False),
        sa.Column('account_number', sa.String(length=40), nullable=False),
        sa.Column('is_default', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # Una sola cuenta predeterminada por empresa (ver ALCANCE > Módulo de
    # liquidaciones, Fase 1 "Restricciones") - índice único parcial, la
    # aplicación ya lo garantiza aparte (ver BankAccountService.py) pero
    # esto evita una carrera de dos requests concurrentes.
    op.create_index(
        'uq_company_bank_account_default',
        'company_bank_accounts',
        ['company_id'],
        unique=True,
        postgresql_where=sa.text('is_default = true'),
    )

    # =================================================
    # LIQUIDACIONES
    # =================================================
    payout_status_enum = postgresql.ENUM(
        'PENDING', 'PROCESSING', 'PAID', 'FAILED',
        name='payoutstatusenum',
    )

    op.create_table(
        'company_payouts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('gross_sales', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('commission_percentage', sa.Numeric(precision=5, scale=4), nullable=False),
        sa.Column('commission_amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('net_amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('payout_status', payout_status_enum, nullable=False),
        sa.Column('bank_account_id', sa.UUID(), nullable=False),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(
            ['bank_account_id'], ['company_bank_accounts.id'], ondelete='RESTRICT'
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'company_id', 'period_start', 'period_end', name='uq_payout_company_period'
        ),
    )

    # =================================================
    # MOVIMIENTOS REHNICOIN (conversión de liquidaciones)
    # =================================================
    op.create_table(
        'rehnicoin_movements',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('payout_id', sa.UUID(), nullable=False),
        sa.Column('amount_cop', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('rehni_coins', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('conversion_rate', sa.Numeric(precision=10, scale=4), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['payout_id'], ['company_payouts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('payout_id'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('rehnicoin_movements')
    op.drop_table('company_payouts')
    op.drop_index('uq_company_bank_account_default', table_name='company_bank_accounts')
    op.drop_table('company_bank_accounts')

    postgresql.ENUM(name='payoutstatusenum').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='bankaccounttypeenum').drop(op.get_bind(), checkfirst=True)
