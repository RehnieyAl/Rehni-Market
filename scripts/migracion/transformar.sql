-- transformar.sql — Etapas 2, 3 y 4: normalización, rechazos e inserción controlada.
-- Plan: docs/plan-implantacion-RehniMarket.md, sección 2 (CE-3).
-- ESTADO: ensayado en BD desechables y en copias aisladas de la base actual (14/10/2026,
--         plan 2.10, ensayos A-D; procedimiento verificado en plan 2.12).
--         NO ejecutado todavía contra la base rehnimarket.
-- Uso (desde la raíz del repositorio, tras copiar scripts/migracion/ al contenedor):
--   docker exec -e SHA="$SHA" rehni-postgres sh -c \
--     'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
--          -v archivo_sha256="$SHA" -f /tmp/migracion/transformar.sql'
-- Variable: archivo_sha256 (sha256 del CSV). Al terminar muestra el id_ejecucion.
-- Contraseñas: el origen no trae hash. Cada cuenta recibe un hash bcrypt PROPIO de un secreto
-- aleatorio que no se guarda (nadie conoce la clave); el acceso se obtiene con
-- /forgot-password-user. Verificación: el origen no la informa, se inserta verified = false.
\set ON_ERROR_STOP on

BEGIN;

-- pgcrypto (crypt/gen_salt/gen_random_bytes) solo dentro del esquema auxiliar: no toca public
-- y desaparece con DROP SCHEMA migracion CASCADE.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA migracion;
DO $$
BEGIN
    IF (SELECT extnamespace::regnamespace::text FROM pg_extension WHERE extname = 'pgcrypto')
       <> 'migracion' THEN
        RAISE EXCEPTION 'pgcrypto ya está instalada fuera del esquema migracion; revisar antes de seguir.';
    END IF;
END $$;

-- Sin altas concurrentes en users mientras dura la transacción.
LOCK TABLE public.users IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM migracion.ejecuciones WHERE estado = 'APLICADA') THEN
        RAISE EXCEPTION 'Ya existe una ejecución APLICADA para esta carga.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'user') THEN
        RAISE EXCEPTION 'No existe el rol user en public.roles.';
    END IF;
END $$;

-- 1. Registro de la ejecución y línea base.
INSERT INTO migracion.ejecuciones (archivo_sha256, filas_origen, users_antes)
SELECT :'archivo_sha256',
       (SELECT count(*) FROM migracion.clientes_legado),
       (SELECT count(*) FROM public.users)
RETURNING id_ejecucion \gset

SELECT set_config('migracion.id_ejecucion', :'id_ejecucion', true);

INSERT INTO migracion.linea_base_users (id_ejecucion, user_id, hash_fila)
SELECT :id_ejecucion, u.id, md5(ROW(u.*)::text)
FROM public.users u;

-- 2. Conversión segura de fechas: NULL si el formato no se reconoce o la fecha no existe.
CREATE OR REPLACE FUNCTION migracion.fecha_segura(valor TEXT)
RETURNS DATE
LANGUAGE plpgsql AS $$
DECLARE
    v   TEXT := btrim(valor);
    fmt TEXT;
    d   DATE;
BEGIN
    IF v ~ '^\d{4}-\d{2}-\d{2}$' THEN
        fmt := 'YYYY-MM-DD';
    ELSIF v ~ '^\d{2}/\d{2}/\d{4}$' THEN
        fmt := 'DD/MM/YYYY';
    ELSE
        RETURN NULL;                 -- vacía o formato no reconocido
    END IF;
    d := to_date(v, fmt);
    IF to_char(d, fmt) <> v THEN     -- ida y vuelta: descarta fechas desbordadas
        RETURN NULL;
    END IF;
    RETURN d;
EXCEPTION WHEN others THEN
    RETURN NULL;                     -- fecha inexistente, p. ej. 30/02/2024
END $$;

-- 3. Datos normalizados (el UUID de destino se fija aquí para poder trazarlo).
DROP TABLE IF EXISTS migracion.normalizados;
CREATE TABLE migracion.normalizados AS
SELECT s.fila,
       nullif(btrim(s.codigo), '')                                           AS codigo,
       -- Primero se colapsa todo espacio en blanco (\s: espacio, tabulador, saltos de línea)
       -- a un solo espacio y después se recorta; btrim() solo elimina espacios, no tabuladores.
       nullif(btrim(regexp_replace(s.nombre_completo, '\s+', ' ', 'g')), '') AS nombre,
       nullif(lower(btrim(s.correo)), '')                                    AS correo,
       nullif(regexp_replace(s.telefono, '[^0-9+]', '', 'g'), '')            AS telefono,
       migracion.fecha_segura(s.fecha_alta)                                  AS fecha_alta,
       gen_random_uuid()                                                     AS user_id,
       ARRAY[]::TEXT[]                                                       AS motivos
FROM migracion.clientes_legado s;

-- 4. Reglas de rechazo (el orden del arreglo define el motivo principal).
UPDATE migracion.normalizados n
SET motivos = array_remove(ARRAY[
        CASE WHEN n.correo IS NULL THEN 'CORREO_VACIO' END,
        CASE WHEN n.correo !~ '^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$'
             THEN 'CORREO_INVALIDO' END,
        CASE WHEN length(n.correo) > 50 THEN 'CORREO_EXCEDE_50' END,
        CASE WHEN n.nombre IS NULL THEN 'NOMBRE_VACIO' END,
        CASE WHEN length(n.nombre) > 50 THEN 'NOMBRE_EXCEDE_50' END,
        CASE WHEN n.telefono IS NULL OR n.telefono !~ '^\+?[0-9]{7,15}$'
             THEN 'TELEFONO_INVALIDO' END,
        CASE WHEN n.fecha_alta IS NULL THEN 'FECHA_INVALIDA' END,
        CASE WHEN n.fecha_alta > current_date THEN 'FECHA_FUTURA' END,
        CASE WHEN EXISTS (SELECT 1 FROM public.users u
                          WHERE lower(btrim(u.email)) = n.correo)
             THEN 'YA_EXISTE_DESTINO' END
    ], NULL);

-- 5. Duplicados en el origen: solo entre registros que superaron las reglas anteriores;
--    se conserva la primera ocurrencia por fecha_alta y número de fila.
WITH ranking AS (
    SELECT fila,
           row_number() OVER (PARTITION BY correo ORDER BY fecha_alta, fila) AS rn
    FROM migracion.normalizados
    WHERE cardinality(motivos) = 0
)
UPDATE migracion.normalizados n
SET motivos = array_append(n.motivos, 'DUPLICADO_ORIGEN')
FROM ranking r
WHERE r.fila = n.fila
  AND r.rn > 1;

-- 6. Registro de rechazos: una fila por registro, con el dato original intacto.
INSERT INTO migracion.rechazos
       (id_ejecucion, fila, codigo, motivo_principal, motivos, datos_origen)
SELECT :id_ejecucion, n.fila, s.codigo, n.motivos[1], n.motivos, to_jsonb(s)
FROM migracion.normalizados n
JOIN migracion.clientes_legado s ON s.fila = n.fila
WHERE cardinality(n.motivos) > 0;

-- 7. Inserción controlada: primero la trazabilidad, después el destino.
INSERT INTO migracion.usuarios_migrados (id_ejecucion, fila, codigo_legado, user_id)
SELECT :id_ejecucion, n.fila, n.codigo, n.user_id
FROM migracion.normalizados n
WHERE cardinality(n.motivos) = 0;

INSERT INTO public.users
       (id, "fullName", email, hashed_password, tell, "profileImagen",
        verified, "isActive", created_at, role_id)
SELECT n.user_id, n.nombre, n.correo,
       migracion.crypt(encode(migracion.gen_random_bytes(32), 'base64'),
                       migracion.gen_salt('bf', 12)),          -- hash único por cuenta
       n.telefono, NULL,
       false, true, n.fecha_alta::timestamp AT TIME ZONE 'UTC', r.id
FROM migracion.normalizados n
JOIN migracion.usuarios_migrados m
  ON m.fila = n.fila AND m.id_ejecucion = :id_ejecucion
CROSS JOIN (SELECT id FROM public.roles WHERE name = 'user') r;

-- Hash de cada usuario recién insertado (rollback.sql lo usa para detectar cambios).
UPDATE migracion.usuarios_migrados m
SET hash_insercion = md5(ROW(u.*)::text)
FROM public.users u
WHERE u.id = m.user_id
  AND m.id_ejecucion = :id_ejecucion;

-- 8. Conciliación interna: si no cuadra, se aborta y no se confirma nada.
DO $$
DECLARE
    v_id       INTEGER := current_setting('migracion.id_ejecucion')::INTEGER;
    origen     BIGINT;
    migrados   BIGINT;
    rechazados BIGINT;
    insertados BIGINT;
BEGIN
    SELECT count(*) INTO origen     FROM migracion.clientes_legado;
    SELECT count(*) INTO migrados   FROM migracion.usuarios_migrados WHERE id_ejecucion = v_id;
    SELECT count(*) INTO rechazados FROM migracion.rechazos          WHERE id_ejecucion = v_id;
    SELECT count(*) INTO insertados
    FROM public.users u
    JOIN migracion.usuarios_migrados m ON m.user_id = u.id AND m.id_ejecucion = v_id;

    IF origen <> migrados + rechazados OR insertados <> migrados THEN
        RAISE EXCEPTION 'Conciliación fallida: origen=%, migrados=%, rechazados=%, insertados=%',
            origen, migrados, rechazados, insertados;
    END IF;
END $$;

UPDATE migracion.ejecuciones
SET estado = 'APLICADA', fin = clock_timestamp()   -- now() = inicio de la transacción
WHERE id_ejecucion = :id_ejecucion;

COMMIT;

SELECT :id_ejecucion AS id_ejecucion;   -- anotar para validar.sql y rollback.sql
