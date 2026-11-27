"""shipping_carriers.created_at NOT NULL (alinea la migración con el modelo, H-01)

`e7a1c9d24b30` creó la columna con nullable=True mientras el modelo la declara NOT NULL
(`Mapped[datetime]` con valor por defecto). El ORM siempre la rellena, pero un INSERT SQL
directo podía dejar NULL y `alembic check` reportaba la diferencia. Antes de imponer la
restricción se completan solo las filas que estuvieran en NULL con la hora actual; no se
modifica ningún otro dato.

Revision ID: c6e8a0b2d4f7
Revises: b5d7f9a1c3e6
Create Date: 2026-11-25 18:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c6e8a0b2d4f7"
down_revision: Union[str, Sequence[str], None] = "b5d7f9a1c3e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE shipping_carriers SET created_at = now() WHERE created_at IS NULL")
    op.alter_column(
        "shipping_carriers",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "shipping_carriers",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        nullable=True,
    )
