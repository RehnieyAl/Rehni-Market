"""add commerce tables (cart, orders, favorites, addresses, wallet)

Revision ID: f3a9c1d8e2b6
Revises: 10c26b9019b8
Create Date: 2026-08-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'f3a9c1d8e2b6'
down_revision: Union[str, Sequence[str], None] = '10c26b9019b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # =================================================
    # DIRECCIONES
    # =================================================
    op.create_table(
        'addresses',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('country', sa.String(length=60), nullable=False),
        sa.Column('department', sa.String(length=60), nullable=False),
        sa.Column('city', sa.String(length=60), nullable=False),
        sa.Column('address', sa.String(length=150), nullable=False),
        sa.Column('postal_code', sa.String(length=15), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('is_default', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # =================================================
    # CARRITO
    # =================================================
    op.create_table(
        'carts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )

    op.create_table(
        'cart_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('cart_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('variant_id', sa.UUID(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['cart_id'], ['carts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'cart_id', 'product_id', 'variant_id', name='uq_cart_item_product_variant'
        ),
    )

    # =================================================
    # PEDIDOS
    # =================================================
    # El tipo ENUM se crea automaticamente como parte del propio
    # CREATE TABLE (mismo patron que 34bcbc5738bf_initial_migration.py) -
    # no se llama .create() aparte, o Postgres lo intenta crear dos veces.
    order_status_enum = postgresql.ENUM(
        'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED',
        name='orderstatusenum',
    )

    op.create_table(
        'orders',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('address_id', sa.UUID(), nullable=True),
        sa.Column('status', order_status_enum, nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('tax', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('total', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['company_id'], ['company.id']),
        sa.ForeignKeyConstraint(['address_id'], ['addresses.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'order_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('order_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('variant_id', sa.UUID(), nullable=True),
        sa.Column('product_name', sa.String(length=150), nullable=False),
        sa.Column('variant_name', sa.String(length=150), nullable=True),
        sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # =================================================
    # FAVORITOS
    # =================================================
    op.create_table(
        'favorites',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'product_id', name='uq_favorite_user_product'),
    )

    # =================================================
    # BILLETERA (REHNICOIN)
    # =================================================
    wallet_transaction_type_enum = postgresql.ENUM(
        'RECHARGE', 'PURCHASE', 'REFUND', name='wallettransactiontype',
    )

    op.create_table(
        'wallets',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('balance', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )

    op.create_table(
        'wallet_transactions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('wallet_id', sa.UUID(), nullable=False),
        sa.Column('type', wallet_transaction_type_enum, nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['wallet_id'], ['wallets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('wallet_transactions')
    op.drop_table('wallets')
    op.drop_table('favorites')
    op.drop_table('order_items')
    op.drop_table('orders')
    op.drop_table('cart_items')
    op.drop_table('carts')
    op.drop_table('addresses')

    postgresql.ENUM(name='wallettransactiontype').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='orderstatusenum').drop(op.get_bind(), checkfirst=True)
