"""return requests (devoluciones de ítems de pedidos entregados)

Nueva tabla `return_requests`: el comprador solicita la devolución de un ítem de un
pedido DELIVERED; la empresa dueña del pedido (company_id denormalizado) aprueba o
rechaza. Al aprobar se reintegra el dinero a la billetera RehniCoin del comprador
(WalletService.refund_wallet, order_id=None). Al rechazar, company_response guarda el
motivo obligatorio.

Índice único parcial `uq_return_active_per_item` sobre order_item_id WHERE
status <> 'REJECTED': una sola devolución activa/aprobada por ítem; tras un rechazo se
puede volver a solicitar. No toca tablas existentes.

Revision ID: f7a2b9c1d3e4
Revises: e1f2a3b4c5d6
Create Date: 2026-09-07 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f7a2b9c1d3e4"
down_revision: Union[str, Sequence[str], None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "return_requests",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("order_id", sa.UUID(), nullable=False),
        sa.Column("order_item_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("PENDING", "APPROVED", "REJECTED", name="return_status"),
            nullable=False,
        ),
        sa.Column("company_response", sa.Text(), nullable=True),
        sa.Column("reviewed_by", sa.UUID(), nullable=True),
        sa.Column("refund_amount", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["order_item_id"], ["order_items.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"]),
        sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_return_requests_company_id", "return_requests", ["company_id"]
    )
    op.create_index(
        "ix_return_requests_order_id", "return_requests", ["order_id"]
    )
    op.create_index(
        "ix_return_requests_user_id", "return_requests", ["user_id"]
    )
    op.create_index(
        "uq_return_active_per_item",
        "return_requests",
        ["order_item_id"],
        unique=True,
        postgresql_where=sa.text("status <> 'REJECTED'"),
    )


def downgrade() -> None:
    op.drop_index("uq_return_active_per_item", table_name="return_requests")
    op.drop_index("ix_return_requests_user_id", table_name="return_requests")
    op.drop_index("ix_return_requests_order_id", table_name="return_requests")
    op.drop_index("ix_return_requests_company_id", table_name="return_requests")
    op.drop_table("return_requests")
    sa.Enum(name="return_status").drop(op.get_bind(), checkfirst=True)
