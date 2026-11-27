"""company contact public

company.contact_public: permiso explícito de la empresa para mostrar su correo y teléfono comerciales en el
perfil público. Las empresas existentes quedan en false: registraron ese contacto como privado.

Revision ID: b6d8f0a2c4e6
Revises: a4c6e8f0b2d4
Create Date: 2026-11-26 21:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b6d8f0a2c4e6"
down_revision: Union[str, Sequence[str], None] = "a4c6e8f0b2d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "company",
        sa.Column("contact_public", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("company", "contact_public")
