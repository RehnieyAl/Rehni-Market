"""single owner - un único usuario con el rol owner (#54)

Agrega users.is_owner, calculada por trigger a partir de roles.name, un índice único parcial
sobre ella y un trigger que impide borrar o renombrar el rol owner (app/database/single_owner.py).

Si al aplicarla ya hay más de un owner, falla sin cambiar nada: la decisión de a quién quitarle
el rol es del responsable, no de la migración.

Revision ID: d7e3f1a9c5b2
Revises: c3e5a7f9d1b2
Create Date: 2026-11-17 00:45:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.database.single_owner import DROP_STATEMENTS, OWNER_INDEX, TRIGGER_STATEMENTS

revision: str = "d7e3f1a9c5b2"
down_revision: Union[str, None] = "c3e5a7f9d1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    owners = op.get_bind().execute(
        sa.text(
            "SELECT count(*) FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'owner'"
        )
    ).scalar()
    if owners > 1:
        raise RuntimeError(
            f"Hay {owners} usuarios con el rol owner y RehniMarket admite uno solo. Deja uno con "
            "UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin') WHERE email = "
            "'<correo>'; y vuelve a ejecutar alembic upgrade head. No se cambió nada."
        )

    op.add_column(
        "users",
        sa.Column("is_owner", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    for statement in TRIGGER_STATEMENTS:
        op.execute(statement)
    op.execute(OWNER_INDEX)
    # El trigger calcula is_owner al tocar la fila: así se llenan las filas existentes.
    op.execute("UPDATE users SET role_id = role_id")


def downgrade() -> None:
    for statement in DROP_STATEMENTS:
        op.execute(statement)
    op.drop_column("users", "is_owner")
