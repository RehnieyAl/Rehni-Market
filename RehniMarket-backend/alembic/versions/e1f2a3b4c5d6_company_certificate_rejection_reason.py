"""company certificate rejection reason

Agrega company.rejection_reason (texto opcional) para registrar el motivo
obligatorio cuando un administrador rechaza el certificado empresarial. La
empresa lo consulta vía GET /company/dashboard/my-profile (y /dashboard/me) y
puede reemplazar el certificado con PUT /company/certificate mientras el
estado sea REJECTED, lo que limpia esta razón. No toca datos existentes.

Revision ID: e1f2a3b4c5d6
Revises: c3d5e7f9a1b2
Create Date: 2026-09-07 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, Sequence[str], None] = "c3d5e7f9a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "company",
        sa.Column("rejection_reason", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("company", "rejection_reason")
