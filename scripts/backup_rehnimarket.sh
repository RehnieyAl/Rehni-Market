#!/usr/bin/env bash
# Respaldo versionado de RehniMarket: PostgreSQL (pg_dump -Fc) y el bucket de MinIO, con manifest.json (id, fecha
# UTC, tag y SHA de la versión desplegada, revisión de Alembic, run de GitHub Actions), SHA256SUMS y verificación.
# Nunca borra respaldos anteriores. Salida final: BACKUP_ID=<id> (la lee el ejecutor de despliegue).
#
#   bash scripts/backup_rehnimarket.sh [--no-stop]
#   BACKUP_DIR=... LOG_DIR=... APP_DIR=...   (por defecto /home/rehnimarket/backups/rehnimarket, /var/log/rehnimarket y el repo)
set -Eeuo pipefail

# Configuración del servidor (APP_DIR, rutas, URLs de salud); propiedad de root. En QA: OPS_ENV=/dev/null.
OPS_ENV="${OPS_ENV:-/etc/rehnimarket/ops.env}"
# shellcheck source=/dev/null
[ -r "${OPS_ENV}" ] && . "${OPS_ENV}"

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-/home/rehnimarket/backups/rehnimarket}"
LOG_DIR="${LOG_DIR:-/var/log/rehnimarket}"
LOCK_FILE="${LOCK_FILE:-${LOG_DIR}/operacion.lock}"
PG_CONTAINER="${PG_CONTAINER:-rehni-postgres}"
MINIO_CONTAINER="${MINIO_CONTAINER:-rehni-minio}"
BACKEND_SERVICE="${BACKEND_SERVICE:-backend}"
BUCKET="${BUCKET:-uploads}"
RUN_ID="${GITHUB_RUN_ID:-manual}"
STOP_BACKEND=1

for arg in "$@"; do
  case "${arg}" in
    --no-stop) STOP_BACKEND=0 ;;
    *) echo "Opción desconocida: ${arg}" >&2; exit 2 ;;
  esac
done

command -v jq >/dev/null || { echo "ERROR: falta jq (apt install jq)" >&2; exit 1; }
install -d -m 700 "${BACKUP_DIR}"
install -d -m 750 "${LOG_DIR}"
LOG="${LOG_DIR}/backup.log"

# Un solo respaldo, restore o despliegue a la vez. El despliegue ya tiene el candado y llama a este script con
# REHNI_LOCK_HELD=1 para no bloquearse a sí mismo.
if [ "${REHNI_LOCK_HELD:-0}" != "1" ]; then
  exec 9>"${LOCK_FILE}"
  flock -n 9 || { echo "ERROR: hay otra operación (respaldo, restore o despliegue) en curso" | tee -a "${LOG}" >&2; exit 75; }
fi

COMMIT_SHA="$(git -C "${APP_DIR}" rev-parse HEAD)"
GIT_TAG="$(git -C "${APP_DIR}" describe --tags --exact-match HEAD 2>/dev/null || true)"
GIT_DESCRIBE="$(git -C "${APP_DIR}" describe --tags --always HEAD 2>/dev/null || echo "${COMMIT_SHA:0:12}")"
CLEAN_TREE=true
[ -z "$(git -C "${APP_DIR}" status --porcelain --untracked-files=no)" ] || CLEAN_TREE=false

STARTED_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
BACKUP_ID="$(date -u +%Y%m%dT%H%M%SZ)_${COMMIT_SHA:0:12}"
DEST="${BACKUP_DIR}/${BACKUP_ID}"
[ -e "${DEST}" ] && { echo "ERROR: ya existe ${DEST}" >&2; exit 1; }
install -d -m 700 "${DEST}"

log() { echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] [${BACKUP_ID}] $*" | tee -a "${LOG}" "${DEST}/backup.log"; }

audit() {
  jq -cn --arg op backup --arg id "${BACKUP_ID}" --arg resultado "$1" --arg detalle "$2" \
    --arg sha "${COMMIT_SHA}" --arg tag "${GIT_TAG}" --arg run "${RUN_ID}" \
    '{fecha_utc: (now | todate), operacion: $op, backup_id: $id, resultado: $resultado, detalle: $detalle,
      commit_sha: $sha, git_tag: $tag, github_run_id: $run}' >> "${LOG_DIR}/auditoria.jsonl"
}

BACKEND_STOPPED=0
resume_backend() {
  if [ "${BACKEND_STOPPED}" -eq 1 ]; then
    docker compose --project-directory "${APP_DIR}" start "${BACKEND_SERVICE}" >/dev/null 2>&1 || true
    BACKEND_STOPPED=0
    log "backend reanudado"
  fi
}

write_manifest() {
  local estado="$1" detalle="$2"
  jq -n \
    --arg id "${BACKUP_ID}" --arg inicio "${STARTED_UTC}" --arg fin "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg tag "${GIT_TAG}" --arg describe "${GIT_DESCRIBE}" --arg sha "${COMMIT_SHA}" \
    --argjson limpio "${CLEAN_TREE}" --arg alembic "${ALEMBIC_REVISION:-}" --arg run "${RUN_ID}" \
    --arg host "$(hostname)" --arg bucket "${BUCKET}" \
    --argjson pg_bytes "${PG_BYTES:-0}" --argjson pg_tablas "${TABLES_IN_DUMP:-0}" \
    --argjson mn_bytes "${MN_BYTES:-0}" --argjson mn_objetos "${OBJ_COUNT:-0}" \
    --arg estado "${estado}" --arg detalle "${detalle}" \
    '{formato: 1, id: $id, fecha_inicio_utc: $inicio, fecha_fin_utc: $fin,
      version: {git_tag: $tag, git_describe: $describe, commit_sha: $sha, arbol_limpio: $limpio,
                alembic_revision: $alembic},
      github_run_id: $run, host: $host,
      postgres: {archivo: "postgres.dump", bytes: $pg_bytes, tablas_con_datos: $pg_tablas},
      minio: {archivo: "minio.tar.gz", bucket: $bucket, bytes: $mn_bytes, objetos: $mn_objetos},
      checksums: "SHA256SUMS", estado: $estado, detalle: $detalle}' > "${DEST}/manifest.json"
  sha256sum "${DEST}/manifest.json" | sed "s#${DEST}/##" > "${DEST}/manifest.json.sha256"
}

fail() {
  trap - ERR
  resume_backend
  log "ERROR: $*"
  write_manifest "fallido" "$*"
  audit "fallido" "$*"
  echo "BACKUP_FALLIDO=${BACKUP_ID}"
  exit 1
}
trap 'fail "abortado en la línea ${LINENO}"' ERR

docker inspect "${PG_CONTAINER}"    >/dev/null 2>&1 || fail "contenedor ${PG_CONTAINER} no existe"
docker inspect "${MINIO_CONTAINER}" >/dev/null 2>&1 || fail "contenedor ${MINIO_CONTAINER} no existe"
docker exec "${PG_CONTAINER}" sh -c 'pg_isready -U "$POSTGRES_USER"' >/dev/null 2>&1 || fail "PostgreSQL no acepta conexiones"

log "=== INICIO respaldo · commit ${COMMIT_SHA} · tag ${GIT_TAG:-sin tag} · run ${RUN_ID} ==="
[ "${CLEAN_TREE}" = true ] || log "aviso: el árbol de ${APP_DIR} tiene cambios sin commit; el SHA no describe todo el código"

ALEMBIC_REVISION="$(docker exec "${PG_CONTAINER}" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT string_agg(version_num, chr(44)) FROM alembic_version"' \
  2>/dev/null | tr -d '[:space:]' || true)"
log "revisión de Alembic en la base: ${ALEMBIC_REVISION:-desconocida}"

if [ "${STOP_BACKEND}" -eq 1 ]; then
  log "deteniendo backend para un respaldo consistente"
  docker compose --project-directory "${APP_DIR}" stop "${BACKEND_SERVICE}" >/dev/null 2>&1 && BACKEND_STOPPED=1 \
    || log "aviso: no se pudo detener el backend (¿no lo gestiona compose?)"
fi

log "pg_dump -> postgres.dump"
docker exec "${PG_CONTAINER}" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c -Z 6' > "${DEST}/postgres.dump"
[ -s "${DEST}/postgres.dump" ] || fail "el dump de PostgreSQL quedó vacío"

log "mc mirror del bucket ${BUCKET}"
docker exec "${MINIO_CONTAINER}" sh -c '
  mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null &&
  rm -rf /tmp/uploads_bk && mkdir -p /tmp/uploads_bk &&
  mc mirror --quiet --overwrite "local/'"${BUCKET}"'" /tmp/uploads_bk
' || fail "mc mirror falló"
STAGE="$(mktemp -d)"
docker cp "${MINIO_CONTAINER}:/tmp/uploads_bk/." "${STAGE}" >/dev/null
docker exec "${MINIO_CONTAINER}" rm -rf /tmp/uploads_bk
OBJ_COUNT="$(find "${STAGE}" -type f | wc -l)"
# mktemp crea el directorio con 700 y tar guarda ese modo en «.»: MinIO (usuario sin privilegios) no podría
# leer los objetos al restaurar.
chmod -R u=rwX,go=rX "${STAGE}"
tar -C "${STAGE}" -czf "${DEST}/minio.tar.gz" .
rm -rf "${STAGE}"

resume_backend

log "verificando el respaldo"
docker exec -i "${PG_CONTAINER}" pg_restore -l < "${DEST}/postgres.dump" > "${DEST}/postgres.toc.txt" \
  || fail "pg_restore -l no puede leer el dump"
TABLES_IN_DUMP="$(grep -c 'TABLE DATA' "${DEST}/postgres.toc.txt" || true)"
[ "${TABLES_IN_DUMP}" -ge 1 ] || fail "el dump no contiene datos de tablas"
TAR_OBJECTS="$(tar -tzf "${DEST}/minio.tar.gz" | grep -cv '/$' || true)"
[ "${TAR_OBJECTS}" -eq "${OBJ_COUNT}" ] || fail "el tar de MinIO tiene ${TAR_OBJECTS} objetos y se copiaron ${OBJ_COUNT}"

(cd "${DEST}" && sha256sum postgres.dump postgres.toc.txt minio.tar.gz > SHA256SUMS)
(cd "${DEST}" && sha256sum --quiet -c SHA256SUMS) || fail "SHA256SUMS no coincide recién escrito"
PG_BYTES="$(stat -c %s "${DEST}/postgres.dump")"
MN_BYTES="$(stat -c %s "${DEST}/minio.tar.gz")"

write_manifest "verificado" "pg_restore -l, ${TABLES_IN_DUMP} tablas con datos, ${OBJ_COUNT} objetos, SHA256SUMS OK"
chmod 600 "${DEST}"/*
audit "verificado" "${TABLES_IN_DUMP} tablas, ${OBJ_COUNT} objetos"
log "=== FIN respaldo — VERIFICADO (${TABLES_IN_DUMP} tablas, ${OBJ_COUNT} objetos) ==="
echo "BACKUP_ID=${BACKUP_ID}"
