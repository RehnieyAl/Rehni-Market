-- rollback.sql — Etapa 6: revierte únicamente los usuarios creados por una ejecución.
-- Plan: docs/plan-implantacion-RehniMarket.md, sección 2 (CE-3).
-- ESTADO: ensayado en BD desechables y en copias aisladas de la base actual (14/10/2026,
--         plan 2.10, ensayos A-D; procedimiento verificado en plan 2.12).
--         NO ejecutado todavía contra la base rehnimarket.
-- Uso (desde la raíz del repositorio, tras copiar scripts/migracion/ al contenedor):
--   docker exec -e ID="$ID" rehni-postgres sh -c \
--     'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
--          -v id_ejecucion="$ID" -f /tmp/migracion/rollback.sql'
-- Si aborta, no borra nada: aplicar la restauración del respaldo previo.
\set ON_ERROR_STOP on

BEGIN;

LOCK TABLE public.users IN SHARE ROW EXCLUSIVE MODE;

SELECT set_config('migracion.id_ejecucion', :'id_ejecucion', true);

DO $$
DECLARE
    v_id         INTEGER := current_setting('migracion.id_ejecucion')::INTEGER;
    fk           RECORD;
    dependientes BIGINT;
    conflictos   BIGINT;
    esperados    BIGINT;
    borrados     BIGINT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM migracion.ejecuciones
                   WHERE id_ejecucion = v_id AND estado = 'APLICADA') THEN
        RAISE EXCEPTION 'La ejecución % no existe o no está APLICADA.', v_id;
    END IF;

    -- a) Ningún usuario migrado puede pertenecer a la línea base (preexistente).
    SELECT count(*) INTO conflictos
    FROM migracion.usuarios_migrados m
    JOIN migracion.linea_base_users b ON b.user_id = m.user_id
    WHERE m.id_ejecucion = v_id;
    IF conflictos > 0 THEN
        RAISE EXCEPTION '% usuarios migrados figuran como preexistentes; rollback cancelado.', conflictos;
    END IF;

    -- b) Los usuarios migrados no deben haber cambiado ni desaparecido desde la inserción.
    SELECT count(*) INTO conflictos
    FROM migracion.usuarios_migrados m
    LEFT JOIN public.users u ON u.id = m.user_id
    WHERE m.id_ejecucion = v_id
      AND (u.id IS NULL OR md5(ROW(u.*)::text) IS DISTINCT FROM m.hash_insercion);
    IF conflictos > 0 THEN
        RAISE EXCEPTION '% usuarios migrados cambiaron tras la carga: usar la restauración del respaldo.', conflictos;
    END IF;

    -- c) Ninguna tabla debe referenciar a los usuarios migrados.
    FOR fk IN
        SELECT c.conrelid::regclass AS tabla, a.attname AS columna
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
        WHERE c.contype = 'f'
          AND c.confrelid = 'public.users'::regclass
    LOOP
        EXECUTE format(
            'SELECT count(*) FROM %s t JOIN migracion.usuarios_migrados m '
            'ON t.%I = m.user_id WHERE m.id_ejecucion = $1', fk.tabla, fk.columna)
        INTO dependientes USING v_id;
        IF dependientes > 0 THEN
            RAISE EXCEPTION '%.% referencia % usuarios migrados: usar la restauración del respaldo.',
                fk.tabla, fk.columna, dependientes;
        END IF;
    END LOOP;

    -- d) Borrado exclusivo de los usuarios de esta ejecución.
    SELECT count(*) INTO esperados
    FROM migracion.usuarios_migrados WHERE id_ejecucion = v_id;

    DELETE FROM public.users u
    USING migracion.usuarios_migrados m
    WHERE u.id = m.user_id
      AND m.id_ejecucion = v_id;
    GET DIAGNOSTICS borrados = ROW_COUNT;

    IF borrados <> esperados THEN
        RAISE EXCEPTION 'Se borrarían % filas y se esperaban %; rollback cancelado.', borrados, esperados;
    END IF;

    UPDATE migracion.ejecuciones
    SET estado = 'REVERTIDA', fin_rollback = clock_timestamp()
    WHERE id_ejecucion = v_id;
END $$;

-- Comprobación posterior al rollback.
SELECT 'Rollback: migrados restantes en users' AS control,
       CASE WHEN count(*) = 0 THEN 'OK' ELSE 'FALLA' END AS resultado,
       format('%s restantes', count(*)) AS detalle
FROM public.users u
JOIN migracion.usuarios_migrados m ON m.user_id = u.id AND m.id_ejecucion = :id_ejecucion;

SELECT 'Rollback: preexistentes intactos' AS control,
       CASE WHEN count(*) = 0 THEN 'OK' ELSE 'FALLA' END AS resultado,
       format('%s distintos de la línea base', count(*)) AS detalle
FROM migracion.linea_base_users b
LEFT JOIN public.users u ON u.id = b.user_id
WHERE b.id_ejecucion = :id_ejecucion
  AND (u.id IS NULL OR md5(ROW(u.*)::text) <> b.hash_fila);

COMMIT;
