"""order payout link

orders.payout_id: liquidación que pagó cada venta. Se rellena con la misma regla con la que se
generaron las liquidaciones existentes (pedido DELIVERED con created_at dentro de
[period_start, period_end + 1 día) comparado en la zona horaria de la sesión, UTC en el despliegue),
así lo ya liquidado sigue liquidado y ningún importe histórico cambia. Si dos liquidaciones se
solapan, la venta queda en la generada primero. Las ventas que esa regla dejó fuera (cierre en hora
de Bogotá o entrega posterior a la liquidación) quedan sin enlace y entran en la siguiente
liquidación: ver docs/runbooks/conciliar-liquidaciones.md.

Revision ID: a4c6e8f0b2d4
Revises: f1c3e5a7b9d2
Create Date: 2026-11-26 18:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a4c6e8f0b2d4"
down_revision: Union[str, Sequence[str], None] = "f1c3e5a7b9d2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

BACKFILL_SQL = """
UPDATE orders AS o
SET payout_id = (
    SELECT p.id
    FROM company_payouts AS p
    WHERE p.company_id = o.company_id
      AND o.created_at >= p.period_start
      AND o.created_at < p.period_end + 1
    ORDER BY p.created_at, p.id
    LIMIT 1
)
WHERE o.status = 'DELIVERED'
  AND o.payout_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM company_payouts AS p
    WHERE p.company_id = o.company_id
      AND o.created_at >= p.period_start
      AND o.created_at < p.period_end + 1
  )
"""


def upgrade() -> None:
    op.add_column("orders", sa.Column("payout_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "orders_payout_id_fkey", "orders", "company_payouts", ["payout_id"], ["id"], ondelete="RESTRICT"
    )
    op.create_index(op.f("ix_orders_payout_id"), "orders", ["payout_id"], unique=False)
    op.execute(BACKFILL_SQL)


def downgrade() -> None:
    op.drop_index(op.f("ix_orders_payout_id"), table_name="orders")
    op.drop_constraint("orders_payout_id_fkey", "orders", type_="foreignkey")
    op.drop_column("orders", "payout_id")
