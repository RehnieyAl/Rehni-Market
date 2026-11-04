#!/usr/bin/env bash
# Prueba de humo de RehniMarket contra una URL base (VM, servidor o nube).
# Solo HTTP: sin docker exec, sin registrar usuarios y sin enviar correos.
#
# Uso:
#   BASE_URL=https://api.<dominio> SMOKE_EMAIL=... SMOKE_PASSWORD=... bash scripts/smoke-test.sh
#   FRONTEND_URL=https://<dominio> ... bash scripts/smoke-test.sh     # comprueba también el frontend
#
# Variables:
#   BASE_URL        URL base de la API, sin barra final (obligatoria)
#   SMOKE_EMAIL     correo de una cuenta de prueba YA VERIFICADA (obligatoria)
#   SMOKE_PASSWORD  contraseña de esa cuenta (obligatoria). Nunca se escribe en el repo
#                   ni se imprime: pásala por el entorno (p. ej. `read -rs SMOKE_PASSWORD`).
#   FRONTEND_URL    URL del frontend (opcional)
#   TIMEOUT         segundos por petición (opcional, por defecto 15)
#
# Por qué la cuenta debe estar verificada: si no lo está, el backend responde
# EMAIL_NOT_VERIFIED y ENVÍA un correo con un código (LoginService.py). El script lo
# detecta y lo marca como fallo. La comprobación de credenciales incorrectas usa un
# correo del dominio reservado example.com que no existe: el backend responde antes
# de llegar a cualquier envío.
#
# Requiere curl y python3 (para leer JSON). Sale con 0 si todo pasa y con 1 si algo falla.

set -uo pipefail

BASE_URL="${BASE_URL:-}"
FRONTEND_URL="${FRONTEND_URL:-}"
TIMEOUT="${TIMEOUT:-15}"
BASE_URL="${BASE_URL%/}"
FRONTEND_URL="${FRONTEND_URL%/}"

if [ -z "$BASE_URL" ]; then
  echo "Uso: BASE_URL=<url-api> SMOKE_EMAIL=<correo> SMOKE_PASSWORD=<clave> bash $0" >&2
  exit 2
fi
command -v curl >/dev/null || { echo "curl no disponible" >&2; exit 2; }
command -v python3 >/dev/null || { echo "python3 no disponible" >&2; exit 2; }

PASSED=0; FAILED=0
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
ok(){ PASSED=$((PASSED+1)); echo "  [PASA]  $1"; }
ko(){ FAILED=$((FAILED+1)); echo "  [FALLA] $1"; }

# jget <ruta.con.puntos> < archivo.json  → valor o vacío
jget(){ python3 -c '
import sys, json
try:
    v = json.load(sys.stdin)
    for k in sys.argv[1].split("."):
        v = v[int(k)] if k.lstrip("-").isdigit() else v[k]
    print(v)
except Exception:
    print("")' "$1"; }

# req <salida> <método> <url> [args curl...]  → imprime el código HTTP
req(){ local out="$1" m="$2" u="$3"; shift 3
  curl -s -o "$out" -w '%{http_code}' --max-time "$TIMEOUT" -X "$m" "$u" "$@" 2>/dev/null || echo "000"; }

# Ni el correo ni la contraseña se imprimen: solo si la variable está definida.
mask(){ [ -n "$1" ] && echo "(definido)" || echo "(vacío)"; }

echo "# Prueba de humo — RehniMarket"
echo "# $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "# BASE_URL=$BASE_URL${FRONTEND_URL:+   FRONTEND_URL=$FRONTEND_URL}   SMOKE_EMAIL=$(mask "${SMOKE_EMAIL:-}")"
echo "------------------------------------------------------------"

echo "1. Salud de la API y de la base de datos"
code=$(req "$TMP/h" GET "$BASE_URL/health/database")
db=$(jget 'Base de datos' < "$TMP/h")
{ [ "$code" = "200" ] && [ "$db" = "OK" ]; } && ok "GET /health/database -> 200 (Base de datos: OK)" \
  || ko "GET /health/database -> $code $(head -c 200 "$TMP/h")"

echo "2. Catálogo público sin sesión"
code=$(req "$TMP/c" GET "$BASE_URL/public/products?limit=1")
total=$(jget 'total' < "$TMP/c")
{ [ "$code" = "200" ] && [ -n "$total" ]; } && ok "GET /public/products?limit=1 -> 200 (total=$total)" \
  || ko "GET /public/products?limit=1 -> $code"

echo "3. Ruta protegida sin token"
code=$(req "$TMP/p" GET "$BASE_URL/cart")
[ "$code" = "401" ] && ok "GET /cart sin token -> 401" || ko "GET /cart sin token -> $code (esperado 401)"

echo "4. Login con credenciales incorrectas (correo inexistente @example.com)"
code=$(req "$TMP/l0" POST "$BASE_URL/auth/login-user" -H 'Content-Type: application/json' \
  -d '{"email":"smoke-no-existe@example.com","password":"ClaveIncorrecta9"}')
c=$(jget 'detail.code' < "$TMP/l0")
{ [ "$code" = "400" ] || [ "$code" = "401" ]; } && ok "POST /auth/login-user -> $code ${c}" \
  || ko "POST /auth/login-user (credenciales malas) -> $code ${c}"

echo "5. Login con la cuenta de prueba"
TOKEN=""
if [ -z "${SMOKE_EMAIL:-}" ] || [ -z "${SMOKE_PASSWORD:-}" ]; then
  ko "SMOKE_EMAIL y SMOKE_PASSWORD son obligatorias (no se probó el login)"
else
  body=$(SMOKE_EMAIL="$SMOKE_EMAIL" SMOKE_PASSWORD="$SMOKE_PASSWORD" python3 -c \
    'import json,os; print(json.dumps({"email": os.environ["SMOKE_EMAIL"], "password": os.environ["SMOKE_PASSWORD"]}))')
  code=$(req "$TMP/l1" POST "$BASE_URL/auth/login-user" -H 'Content-Type: application/json' --data-binary @- <<<"$body")
  TOKEN=$(jget 'access_token' < "$TMP/l1"); role=$(jget 'role' < "$TMP/l1"); c=$(jget 'detail.code' < "$TMP/l1")
  if [ "$code" = "200" ] && [ -n "$TOKEN" ]; then
    ok "POST /auth/login-user -> 200 con access_token (rol: $role)"
  elif [ "$c" = "EMAIL_NOT_VERIFIED" ]; then
    ko "la cuenta de prueba no está verificada (EMAIL_NOT_VERIFIED): el backend acaba de enviarle un código; usa una cuenta verificada"
  else
    ko "POST /auth/login-user -> $code ${c}"
  fi
fi

echo "6. Perfil con el token"
if [ -n "$TOKEN" ]; then
  code=$(req "$TMP/m" GET "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN")
  me=$(jget 'email' < "$TMP/m")
  { [ "$code" = "200" ] && [ "${me,,}" = "${SMOKE_EMAIL,,}" ]; } && ok "GET /auth/me -> 200 (correo coincide)" \
    || ko "GET /auth/me -> $code"
else
  ko "GET /auth/me no se ejecutó (sin token)"
fi

if [ -n "$FRONTEND_URL" ]; then
  echo "7. Frontend"
  code=$(req "$TMP/f" GET "$FRONTEND_URL/")
  [ "$code" = "200" ] && ok "GET $FRONTEND_URL/ -> 200" || ko "GET $FRONTEND_URL/ -> $code"
fi

echo "------------------------------------------------------------"
echo "RESULTADO: $PASSED pasan, $FAILED fallan"
[ "$FAILED" -eq 0 ]
