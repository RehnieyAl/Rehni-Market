"""returns claims (reembolso único, IVA histórico, compensación en liquidaciones, historial)

- return_status gana UNDER_REVIEW (revisión administrativa) y return_requests guarda el asunto
  de la empresa, la revisión pedida por el comprador, la intervención del administrador y la
  liquidación que descontó el reembolso.
- return_request_events (historial) y return_notifications (correos pendientes y su estado).
- wallet_transactions.return_request_id con índice único parcial: un solo reembolso por
  reclamación. No se enlazan reembolsos antiguos (solo tenían una descripción de texto); las
  reclamaciones ya aprobadas no se pueden volver a aprobar por su estado.
- order_items.tax_amount: IVA cobrado por línea. En pedidos existentes solo se rellena cuando el
  reparto es exacto (pedido sin IVA, una sola línea, o todas las líneas gravadas); en el resto
  queda NULL y el reembolso se bloquea en lugar de inventar un monto.
- company.contact_email / contact_phone (contacto empresarial, vacío en empresas existentes).
- company_payouts.refunds_amount = 0 en las liquidaciones históricas.

Revision ID: e9a1b3c5d7f2
Revises: d8f0a2c4e6b1
Create Date: 2026-11-25 20:00:00.000000

"""
from decimal import Decimal
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e9a1b3c5d7f2"
down_revision: Union[str, Sequence[str], None] = "d8f0a2c4e6b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TAX_RATE = Decimal("0.19")
CENTS = Decimal("0.01")

EVENT_TYPES = (
    "REQUESTED", "COMPANY_APPROVED", "COMPANY_REJECTED", "REFUNDED", "REVIEW_REQUESTED",
    "ESCALATED", "ADMIN_APPROVED", "ADMIN_REJECTED", "ADMIN_EMAIL", "ADMIN_CALL",
)
CALL_OUTCOMES = ("CONTACTED", "NO_ANSWER", "WRONG_NUMBER", "CALLBACK_REQUESTED")
NOTIFICATION_STATUSES = ("PENDING", "SENDING", "ACCEPTED", "FAILED")


def _tax(base: Decimal) -> Decimal:
    return (base * TAX_RATE).quantize(CENTS)


def _line_taxes(subtotals: list[Decimal], order_tax: Decimal) -> list[Decimal] | None:
    """Reparto exacto del IVA del pedido por línea, o None si no se puede deducir."""

    if order_tax == 0:
        return [Decimal("0")] * len(subtotals)

    if len(subtotals) == 1:
        return [order_tax]

    if _tax(sum(subtotals, Decimal("0"))) != order_tax:
        return None

    taxes = [_tax(subtotal) for subtotal in subtotals]
    taxes[-1] += order_tax - sum(taxes, Decimal("0"))
    return taxes


def _backfill_line_taxes() -> None:
    bind = op.get_bind()
    rows = bind.execute(
        sa.text(
            "SELECT o.id, o.tax, i.id, i.subtotal FROM orders o "
            "JOIN order_items i ON i.order_id = o.id ORDER BY o.id, i.id"
        )
    ).fetchall()

    orders: dict = {}
    for order_id, order_tax, item_id, subtotal in rows:
        orders.setdefault(order_id, (Decimal(order_tax), []))[1].append((item_id, Decimal(subtotal)))

    for order_tax, items in orders.values():
        taxes = _line_taxes([subtotal for _, subtotal in items], order_tax)
        if taxes is None:
            continue
        for (item_id, _), tax in zip(items, taxes):
            bind.execute(
                sa.text("UPDATE order_items SET tax_amount = :tax WHERE id = :id"),
                {"tax": tax, "id": item_id},
            )


def upgrade() -> None:
    op.execute("ALTER TYPE return_status ADD VALUE IF NOT EXISTS 'UNDER_REVIEW'")

    event_type = postgresql.ENUM(*EVENT_TYPES, name="return_event_type", create_type=False)
    call_outcome = postgresql.ENUM(*CALL_OUTCOMES, name="return_call_outcome", create_type=False)
    notification_status = postgresql.ENUM(
        *NOTIFICATION_STATUSES, name="return_notification_status", create_type=False
    )
    bind = op.get_bind()
    event_type.create(bind, checkfirst=True)
    call_outcome.create(bind, checkfirst=True)
    notification_status.create(bind, checkfirst=True)

    op.add_column("return_requests", sa.Column("company_subject", sa.String(length=150), nullable=True))
    op.add_column("return_requests", sa.Column("review_reason", sa.Text(), nullable=True))
    op.add_column("return_requests", sa.Column("review_requested_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("return_requests", sa.Column("escalated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("return_requests", sa.Column("admin_subject", sa.String(length=150), nullable=True))
    op.add_column("return_requests", sa.Column("admin_response", sa.Text(), nullable=True))
    op.add_column("return_requests", sa.Column("admin_reviewed_by", sa.UUID(), nullable=True))
    op.add_column("return_requests", sa.Column("admin_resolved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("return_requests", sa.Column("payout_adjustment_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "return_requests_admin_reviewed_by_fkey", "return_requests", "users", ["admin_reviewed_by"], ["id"]
    )
    op.create_foreign_key(
        "return_requests_payout_adjustment_id_fkey",
        "return_requests", "company_payouts", ["payout_adjustment_id"], ["id"],
    )
    op.create_index(
        "ix_return_requests_payout_adjustment_id", "return_requests", ["payout_adjustment_id"]
    )

    op.create_table(
        "return_request_events",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("return_request_id", sa.UUID(), nullable=False),
        sa.Column("event_type", event_type, nullable=False),
        sa.Column("actor_id", sa.UUID(), nullable=True),
        sa.Column("actor_role", sa.String(length=20), nullable=False),
        sa.Column("subject", sa.String(length=150), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("wallet_transaction_id", sa.UUID(), nullable=True),
        sa.Column("call_outcome", call_outcome, nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["return_request_id"], ["return_requests.id"]),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["wallet_transaction_id"], ["wallet_transactions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_return_request_events_return_request_id", "return_request_events", ["return_request_id"]
    )

    op.create_table(
        "return_notifications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("return_request_id", sa.UUID(), nullable=False),
        sa.Column("event_id", sa.UUID(), nullable=True),
        sa.Column("kind", sa.String(length=40), nullable=False),
        sa.Column("recipient_role", sa.String(length=20), nullable=False),
        sa.Column("recipient_email", sa.String(length=254), nullable=False),
        sa.Column("subject", sa.String(length=150), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("body_html", sa.Text(), nullable=False),
        sa.Column("status", notification_status, nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("last_error", sa.String(length=500), nullable=True),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["return_request_id"], ["return_requests.id"]),
        sa.ForeignKeyConstraint(["event_id"], ["return_request_events.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_return_notifications_return_request_id", "return_notifications", ["return_request_id"]
    )

    op.add_column("wallet_transactions", sa.Column("return_request_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "wallet_transactions_return_request_id_fkey",
        "wallet_transactions", "return_requests", ["return_request_id"], ["id"],
    )
    op.create_index(
        "uq_wallet_transaction_refund_per_return",
        "wallet_transactions",
        ["return_request_id"],
        unique=True,
        postgresql_where=sa.text("return_request_id IS NOT NULL"),
    )

    op.add_column("order_items", sa.Column("tax_amount", sa.Numeric(precision=12, scale=2), nullable=True))
    _backfill_line_taxes()

    op.add_column("company", sa.Column("contact_email", sa.String(length=254), nullable=True))
    op.add_column("company", sa.Column("contact_phone", sa.String(length=20), nullable=True))

    op.add_column(
        "company_payouts",
        sa.Column("refunds_amount", sa.Numeric(precision=14, scale=2), server_default="0", nullable=False),
    )


def downgrade() -> None:
    # PostgreSQL no quita valores de un enum: se recrea el tipo antes de borrar las columnas. Una
    # reclamación en revisión vuelve al estado del que salió (rechazada si el comprador pidió
    # revisión, pendiente si la escaló el administrador).
    op.execute("ALTER TYPE return_status RENAME TO return_status_old")
    op.execute("CREATE TYPE return_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED')")
    op.execute("DROP INDEX IF EXISTS uq_return_active_per_item")
    op.execute(
        "ALTER TABLE return_requests ALTER COLUMN status TYPE return_status USING ("
        "CASE WHEN status::text <> 'UNDER_REVIEW' THEN status::text "
        "WHEN review_requested_at IS NOT NULL THEN 'REJECTED' ELSE 'PENDING' END)::return_status"
    )
    op.execute("DROP TYPE return_status_old")
    op.create_index(
        "uq_return_active_per_item",
        "return_requests",
        ["order_item_id"],
        unique=True,
        postgresql_where=sa.text("status <> 'REJECTED'"),
    )

    op.drop_column("company_payouts", "refunds_amount")
    op.drop_column("company", "contact_phone")
    op.drop_column("company", "contact_email")
    op.drop_column("order_items", "tax_amount")

    op.drop_index("uq_wallet_transaction_refund_per_return", table_name="wallet_transactions")
    op.drop_constraint("wallet_transactions_return_request_id_fkey", "wallet_transactions", type_="foreignkey")
    op.drop_column("wallet_transactions", "return_request_id")

    op.drop_index("ix_return_notifications_return_request_id", table_name="return_notifications")
    op.drop_table("return_notifications")
    op.drop_index("ix_return_request_events_return_request_id", table_name="return_request_events")
    op.drop_table("return_request_events")

    op.drop_index("ix_return_requests_payout_adjustment_id", table_name="return_requests")
    op.drop_constraint("return_requests_payout_adjustment_id_fkey", "return_requests", type_="foreignkey")
    op.drop_constraint("return_requests_admin_reviewed_by_fkey", "return_requests", type_="foreignkey")
    for column in (
        "payout_adjustment_id", "admin_resolved_at", "admin_reviewed_by", "admin_response",
        "admin_subject", "escalated_at", "review_requested_at", "review_reason", "company_subject",
    ):
        op.drop_column("return_requests", column)

    sa.Enum(name="return_notification_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="return_call_outcome").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="return_event_type").drop(op.get_bind(), checkfirst=True)
