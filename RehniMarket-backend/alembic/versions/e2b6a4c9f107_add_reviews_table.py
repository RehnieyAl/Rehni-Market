"""add reviews table

Revision ID: e2b6a4c9f107
Revises: d9a6b3f4c8e1
Create Date: 2026-08-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e2b6a4c9f107'
down_revision: Union[str, Sequence[str], None] = 'd9a6b3f4c8e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        'reviews',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'product_id', name='uq_review_user_product'),
        sa.CheckConstraint('rating >= 1 AND rating <= 5', name='ck_review_rating_range'),
    )

    # Compuesto (product_id, is_active): sirve tanto al listado publico de
    # reseñas de un producto (GET /public/products/{id}/reviews, filtra
    # por exactamente estas dos columnas) como al join+filter de
    # get_company_rating (ver ReviewRepository.py) - evita un seq scan
    # sobre reviews a medida que crece la tabla (ver ALCANCE > regla 10:
    # optimizar consultas).
    op.create_index(
        'ix_reviews_product_id_is_active', 'reviews', ['product_id', 'is_active']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_reviews_product_id_is_active', table_name='reviews')
    op.drop_table('reviews')
