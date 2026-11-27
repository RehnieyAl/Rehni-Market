-- Crea los cuatro roles de RehniMarket (user, company, admin, owner) directamente en PostgreSQL.
-- Son los mismos que siembra app/utils/seed_roles.py. Con RUN_SEED=false el backend no los crea al
-- arrancar, y sin ellos el registro falla y deploy/sql/crear-owner.sql se detiene.
--
--   docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
--     < deploy/sql/crear-roles.sql
--
-- Idempotente: un rol que ya existe no se duplica ni se modifica (ON CONFLICT sobre roles_name_key), así
-- que conserva su id y las cuentas que lo usan. Solo crea roles: el catálogo y las transportadoras siguen
-- saliendo de scripts/datos-base.sh.

\set ON_ERROR_STOP on

BEGIN;

-- El id lo genera Python (uuid4) en el ORM; la columna no tiene valor por defecto en la base.
INSERT INTO roles (id, name)
SELECT gen_random_uuid(), r.name
  FROM (VALUES ('user'), ('company'), ('admin'), ('owner')) AS r(name)
ON CONFLICT (name) DO NOTHING;

DO $$
BEGIN
    IF (SELECT count(*) FROM roles WHERE name IN ('user', 'company', 'admin', 'owner')) <> 4 THEN
        RAISE EXCEPTION 'Faltan roles después de la inserción: revisa la tabla roles.';
    END IF;
END
$$;

COMMIT;

SELECT name AS rol FROM roles ORDER BY name;
