"""add report_evidences table

Revision ID: c8e2b5d7f341
Revises: b6d1f8a3c920
Create Date: 2026-08-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c8e2b5d7f341'
down_revision: Union[str, Sequence[str], None] = 'b6d1f8a3c920'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'report_evidences',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('report_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('url', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ['report_id'], ['reports.id'],
            name='fk_report_evidences_report_id_reports',
            ondelete='CASCADE',
        ),
    )

    op.create_index(
        'ix_report_evidences_report_id', 'report_evidences', ['report_id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_report_evidences_report_id', table_name='report_evidences')
    op.drop_table('report_evidences')
