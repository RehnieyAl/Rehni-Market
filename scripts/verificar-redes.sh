#!/usr/bin/env bash
# Verificación de la segmentación de redes de docker-compose.yml (edge / data).
#
#   edge 172.30.0.0/24 : frontend (Caddy, 172.30.0.10) y backend
#   data 172.30.1.0/24 : backend, pgbouncer, postgres y minio
#   postgres-test      : red default del proyecto, sin ningún otro servicio
#
# POSITIVAS: los caminos que la aplicación usa deben funcionar, también tras reiniciar
#            el backend (Caddy reintenta, caddy/Caddyfile).
# NEGATIVAS: los que no usa deben FALLAR (eso prueba el aislamiento).
# Reinicia el contenedor backend una vez (prueba de resiliencia): no correr en producción
# con tráfico real.
#
# Uso (desde la raíz del repo, con el stack arriba: docker compose up -d --wait):
#   bash scripts/verificar-redes.sh
#   bash scripts/verificar-redes.sh | tee docs/evidencias/verificacion-redes-$(date +%F).txt
#
# Variables opcionales:
#   ENV_FILE        .env del que se leen SITE_ADDRESS, API_ADDRESS, HTTPS_PORT y POSTGRES_PORT (./.env)
#   CURL_INSECURE=1 no valida el certificado (si la CA local de Caddy no está instalada en el host)
#   TIMEOUT         segundos por prueba de red (5)
#   RESTART_WAIT    segundos máximos para que el sitio vuelva tras reiniciar el backend (90)
#
# Solo usa herramientas que ya traen las imágenes: busybox (nc, getent, wget) en Caddy,
# python3 + el venv del backend (psycopg2, minio), psql en pgbouncer, mc en minio.
# En el host: docker, curl, python3 y ss (opcional).
# Sale con 0 si todo pasa y con 1 si alguna prueba falla. No imprime credenciales.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 2

ENV_FILE="${ENV_FILE:-./.env}"
TIMEOUT="${TIMEOUT:-5}"
RESTART_WAIT="${RESTART_WAIT:-90}"

FRONTEND=rehni-frontend
BACKEND=rehni-backend
PGBOUNCER=pgbouncer_pool
POSTGRES=rehni-postgres
MINIO=rehni-minio
CADDY_IP=172.30.0.10

# Lee una variable del .env sin ejecutarlo (puede tener secretos con caracteres especiales).
envval(){ local v=""
  [ -f "$ENV_FILE" ] && v="$(grep -E "^$1=" "$ENV_FILE" | tail -n1 | cut -d= -f2- | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/')"
  printf '%s' "${v:-$2}"; }

SITE_ADDRESS="$(envval SITE_ADDRESS localhost)"
API_ADDRESS="$(envval API_ADDRESS api.localhost)"
HTTPS_PORT="$(envval HTTPS_PORT 443)"
POSTGRES_PORT="$(envval POSTGRES_PORT 5433)"
BACKEND_PORT="$(envval BACKEND_PORT 8000)"
PORT_SUFFIX=""; [ "$HTTPS_PORT" != "443" ] && PORT_SUFFIX=":$HTTPS_PORT"
SITE_URL="https://${SITE_ADDRESS}${PORT_SUFFIX}"
API_URL="https://${API_ADDRESS}${PORT_SUFFIX}"
CURL_BODY=(curl -s --max-time 15)
[ "${CURL_INSECURE:-0}" = "1" ] && CURL_BODY+=(-k)
CURL=("${CURL_BODY[@]}" -o /dev/null)

PASSED=0; FAILED=0
ok(){ PASSED=$((PASSED+1)); printf '  ✅ %s\n' "$1"; }
ko(){ FAILED=$((FAILED+1)); printf '  ❌ %s\n' "$1"; }
# check <descripción> <comando...>: pasa si el comando sale con 0
check(){ local d="$1"; shift; if "$@" >/dev/null 2>&1; then ok "$d"; else ko "$d"; fi; }
# deny <descripción> <comando...>: pasa si el comando FALLA (prueba negativa)
deny(){ local d="$1"; shift; if "$@" >/dev/null 2>&1; then ko "$d"; else ok "$d"; fi; }

for t in docker curl python3; do command -v "$t" >/dev/null || { echo "Falta $t en el host" >&2; exit 2; }; done
for c in "$FRONTEND" "$BACKEND" "$PGBOUNCER" "$POSTGRES" "$MINIO"; do
  [ "$(docker inspect -f '{{.State.Running}}' "$c" 2>/dev/null)" = "true" ] \
    || { echo "El contenedor $c no está corriendo: docker compose up -d --wait" >&2; exit 2; }
done

nets(){ docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$1" | tr ' ' '\n' | sed -E 's/^.*_//' | grep -v '^$' | sort | tr '\n' ' ' | sed 's/ $//'; }
ip_in(){ docker inspect -f "{{with index .NetworkSettings.Networks \"$2\"}}{{.IPAddress}}{{end}}" "$1"; }
PROJECT="$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' "$POSTGRES")"
PG_IP="$(ip_in "$POSTGRES" "${PROJECT}_data")"
PGB_IP="$(ip_in "$PGBOUNCER" "${PROJECT}_data")"
MINIO_IP="$(ip_in "$MINIO" "${PROJECT}_data")"
EDGE_GW="$(docker network inspect -f '{{range .IPAM.Config}}{{.Gateway}}{{end}}' "${PROJECT}_edge" 2>/dev/null)"

echo "Verificación de redes · $(date '+%Y-%m-%d %H:%M:%S %Z') · $(hostname)"
echo "Sitio: ${SITE_URL}   API: ${API_URL}   Postgres en el host: 127.0.0.1:${POSTGRES_PORT}"
echo
echo "Redes por servicio:"
for c in "$FRONTEND" "$BACKEND" "$PGBOUNCER" "$POSTGRES" "$MINIO"; do
  printf '  %-16s %s\n' "$c" "$(nets "$c")"
done
echo

echo "Topología esperada"
check "frontend (Caddy) solo en edge"                       test "$(nets "$FRONTEND")" = "edge"
check "backend en edge y data"                              test "$(nets "$BACKEND")" = "data edge"
check "pgbouncer solo en data"                              test "$(nets "$PGBOUNCER")" = "data"
check "postgres solo en data"                               test "$(nets "$POSTGRES")" = "data"
check "minio solo en data"                                  test "$(nets "$MINIO")" = "data"
check "Caddy conserva la IP fija ${CADDY_IP} en edge"       test "$(ip_in "$FRONTEND" "${PROJECT}_edge")" = "$CADDY_IP"
check "backend confía solo en Caddy (FORWARDED_ALLOW_IPS=${CADDY_IP})" \
  test "$(docker exec "$BACKEND" sh -c 'printf %s "$FORWARDED_ALLOW_IPS"')" = "$CADDY_IP"
echo

echo "POSITIVAS (deben pasar)"
check "Host → Caddy: ${SITE_URL}/ responde 200" \
  test "$("${CURL[@]}" -w '%{http_code}' "${SITE_URL}/")" = "200"
check "Caddy → backend: ${API_URL}/health/database responde 200" \
  test "$("${CURL[@]}" -w '%{http_code}' "${API_URL}/health/database")" = "200"

# Caddy no hace proxy a MinIO (caddy/Caddyfile): las imágenes llegan por el backend.
IMG_PATH="$(docker exec "$POSTGRES" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT url FROM product_variant_images ORDER BY id LIMIT 1"' 2>/dev/null | tr -d '[:space:]')"
if [ -n "$IMG_PATH" ]; then
  IMG_RES="$("${CURL[@]}" -w '%{http_code} %{content_type}' "${API_URL}/media/proxy?path=${IMG_PATH}")"
  check "Caddy → backend → MinIO: imagen de producto por /media/proxy (${IMG_PATH}) → ${IMG_RES}" \
    sh -c "case '$IMG_RES' in '200 image/'*) exit 0;; *) exit 1;; esac"
else
  ko "Caddy → backend → MinIO: no hay imágenes de producto en la base de datos"
fi

check "Backend → PgBouncer → Postgres: SELECT 1 por URL_DATABASE_POOLED (pgbouncer:6432)" \
  docker exec -i "$BACKEND" /app/.venv/bin/python - <<'PY'
import os, psycopg2
url = os.environ["URL_DATABASE_POOLED"]
assert "@pgbouncer:6432/" in url, "URL_DATABASE_POOLED no apunta a pgbouncer:6432"
with psycopg2.connect(url, connect_timeout=5) as conn, conn.cursor() as cur:
    cur.execute("SELECT 1")
    assert cur.fetchone()[0] == 1
PY

check "Backend → Postgres: SELECT 1 por URL_DATABASE (postgres:5432, la que usa Alembic)" \
  docker exec -i "$BACKEND" /app/.venv/bin/python - <<'PY'
import os, psycopg2
with psycopg2.connect(os.environ["URL_DATABASE"], connect_timeout=5) as conn, conn.cursor() as cur:
    cur.execute("SELECT 1")
    assert cur.fetchone()[0] == 1
PY

check "Backend → MinIO: conexión TCP a minio:9000" \
  docker exec "$BACKEND" python3 -c "import socket; socket.create_connection(('minio', 9000), timeout=$TIMEOUT).close()"

check "Backend → MinIO: listado del bucket uploads" \
  docker exec -i "$BACKEND" /app/.venv/bin/python - <<'PY'
import os
from minio import Minio
c = Minio(os.environ.get("MINIO_URL") or "minio:9000",
          access_key=os.environ["MINIO_ROOT_USER"], secret_key=os.environ["MINIO_ROOT_PASSWORD"], secure=False)
assert c.bucket_exists("uploads")
assert next(iter(c.list_objects("uploads", recursive=True)), None) is not None, "bucket vacío"
PY

check "MinIO: el bucket uploads existe (mc ls desde el contenedor minio)" \
  docker exec "$MINIO" sh -c 'MC_HOST_local="http://$MINIO_ROOT_USER:$MINIO_ROOT_PASSWORD@localhost:9000" mc ls local/uploads >/dev/null'

check "PgBouncer → Postgres: healthcheck del contenedor pgbouncer = healthy" \
  test "$(docker inspect -f '{{.State.Health.Status}}' "$PGBOUNCER")" = "healthy"
check "PgBouncer → Postgres: SELECT 1 a través del pool (psql -h 127.0.0.1 -p 6432)" \
  docker exec "$PGBOUNCER" sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 6432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT 1" | grep -qx 1'
check "PgBouncer → Postgres: SELECT 1 directo a postgres:5432 por la red data" \
  docker exec "$PGBOUNCER" sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT 1" | grep -qx 1'

# SSLRequest del protocolo de Postgres: el servidor contesta 'S' o 'N'. Prueba que en
# 127.0.0.1:POSTGRES_PORT hay un Postgres, no solo un puerto abierto.
check "Host → Postgres: 127.0.0.1:${POSTGRES_PORT} acepta conexión (DbSchema / túnel SSH)" \
  python3 - "$POSTGRES_PORT" "$TIMEOUT" <<'PY'
import socket, struct, sys
s = socket.create_connection(("127.0.0.1", int(sys.argv[1])), timeout=float(sys.argv[2]))
s.sendall(struct.pack("!ii", 8, 80877103))
assert s.recv(1) in (b"S", b"N")
s.close()
PY

# Resiliencia (#48): con el backend reiniciando, Caddy retiene las peticiones (lb_try_duration)
# en lugar de responder 502, y el sitio vuelve sin intervención.
RESTART_LOG="$(mktemp)"
( end=$((SECONDS + RESTART_WAIT)); while [ "$SECONDS" -lt "$end" ]; do
    "${CURL[@]}" -w '%{http_code}\n' "${API_URL}/health/database" >>"$RESTART_LOG"; sleep 0.5
  done ) &
PROBE=$!
sleep 1
docker compose restart backend >/dev/null 2>&1
RECOVERED=""
for _ in $(seq 1 "$RESTART_WAIT"); do
  if [ "$(docker inspect -f '{{.State.Health.Status}}' "$BACKEND")" = "healthy" ] \
     && [ "$("${CURL[@]}" -w '%{http_code}' "${API_URL}/health/database")" = "200" ]; then
    RECOVERED=1; break
  fi
  sleep 1
done
kill "$PROBE" 2>/dev/null; wait "$PROBE" 2>/dev/null
CODES="$(sort "$RESTART_LOG" | uniq -c | awk '{printf "%s×%s ", $1, $2}')"
rm -f "$RESTART_LOG"
check "Resiliencia: tras docker compose restart backend, la API vuelve sola (healthy + 200)" test -n "$RECOVERED"
check "Resiliencia: el sitio ${SITE_URL}/ sigue en 200 después del reinicio" \
  test "$("${CURL[@]}" -w '%{http_code}' "${SITE_URL}/")" = "200"
check "Resiliencia: ningún 502/503/504 por Caddy durante el reinicio (sondeo cada 0,5 s: ${CODES% })" \
  sh -c "! printf '%s' '$CODES' | grep -qE '×(502|503|504)'"
echo

echo "NEGATIVAS (deben fallar: eso prueba el aislamiento)"
deny "Caddy → postgres: el nombre no resuelve"              docker exec "$FRONTEND" getent hosts postgres
deny "Caddy → pgbouncer: el nombre no resuelve"             docker exec "$FRONTEND" getent hosts pgbouncer
deny "Caddy → minio: el nombre no resuelve"                 docker exec "$FRONTEND" getent hosts minio
deny "Caddy → postgres:5432 no conecta"                     docker exec "$FRONTEND" nc -z -w "$TIMEOUT" postgres 5432
deny "Caddy → pgbouncer:6432 no conecta"                    docker exec "$FRONTEND" nc -z -w "$TIMEOUT" pgbouncer 6432
deny "Caddy → postgres por IP (${PG_IP:-?}:5432) no conecta"     docker exec "$FRONTEND" nc -z -w "$TIMEOUT" "${PG_IP:-0.0.0.0}" 5432
deny "Caddy → pgbouncer por IP (${PGB_IP:-?}:6432) no conecta"   docker exec "$FRONTEND" nc -z -w "$TIMEOUT" "${PGB_IP:-0.0.0.0}" 6432
deny "Caddy → minio por IP (${MINIO_IP:-?}:9000) no conecta"     docker exec "$FRONTEND" nc -z -w "$TIMEOUT" "${MINIO_IP:-0.0.0.0}" 9000
deny "Caddy → minio:9001 (consola) no conecta"              docker exec "$FRONTEND" nc -z -w "$TIMEOUT" minio 9001
deny "Caddy → minio por IP (${MINIO_IP:-?}:9001, consola) no conecta" docker exec "$FRONTEND" nc -z -w "$TIMEOUT" "${MINIO_IP:-0.0.0.0}" 9001
deny "Caddy → pasarela de edge (${EDGE_GW:-?}:${POSTGRES_PORT}) no llega al Postgres publicado" \
  docker exec "$FRONTEND" nc -z -w "$TIMEOUT" "${EDGE_GW:-0.0.0.0}" "$POSTGRES_PORT"

deny "Host → consola de MinIO: 127.0.0.1:9001 no responde"    curl -s --max-time "$TIMEOUT" -o /dev/null http://127.0.0.1:9001/
deny "Host → API S3 de MinIO: 127.0.0.1:9000 no responde"   curl -s --max-time "$TIMEOUT" -o /dev/null http://127.0.0.1:9000/

# Por Caddy: ni la raíz ni rutas típicas de MinIO devuelven un listado S3
# (ListAllMyBucketsResult / ListBucketResult) ni la consola.
MINIO_LEAK=""
for url in "${SITE_URL}" "${API_URL}"; do
  for path in / /uploads /uploads/ "/uploads?list-type=2" /minio/ /minio/health/live /browser /api/v1/login; do
    body="$("${CURL_BODY[@]}" "${url}${path}" | head -c 20000)"
    printf '%s' "$body" | grep -qE 'ListAllMyBucketsResult|ListBucketResult|MinIO Console|<title>MinIO' \
      && MINIO_LEAK+="${url}${path} "
  done
done
check "Desde afuera: ninguna ruta de Caddy lista buckets ni abre la consola de MinIO${MINIO_LEAK:+ (fuga: ${MINIO_LEAK% })}" \
  test -z "$MINIO_LEAK"

PG_PUBLISHED="$(docker port "$POSTGRES" 5432/tcp 2>/dev/null | tr '\n' ' ')"
check "Postgres solo publicado en 127.0.0.1 (docker port: ${PG_PUBLISHED:-ninguno})" \
  sh -c "[ -n '$PG_PUBLISHED' ] && ! printf '%s' '$PG_PUBLISHED' | grep -qvE '^(127\.0\.0\.1:[0-9]+ ?)+$'"
if command -v ss >/dev/null; then
  deny "Postgres no escucha en 0.0.0.0/[::]:${POSTGRES_PORT} (ss -tln)" \
    sh -c "ss -tlnH | awk '{print \$4}' | grep -qE '^(0\.0\.0\.0|\*|\[::\]):${POSTGRES_PORT}\$'"
fi
check "pgbouncer y minio sin puertos publicados en el host" \
  test -z "$(docker port "$PGBOUNCER")$(docker port "$MINIO")"
BE_PUBLISHED="$(docker port "$BACKEND" 8000/tcp 2>/dev/null | tr '\n' ' ')"
check "backend sin publicar en 0.0.0.0/[::] (docker port: ${BE_PUBLISHED:-ninguno})" \
  sh -c "! printf '%s' '$BE_PUBLISHED' | grep -qE '(0\.0\.0\.0|\[::\]):'"
if command -v ss >/dev/null; then
  deny "Nada escucha en 0.0.0.0/[::] en ${BACKEND_PORT}, 6432, 9000 ni 9001 del host (ss -tln)" \
    sh -c "ss -tlnH | awk '{print \$4}' | grep -qE '^(0\.0\.0\.0|\*|\[::\]):(${BACKEND_PORT}|6432|9000|9001)\$'"
fi
check "Solo frontend (Caddy) publica puertos fuera de 127.0.0.1" \
  sh -c "[ -z \"\$(for c in $BACKEND $PGBOUNCER $POSTGRES $MINIO; do docker port \$c; done | grep -vE '^[0-9/a-z]+ -> 127\.0\.0\.1:')\" ]"

TEST_PG="$(docker ps -q --filter "label=com.docker.compose.project=${PROJECT}" --filter 'label=com.docker.compose.service=postgres-test')"
if [ -n "$TEST_PG" ]; then
  check "postgres-test aislado: solo en la red default y sin otros contenedores" \
    sh -c "[ \"\$(docker inspect -f '{{range \$k,\$v := .NetworkSettings.Networks}}{{\$k}} {{end}}' $TEST_PG)\" = '${PROJECT}_default ' ] && [ \"\$(docker network inspect -f '{{len .Containers}}' ${PROJECT}_default)\" = 1 ]"
  deny "Backend → postgres-test: el nombre no resuelve"     docker exec "$BACKEND" getent hosts postgres-test
else
  echo "  (postgres-test no está corriendo: se omiten sus pruebas)"
fi

echo
echo "Resultado: ${PASSED} pasan, ${FAILED} fallan"
[ "$FAILED" -eq 0 ]
