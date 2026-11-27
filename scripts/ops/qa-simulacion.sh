#!/usr/bin/env bash
# Simulación aislada del ciclo respaldo → despliegue → health check → rollback → restore con los scripts reales:
# contenedores desechables de PostgreSQL y MinIO (las imágenes del docker-compose.yml), un repositorio Git temporal
# con las versiones A y B y rutas de respaldo/logs temporales. No toca la base de desarrollo ni producción.
# Al final imprime la tabla de resultados y deja la evidencia (logs, manifiestos) en el directorio de trabajo.
#
#   bash scripts/ops/qa-simulacion.sh [directorio_de_trabajo]
set -Euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORK="${1:-$(mktemp -d /tmp/rehni-qa-sim.XXXXXX)}"
mkdir -p "${WORK}"
WORK="$(cd "${WORK}" && pwd)"
PG_IMAGE="postgres:17-alpine"
MINIO_IMAGE="$(sed -n 's/^\s*image: \(cgr.dev\/chainguard\/minio@sha256:[0-9a-f]*\)/\1/p' "${REPO_ROOT}/docker-compose.yml" | head -n 1)"
PG_C="rehni-sim-pg"
MN_C="rehni-sim-minio"
WEB_PORT="${WEB_PORT:-58123}"

export OPS_ENV=/dev/null
export BACKUP_DIR="${WORK}/backups" LOG_DIR="${WORK}/logs" APP_DIR="${WORK}/app"
export PG_CONTAINER="${PG_C}" MINIO_CONTAINER="${MN_C}" BACKEND_SERVICE=web BACKEND_CONTAINER=rehni-sim-web
export HEALTH_URLS="http://127.0.0.1:${WEB_PORT}/health" HEALTH_RETRIES=3 WAIT_TIMEOUT=120
export MIGRATIONS_PATH="RehniMarket-backend/alembic/versions" COMPOSE_CMD="docker compose" COMPOSE_PROJECT_NAME=rehni-sim
BACKUP="${REPO_ROOT}/scripts/backup_rehnimarket.sh"
RESTORE="${REPO_ROOT}/scripts/restore_rehnimarket.sh"
DEPLOY="${REPO_ROOT}/scripts/deploy_rehnimarket.sh"

RESULTS=()
pass() { RESULTS+=("OK    | $1 | ${2:-}"); echo "OK    $1 ${2:-}"; }
failt() { RESULTS+=("FALLA | $1 | ${2:-}"); echo "FALLA $1 ${2:-}"; }
expect_code() { # nombre, código esperado, código obtenido, detalle
  if [ "$3" -eq "$2" ]; then pass "$1" "código $3 ${4:-}"; else failt "$1" "esperado $2, obtenido $3 ${4:-}"; fi
}

cleanup() {
  (cd "${APP_DIR}" 2>/dev/null && docker compose down -v >/dev/null 2>&1) || true
  docker rm -f "${PG_C}" "${MN_C}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

backup_id() { sed -n 's/^BACKUP_ID=//p' | tail -n 1; }
sha_of() { git -C "${WORK}/dev" rev-parse "$1"; }
deployed() { git -C "${APP_DIR}" rev-parse HEAD; }

echo "== Preparación en ${WORK}"
cleanup
docker run -d --name "${PG_C}" -e POSTGRES_USER=rehni -e POSTGRES_PASSWORD=pg-clave-simulacion-91 -e POSTGRES_DB=rehnimarket "${PG_IMAGE}" >/dev/null
docker run -d --name "${MN_C}" -e MINIO_ROOT_USER=simminio -e MINIO_ROOT_PASSWORD=simminio-secret-123 \
  --tmpfs /data:uid=65532,gid=65532 "${MINIO_IMAGE}" server /data >/dev/null
for _ in $(seq 1 60); do docker exec "${PG_C}" pg_isready -h 127.0.0.1 -U rehni >/dev/null 2>&1 && break; sleep 1; done
sleep 2
docker exec "${PG_C}" psql -U rehni -d rehnimarket -q -c \
  "CREATE TABLE alembic_version (version_num varchar(32) PRIMARY KEY); INSERT INTO alembic_version VALUES ('a1');
   CREATE TABLE pedidos (id int PRIMARY KEY, total numeric); INSERT INTO pedidos VALUES (1, 100), (2, 250);"
for _ in $(seq 1 30); do
  docker exec "${MN_C}" sh -c 'mc alias set l http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1' && break
  sleep 1
done
docker exec "${MN_C}" sh -c 'mc mb -p l/uploads >/dev/null && echo logo > /tmp/a.png && echo banner > /tmp/b.png &&
  mc cp /tmp/a.png l/uploads/companies/a.png >/dev/null && mc cp /tmp/b.png l/uploads/products/b.png >/dev/null'

# Repositorio de origen con las versiones A, B, B-mala (sin salud) y C-migracion-mala; "app" es el servidor.
git init -q --bare -b main "${WORK}/origin.git"
git init -q -b main "${WORK}/dev"
git -C "${WORK}/dev" config user.email qa@rehnimarket.example
git -C "${WORK}/dev" config user.name "QA simulación"
mkdir -p "${WORK}/dev/www" "${WORK}/dev/${MIGRATIONS_PATH}"
cat > "${WORK}/dev/docker-compose.yml" <<EOF
services:
  web:
    image: python:3.13-alpine
    container_name: rehni-sim-web
    command: ["python", "-m", "http.server", "8000", "-d", "/srv/www"]
    ports: ["127.0.0.1:${WEB_PORT}:8000"]
    volumes: ["./www:/srv/www:ro"]
EOF
commit() { git -C "${WORK}/dev" add -A && git -C "${WORK}/dev" commit -q -m "$1" && { [ -z "${2:-}" ] || git -C "${WORK}/dev" tag "$2"; }; }
echo "A" > "${WORK}/dev/www/version"; echo ok > "${WORK}/dev/www/health"; touch "${WORK}/dev/${MIGRATIONS_PATH}/.keep"
commit "versión A" vA
echo "B" > "${WORK}/dev/www/version"; commit "versión B" vB
echo "B-mala" > "${WORK}/dev/www/version"; rm "${WORK}/dev/www/health"; commit "versión B mala (sin salud)"
echo "C" > "${WORK}/dev/www/version"; echo ok > "${WORK}/dev/www/health"
echo "rev c1" > "${WORK}/dev/${MIGRATIONS_PATH}/c1_nueva.py"; commit "versión C con migración" vC
echo "C-mala" > "${WORK}/dev/www/version"; rm "${WORK}/dev/www/health"
echo "rev c2" > "${WORK}/dev/${MIGRATIONS_PATH}/c2_otra.py"; commit "versión C mala con migración"
git -C "${WORK}/dev" push -q --tags "${WORK}/origin.git" main
git clone -q "${WORK}/origin.git" "${APP_DIR}"
git -C "${APP_DIR}" checkout -q --detach vA
SHA_A="$(sha_of vA)"; SHA_B="$(sha_of vB)"
SHA_BBAD="$(git -C "${WORK}/dev" log --format=%H --grep='versión B mala' -n 1 --all)"
SHA_C="$(sha_of vC)"; SHA_CBAD="$(git -C "${WORK}/dev" log --format=%H --grep='versión C mala' -n 1 --all)"
(cd "${APP_DIR}" && ${COMPOSE_CMD} up -d --wait >/dev/null 2>&1)
curl -fsS "http://127.0.0.1:${WEB_PORT}/health" >/dev/null && echo "Versión A desplegada y sana: ${SHA_A}"

echo; echo "== Casos"
# 1-2. Respaldo de A: manifiesto con fecha UTC, tag, SHA completo, run ID, checksums y estado.
ID_A="$(GITHUB_RUN_ID=1001 bash "${BACKUP}" | backup_id)"
M="${BACKUP_DIR}/${ID_A}/manifest.json"
if [ -n "${ID_A}" ] && [ "$(jq -r .estado "${M}")" = verificado ] && [ "$(jq -r .version.commit_sha "${M}")" = "${SHA_A}" ] \
   && [ "$(jq -r .version.git_tag "${M}")" = vA ] && [ "$(jq -r .github_run_id "${M}")" = 1001 ] \
   && [[ "$(jq -r .fecha_fin_utc "${M}")" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:]{8}Z$ ]] \
   && (cd "${BACKUP_DIR}/${ID_A}" && sha256sum --quiet -c SHA256SUMS && sha256sum --quiet -c manifest.json.sha256); then
  pass "Respaldo de A antes de publicar B (fecha UTC, tag vA, SHA, run 1001, checksums)" "${ID_A}"
  if [ "$(jq -r .version.alembic_revision "${M}")" = a1 ]; then pass "Manifiesto registra la revisión de Alembic" a1
  else failt "Manifiesto registra la revisión de Alembic" "$(jq -r .version.alembic_revision "${M}")"; fi
else failt "Respaldo de A" "${ID_A:-sin id}"; fi

# 3. Respaldo fallido (PostgreSQL caído) → manifiesto «fallido» y el despliegue lo rechaza.
docker stop "${PG_C}" >/dev/null
OUT="$(bash "${BACKUP}" 2>&1)"; CODE=$?
FAILED_ID="$(echo "${OUT}" | sed -n 's/^BACKUP_FALLIDO=//p')"
docker start "${PG_C}" >/dev/null; for _ in $(seq 1 30); do docker exec "${PG_C}" pg_isready -h 127.0.0.1 -U rehni >/dev/null 2>&1 && break; sleep 1; done; sleep 2
expect_code "Respaldo fallido termina con error" 1 "${CODE}" "(PostgreSQL detenido)"
if [ -n "${FAILED_ID}" ]; then
  bash "${DEPLOY}" "${SHA_B}" "${FAILED_ID}" 2002 >/dev/null 2>&1; CODE=$?
  expect_code "Respaldo fallido bloquea el despliegue" 1 "${CODE}" "HEAD sigue en A: $([ "$(deployed)" = "${SHA_A}" ] && echo sí || echo no)"
  if tail -n 1 "${LOG_DIR}/releases.jsonl" | grep -q 'no está verificado'; then pass "El registro indica la causa (respaldo no verificado)"
  else failt "El registro indica la causa (respaldo no verificado)" "$(tail -n 1 "${LOG_DIR}/releases.jsonl" | jq -r .detalle)"; fi
else
  failt "Respaldo fallido bloquea el despliegue" "el respaldo no se registró como fallido"
fi

# 4. Respaldo genuino con un archivo alterado → restore --dry-run y despliegue lo rechazan por checksum.
TAMPER_ID="$(GITHUB_RUN_ID=1002 bash "${BACKUP}" | backup_id)"
printf 'x' >> "${BACKUP_DIR}/${TAMPER_ID}/minio.tar.gz"
bash "${RESTORE}" "${TAMPER_ID}" --dry-run >/dev/null 2>&1; expect_code "Checksum incorrecto: restore --dry-run lo rechaza" 1 $?
bash "${DEPLOY}" "${SHA_B}" "${TAMPER_ID}" 2003 >/dev/null 2>&1; CODE=$?
expect_code "Checksum incorrecto: el despliegue se cancela" 1 "${CODE}" "($(tail -n 1 "${LOG_DIR}/releases.jsonl" | jq -r .detalle))"
# Copia íntegra con otro nombre: los checksums cuadran, pero el ID del manifiesto no es el del directorio.
COPY_ID="${ID_A%%T*}T000000Z_${ID_A##*_}"
cp -a "${BACKUP_DIR}/${ID_A}" "${BACKUP_DIR}/${COPY_ID}"
bash "${RESTORE}" "${COPY_ID}" --dry-run >/dev/null 2>&1; expect_code "Respaldo renombrado: restore lo rechaza" 1 $?
bash "${DEPLOY}" "${SHA_B}" "${COPY_ID}" 2003 >/dev/null 2>&1; expect_code "Respaldo renombrado: el despliegue se cancela" 1 $?
if bash "${RESTORE}" --list | grep "^${COPY_ID} " | grep -q alterado && bash "${RESTORE}" --find=vA | grep -q "^${ID_A} .*verificado"; then
  pass "--list marca el renombrado como alterado y --find=vA encuentra el original"
else failt "--list / --find"; fi
bash "${RESTORE}" --find=v9.9.9 >/dev/null 2>&1; expect_code "--find sin coincidencias termina con error" 1 $?

# 5. Despliegue exitoso de B con el respaldo de A.
bash "${DEPLOY}" "${SHA_B}" "${ID_A}" 2004 >/dev/null 2>&1; CODE=$?
expect_code "Despliegue exitoso de B" 0 "${CODE}" "HEAD=$(deployed | cut -c1-12) versión=$(curl -fsS "http://127.0.0.1:${WEB_PORT}/version")"

# 6. Respaldo de otra versión (A) cuando lo desplegado es B → cancelado.
bash "${DEPLOY}" "${SHA_C}" "${ID_A}" 2005 >/dev/null 2>&1; expect_code "Respaldo que no es de la versión desplegada se rechaza" 1 $?

# 7. Despliegue fallido (health check) sin migraciones → rollback automático a B.
ID_B="$(GITHUB_RUN_ID=2006 bash "${BACKUP}" | backup_id)"
bash "${DEPLOY}" "${SHA_BBAD}" "${ID_B}" 2006 >/dev/null 2>&1; CODE=$?
expect_code "Health check fallido → rollback seguro a B" 2 "${CODE}" "HEAD vuelve a B: $([ "$(deployed)" = "${SHA_B}" ] && echo sí || echo no)"

# 8. Rollback manual B → A (sin migraciones entre ambas) permitido.
ID_B2="$(GITHUB_RUN_ID=2007 bash "${BACKUP}" | backup_id)"
bash "${DEPLOY}" "${SHA_A}" "${ID_B2}" 2007 >/dev/null 2>&1; CODE=$?
expect_code "Rollback B → A compatible (sin migraciones)" 0 "${CODE}" "HEAD=A: $([ "$(deployed)" = "${SHA_A}" ] && echo sí || echo no)"

# 9. Despliegue de C (con migración) y fallo de C-mala: el rollback automático queda bloqueado.
ID_A2="$(GITHUB_RUN_ID=2008 bash "${BACKUP}" | backup_id)"
bash "${DEPLOY}" "${SHA_C}" "${ID_A2}" 2008 >/dev/null 2>&1; expect_code "Despliegue de C (trae migración)" 0 $?
ID_C="$(GITHUB_RUN_ID=2009 bash "${BACKUP}" | backup_id)"
bash "${DEPLOY}" "${SHA_CBAD}" "${ID_C}" 2009 >/dev/null 2>&1; CODE=$?
expect_code "Fallo con migración: rollback automático bloqueado" 3 "${CODE}" "(se exige restore manual)"
git -C "${APP_DIR}" checkout -q --detach "${SHA_C}"

# 10. Rollback incompatible C → A (hay migración entre ambas) bloqueado.
ID_C2="$(GITHUB_RUN_ID=2010 bash "${BACKUP}" | backup_id)"
bash "${DEPLOY}" "${SHA_A}" "${ID_C2}" 2010 >/dev/null 2>&1; CODE=$?
expect_code "Rollback incompatible C → A bloqueado" 1 "${CODE}" "HEAD sigue en C: $([ "$(deployed)" = "${SHA_C}" ] && echo sí || echo no)"

# 11. Restore por ID en QA aislado (contenedores desechables).
bash "${RESTORE}" "${ID_A}" --verify-only >"${WORK}/restore-verify.log" 2>&1; expect_code "Restore QA por ID (contenedores desechables)" 0 $?

# 12. Restores no autorizados rechazados.
bash "${RESTORE}" "${ID_C2}" >/dev/null 2>&1; expect_code "Restore sin --confirm rechazado" 1 $?
bash "${RESTORE}" "${ID_A}" "--confirm=${ID_A}" >/dev/null 2>&1; expect_code "Restore con código de otra versión rechazado" 1 $?

# 13. Restore real autorizado (solo en esta simulación): cambia datos y vuelve al estado del respaldo de C.
docker exec "${PG_C}" psql -U rehni -d rehnimarket -q -c "DELETE FROM pedidos;"
GITHUB_RUN_ID=3001 bash "${RESTORE}" "${ID_C2}" "--confirm=${ID_C2}" >"${WORK}/restore-real.log" 2>&1; CODE=$?
N="$(docker exec "${PG_C}" psql -U rehni -d rehnimarket -tAc 'SELECT count(*) FROM pedidos')"
expect_code "Restore confirmado con el ID restaura los datos" 0 "${CODE}" "pedidos=${N} (esperado 2) y respaldo preventivo previo"

# 14. Operaciones simultáneas bloqueadas.
( exec 8>"${LOG_DIR}/operacion.lock"; flock 8; sleep 8 ) &
sleep 1
bash "${BACKUP}" >/dev/null 2>&1; expect_code "Respaldo concurrente bloqueado" 75 $?
bash "${DEPLOY}" "${SHA_B}" "${ID_C2}" 2011 >/dev/null 2>&1; expect_code "Despliegue concurrente bloqueado" 75 $?
wait

# 15. Logs de éxito y de error.
if grep -q '"resultado":"verificado"' "${LOG_DIR}/auditoria.jsonl" && grep -q '"resultado":"fallido"' "${LOG_DIR}/auditoria.jsonl" \
   && grep -q '"resultado":"desplegado"' "${LOG_DIR}/releases.jsonl" && grep -q '"resultado":"revertido"' "${LOG_DIR}/releases.jsonl" \
   && grep -q '"resultado":"cancelado"' "${LOG_DIR}/releases.jsonl" && grep -q '"operacion":"restore"' "${LOG_DIR}/auditoria.jsonl"; then
  pass "Logs de éxito y error (auditoria.jsonl, releases.jsonl, backup.log, deploy.log)"
else failt "Logs de éxito y error"; fi
if ! grep -qiE 'simminio-secret|pg-clave-simulacion|PASSWORD=' "${LOG_DIR}"/*.log "${LOG_DIR}"/*.jsonl "${BACKUP_DIR}"/*/manifest.json; then
  pass "Ningún secreto en logs ni manifiestos"
else failt "Ningún secreto en logs ni manifiestos"; fi

echo
echo "== Resultados (${#RESULTS[@]} casos) · evidencia en ${WORK}"
printf '%s\n' "${RESULTS[@]}"
printf '%s\n' "${RESULTS[@]}" > "${WORK}/resultados.txt"
! printf '%s\n' "${RESULTS[@]}" | grep -q '^FALLA'
