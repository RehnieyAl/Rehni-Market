set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_DIR}/backups}"
PG_CONTAINER="${PG_CONTAINER:-rehni-postgres}"
MINIO_CONTAINER="${MINIO_CONTAINER:-rehni-minio}"
BUCKET="${BUCKET:-uploads}"
KEEP_DAILY="${KEEP_DAILY:-7}"
STOP_BACKEND=1
[ "${1:-}" = "--no-stop" ] && STOP_BACKEND=0

TS="$(date -u +%Y-%m-%d_%H-%M)"
LOG="${BACKUP_DIR}/backup.log"
PG_OUT="${BACKUP_DIR}/postgres/rehni_market_postgres_${TS}.dump"
MN_DIR="${BACKUP_DIR}/minio/rehni_market_minio_${TS}"
MN_TAR="${MN_DIR}.tar.gz"

mkdir -p "${BACKUP_DIR}/postgres" "${BACKUP_DIR}/minio"
chmod 700 "${BACKUP_DIR}" || true

log() { echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] $*" | tee -a "${LOG}"; }
fail() { log "ERROR: $*"; exit 1; }
trap 'fail "abortado en la línea ${LINENO}"' ERR

cd "${PROJECT_DIR}"

docker inspect "${PG_CONTAINER}"    >/dev/null 2>&1 || fail "contenedor ${PG_CONTAINER} no existe (¿docker compose up -d?)"
docker inspect "${MINIO_CONTAINER}" >/dev/null 2>&1 || fail "contenedor ${MINIO_CONTAINER} no existe"
docker exec "${PG_CONTAINER}" pg_isready -U "$(docker exec "${PG_CONTAINER}" printenv POSTGRES_USER)" >/dev/null 2>&1 \
  || fail "PostgreSQL no acepta conexiones"

log "=== INICIO backup ${TS} ==="

if [ "${STOP_BACKEND}" -eq 1 ]; then
  log "deteniendo backend para consistencia..."
  docker compose stop backend >/dev/null 2>&1 || log "aviso: no se pudo detener backend (¿no está gestionado por compose?)"
fi

log "pg_dump -> ${PG_OUT}"
docker exec "${PG_CONTAINER}" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c -Z 6' > "${PG_OUT}"
[ -s "${PG_OUT}" ] || fail "el dump de PostgreSQL quedó vacío"

log "validando dump con pg_restore -l ..."
docker exec -i "${PG_CONTAINER}" pg_restore -l < "${PG_OUT}" > "${PG_OUT}.toc.txt" \
  || fail "pg_restore -l falló: el dump no es válido"
TABLES_IN_DUMP="$(grep -c 'TABLE DATA' "${PG_OUT}.toc.txt" || true)"
log "dump válido — ${TABLES_IN_DUMP} tablas con datos en el TOC"

sha256sum "${PG_OUT}" | tee "${PG_OUT}.sha256" >> "${LOG}"

log "mc mirror del bucket ${BUCKET} -> ${MN_DIR}"
docker exec "${MINIO_CONTAINER}" sh -c '
  mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null &&
  rm -rf /tmp/uploads_bk && mkdir -p /tmp/uploads_bk &&
  mc mirror --quiet --overwrite "local/'"${BUCKET}"'" /tmp/uploads_bk
'
mkdir -p "${MN_DIR}"
docker cp "${MINIO_CONTAINER}:/tmp/uploads_bk/." "${MN_DIR}" >/dev/null
docker exec "${MINIO_CONTAINER}" rm -rf /tmp/uploads_bk
OBJ_COUNT="$(find "${MN_DIR}" -type f | wc -l)"
log "objetos respaldados: ${OBJ_COUNT}"

tar -C "${MN_DIR}" -czf "${MN_TAR}" .
sha256sum "${MN_TAR}" | tee "${MN_TAR}.sha256" >> "${LOG}"

if [ "${STOP_BACKEND}" -eq 1 ]; then
  docker compose start backend >/dev/null 2>&1 || true
  log "backend reanudado"
fi

cat > "${BACKUP_DIR}/rehni_market_backup_${TS}.manifest.txt" <<EOF
RehniMarket — Manifiesto de backup
Identificador (TS): ${TS}
Fecha UTC        : $(date -u '+%Y-%m-%d %H:%M:%S')
PostgreSQL dump  : $(basename "${PG_OUT}")   ($(du -h "${PG_OUT}" | cut -f1))
  tablas con datos: ${TABLES_IN_DUMP}
MinIO tar        : $(basename "${MN_TAR}")   ($(du -h "${MN_TAR}" | cut -f1))
  objetos        : ${OBJ_COUNT}
SHA-256:
$(cat "${PG_OUT}.sha256")
$(cat "${MN_TAR}.sha256")
EOF
log "manifiesto: rehni_market_backup_${TS}.manifest.txt"

log "rotación: conservar ${KEEP_DAILY} más recientes de cada tipo"
ls -1t "${BACKUP_DIR}"/postgres/rehni_market_postgres_*.dump 2>/dev/null | tail -n +$((KEEP_DAILY+1)) | while read -r f; do
  rm -f "$f" "$f".sha256 "$f".toc.txt; log "  borrado $(basename "$f")"
done
ls -1dt "${BACKUP_DIR}"/minio/rehni_market_minio_*/ 2>/dev/null | tail -n +$((KEEP_DAILY+1)) | while read -r d; do
  rm -rf "$d" "${d%/}".tar.gz "${d%/}".tar.gz.sha256; log "  borrado $(basename "$d")"
done

log "=== FIN backup ${TS} — OK ==="
echo
echo "Backup completado. Artefactos en: ${BACKUP_DIR}"
echo "  - ${PG_OUT}"
echo "  - ${MN_TAR}"
echo "Restaurar en el proyecto:      scripts/restore_rehnimarket.sh ${TS}"
echo "Validar sin tocar el proyecto: scripts/restore_rehnimarket.sh ${TS} --verify-only"
