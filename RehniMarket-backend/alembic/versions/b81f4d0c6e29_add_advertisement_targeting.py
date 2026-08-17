"""add advertisement dynamic targeting (target_type + rules)

Revision ID: b81f4d0c6e29
Revises: a4c7d19e5f83
Create Date: 2026-08-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b81f4d0c6e29'
down_revision: Union[str, Sequence[str], None] = 'a4c7d19e5f83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    target_type_enum = postgresql.ENUM(
        'PRODUCT', 'CATEGORY', 'COMPANY', 'PROMOTION', 'BLACK_FRIDAY',
        'CYBER_DAYS', 'LIQUIDATION', 'NEW_RELEASE',
        name='advertisementtargettype',
    )
    target_type_enum.create(op.get_bind(), checkfirst=True)

    # Todas nullable: los anuncios existentes quedan con target_type=NULL
    # (modo manual clasico, ver ModelAdvertisement.py) - compatibilidad
    # total, no se les asigna ningun tipo/valor por defecto.
    op.add_column(
        'advertisements',
        sa.Column('target_type', target_type_enum, nullable=True),
    )
    op.add_column(
        'advertisements', sa.Column('target_product_id', sa.UUID(), nullable=True)
    )
    op.add_column(
        'advertisements', sa.Column('target_catalog_id', sa.UUID(), nullable=True)
    )
    op.add_column(
        'advertisements', sa.Column('target_company_id', sa.UUID(), nullable=True)
    )
    op.add_column(
        'advertisements', sa.Column('minimum_discount', sa.Integer(), nullable=True)
    )
    op.add_column(
        'advertisements', sa.Column('maximum_stock', sa.Integer(), nullable=True)
    )
    op.add_column(
        'advertisements', sa.Column('max_age_days', sa.Integer(), nullable=True)
    )

    op.create_foreign_key(
        'fk_advertisements_target_product_id', 'advertisements', 'products',
        ['target_product_id'], ['id'], ondelete='SET NULL',
    )
    op.create_foreign_key(
        'fk_advertisements_target_catalog_id', 'advertisements', 'catalog',
        ['target_catalog_id'], ['id'], ondelete='SET NULL',
    )
    op.create_foreign_key(
        'fk_advertisements_target_company_id', 'advertisements', 'company',
        ['target_company_id'], ['id'], ondelete='SET NULL',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        'fk_advertisements_target_company_id', 'advertisements', type_='foreignkey'
    )
    op.drop_constraint(
        'fk_advertisements_target_catalog_id', 'advertisements', type_='foreignkey'
    )
    op.drop_constraint(
        'fk_advertisements_target_product_id', 'advertisements', type_='foreignkey'
    )

    op.drop_column('advertisements', 'max_age_days')
    op.drop_column('advertisements', 'maximum_stock')
    op.drop_column('advertisements', 'minimum_discount')
    op.drop_column('advertisements', 'target_company_id')
    op.drop_column('advertisements', 'target_catalog_id')
    op.drop_column('advertisements', 'target_product_id')
    op.drop_column('advertisements', 'target_type')

    postgresql.ENUM(name='advertisementtargettype').drop(op.get_bind(), checkfirst=True)
