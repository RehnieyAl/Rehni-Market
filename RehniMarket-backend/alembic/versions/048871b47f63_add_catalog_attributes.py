"""add catalog attributes

Revision ID: 048871b47f63
Revises: d72ef7fa597e
Create Date: 2026-08-29 00:45:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "048871b47f63"
down_revision: Union[str, Sequence[str], None] = "d72ef7fa597e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "catalog_attributes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("catalog_id", UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column(
            "input_type",
            sa.String(length=16),
            nullable=False,
            server_default="select",
        ),
        sa.Column("unit", sa.String(length=24), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.true()
        ),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["catalog_id"], ["catalog.id"]),
        sa.UniqueConstraint(
            "catalog_id", "name", name="uq_catalog_attribute_catalog_name"
        ),
    )
    op.create_index(
        "ix_catalog_attributes_catalog_id",
        "catalog_attributes",
        ["catalog_id"],
    )

    op.create_table(
        "catalog_attribute_options",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("attribute_id", UUID(as_uuid=True), nullable=False),
        sa.Column("value", sa.String(length=80), nullable=False),
        sa.Column("hex_color", sa.String(length=7), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["attribute_id"], ["catalog_attributes.id"]),
        sa.UniqueConstraint(
            "attribute_id", "value", name="uq_catalog_attribute_option_value"
        ),
    )
    op.create_index(
        "ix_catalog_attribute_options_attribute_id",
        "catalog_attribute_options",
        ["attribute_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_catalog_attribute_options_attribute_id",
        table_name="catalog_attribute_options",
    )
    op.drop_table("catalog_attribute_options")
    op.drop_index(
        "ix_catalog_attributes_catalog_id", table_name="catalog_attributes"
    )
    op.drop_table("catalog_attributes")
