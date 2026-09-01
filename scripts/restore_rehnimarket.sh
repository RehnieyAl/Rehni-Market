#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_DIR}/backups}"
PG_CONTAINER="${PG_CONTAINER:-rehni-postgres}"
MINIO_CONTAINER="${MINIO_CONTAINER:-rehni-minio}"
BACKEND_CONTAINER="${BACKEND_CONTAINER:-rehni-backend}"
BUCKET="${BUCKET:-uploads}"

TS=""
MODE="real"
MINIO_PURGE=0
for arg in "$@"; do
  case "${arg}" in
    --verify-only|--isolated) MODE="verify" ;;
    --minio-purge) MINIO_PURGE=1 ;;
    --*) echo "Opcion desconocida: ${arg}" >&2; exit 2 ;;
    *) TS="${arg}" ;;
  esac
done

if [ -z "${TS}" ]; then
  echo "Uso: $0 <TS> [--verify-only] [--minio-purge]" >&2
  echo "  <TS> como en backups/, p.ej. 2026-08-31_22-14" >&2
  echo "  --verify-only : restaura en contenedores desechables y valida, sin tocar el proyecto" >&2
  echo "  --minio-purge : ademas elimina de MinIO los objetos que no esten en el backup" >&2
  exit 2
fi

PG_DUMP="${BACKUP_DIR}/postgres/rehni_market_postgres_${TS}.dump"
MN_TAR="${BACKUP_DIR}/minio/rehni_market_minio_${TS}.tar.gz"

[ -f "${PG_DUMP}" ] || { echo "ERROR: no existe ${PG_DUMP}" >&2; exit 1; }
[ -f "${MN_TAR}" ]  || { echo "ERROR: no existe ${MN_TAR}" >&2; exit 1; }

WORKDIR="$(mktemp -d)"
cleanup_workdir() { rm -rf "${WORKDIR}"; }

log() { echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] $*"; }
line() { printf -- '------------------------------------------------------------\n'; }

verify_sha256() {
  local file="$1" sidecar="$1.sha256"
  if [ ! -f "${sidecar}" ]; then
    log "aviso: sin ${sidecar##*/}, se omite verificacion SHA-256"
    return 0
  fi
  local expected actual
  expected="$(awk '{print $1; exit}' "${sidecar}")"
  actual="$(sha256sum "${file}" | awk '{print $1}')"
  if [ "${expected}" != "${actual}" ]; then
    echo "ERROR: SHA-256 no coincide para ${file##*/}" >&2
    return 1
  fi
  log "SHA-256 OK: ${file##*/}"
}

pg_psql() {
  local container="$1" db="$2"; shift 2
  docker exec -i "${container}" sh -c \
    'PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$0" "$@"' "${db}" "$@"
}

pg_restore_into() {
  local container="$1" db="$2"; shift 2
  docker exec -i "${container}" sh -c \
    'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore -U "$POSTGRES_USER" -d "$0" "$@"' "${db}" "$@" < "${PG_DUMP}"
}

drop_db() {
  pg_psql "${PG_CONTAINER}" postgres -q -c "DROP DATABASE IF EXISTS \"${1}\";" >/dev/null 2>&1 || true
}

pg_scalar() {
  pg_psql "${1}" "${2}" -tA -c "${3}" 2>/dev/null | tr -d '[:space:]'
}

minio_alias() {
  docker exec "${1}" sh -c 'mc alias set rm "http://localhost:9000" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1' || true
}

minio_check_objects() {
  local container="$1" src_dir="$2" listing="${WORKDIR}/minio_listing.json" missing="${WORKDIR}/minio_missing.txt"
  minio_alias "${container}"
  docker exec "${container}" sh -c 'mc alias set rm "http://localhost:9000" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1; mc --json ls --recursive "rm/'"${BUCKET}"'"' \
    | tr -d '\0' > "${listing}" || true
  python3 - "${src_dir}" "${listing}" "${missing}" <<'PY'
import json, os, sys
src_dir, listing, missing = sys.argv[1], sys.argv[2], sys.argv[3]
have = {}
with open(listing, encoding="utf-8", errors="replace") as fh:
    for raw in fh:
        raw = raw.strip()
        if not raw:
            continue
        try:
            o = json.loads(raw)
        except Exception:
            continue
        if o.get("type") == "file" and "key" in o:
            have[o["key"]] = o.get("size")
want = {}
for root, _, files in os.walk(src_dir):
    for f in files:
        full = os.path.join(root, f)
        rel = os.path.relpath(full, src_dir).replace(os.sep, "/")
        want[rel] = os.path.getsize(full)
lost = []
for k, size in want.items():
    if k not in have:
        lost.append(k + " (ausente)")
    elif have[k] is not None and have[k] != size:
        lost.append(k + f" (tamano {have[k]} != {size})")
with open(missing, "w", encoding="utf-8") as fh:
    fh.write("\n".join(lost))
print(f"{len(want)} {len(have)} {len(lost)}")
PY
}

docker inspect "${PG_CONTAINER}"    >/dev/null 2>&1 || { echo "ERROR: contenedor ${PG_CONTAINER} no existe (ejecuta docker compose up -d)" >&2; exit 1; }
docker inspect "${MINIO_CONTAINER}" >/dev/null 2>&1 || { echo "ERROR: contenedor ${MINIO_CONTAINER} no existe" >&2; exit 1; }

PGUSER="$(docker exec "${PG_CONTAINER}" printenv POSTGRES_USER)"
PGDB="$(docker exec "${PG_CONTAINER}" printenv POSTGRES_DB)"

line
log "RESTORE RehniMarket  |  backup ${TS}  |  modo: ${MODE}"
line

verify_sha256 "${PG_DUMP}" || { cleanup_workdir; exit 1; }
verify_sha256 "${MN_TAR}"   || { cleanup_workdir; exit 1; }

TABLE_DATA_IN_DUMP="$(docker exec -i "${PG_CONTAINER}" pg_restore -l < "${PG_DUMP}" 2>/dev/null | grep -c 'TABLE DATA' || true)"
[ "${TABLE_DATA_IN_DUMP}" -ge 1 ] || { echo "ERROR: el dump no contiene datos de tablas (pg_restore -l)" >&2; cleanup_workdir; exit 1; }
log "dump valido: ${TABLE_DATA_IN_DUMP} tablas con datos"

mkdir -p "${WORKDIR}/objects"
tar -C "${WORKDIR}/objects" -xzf "${MN_TAR}"
OBJ_IN_BACKUP="$(find "${WORKDIR}/objects" -type f | wc -l)"
log "objetos en el backup de MinIO: ${OBJ_IN_BACKUP}"

PG_RESULT="NO EJECUTADO"
MINIO_RESULT="NO EJECUTADO"

if [ "${MODE}" = "verify" ]; then
  RPG="rehni-restore-pg"; RMINIO="rehni-restore-minio"; NET="rehni-restore-net"
  cleanup_verify() {
    docker rm -f "${RPG}" "${RMINIO}" >/dev/null 2>&1 || true
    docker network rm "${NET}" >/dev/null 2>&1 || true
    cleanup_workdir
    log "entorno de verificacion destruido"
  }
  trap cleanup_verify EXIT
  docker rm -f "${RPG}" "${RMINIO}" >/dev/null 2>&1 || true
  docker network rm "${NET}" >/dev/null 2>&1 || true
  docker network create "${NET}" >/dev/null
  PG_IMAGE="$(docker inspect -f '{{.Config.Image}}' "${PG_CONTAINER}")"
  MN_IMAGE="$(docker inspect -f '{{.Config.Image}}' "${MINIO_CONTAINER}")"
  docker run -d --name "${RPG}" --network "${NET}" \
    --env-file <(docker exec "${PG_CONTAINER}" sh -c 'printf "POSTGRES_PASSWORD=%s\n" "$POSTGRES_PASSWORD"') \
    -e POSTGRES_USER="${PGUSER}" -e POSTGRES_DB="${PGDB}" \
    "${PG_IMAGE}" >/dev/null
  docker run -d --name "${RMINIO}" --network "${NET}" \
    --env-file <(docker exec "${MINIO_CONTAINER}" sh -c 'printf "MINIO_ROOT_USER=%s\nMINIO_ROOT_PASSWORD=%s\n" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"') \
    "${MN_IMAGE}" server /data >/dev/null
  log "esperando PostgreSQL desechable..."
  for _ in $(seq 1 60); do
    docker exec "${RPG}" pg_isready -U "${PGUSER}" >/dev/null 2>&1 && break
    sleep 1
  done
  docker exec "${RPG}" pg_isready -U "${PGUSER}" >/dev/null 2>&1 || { echo "ERROR: PostgreSQL desechable no arranco" >&2; exit 1; }
  sleep 3

  line
  log "PostgreSQL: pg_restore en base desechable"
  if pg_restore_into "${RPG}" "${PGDB}" --no-owner --no-privileges --clean --if-exists --exit-on-error; then
    T="$(pg_scalar "${RPG}" "${PGDB}" "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")"
    A="$(pg_scalar "${RPG}" "${PGDB}" "SELECT count(*) FROM alembic_version;")"
    log "tablas restauradas: ${T} | alembic_version: ${A:-0}"
    if [ "${T:-0}" -ge 1 ] && [ "${A:-0}" -ge 1 ]; then
      PG_RESULT="VERIFICADO (${T} tablas, entorno desechable)"
    else
      PG_RESULT="FALLO (restauracion incompleta)"
    fi
  else
    PG_RESULT="FALLO (pg_restore devolvio error)"
  fi

  line
  log "MinIO: restauracion en instancia desechable"
  docker cp "${WORKDIR}/objects/." "${RMINIO}:/tmp/rs" >/dev/null
  minio_alias "${RMINIO}"
  if docker exec "${RMINIO}" sh -c 'mc alias set rm "http://localhost:9000" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1; mc mb -p "rm/'"${BUCKET}"'" >/dev/null 2>&1; mc mirror --overwrite --quiet /tmp/rs "rm/'"${BUCKET}"'"'; then
    read -r WANT HAVE LOST <<<"$(minio_check_objects "${RMINIO}" "${WORKDIR}/objects")"
    log "objetos en el bucket: ${HAVE} | del backup: ${WANT} | faltantes: ${LOST}"
    if [ "${LOST:-1}" -eq 0 ]; then
      MINIO_RESULT="VERIFICADO (${WANT} objetos, entorno desechable)"
    else
      MINIO_RESULT="FALLO (${LOST} objetos no restaurados)"
      cat "${WORKDIR}/minio_missing.txt"
    fi
  else
    MINIO_RESULT="FALLO (mc mirror devolvio error)"
  fi
else
  BACKEND_WAS_RUNNING=0
  if docker inspect -f '{{.State.Running}}' "${BACKEND_CONTAINER}" 2>/dev/null | grep -q true; then
    BACKEND_WAS_RUNNING=1
  fi
  restore_backend() {
    if [ "${BACKEND_WAS_RUNNING}" -eq 1 ]; then
      docker start "${BACKEND_CONTAINER}" >/dev/null 2>&1 \
        || docker compose -f "${PROJECT_DIR}/docker-compose.yml" start backend >/dev/null 2>&1 || true
      log "backend reanudado"
    fi
    cleanup_workdir
  }
  trap restore_backend EXIT

  if [ "${BACKEND_WAS_RUNNING}" -eq 1 ]; then
    log "deteniendo backend para liberar conexiones..."
    docker stop "${BACKEND_CONTAINER}" >/dev/null 2>&1 \
      || docker compose -f "${PROJECT_DIR}/docker-compose.yml" stop backend >/dev/null 2>&1 || true
  fi

  TMP_DB="${PGDB}_restore_tmp"
  PREV_DB="${PGDB}_prev"

  line
  log "PostgreSQL: preparando base temporal ${TMP_DB}"
  drop_db "${TMP_DB}"
  pg_psql "${PG_CONTAINER}" postgres -v ON_ERROR_STOP=1 -q \
    -c "CREATE DATABASE \"${TMP_DB}\" OWNER \"${PGUSER}\";"

  log "PostgreSQL: pg_restore -> ${TMP_DB}"
  if pg_restore_into "${PG_CONTAINER}" "${TMP_DB}" --no-owner --no-privileges --exit-on-error; then
    RESTORED_TABLES="$(pg_scalar "${PG_CONTAINER}" "${TMP_DB}" "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")"
    HAS_ALEMBIC="$(pg_scalar "${PG_CONTAINER}" "${TMP_DB}" "SELECT count(*) FROM alembic_version;")"
    if [ "${RESTORED_TABLES:-0}" -ge 1 ] && [ "${HAS_ALEMBIC:-0}" -ge 1 ]; then
      log "PostgreSQL: base temporal OK (${RESTORED_TABLES} tablas, alembic_version presente)"
      log "PostgreSQL: intercambiando ${PGDB} -> ${PREV_DB} y ${TMP_DB} -> ${PGDB}"
      SWAPPED=0
      for _ in $(seq 1 5); do
        if pg_psql "${PG_CONTAINER}" postgres -v ON_ERROR_STOP=1 -q \
            -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname IN ('${PGDB}','${TMP_DB}') AND pid <> pg_backend_pid();" \
            -c "DROP DATABASE IF EXISTS \"${PREV_DB}\";" \
            -c "ALTER DATABASE \"${PGDB}\" RENAME TO \"${PREV_DB}\";" \
            -c "ALTER DATABASE \"${TMP_DB}\" RENAME TO \"${PGDB}\";" >/dev/null 2>&1
        then SWAPPED=1; break; fi
        sleep 1
      done
      if [ "${SWAPPED}" -eq 1 ]; then
        FINAL_TABLES="$(pg_scalar "${PG_CONTAINER}" "${PGDB}" "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")"
        PG_RESULT="RESTAURADO (${FINAL_TABLES} tablas; copia previa en ${PREV_DB})"
      else
        drop_db "${TMP_DB}"
        PG_RESULT="FALLO (no se pudo intercambiar la base; ${PGDB} sin cambios)"
      fi
    else
      drop_db "${TMP_DB}"
      PG_RESULT="FALLO (restauracion incompleta; ${PGDB} sin cambios)"
    fi
  else
    drop_db "${TMP_DB}"
    PG_RESULT="FALLO (pg_restore devolvio error; ${PGDB} sin cambios)"
  fi

  line
  log "MinIO: restaurando objetos en el bucket ${BUCKET}"
  RESTORE_PATH="/tmp/rehni_restore_${TS}"
  docker exec "${MINIO_CONTAINER}" rm -rf "${RESTORE_PATH}" >/dev/null 2>&1 || true
  docker cp "${WORKDIR}/objects/." "${MINIO_CONTAINER}:${RESTORE_PATH}" >/dev/null

  MIRROR_FLAGS="--overwrite --quiet"
  [ "${MINIO_PURGE}" -eq 1 ] && MIRROR_FLAGS="${MIRROR_FLAGS} --remove"

  minio_alias "${MINIO_CONTAINER}"
  if docker exec "${MINIO_CONTAINER}" sh -c 'mc alias set rm "http://localhost:9000" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1; mc mb -p "rm/'"${BUCKET}"'" >/dev/null 2>&1; mc mirror '"${MIRROR_FLAGS}"' "'"${RESTORE_PATH}"'" "rm/'"${BUCKET}"'"'; then
    read -r WANT HAVE LOST <<<"$(minio_check_objects "${MINIO_CONTAINER}" "${WORKDIR}/objects")"
    docker exec "${MINIO_CONTAINER}" rm -rf "${RESTORE_PATH}" >/dev/null 2>&1 || true
    log "objetos en el bucket: ${HAVE} | del backup: ${WANT} | faltantes: ${LOST}"
    if [ "${LOST:-1}" -eq 0 ]; then
      MINIO_RESULT="RESTAURADO (${HAVE} objetos en el bucket; ${WANT} desde el backup)"
    else
      MINIO_RESULT="FALLO (${LOST} objetos del backup no quedaron restaurados)"
      cat "${WORKDIR}/minio_missing.txt"
    fi
  else
    docker exec "${MINIO_CONTAINER}" rm -rf "${RESTORE_PATH}" >/dev/null 2>&1 || true
    MINIO_RESULT="FALLO (mc mirror devolvio error)"
  fi
fi

line
echo "RESULTADO DEL RESTORE (${TS})"
echo "  PostgreSQL : ${PG_RESULT}"
echo "  MinIO      : ${MINIO_RESULT}"
line

case "${PG_RESULT}::${MINIO_RESULT}" in
  RESTAURADO*::RESTAURADO*|VERIFICADO*::VERIFICADO*)
    log "OK: restore completo."
    exit 0
    ;;
  *)
    echo "ERROR: el restore NO se completo correctamente en todos los componentes." >&2
    exit 1
    ;;
esac
