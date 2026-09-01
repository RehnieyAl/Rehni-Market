"""shipping carriers catalog + order shipping info

- Nueva tabla `shipping_carriers` (catálogo global Admin/Owner).
- `orders.shipping_carrier_id` (FK nullable) y `orders.tracking_number` (nullable):
  los pedidos existentes siguen funcionando sin transportadora ni guía.

Revision ID: e7a1c9d24b30
Revises: d4e5f6a7b8c9
Create Date: 2026-08-29 19:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e7a1c9d24b30"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "shipping_carriers",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("tracking_url", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.add_column(
        "orders", sa.Column("shipping_carrier_id", sa.UUID(), nullable=True)
    )
    op.add_column(
        "orders", sa.Column("tracking_number", sa.String(length=80), nullable=True)
    )
    op.create_foreign_key(
        "fk_orders_shipping_carrier_id",
        "orders",
        "shipping_carriers",
        ["shipping_carrier_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_orders_shipping_carrier_id", "orders", type_="foreignkey")
    op.drop_column("orders", "tracking_number")
    op.drop_column("orders", "shipping_carrier_id")
    op.drop_table("shipping_carriers")
