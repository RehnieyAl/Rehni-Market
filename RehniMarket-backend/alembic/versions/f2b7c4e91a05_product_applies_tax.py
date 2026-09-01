"""product.applies_tax - IVA opcional por producto

Añade `products.applies_tax` (BOOLEAN NOT NULL DEFAULT true). El default a nivel
de servidor deja a los productos existentes exactamente como estaban (todos con
IVA); el vendedor lo desmarca cuando corresponda. No toca `orders` ni ninguna
tabla de la comisión: los pedidos históricos conservan su `orders.tax`.

Revision ID: f2b7c4e91a05
Revises: e7a1c9d24b30
Create Date: 2026-08-29 20:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f2b7c4e91a05"
down_revision: Union[str, Sequence[str], None] = "e7a1c9d24b30"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "applies_tax",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )


def downgrade() -> None:
    op.drop_column("products", "applies_tax")
