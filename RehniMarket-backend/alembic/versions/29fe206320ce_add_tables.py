"""add tables

Revision ID: 29fe206320ce
Revises: 
Create Date: 2026-08-28 19:10:32.075586

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '29fe206320ce'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('catalog',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=50), nullable=False),
    sa.Column('description', sa.String(length=500), nullable=True),
    sa.Column('image_url', sa.String(length=255), nullable=True),
    sa.Column('display_order', sa.Integer(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_table('color_variants',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=50), nullable=False),
    sa.Column('hex_color', sa.String(length=7), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_table('roles',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=50), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_table('specification_templates',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('type', sa.String(length=50), nullable=False),
    sa.Column('required', sa.Boolean(), nullable=False),
    sa.Column('catalog_id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['catalog_id'], ['catalog.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('users',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('fullName', sa.String(length=50), nullable=False),
    sa.Column('email', sa.String(length=50), nullable=False),
    sa.Column('hashed_password', sa.String(length=255), nullable=False),
    sa.Column('tell', sa.String(length=50), nullable=False),
    sa.Column('profileImagen', sa.String(length=255), nullable=True),
    sa.Column('verified', sa.Boolean(), nullable=False),
    sa.Column('isActive', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('role_id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )
    op.create_table('addresses',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('label', sa.String(length=60), nullable=True),
    sa.Column('full_name', sa.String(length=150), nullable=True),
    sa.Column('country', sa.String(length=60), nullable=False),
    sa.Column('department', sa.String(length=60), nullable=False),
    sa.Column('city', sa.String(length=60), nullable=False),
    sa.Column('address', sa.String(length=150), nullable=False),
    sa.Column('postal_code', sa.String(length=15), nullable=True),
    sa.Column('phone', sa.String(length=20), nullable=False),
    sa.Column('additional_instructions', sa.String(length=255), nullable=True),
    sa.Column('is_default', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('carts',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id')
    )
    op.create_table('company',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('nameCompany', sa.String(length=50), nullable=False),
    sa.Column('addressCompany', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('CompanyNIT', sa.String(length=50), nullable=False),
    sa.Column('CompanyNITDV', sa.String(length=1), nullable=False),
    sa.Column('CompanyLogo', sa.String(length=255), nullable=True),
    sa.Column('CompanyBanner', sa.String(length=255), nullable=True),
    sa.Column('CompanyCertificate', sa.String(length=255), nullable=True),
    sa.Column('CompanyCertificateStatus', sa.Enum('PENDING', 'APPROVED', 'REJECTED', name='companycertificateenum'), nullable=False),
    sa.Column('CompanyStatus', sa.Boolean(), nullable=False),
    sa.Column('suspension_reason', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id')
    )
    op.create_table('event_codes',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('code', sa.String(length=10), nullable=False),
    sa.Column('type', sa.Enum('RESET_PASSWORD', 'VERIFY_EMAIL', 'CHANGE_EMAIL', name='type_code_enum'), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('expires_at', sa.DateTime(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_codes_user_type', 'event_codes', ['user_id', 'type'], unique=False)
    op.create_table('refreshToken',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('token', sa.String(length=255), nullable=False),
    sa.Column('revoked', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('expires_at', sa.DateTime(), nullable=True),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('wallets',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('balance', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id')
    )
    op.create_table('admin_activities',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('admin_id', sa.UUID(), nullable=False),
    sa.Column('action', sa.Enum('user_created', 'user_updated', 'user_upgraded', 'user_blocked', 'user_unblocked', 'user_deleted', 'company_created', 'company_approved', 'company_rejected', 'company_blocked', 'company_unblocked', name='admin_activity_action'), nullable=False),
    sa.Column('target_user_id', sa.UUID(), nullable=True),
    sa.Column('target_company_id', sa.UUID(), nullable=True),
    sa.Column('reason', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['target_company_id'], ['company.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['target_user_id'], ['users.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('company_bank_accounts',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('company_id', sa.UUID(), nullable=False),
    sa.Column('account_holder', sa.String(length=150), nullable=False),
    sa.Column('document_number', sa.String(length=30), nullable=False),
    sa.Column('bank_name', sa.String(length=100), nullable=False),
    sa.Column('account_type', sa.Enum('SAVINGS', 'CHECKING', 'NEQUI', 'DAVIPLATA', name='bankaccounttypeenum'), nullable=False),
    sa.Column('account_number', sa.String(length=40), nullable=False),
    sa.Column('is_default', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('uq_company_bank_account_default', 'company_bank_accounts', ['company_id'], unique=True, postgresql_where=sa.text('is_default = true'))
    op.create_table('orders',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('order_number', sa.Integer(), sa.Identity(always=False, start=1, increment=1), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('company_id', sa.UUID(), nullable=False),
    sa.Column('address_id', sa.UUID(), nullable=True),
    sa.Column('delivery_label', sa.String(length=60), nullable=True),
    sa.Column('delivery_full_name', sa.String(length=150), nullable=True),
    sa.Column('delivery_phone', sa.String(length=20), nullable=True),
    sa.Column('delivery_address', sa.String(length=150), nullable=True),
    sa.Column('delivery_city', sa.String(length=60), nullable=True),
    sa.Column('delivery_department', sa.String(length=60), nullable=True),
    sa.Column('status', sa.Enum('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', name='orderstatusenum'), nullable=False),
    sa.Column('subtotal', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('tax', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('total', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['address_id'], ['addresses.id'], ),
    sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('order_number')
    )
    op.create_table('products',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('discount_enable', sa.Boolean(), nullable=False),
    sa.Column('discount_value', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('stock', sa.Integer(), nullable=False),
    sa.Column('has_variants', sa.Boolean(), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('company_id', sa.UUID(), nullable=False),
    sa.Column('catalog_id', sa.UUID(), nullable=False),
    sa.Column('main_color_id', sa.UUID(), nullable=True),
    sa.ForeignKeyConstraint(['catalog_id'], ['catalog.id'], ),
    sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
    sa.ForeignKeyConstraint(['main_color_id'], ['color_variants.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('advertisements',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('title', sa.String(length=150), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('image_url', sa.String(length=255), nullable=False),
    sa.Column('mobile_image_url', sa.String(length=255), nullable=True),
    sa.Column('button_text', sa.String(length=50), nullable=True),
    sa.Column('button_link', sa.String(length=255), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('order', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('target_type', sa.Enum('PRODUCT', 'CATEGORY', 'COMPANY', 'PROMOTION', 'BLACK_FRIDAY', 'CYBER_DAYS', 'LIQUIDATION', 'NEW_RELEASE', name='advertisementtargettype'), nullable=True),
    sa.Column('target_product_id', sa.UUID(), nullable=True),
    sa.Column('target_catalog_id', sa.UUID(), nullable=True),
    sa.Column('target_company_id', sa.UUID(), nullable=True),
    sa.Column('minimum_discount', sa.Integer(), nullable=True),
    sa.Column('maximum_stock', sa.Integer(), nullable=True),
    sa.Column('max_age_days', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['target_catalog_id'], ['catalog.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['target_company_id'], ['company.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['target_product_id'], ['products.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('company_payouts',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('company_id', sa.UUID(), nullable=False),
    sa.Column('period_start', sa.Date(), nullable=False),
    sa.Column('period_end', sa.Date(), nullable=False),
    sa.Column('gross_sales', sa.Numeric(precision=14, scale=2), nullable=False),
    sa.Column('commission_percentage', sa.Numeric(precision=5, scale=4), nullable=False),
    sa.Column('commission_amount', sa.Numeric(precision=14, scale=2), nullable=False),
    sa.Column('net_amount', sa.Numeric(precision=14, scale=2), nullable=False),
    sa.Column('payout_status', sa.Enum('PENDING', 'PROCESSING', 'PAID', 'FAILED', name='payoutstatusenum'), nullable=False),
    sa.Column('bank_account_id', sa.UUID(), nullable=False),
    sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['bank_account_id'], ['company_bank_accounts.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('company_id', 'period_start', 'period_end', name='uq_payout_company_period')
    )
    op.create_table('favorites',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('product_id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'product_id', name='uq_favorite_user_product')
    )
    op.create_table('product_images',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('url', sa.String(length=255), nullable=False),
    sa.Column('is_main', sa.Boolean(), nullable=False),
    sa.Column('product_id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('product_specifications',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('value', sa.Text(), nullable=False),
    sa.Column('product_id', sa.UUID(), nullable=False),
    sa.Column('specification_template_id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
    sa.ForeignKeyConstraint(['specification_template_id'], ['specification_templates.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('product_variants',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('stock', sa.Integer(), nullable=False),
    sa.Column('discount_enable', sa.Boolean(), nullable=False),
    sa.Column('discount_value', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('product_id', sa.UUID(), nullable=False),
    sa.Column('color_id', sa.UUID(), nullable=True),
    sa.ForeignKeyConstraint(['color_id'], ['color_variants.id'], ),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('reports',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('reporter_id', sa.UUID(), nullable=False),
    sa.Column('target_type', sa.Enum('PRODUCT', 'COMPANY', name='report_target_type'), nullable=False),
    sa.Column('product_id', sa.UUID(), nullable=True),
    sa.Column('company_id', sa.UUID(), nullable=True),
    sa.Column('reason', sa.String(length=150), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('status', sa.Enum('PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED', name='report_status'), nullable=False),
    sa.Column('admin_response', sa.Text(), nullable=True),
    sa.Column('resolved_by', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
    sa.CheckConstraint("(target_type = 'PRODUCT' AND product_id IS NOT NULL AND company_id IS NULL) OR (target_type = 'COMPANY' AND company_id IS NOT NULL AND product_id IS NULL)", name='ck_report_target_exclusive'),
    sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
    sa.ForeignKeyConstraint(['reporter_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['resolved_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('reviews',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('product_id', sa.UUID(), nullable=False),
    sa.Column('rating', sa.Integer(), nullable=False),
    sa.Column('comment', sa.Text(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.CheckConstraint('rating >= 1 AND rating <= 5', name='ck_review_rating_range'),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'product_id', name='uq_review_user_product')
    )
    op.create_table('wallet_transactions',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('wallet_id', sa.UUID(), nullable=False),
    sa.Column('type', sa.Enum('RECHARGE', 'PURCHASE', 'REFUND', 'ADJUSTMENT', name='wallettransactiontype'), nullable=False),
    sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('description', sa.String(length=255), nullable=True),
    sa.Column('created_by', sa.UUID(), nullable=True),
    sa.Column('order_id', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['wallet_id'], ['wallets.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('cart_items',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('cart_id', sa.UUID(), nullable=False),
    sa.Column('product_id', sa.UUID(), nullable=False),
    sa.Column('variant_id', sa.UUID(), nullable=True),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['cart_id'], ['carts.id'], ),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
    sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('cart_id', 'product_id', 'variant_id', name='uq_cart_item_product_variant')
    )
    op.create_table('order_items',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('order_id', sa.UUID(), nullable=False),
    sa.Column('product_id', sa.UUID(), nullable=False),
    sa.Column('variant_id', sa.UUID(), nullable=True),
    sa.Column('product_name', sa.String(length=150), nullable=False),
    sa.Column('variant_name', sa.String(length=150), nullable=True),
    sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('original_unit_price', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.Column('subtotal', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
    sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('product_variant_images',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('url', sa.String(length=255), nullable=False),
    sa.Column('is_main', sa.Boolean(), nullable=False),
    sa.Column('variant_id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('rehnicoin_movements',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('company_id', sa.UUID(), nullable=False),
    sa.Column('payout_id', sa.UUID(), nullable=False),
    sa.Column('amount_cop', sa.Numeric(precision=14, scale=2), nullable=False),
    sa.Column('rehni_coins', sa.Numeric(precision=14, scale=2), nullable=False),
    sa.Column('conversion_rate', sa.Numeric(precision=10, scale=4), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
    sa.ForeignKeyConstraint(['payout_id'], ['company_payouts.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('payout_id')
    )
    op.create_table('report_evidences',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('report_id', sa.UUID(), nullable=False),
    sa.Column('url', sa.String(length=255), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['report_id'], ['reports.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('variant_specifications',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('value', sa.Text(), nullable=False),
    sa.Column('variant_id', sa.UUID(), nullable=False),
    sa.Column('specification_template_id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['specification_template_id'], ['specification_templates.id'], ),
    sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('variant_specifications')
    op.drop_table('report_evidences')
    op.drop_table('rehnicoin_movements')
    op.drop_table('product_variant_images')
    op.drop_table('order_items')
    op.drop_table('cart_items')
    op.drop_table('wallet_transactions')
    op.drop_table('reviews')
    op.drop_table('reports')
    op.drop_table('product_variants')
    op.drop_table('product_specifications')
    op.drop_table('product_images')
    op.drop_table('favorites')
    op.drop_table('company_payouts')
    op.drop_table('advertisements')
    op.drop_table('products')
    op.drop_table('orders')
    op.drop_index('uq_company_bank_account_default', table_name='company_bank_accounts', postgresql_where=sa.text('is_default = true'))
    op.drop_table('company_bank_accounts')
    op.drop_table('admin_activities')
    op.drop_table('wallets')
    op.drop_table('refreshToken')
    op.drop_index('idx_codes_user_type', table_name='event_codes')
    op.drop_table('event_codes')
    op.drop_table('company')
    op.drop_table('carts')
    op.drop_table('addresses')
    op.drop_table('users')
    op.drop_table('specification_templates')
    op.drop_table('roles')
    op.drop_table('color_variants')
    op.drop_table('catalog')
