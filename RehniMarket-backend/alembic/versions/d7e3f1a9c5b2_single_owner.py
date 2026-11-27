"""single owner - un único usuario con el rol owner (#54)

Agrega users.is_owner, calculada por trigger a partir de roles.name, un índice único parcial
sobre ella y un trigger que impide borrar o renombrar el rol owner.

Si al aplicarla ya hay más de un owner, falla sin cambiar nada: la decisión de a quién quitarle
el rol es del responsable, no de la migración.

Revision ID: d7e3f1a9c5b2
Revises: c3e5a7f9d1b2
Create Date: 2026-11-17 00:45:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# SQL copiado aquí (antes en app/database/single_owner.py): una migración aplicada no debe
# depender de módulos de la app que pueden cambiar. Debe coincidir con app/models/ModelUser.py.
# is_owner se recalcula en cada INSERT y UPDATE a partir de roles.name, no de un UUID fijo: si el
# rol owner tuviera otro id, la garantía seguiría valiendo. Un UPDATE manual de is_owner se ignora.
USERS_FUNCTION = """
CREATE OR REPLACE FUNCTION rehni_users_set_is_owner() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.is_owner := EXISTS (SELECT 1 FROM roles WHERE id = NEW.role_id AND name = 'owner');
    RETURN NEW;
END
$$
"""

USERS_TRIGGER = """
CREATE TRIGGER users_set_is_owner
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION rehni_users_set_is_owner()
"""

# El índice, y no un conteo en el trigger, es lo que impide dos owners con transacciones
# simultáneas: la segunda espera a la primera y falla con unique_violation, sin depender del
# nivel de aislamiento.
OWNER_INDEX_NAME = "uq_users_single_owner"
OWNER_INDEX = f"CREATE UNIQUE INDEX {OWNER_INDEX_NAME} ON users (is_owner) WHERE is_owner"

# Sin esto, renombrar otro rol a 'owner' daría varios owners con is_owner = false.
ROLES_FUNCTION = """
CREATE OR REPLACE FUNCTION rehni_roles_protect_owner() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.name = 'owner' THEN
            RAISE EXCEPTION 'El rol owner no se puede borrar.' USING ERRCODE = 'check_violation';
        END IF;
        RETURN OLD;
    END IF;
    IF (OLD.name = 'owner') IS DISTINCT FROM (NEW.name = 'owner') THEN
        RAISE EXCEPTION 'El rol owner no se puede renombrar, ni otro rol puede pasar a llamarse owner.'
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END
$$
"""

ROLES_TRIGGER = """
CREATE TRIGGER roles_protect_owner
BEFORE UPDATE OR DELETE ON roles
FOR EACH ROW EXECUTE FUNCTION rehni_roles_protect_owner()
"""

TRIGGER_STATEMENTS = (USERS_FUNCTION, USERS_TRIGGER, ROLES_FUNCTION, ROLES_TRIGGER)

DROP_STATEMENTS = (
    "DROP TRIGGER IF EXISTS roles_protect_owner ON roles",
    "DROP FUNCTION IF EXISTS rehni_roles_protect_owner()",
    f"DROP INDEX IF EXISTS {OWNER_INDEX_NAME}",
    "DROP TRIGGER IF EXISTS users_set_is_owner ON users",
    "DROP FUNCTION IF EXISTS rehni_users_set_is_owner()",
)

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
