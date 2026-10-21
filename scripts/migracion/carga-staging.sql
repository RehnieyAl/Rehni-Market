-- carga-staging.sql — Etapa 1: carga del archivo del sistema legado sin transformar.
-- Plan: docs/plan-implantacion-RehniMarket.md, sección 2 (CE-3).
-- ESTADO: ensayado en BD desechables y en copias aisladas de la base actual (14/10/2026,
--         plan 2.10, ensayos A-D; procedimiento verificado en plan 2.12).
--         NO ejecutado todavía contra la base rehnimarket.
-- Uso (desde la raíz del repositorio, tras copiar scripts/migracion/ al contenedor):
--   docker exec rehni-postgres sh -c \
--     'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /tmp/migracion/carga-staging.sql'
-- Requisito: el CSV debe estar en /tmp/migracion/clientes_legado.csv DENTRO del contenedor.
\set ON_ERROR_STOP on

-- Protección: no recrear el esquema si guarda una ejecución APLICADA, porque se perdería
-- la trazabilidad que necesita rollback.sql. Exportar evidencias o revertir antes.
DO $$
DECLARE
    aplicadas INTEGER := 0;
BEGIN
    IF to_regclass('migracion.ejecuciones') IS NOT NULL THEN
        EXECUTE 'SELECT count(*) FROM migracion.ejecuciones WHERE estado = ''APLICADA'''
            INTO aplicadas;
    END IF;
    IF aplicadas > 0 THEN
        RAISE EXCEPTION 'El esquema migracion contiene una ejecución APLICADA; no se recarga.';
    END IF;
END $$;

DROP SCHEMA IF EXISTS migracion CASCADE;   -- solo el esquema auxiliar, nunca public
CREATE SCHEMA migracion;

-- Staging: datos originales sin transformar.
CREATE TABLE migracion.clientes_legado (
    fila            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo          TEXT,
    nombre_completo TEXT,
    correo          TEXT,
    fecha_alta      TEXT,
    telefono        TEXT
);

-- Control de ejecuciones (identificador inequívoco para validar y revertir).
CREATE TABLE migracion.ejecuciones (
    id_ejecucion   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inicio         TIMESTAMPTZ NOT NULL DEFAULT now(),
    fin            TIMESTAMPTZ,
    fin_rollback   TIMESTAMPTZ,
    archivo_sha256 TEXT NOT NULL,
    filas_origen   INTEGER NOT NULL,
    users_antes    INTEGER NOT NULL,
    estado         TEXT NOT NULL DEFAULT 'EN_CURSO'
                   CHECK (estado IN ('EN_CURSO', 'APLICADA', 'REVERTIDA'))
);

-- Línea base: hash de cada usuario existente antes de insertar.
CREATE TABLE migracion.linea_base_users (
    id_ejecucion INTEGER NOT NULL REFERENCES migracion.ejecuciones,
    user_id      UUID    NOT NULL,
    hash_fila    TEXT    NOT NULL,
    PRIMARY KEY (id_ejecucion, user_id)
);

-- Rechazos: una fila por registro de origen rechazado.
CREATE TABLE migracion.rechazos (
    id_ejecucion     INTEGER NOT NULL REFERENCES migracion.ejecuciones,
    fila             BIGINT  NOT NULL REFERENCES migracion.clientes_legado,
    codigo           TEXT,
    motivo_principal TEXT    NOT NULL,
    motivos          TEXT[]  NOT NULL,
    datos_origen     JSONB   NOT NULL,
    PRIMARY KEY (id_ejecucion, fila)
);

-- Trazabilidad: qué usuario de destino creó cada fila de origen.
CREATE TABLE migracion.usuarios_migrados (
    id_ejecucion   INTEGER NOT NULL REFERENCES migracion.ejecuciones,
    fila           BIGINT  NOT NULL REFERENCES migracion.clientes_legado,
    codigo_legado  TEXT,
    user_id        UUID    NOT NULL UNIQUE,
    hash_insercion TEXT,
    PRIMARY KEY (id_ejecucion, fila)
);

-- Carga sin transformar (ruta DENTRO del contenedor rehni-postgres).
COPY migracion.clientes_legado (codigo, nombre_completo, correo, fecha_alta, telefono)
FROM '/tmp/migracion/clientes_legado.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ';', ENCODING 'UTF8');

SELECT count(*) AS filas_cargadas FROM migracion.clientes_legado;
