"""variant combinations and discounts

Revision ID: a90540bebea
Revises: 048871b47f63
Create Date: 2026-08-29 02:10:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "a90540bebea"
down_revision: Union[str, Sequence[str], None] = "048871b47f63"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_DISCOUNT_COLUMNS = (
    ("discount_type", sa.String(length=8)),
    ("discount_starts_at", sa.DateTime()),
    ("discount_ends_at", sa.DateTime()),
)


def upgrade() -> None:
    for name, column_type in _DISCOUNT_COLUMNS:
        op.add_column("products", sa.Column(name, column_type, nullable=True))
        op.add_column(
            "product_variants", sa.Column(name, column_type, nullable=True)
        )

    op.add_column(
        "product_variants", sa.Column("sku", sa.String(length=64), nullable=True)
    )
    op.add_column(
        "product_variants",
        sa.Column("combo_key", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "product_variants", sa.Column("deleted_at", sa.DateTime(), nullable=True)
    )

    op.create_index(
        "uq_variant_product_combo_active",
        "product_variants",
        ["product_id", "combo_key"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL AND combo_key IS NOT NULL"),
    )
    op.create_index(
        "uq_variant_product_sku_active",
        "product_variants",
        ["product_id", "sku"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL AND sku IS NOT NULL"),
    )

    op.create_table(
        "variant_options",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("variant_id", UUID(as_uuid=True), nullable=False),
        sa.Column("attribute_id", UUID(as_uuid=True), nullable=False),
        sa.Column("option_id", UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["variant_id"], ["product_variants.id"]),
        sa.ForeignKeyConstraint(["attribute_id"], ["catalog_attributes.id"]),
        sa.ForeignKeyConstraint(["option_id"], ["catalog_attribute_options.id"]),
        sa.UniqueConstraint(
            "variant_id", "attribute_id", name="uq_variant_option_axis"
        ),
    )
    op.create_index(
        "ix_variant_options_variant_id", "variant_options", ["variant_id"]
    )

    op.create_table(
        "product_attribute_values",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("product_id", UUID(as_uuid=True), nullable=False),
        sa.Column("attribute_id", UUID(as_uuid=True), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["attribute_id"], ["catalog_attributes.id"]),
        sa.UniqueConstraint(
            "product_id", "attribute_id", name="uq_product_attribute_value"
        ),
    )
    op.create_index(
        "ix_product_attribute_values_product_id",
        "product_attribute_values",
        ["product_id"],
    )

    op.create_table(
        "variant_attribute_values",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("variant_id", UUID(as_uuid=True), nullable=False),
        sa.Column("attribute_id", UUID(as_uuid=True), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["variant_id"], ["product_variants.id"]),
        sa.ForeignKeyConstraint(["attribute_id"], ["catalog_attributes.id"]),
        sa.UniqueConstraint(
            "variant_id", "attribute_id", name="uq_variant_attribute_value"
        ),
    )
    op.create_index(
        "ix_variant_attribute_values_variant_id",
        "variant_attribute_values",
        ["variant_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_variant_attribute_values_variant_id",
        table_name="variant_attribute_values",
    )
    op.drop_table("variant_attribute_values")
    op.drop_index(
        "ix_product_attribute_values_product_id",
        table_name="product_attribute_values",
    )
    op.drop_table("product_attribute_values")
    op.drop_index("ix_variant_options_variant_id", table_name="variant_options")
    op.drop_table("variant_options")

    op.drop_index(
        "uq_variant_product_sku_active", table_name="product_variants"
    )
    op.drop_index(
        "uq_variant_product_combo_active", table_name="product_variants"
    )

    op.drop_column("product_variants", "deleted_at")
    op.drop_column("product_variants", "combo_key")
    op.drop_column("product_variants", "sku")

    for name, _ in _DISCOUNT_COLUMNS:
        op.drop_column("product_variants", name)
        op.drop_column("products", name)
