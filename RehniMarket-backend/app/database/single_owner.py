"""Garantía en PostgreSQL de un único owner (#54): users.is_owner calculada por trigger, índice
único parcial sobre ella y protección del rol owner en roles.

Lo usan la migración d7e3f1a9c5b2 y ModelUser, que declara el índice y registra los triggers
para que create_all (pruebas) cree lo mismo que la migración.
"""

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
