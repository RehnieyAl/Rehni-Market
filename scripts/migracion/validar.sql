-- validar.sql — Etapa 5: validación, conciliación y checksums (solo lectura).
-- Plan: docs/plan-implantacion-RehniMarket.md, sección 2 (CE-3).
-- ESTADO: ensayado en BD desechables y en copias aisladas de la base actual (14/10/2026,
--         plan 2.10, ensayos A-D; procedimiento verificado en plan 2.12).
--         NO ejecutado todavía contra la base rehnimarket.
-- Uso (desde la raíz del repositorio, tras copiar scripts/migracion/ al contenedor):
--   docker exec -e ID="$ID" rehni-postgres sh -c \
--     'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
--          -v id_ejecucion="$ID" -f /tmp/migracion/validar.sql'
-- Solo lectura. Cada control devuelve control / resultado (OK, FALLA, INFO) / detalle.
\set ON_ERROR_STOP on

-- Controles 1-11.
-- 1. Conciliación: origen = migrados + rechazados (cada registro cuenta una sola vez).
WITH c AS (
    SELECT e.filas_origen,
           (SELECT count(*) FROM migracion.clientes_legado)                           AS origen,
           (SELECT count(*) FROM migracion.usuarios_migrados WHERE id_ejecucion = e.id_ejecucion) AS migrados,
           (SELECT count(*) FROM migracion.rechazos          WHERE id_ejecucion = e.id_ejecucion) AS rechazados
    FROM migracion.ejecuciones e
    WHERE e.id_ejecucion = :id_ejecucion
)
SELECT '1. Conciliación origen = migrados + rechazados' AS control,
       CASE WHEN origen = filas_origen AND origen = migrados + rechazados
            THEN 'OK' ELSE 'FALLA' END                  AS resultado,
       format('origen=%s migrados=%s rechazados=%s', origen, migrados, rechazados) AS detalle
FROM c;

-- 2. Ningún registro aparece a la vez como migrado y como rechazado.
SELECT '2. Exclusión migrados / rechazados' AS control,
       CASE WHEN count(*) = 0 THEN 'OK' ELSE 'FALLA' END AS resultado,
       format('%s filas en ambos conjuntos', count(*))   AS detalle
FROM migracion.usuarios_migrados m
JOIN migracion.rechazos r ON r.id_ejecucion = m.id_ejecucion AND r.fila = m.fila
WHERE m.id_ejecucion = :id_ejecucion;

-- 3. Conteo del destino frente a la línea base (válido antes de reabrir la aplicación).
SELECT '3. users = línea base + migrados' AS control,
       CASE WHEN (SELECT count(*) FROM public.users) = e.users_antes + m.migrados
            THEN 'OK' ELSE 'FALLA' END AS resultado,
       format('antes=%s migrados=%s ahora=%s',
              e.users_antes, m.migrados, (SELECT count(*) FROM public.users)) AS detalle
FROM migracion.ejecuciones e,
     LATERAL (SELECT count(*) AS migrados FROM migracion.usuarios_migrados
              WHERE id_ejecucion = e.id_ejecucion) m
WHERE e.id_ejecucion = :id_ejecucion;

-- 4. Desglose de rechazos por motivo principal (para el reporte al cliente).
SELECT '4. Rechazos: ' || motivo_principal AS control,
       'INFO'                              AS resultado,
       format('%s registros', count(*))    AS detalle
FROM migracion.rechazos
WHERE id_ejecucion = :id_ejecucion
GROUP BY motivo_principal
ORDER BY motivo_principal;

-- 5. Sin correos duplicados en el destino (sin distinguir mayúsculas).
SELECT '5. Sin duplicados de email en users' AS control,
       CASE WHEN count(*) = 0 THEN 'OK' ELSE 'FALLA' END AS resultado,
       format('%s correos repetidos', count(*))          AS detalle
FROM (SELECT lower(email) FROM public.users GROUP BY 1 HAVING count(*) > 1) d;

-- 6. Reglas de normalización en los registros migrados.
SELECT '6. Reglas de normalización' AS control,
       CASE WHEN count(*) = 0 THEN 'OK' ELSE 'FALLA' END AS resultado,
       format('%s registros incumplen', count(*))        AS detalle
FROM public.users u
JOIN migracion.usuarios_migrados m ON m.user_id = u.id AND m.id_ejecucion = :id_ejecucion
WHERE u.email <> lower(btrim(u.email))
   OR u.email !~ '^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$'
   OR u."fullName" <> regexp_replace(btrim(u."fullName"), '\s+', ' ', 'g')
   OR u.tell !~ '^\+?[0-9]{7,15}$'
   OR u.created_at > now();

-- 7. Integridad referencial: cada migrado existe y su role_id apunta al rol user.
SELECT '7. Integridad referencial de migrados' AS control,
       CASE WHEN count(*) FILTER (WHERE u.id IS NULL OR r.name IS DISTINCT FROM 'user') = 0
            THEN 'OK' ELSE 'FALLA' END AS resultado,
       format('%s registros con problema',
              count(*) FILTER (WHERE u.id IS NULL OR r.name IS DISTINCT FROM 'user')) AS detalle
FROM migracion.usuarios_migrados m
LEFT JOIN public.users u ON u.id = m.user_id
LEFT JOIN public.roles r ON r.id = u.role_id
WHERE m.id_ejecucion = :id_ejecucion;

-- 8. Los usuarios preexistentes no fueron alterados ni eliminados.
SELECT '8. Preexistentes sin alterar' AS control,
       CASE WHEN count(*) = 0 THEN 'OK' ELSE 'FALLA' END AS resultado,
       format('%s usuarios preexistentes distintos de la línea base', count(*)) AS detalle
FROM migracion.linea_base_users b
LEFT JOIN public.users u ON u.id = b.user_id
WHERE b.id_ejecucion = :id_ejecucion
  AND (u.id IS NULL OR md5(ROW(u.*)::text) <> b.hash_fila);

-- 9. Checksum: datos normalizados esperados frente a datos leídos del destino.
WITH esperado AS (
    SELECT md5(string_agg(concat_ws('|', n.user_id, n.nombre, n.correo, n.telefono, n.fecha_alta),
                          E'\n' ORDER BY n.user_id)) AS h
    FROM migracion.normalizados n
    JOIN migracion.usuarios_migrados m ON m.fila = n.fila AND m.id_ejecucion = :id_ejecucion
), obtenido AS (
    SELECT md5(string_agg(concat_ws('|', u.id, u."fullName", u.email, u.tell,
                                    (u.created_at AT TIME ZONE 'UTC')::date),
                          E'\n' ORDER BY u.id)) AS h
    FROM public.users u
    JOIN migracion.usuarios_migrados m ON m.user_id = u.id AND m.id_ejecucion = :id_ejecucion
)
SELECT '9. Checksum normalizados = destino' AS control,
       CASE WHEN e.h IS NOT DISTINCT FROM o.h THEN 'OK' ELSE 'FALLA' END AS resultado,
       format('esperado=%s obtenido=%s', e.h, o.h) AS detalle
FROM esperado e, obtenido o;

-- 10. Contraseñas: hash bcrypt y distinto en cada cuenta migrada (sin clave común).
SELECT '10. Hash bcrypt único por migrado' AS control,
       CASE WHEN count(*) FILTER (WHERE u.hashed_password !~ '^\$2[aby]\$') = 0
             AND count(DISTINCT u.hashed_password) = count(*)
            THEN 'OK' ELSE 'FALLA' END AS resultado,
       format('%s migrados, %s hashes distintos, %s no bcrypt',
              count(*), count(DISTINCT u.hashed_password),
              count(*) FILTER (WHERE u.hashed_password !~ '^\$2[aby]\$')) AS detalle
FROM public.users u
JOIN migracion.usuarios_migrados m ON m.user_id = u.id AND m.id_ejecucion = :id_ejecucion;

-- 11. Verificación: el origen no la informa; ninguna cuenta migrada puede quedar verificada.
SELECT '11. Migrados sin verificar' AS control,
       CASE WHEN count(*) FILTER (WHERE u.verified) = 0 THEN 'OK' ELSE 'FALLA' END AS resultado,
       format('%s verificados de %s migrados', count(*) FILTER (WHERE u.verified), count(*)) AS detalle
FROM public.users u
JOIN migracion.usuarios_migrados m ON m.user_id = u.id AND m.id_ejecucion = :id_ejecucion;
