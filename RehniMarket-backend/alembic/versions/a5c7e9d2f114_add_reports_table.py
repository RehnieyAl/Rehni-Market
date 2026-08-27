"""add reports table (product/company reports)

Revision ID: a5c7e9d2f114
Revises: 1338b2c2d72b
Create Date: 2026-08-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a5c7e9d2f114'
down_revision: Union[str, Sequence[str], None] = '1338b2c2d72b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # create_type=False en las columnas de abajo: el tipo se crea acá, una
    # sola vez, explícitamente - si se deja create_type=True (default),
    # op.create_table() intenta volver a crearlo al compilar la columna y
    # falla con "type already exists" (ambas sentencias caen en la misma
    # transacción, así que ese segundo intento fallido revierte también
    # la creación del tipo que sí había funcionado).
    report_target_type = postgresql.ENUM(
        'PRODUCT', 'COMPANY', name='report_target_type', create_type=False
    )
    report_target_type.create(op.get_bind())

    report_status = postgresql.ENUM(
        'PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED', name='report_status', create_type=False
    )
    report_status.create(op.get_bind())

    op.create_table(
        'reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('reporter_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('target_type', report_target_type, nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reason', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', report_status, nullable=False, server_default='PENDING'),
        sa.Column('admin_response', sa.Text(), nullable=True),
        sa.Column('resolved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['reporter_id'], ['users.id'], name='fk_reports_reporter_id_users'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], name='fk_reports_product_id_products'),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], name='fk_reports_company_id_company'),
        sa.ForeignKeyConstraint(['resolved_by'], ['users.id'], name='fk_reports_resolved_by_users'),
        # Un producto queda con product_id, una empresa con company_id -
        # nunca ambos, nunca ninguno (ver ModelReport.py).
        sa.CheckConstraint(
            "(target_type = 'PRODUCT' AND product_id IS NOT NULL AND company_id IS NULL) OR "
            "(target_type = 'COMPANY' AND company_id IS NOT NULL AND product_id IS NULL)",
            name='ck_report_target_exclusive',
        ),
    )

    # Índices para los filtros del admin (Tipo/Estado/búsqueda por
    # empresa/producto, ver ALCANCE > Admin > Reportes).
    op.create_index('ix_reports_target_type', 'reports', ['target_type'])
    op.create_index('ix_reports_status', 'reports', ['status'])
    op.create_index('ix_reports_product_id', 'reports', ['product_id'])
    op.create_index('ix_reports_company_id', 'reports', ['company_id'])
    op.create_index('ix_reports_created_at', 'reports', ['created_at'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_reports_created_at', table_name='reports')
    op.drop_index('ix_reports_company_id', table_name='reports')
    op.drop_index('ix_reports_product_id', table_name='reports')
    op.drop_index('ix_reports_status', table_name='reports')
    op.drop_index('ix_reports_target_type', table_name='reports')
    op.drop_table('reports')

    report_status = postgresql.ENUM(name='report_status')
    report_status.drop(op.get_bind())

    report_target_type = postgresql.ENUM(name='report_target_type')
    report_target_type.drop(op.get_bind())
