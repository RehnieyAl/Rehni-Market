"""company followers (compradores que siguen empresas)

Nueva tabla `company_followers`: relación comprador ↔ empresa con fecha de seguimiento.
UNIQUE (user_id, company_id) impide duplicados aun con peticiones concurrentes (el
servicio inserta con ON CONFLICT DO NOTHING); índice por company_id para el contador
del perfil público. ON DELETE CASCADE en ambas claves. No toca tablas existentes.

Revision ID: b5d7f9a1c3e6
Revises: d7e3f1a9c5b2
Create Date: 2026-11-25 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b5d7f9a1c3e6"
down_revision: Union[str, Sequence[str], None] = "d7e3f1a9c5b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "company_followers",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id", "company_id", name="uq_company_follower_user_company"
        ),
    )
    op.create_index(
        "ix_company_followers_company_id", "company_followers", ["company_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_company_followers_company_id", table_name="company_followers")
    op.drop_table("company_followers")
