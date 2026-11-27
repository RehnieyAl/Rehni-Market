#!/usr/bin/env bash
# Ejecutor de despliegue en el servidor: publica un commit de main ya aprobado por CI, solo con un respaldo
# verificado de la versión que está desplegada ahora; comprueba salud y, si falla, vuelve al código anterior
# únicamente cuando el cambio no trae migraciones (los datos nunca se restauran solos). Registra cada intento.
#
#   deploy_rehnimarket.sh <commit_sha_40> <backup_id> [github_run_id]
set -Eeuo pipefail

# Configuración del servidor (APP_DIR, rutas, URLs de salud); propiedad de root. En QA: OPS_ENV=/dev/null.
OPS_ENV="${OPS_ENV:-/etc/rehnimarket/ops.env}"
# shellcheck source=/dev/null
[ -r "${OPS_ENV}" ] && . "${OPS_ENV}"

APP_DIR="${APP_DIR:-/opt/rehnimarket}"
BACKUP_DIR="${BACKUP_DIR:-/home/rehnimarket/backups/rehnimarket}"
LOG_DIR="${LOG_DIR:-/var/log/rehnimarket}"
LOCK_FILE="${LOCK_FILE:-${LOG_DIR}/operacion.lock}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
COMPOSE_CMD="${COMPOSE_CMD:-docker compose}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-600}"
# Respaldo como máximo así de antiguo: uno de ayer no protege los datos de hoy.
MAX_BACKUP_AGE_MIN="${MAX_BACKUP_AGE_MIN:-120}"
HEALTH_URLS="${HEALTH_URLS:-http://127.0.0.1:8000/health/database}"
HEALTH_RETRIES="${HEALTH_RETRIES:-10}"
MIGRATIONS_PATH="${MIGRATIONS_PATH:-RehniMarket-backend/alembic/versions}"

TARGET_SHA="${1:-}"
BACKUP_ID="${2:-}"
RUN_ID="${3:-${GITHUB_RUN_ID:-manual}}"

[[ "${TARGET_SHA}" =~ ^[0-9a-f]{40}$ ]] || { echo "ERROR: SHA no válido (se esperan 40 hexadecimales)" >&2; exit 2; }
[[ "${BACKUP_ID}" =~ ^[0-9]{8}T[0-9]{6}Z_[0-9a-f]{12}$ ]] || { echo "ERROR: ID de respaldo no válido" >&2; exit 2; }
command -v jq >/dev/null || { echo "ERROR: falta jq" >&2; exit 1; }

install -d -m 750 "${LOG_DIR}"
LOG="${LOG_DIR}/deploy.log"
exec 9>"${LOCK_FILE}"
flock -n 9 || { echo "ERROR: hay otra operación (respaldo, restore o despliegue) en curso" | tee -a "${LOG}" >&2; exit 75; }
export REHNI_LOCK_HELD=1

log() { echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] [deploy ${TARGET_SHA:0:12} run ${RUN_ID}] $*" | tee -a "${LOG}"; }

PREV_SHA="$(git -C "${APP_DIR}" rev-parse HEAD)"
PREV_TAG="$(git -C "${APP_DIR}" describe --tags --exact-match HEAD 2>/dev/null || true)"
TARGET_TAG=""
HEALTH_RESULT="no ejecutado"

record() {
  local resultado="$1" detalle="$2"
  jq -cn --arg resultado "${resultado}" --arg detalle "${detalle}" --arg sha "${TARGET_SHA}" --arg tag "${TARGET_TAG}" \
    --arg prev_sha "${PREV_SHA}" --arg prev_tag "${PREV_TAG}" --arg backup "${BACKUP_ID}" --arg run "${RUN_ID}" \
    --arg salud "${HEALTH_RESULT}" \
    '{fecha_utc: (now | todate), operacion: "deploy", resultado: $resultado, detalle: $detalle,
      commit_sha: $sha, git_tag: $tag, anterior_sha: $prev_sha, anterior_tag: $prev_tag,
      backup_previo: $backup, github_run_id: $run, health_checks: $salud}' \
    | tee -a "${LOG_DIR}/releases.jsonl" >> "${LOG_DIR}/auditoria.jsonl"
}

trap 'record "error" "fallo inesperado en la línea ${LINENO}"; log "ERROR inesperado en la línea ${LINENO}"' ERR

abort() {
  log "CANCELADO: $1"
  record "cancelado" "$1"
  exit "${2:-1}"
}

compose_up() {
  (cd "${APP_DIR}" && ${COMPOSE_CMD} up -d --build --wait --wait-timeout "${WAIT_TIMEOUT}")
}

health_ok() {
  local url attempt
  for url in ${HEALTH_URLS}; do
    for attempt in $(seq 1 "${HEALTH_RETRIES}"); do
      curl -fsS --max-time 10 -o /dev/null "${url}" && break
      [ "${attempt}" -eq "${HEALTH_RETRIES}" ] && { log "health check falló: ${url}"; return 1; }
      sleep 3
    done
    log "health check OK: ${url}"
  done
}

log "=== INICIO · actual ${PREV_SHA} (${PREV_TAG:-sin tag}) → ${TARGET_SHA} · respaldo ${BACKUP_ID} ==="

if [ "${PREV_SHA}" = "${TARGET_SHA}" ]; then
  log "el commit ya está desplegado; nada que hacer"
  record "sin_cambios" "commit ya desplegado"
  exit 0
fi

[ -z "$(git -C "${APP_DIR}" status --porcelain --untracked-files=no)" ] \
  || abort "${APP_DIR} tiene cambios sin commit: el servidor debe reflejar exactamente un commit"

git -C "${APP_DIR}" fetch --quiet --tags origin "${DEPLOY_BRANCH}"
git -C "${APP_DIR}" cat-file -e "${TARGET_SHA}^{commit}" 2>/dev/null || abort "el commit no existe en origin"
git -C "${APP_DIR}" merge-base --is-ancestor "${TARGET_SHA}" "origin/${DEPLOY_BRANCH}" \
  || abort "el commit no pertenece a origin/${DEPLOY_BRANCH}"
TARGET_TAG="$(git -C "${APP_DIR}" describe --tags --exact-match "${TARGET_SHA}" 2>/dev/null || true)"

# El respaldo debe ser el de la versión desplegada AHORA (no la candidata), verificado, íntegro y reciente.
MANIFEST="${BACKUP_DIR}/${BACKUP_ID}/manifest.json"
[ -f "${MANIFEST}" ] || abort "no existe el respaldo ${BACKUP_ID}"
[ "$(jq -r .estado "${MANIFEST}" 2>/dev/null)" = "verificado" ] || abort "el respaldo ${BACKUP_ID} no está verificado"
[ "$(jq -r .id "${MANIFEST}")" = "${BACKUP_ID}" ] || abort "el manifiesto de ${BACKUP_ID} pertenece a otro respaldo"
(cd "${BACKUP_DIR}/${BACKUP_ID}" && sha256sum --quiet -c manifest.json.sha256 && sha256sum --quiet -c SHA256SUMS) \
  || abort "los checksums del respaldo ${BACKUP_ID} no coinciden"
[ "$(jq -r .version.commit_sha "${MANIFEST}")" = "${PREV_SHA}" ] \
  || abort "el respaldo ${BACKUP_ID} es de $(jq -r .version.commit_sha "${MANIFEST}"), no de la versión desplegada ${PREV_SHA}"
BACKUP_EPOCH="$(date -u -d "$(jq -r .fecha_fin_utc "${MANIFEST}")" +%s)"
[ $(( ($(date -u +%s) - BACKUP_EPOCH) / 60 )) -le "${MAX_BACKUP_AGE_MIN}" ] \
  || abort "el respaldo ${BACKUP_ID} tiene más de ${MAX_BACKUP_AGE_MIN} minutos"
log "respaldo previo válido: ${BACKUP_ID}"

HAS_MIGRATIONS=0
[ -z "$(git -C "${APP_DIR}" diff --name-only "${PREV_SHA}" "${TARGET_SHA}" -- "${MIGRATIONS_PATH}")" ] || HAS_MIGRATIONS=1
log "migraciones nuevas entre versiones: $([ "${HAS_MIGRATIONS}" -eq 1 ] && echo sí || echo no)"

# Volver a un commit anterior (rollback B → A) solo es seguro si no hay migraciones entre ambos: la base ya tiene
# el esquema nuevo y el código viejo no lo conoce. En ese caso hace falta un restore decidido por una persona.
if [ "${HAS_MIGRATIONS}" -eq 1 ] && git -C "${APP_DIR}" merge-base --is-ancestor "${TARGET_SHA}" "${PREV_SHA}"; then
  abort "rollback incompatible: entre ${TARGET_SHA:0:12} y ${PREV_SHA:0:12} hay migraciones; restaurar con un respaldo de esa versión"
fi

git -C "${APP_DIR}" checkout --quiet --detach "${TARGET_SHA}"
if compose_up && health_ok; then
  HEALTH_RESULT="ok"
  log "=== DESPLEGADO ${TARGET_SHA} (${TARGET_TAG:-sin tag}) ==="
  record "desplegado" "health checks OK"
  jq -n --arg sha "${TARGET_SHA}" --arg tag "${TARGET_TAG}" --arg backup "${BACKUP_ID}" --arg run "${RUN_ID}" \
    '{commit_sha: $sha, git_tag: $tag, desplegado_utc: (now | todate), backup_previo: $backup, github_run_id: $run}' \
    > "${LOG_DIR}/version-actual.json"
  exit 0
fi

HEALTH_RESULT="fallido"
log "la versión nueva no quedó sana"

if [ "${HAS_MIGRATIONS}" -eq 1 ]; then
  # Las migraciones pudieron cambiar el esquema: el código anterior podría no funcionar con él y restaurar
  # datos sin una persona que lo decida perdería escrituras. Se deja todo como está y se avisa.
  log "ROLLBACK AUTOMÁTICO BLOQUEADO: la versión trae migraciones. Requiere decisión manual (restore ${BACKUP_ID})."
  record "fallido_sin_rollback" "versión con migraciones; restore manual desde ${BACKUP_ID} si procede"
  exit 3
fi

log "volviendo al código anterior ${PREV_SHA} (sin migraciones de por medio, los datos son compatibles)"
git -C "${APP_DIR}" checkout --quiet --detach "${PREV_SHA}"
if compose_up && health_ok; then
  HEALTH_RESULT="fallido; rollback sano"
  record "revertido" "health check falló; se volvió a ${PREV_SHA}"
  jq -n --arg sha "${PREV_SHA}" --arg tag "${PREV_TAG}" '{commit_sha: $sha, git_tag: $tag, revertido_utc: (now | todate)}' \
    > "${LOG_DIR}/version-actual.json"
  exit 2
fi

HEALTH_RESULT="fallido; rollback también fallido"
record "rollback_fallido" "ni la versión nueva ni la anterior quedaron sanas"
log "ERROR CRÍTICO: el rollback tampoco quedó sano; intervención manual inmediata"
exit 4
