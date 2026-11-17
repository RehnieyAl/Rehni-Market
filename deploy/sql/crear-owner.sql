-- Crea el único owner de RehniMarket directamente en PostgreSQL (guía: deploy/OWNER.md).
-- Variables de psql: correo, nombre, telefono y clave (obligatorias); convertir=true para dar el
-- rol owner a una cuenta ya registrada con ese correo. Nunca escribir datos reales en este archivo.
--
--   docker compose exec -T -e OWNER_CLAVE postgres sh -c \
--     'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v clave="$OWNER_CLAVE" \
--           -v correo="<correo-del-owner>" -v nombre="<nombre>" -v telefono="<10 dígitos>"' \
--     < deploy/sql/crear-owner.sql
--
-- Todo va en una transacción: ante cualquier error psql se detiene y no queda nada a medias.
-- Las mismas reglas del registro por la API: correo y nombre de hasta 50 caracteres, teléfono de
-- 10 dígitos y clave con mayúscula, minúscula y número. La clave va de 8 a 72 bytes porque bcrypt
-- solo usa los primeros 72 (app/utils/Security.py): más larga, la parte sobrante no protegería.

\set ON_ERROR_STOP on

\if :{?correo}
\else
    \warn 'Falta -v correo=<correo-del-owner>'
    \quit 1
\endif
\if :{?nombre}
\else
    \warn 'Falta -v nombre=<nombre>'
    \quit 1
\endif
\if :{?telefono}
\else
    \warn 'Falta -v telefono=<10 dígitos>'
    \quit 1
\endif
\if :{?clave}
\else
    \warn 'Falta -v clave=... (pásala desde una variable de entorno; ver deploy/OWNER.md)'
    \quit 1
\endif
\if :{?convertir}
\else
    \set convertir false
\endif

BEGIN;

-- crypt() y gen_salt('bf') generan el mismo bcrypt ($2a$) que verifica passlib en el backend.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- El backend valida el correo con EmailStr, que pasa el dominio a minúsculas, y lo busca exacto.
SELECT split_part(btrim(:'correo'), '@', 1) || '@' || lower(split_part(btrim(:'correo'), '@', 2))
       AS correo_normalizado
\gset

-- Los valores llegan al bloque de validación como ajustes locales de la transacción: un DO no ve
-- las variables de psql y así la clave no sale en ningún resultado.
SELECT count(*) AS ajustes
  FROM (SELECT set_config('rehni_owner.correo', :'correo_normalizado', true),
               set_config('rehni_owner.nombre', btrim(:'nombre'), true),
               set_config('rehni_owner.telefono', btrim(:'telefono'), true),
               set_config('rehni_owner.clave', :'clave', true),
               set_config('rehni_owner.convertir', :'convertir', true)) AS s
\gset _rehni_owner_

DO $$
DECLARE
    v_correo    text    := current_setting('rehni_owner.correo');
    v_nombre    text    := current_setting('rehni_owner.nombre');
    v_telefono  text    := current_setting('rehni_owner.telefono');
    v_clave     text    := current_setting('rehni_owner.clave');
    v_convertir boolean := current_setting('rehni_owner.convertir')::boolean;
    v_existe    boolean;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'owner') THEN
        RAISE EXCEPTION 'No existe el rol owner: arranca el backend (crea los roles) y vuelve a intentarlo.';
    END IF;
    IF EXISTS (SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'owner') THEN
        RAISE EXCEPTION 'Ya existe un owner: RehniMarket admite uno solo. Para cambiarlo, usa la transferencia de deploy/OWNER.md.';
    END IF;
    IF v_correo !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
        RAISE EXCEPTION 'El correo no es válido.';
    END IF;
    IF char_length(v_correo) > 50 THEN
        RAISE EXCEPTION 'El correo tiene % caracteres; el máximo es 50.', char_length(v_correo);
    END IF;
    IF char_length(v_nombre) < 3 OR char_length(v_nombre) > 50 THEN
        RAISE EXCEPTION 'El nombre debe tener entre 3 y 50 caracteres (tiene %).', char_length(v_nombre);
    END IF;
    IF v_telefono !~ '^[0-9]{10}$' THEN
        RAISE EXCEPTION 'El teléfono debe tener exactamente 10 dígitos.';
    END IF;
    IF octet_length(v_clave) < 8 OR octet_length(v_clave) > 72 THEN
        RAISE EXCEPTION 'La clave debe tener entre 8 y 72 bytes (tiene %).', octet_length(v_clave);
    END IF;
    IF v_clave !~ '[A-Z]' OR v_clave !~ '[a-z]' OR v_clave !~ '[0-9]' THEN
        RAISE EXCEPTION 'La clave debe tener al menos una mayúscula, una minúscula y un número.';
    END IF;

    v_existe := EXISTS (SELECT 1 FROM users WHERE email = v_correo);
    IF v_existe AND NOT v_convertir THEN
        RAISE EXCEPTION 'El correo ya está registrado. Para convertir esa cuenta en owner, agrega -v convertir=true.';
    END IF;
    IF NOT v_existe AND v_convertir THEN
        RAISE EXCEPTION 'No hay ninguna cuenta con ese correo para convertir en owner.';
    END IF;
END
$$;

\if :convertir
UPDATE users
   SET role_id = (SELECT id FROM roles WHERE name = 'owner'),
       hashed_password = crypt(:'clave', gen_salt('bf', 12)),
       verified = true,
       "isActive" = true
 WHERE email = :'correo_normalizado';
\else
INSERT INTO users (id, "fullName", email, hashed_password, tell, verified, "isActive", created_at, role_id)
SELECT gen_random_uuid(),
       btrim(:'nombre'),
       :'correo_normalizado',
       crypt(:'clave', gen_salt('bf', 12)),
       btrim(:'telefono'),
       true,
       true,
       now(),
       (SELECT id FROM roles WHERE name = 'owner');
\endif

COMMIT;

\unset clave
\unset _rehni_owner_ajustes

SELECT u.email AS correo, r.name AS rol
  FROM users u
  JOIN roles r ON r.id = u.role_id
 WHERE r.name = 'owner';
