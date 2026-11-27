"""banks catalog (catálogo de bancos administrable y relación con las cuentas de empresa)

Nueva tabla `banks` (nombre, nombre normalizado UNIQUE para evitar duplicados por mayúsculas o
espacios, ruta del logo en MinIO y estado) y columna `company_bank_accounts.bank_id` (FK nullable,
ON DELETE RESTRICT, indexada). No se crea ningún banco ni se modifica ninguna cuenta: las cuentas
existentes conservan su bank_name y quedan sin bank_id hasta que un administrador registre un banco
con el mismo nombre normalizado (el servicio las enlaza entonces).

Revision ID: d8f0a2c4e6b1
Revises: c6e8a0b2d4f7
Create Date: 2026-11-25 20:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d8f0a2c4e6b1"
down_revision: Union[str, Sequence[str], None] = "c6e8a0b2d4f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "banks",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("normalized_name", sa.String(length=100), nullable=False),
        sa.Column("logo", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("normalized_name"),
    )
    op.add_column("company_bank_accounts", sa.Column("bank_id", sa.UUID(), nullable=True))
    op.create_index(
        op.f("ix_company_bank_accounts_bank_id"), "company_bank_accounts", ["bank_id"]
    )
    op.create_foreign_key(
        "company_bank_accounts_bank_id_fkey",
        "company_bank_accounts",
        "banks",
        ["bank_id"],
        ["id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint("company_bank_accounts_bank_id_fkey", "company_bank_accounts", type_="foreignkey")
    op.drop_index(op.f("ix_company_bank_accounts_bank_id"), table_name="company_bank_accounts")
    op.drop_column("company_bank_accounts", "bank_id")
    op.drop_table("banks")
