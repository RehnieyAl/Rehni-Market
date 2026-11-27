#!/usr/bin/env bash
# Menú de datos iniciales: roles (deploy/sql/crear-roles.sql), owner único (deploy/sql/crear-owner.sql) y verificación.
# Opera el Compose del repositorio que contiene este script (en Azure, /opt/rehnimarket) con los servicios en marcha.
# DB_NAME apunta a otra base del mismo PostgreSQL, solo para probar el menú en una base desechable.
set -Euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SQL_DIR="${ROOT}/deploy/sql"
SEED_ROLES="${ROOT}/RehniMarket-backend/app/utils/seed_roles.py"
DB_NAME="${DB_NAME:-}"

compose() { docker compose --project-directory "${ROOT}" -f "${ROOT}/docker-compose.yml" "$@"; }

# Las consultas no leen la entrada estándar: si lo hicieran, se tragarían las respuestas del menú.

query() {
  compose exec -T postgres sh -c 'psql -X -tA -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "${1:-$POSTGRES_DB}" -c "$2"' \
    _ "${DB_NAME}" "$1" < /dev/null
}

run_sql() {
  compose exec -T postgres sh -c 'psql -X -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "${1:-$POSTGRES_DB}"' \
    _ "${DB_NAME}" < "$1"
}

error() { echo "ERROR: $*" >&2; return 1; }

require_services() {
  command -v docker >/dev/null || { error "Docker no está instalado"; return 1; }
  local s
  for s in postgres backend; do
    [ -n "$(compose ps --status running -q "${s}" 2>/dev/null < /dev/null)" ] \
      || { error "el servicio ${s} no está en marcha (docker compose up -d --wait)"; return 1; }
  done
  compose exec -T postgres sh -c 'pg_isready -q -U "$POSTGRES_USER"' < /dev/null || { error "PostgreSQL no acepta conexiones"; return 1; }
}

check_migrations() {
  local db head
  db="$(query 'SELECT string_agg(version_num, chr(44)) FROM alembic_version' 2>/dev/null | tr -d '[:space:]')"
  head="$(compose exec -T backend uv run --no-sync alembic heads 2>/dev/null < /dev/null | awk '{print $1}' | paste -sd, -)"
  echo "Migraciones: base=${db:-ninguna} · código=${head:-desconocido}"
  [ -n "${db}" ] && [ "${db}" = "${head}" ] \
    || { error "la base no está en la última migración (el backend la aplica al arrancar)"; return 1; }
}

roles_from() { grep -oE "'[a-z]+'|\"[a-z]+\"" | tr -d "'\"" | sort | paste -sd' ' -; }

init_roles() {
  require_services && check_migrations || return 1
  local backend sql
  backend="$(grep -E '^\s*roles\s*=' "${SEED_ROLES}" | roles_from)"
  sql="$(grep -E '^\s*FROM \(VALUES' "${SQL_DIR}/crear-roles.sql" | roles_from)"
  echo "Roles del backend: ${backend} · roles del SQL: ${sql}"
  [ -n "${backend}" ] && [ "${backend}" = "${sql}" ] \
    || { error "crear-roles.sql no coincide con app/utils/seed_roles.py; no se insertó nada"; return 1; }
  echo "Roles existentes antes: $(query 'SELECT coalesce(string_agg(name, chr(32) ORDER BY name), chr(45)) FROM roles')"
  run_sql "${SQL_DIR}/crear-roles.sql" || return 1
  echo "Roles inicializados. Los que ya existían no se modificaron."
}

create_owner() {
  require_services || return 1
  [ "$(query "SELECT count(*) FROM roles WHERE name = 'owner'")" = "1" ] \
    || { error "no existe el rol owner: ejecuta antes la opción 1"; return 1; }
  [ "$(query 'SELECT count(*) FROM users WHERE is_owner')" = "0" ] \
    || { error "ya existe un owner (puede tener otro correo); no se crea otro ni se modifica el actual"; return 1; }

  local correo nombre telefono clave clave2
  read -r -p "Correo del owner${OWNER_CORREO:+ [${OWNER_CORREO}]}: " correo
  correo="${correo:-${OWNER_CORREO:-}}"
  read -r -p "Nombre completo: " nombre
  read -r -p "Teléfono (10 dígitos): " telefono
  read -r -s -p "Clave (8 a 72 bytes, con mayúscula, minúscula y número): " clave; echo
  read -r -s -p "Repite la clave: " clave2; echo
  [ -n "${clave}" ] && [ "${clave}" = "${clave2}" ] || { error "las claves no coinciden"; return 1; }

  # La clave viaja solo por el entorno del contenedor (\getenv en el SQL): nunca en argumentos ni en el historial.
  OWNER_CLAVE="${clave}" compose exec -T -e OWNER_CLAVE postgres sh -c \
    'psql -X -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "${1:-$POSTGRES_DB}" -v correo="$2" -v nombre="$3" -v telefono="$4"' \
    _ "${DB_NAME}" "${correo}" "${nombre}" "${telefono}" < "${SQL_DIR}/crear-owner.sql"
  local code=$?
  unset clave clave2
  [ "${code}" -eq 0 ] || { error "no se creó el owner (el mensaje anterior indica la causa); no quedó nada a medias"; return 1; }
  [ "$(query 'SELECT count(*) FROM users WHERE is_owner')" = "1" ] || { error "no hay exactamente un owner"; return 1; }
  echo "Owner creado, activo y verificado."
}

verify() {
  require_services || return 1
  echo "Roles: $(query 'SELECT coalesce(string_agg(name, chr(32) ORDER BY name), chr(45)) FROM roles')"
  echo "Owners: $(query 'SELECT count(*) FROM users WHERE is_owner')"
  query "SELECT 'Correo: ' || email || chr(10) || 'Activo: ' || CASE WHEN \"isActive\" THEN 'sí' ELSE 'no' END
                || chr(10) || 'Verificado: ' || CASE WHEN verified THEN 'sí' ELSE 'no' END
           FROM users WHERE is_owner"
}

while true; do
  cat <<'EOF'

========================================
       REHNIMARKET - DATOS INICIALES
========================================

1. Inicializar roles
2. Crear owner único y activo
3. Verificar roles y owner
0. Salir

EOF
  read -r -p "Seleccione una opción: " opcion || exit 0
  case "${opcion}" in
    1) init_roles ;;
    2) create_owner ;;
    3) verify ;;
    0) exit 0 ;;
    *) echo "Opción no válida." ;;
  esac
done
