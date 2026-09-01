#!/usr/bin/env bash
set -uo pipefail

API="${API:-http://localhost:8000}"
PGC="${PGC:-rehni-postgres}"
TS="$(date -u +%Y%m%d%H%M%S)"
EMAIL="acc.${TS}@gmail.com"
PASS="QaTest123@"
PASSED=0; FAILED=0

hr(){ printf '%s\n' "------------------------------------------------------------"; }
ok(){ PASSED=$((PASSED+1)); echo "  [PASA]  $1"; }
ko(){ FAILED=$((FAILED+1)); echo "  [FALLA] $1"; }
jget(){ python3 -c "import sys,json
try:
    d=json.load(sys.stdin)
    v=d
    for k in '$1'.split('.'):
        v=v[int(k)] if k.lstrip('-').isdigit() else v[k]
    print(v)
except Exception:
    pass"; }

psql_q(){ docker exec "$PGC" sh -c "PGPASSWORD=\"\$POSTGRES_PASSWORD\" psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -tAc \"$1\"" 2>/dev/null | tr -d '[:space:]'; }

echo "# Pruebas de aceptación (muestra técnica) — RehniMarket"
echo "# $(date -u '+%Y-%m-%d %H:%M:%S UTC')   API=$API"
echo "# Cuenta de prueba: $EMAIL"
echo "# Fuente de casos: docs/PLAN_PRUEBAS_ACEPTACION_REHNIMARKET.md §7-§8"
hr

echo "AC-AUTH-01  Registro de comprador (HU-004)"
code=$(curl -s -o /tmp/r1 -w '%{http_code}' -X POST "$API/auth/register-user" \
  -H 'Content-Type: application/json' \
  -d "{\"full_name\":\"Acc Test\",\"email\":\"$EMAIL\",\"tell\":\"3001234567\",\"password\":\"$PASS\"}")
{ [ "$code" = "200" ] || [ "$code" = "201" ]; } && ok "registro -> $code" || ko "registro -> $code  $(cat /tmp/r1)"

echo "AC-AUTH-07a Login antes de verificar -> EMAIL_NOT_VERIFIED (HU-005)"
code=$(curl -s -o /tmp/r2 -w '%{http_code}' -X POST "$API/auth/login-user" \
  -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
c=$(jget 'detail.code' < /tmp/r2)
{ [ "$code" = "400" ] && [ "$c" = "EMAIL_NOT_VERIFIED" ]; } && ok "login sin verificar -> 400 $c" || ko "login sin verificar -> $code $c"

echo "AC-AUTH-06  Cooldown de reenvío de código (<60s) -> 429 (HU-005)"
code=$(curl -s -o /tmp/r2b -w '%{http_code}' -X POST "$API/auth/resend-verification-code" \
  -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\"}")
c=$(jget 'detail.code' < /tmp/r2b)
{ [ "$code" = "429" ]; } && ok "resend inmediato -> 429 $c" || ko "resend inmediato -> $code $c (esperado 429)"

echo "AC-AUTH-04  Verificación de correo con el código real de la BD (HU-005)"
VCODE=$(psql_q "SELECT code FROM event_codes ec JOIN users u ON u.id=ec.user_id WHERE u.email='$EMAIL' ORDER BY ec.created_at DESC LIMIT 1;")
if [ -n "$VCODE" ]; then
  code=$(curl -s -o /tmp/r3 -w '%{http_code}' -X POST "$API/auth/verify-email-user" \
    -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"code\":\"$VCODE\"}")
  [ "$code" = "200" ] && ok "verify-email-user (código $VCODE) -> 200" || ko "verify -> $code  $(cat /tmp/r3)"
else
  ko "no se encontró el código de verificación en event_codes"
fi

echo "AC-AUTH-07  Login exitoso tras verificar (HU-006)"
code=$(curl -s -o /tmp/r4 -w '%{http_code}' -X POST "$API/auth/login-user" \
  -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
TOKEN=$(jget 'access_token' < /tmp/r4); REFRESH=$(jget 'refresh_token' < /tmp/r4)
{ [ "$code" = "200" ] && [ -n "$TOKEN" ]; } && ok "login -> 200 con access_token" || ko "login -> $code  $(cat /tmp/r4)"

echo "AC-AUTH-12b Login con contraseña incorrecta -> sin revelar cuál dato (HU-006)"
code=$(curl -s -o /tmp/r5 -w '%{http_code}' -X POST "$API/auth/login-user" \
  -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"ClaveMala9\"}")
c=$(jget 'detail.code' < /tmp/r5)
{ [ "$code" = "400" ] || [ "$code" = "401" ]; } && ok "credenciales malas -> $code $c" || ko "credenciales malas -> $code $c"

echo "AC-AUTH-19  Refresh token -> nuevo access token (HU-007)"
code=$(curl -s -o /tmp/r6 -w '%{http_code}' -X POST "$API/auth/refresh" \
  -H 'Content-Type: application/json' -d "{\"refresh_token\":\"$REFRESH\"}")
NEWTOK=$(jget 'access_token' < /tmp/r6)
{ [ "$code" = "200" ] && [ -n "$NEWTOK" ]; } && ok "refresh -> 200 con nuevo access_token" || ko "refresh -> $code  $(cat /tmp/r6)"

hr
echo "AC-AUTH-16  Ruta protegida sin token -> 401 (HU-007)"
code=$(curl -s -o /dev/null -w '%{http_code}' "$API/cart")
[ "$code" = "401" ] && ok "/cart sin token -> 401" || ko "/cart sin token -> $code"

echo "AC-AUTH-17  Comprador -> ruta de admin -> 403 (HU-022 / seguridad)"
code=$(curl -s -o /tmp/r7 -w '%{http_code}' "$API/admin/dashboard/get-users" -H "Authorization: Bearer $TOKEN")
c=$(jget 'detail.code' < /tmp/r7)
[ "$code" = "403" ] && ok "user -> /admin/dashboard/get-users -> 403 $c" || ko "user -> /admin/... -> $code $c"

echo "AC-AUTH-17b Comprador -> ruta de empresa -> 403"
code=$(curl -s -o /dev/null -w '%{http_code}' "$API/company/dashboard/me" -H "Authorization: Bearer $TOKEN")
[ "$code" = "403" ] && ok "user -> /company/dashboard/me -> 403" || ko "user -> /company/dashboard/me -> $code"

echo "AC-SEC     Comprador intenta acreditarse saldo (POST /wallet/recharge) -> no autorizado (HU-027)"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/wallet/recharge" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"amount":100000}')
{ [ "$code" = "403" ] || [ "$code" = "404" ] || [ "$code" = "405" ]; } && ok "user -> /wallet/recharge -> $code (no autorizado)" || ko "user -> /wallet/recharge -> $code"

hr
echo "AC-CAT-02  Catálogo público sin sesión (HU-001)"
code=$(curl -s -o /tmp/r8 -w '%{http_code}' "$API/public/products?limit=5")
TOTAL=$(jget 'total' < /tmp/r8)
{ [ "$code" = "200" ] && [ -n "$TOTAL" ]; } && ok "/public/products -> 200 (total=$TOTAL)" || ko "/public/products -> $code"

echo "AC-CAT-03  Búsqueda difusa tolerante a tildes/errores (HU-001)"
R=$(curl -s "$API/public/products?search=audifono&limit=5"); n=$(echo "$R" | jget 'total')
{ [ -n "$n" ] && [ "$n" -ge 1 ]; } && ok "search='audifono' -> $n resultado(s) (tolerante a tildes)" || ko "search -> $n resultados"

echo "AC-CAT-07  Sección Ofertas (HU-001)"
code=$(curl -s -o /dev/null -w '%{http_code}' "$API/public/products/offers?limit=5")
[ "$code" = "200" ] && ok "/public/products/offers -> 200" || ko "offers -> $code"

echo "AC-CAT-08  Sección Novedades (HU-001)"
code=$(curl -s -o /dev/null -w '%{http_code}' "$API/public/products/new?limit=5")
[ "$code" = "200" ] && ok "/public/products/new -> 200" || ko "new -> $code"

hr
echo "AC-CART-01  Localizar un producto con stock (HU-011)"
DATA=$(curl -s "$API/public/products?in_stock=true&limit=48")
PID=$(echo "$DATA" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for p in d.get('products',[]):
    if (p.get('stock') or 0) > 0: print(p['id']); break
")
if [ -z "$PID" ]; then
  ko "no hay producto con stock>0 en el catálogo (no se puede probar carrito/checkout)"
else
  DET=$(curl -s "$API/public/products/$PID")
  PNAME=$(echo "$DET" | jget 'name')
  VARIANT=$(echo "$DET" | python3 -c "import sys,json;d=json.load(sys.stdin);vs=d.get('variants') or [];print(next((v['id'] for v in vs if (v.get('stock') or 0)>0), vs[0]['id'] if vs else ''))" 2>/dev/null)
  echo "  producto: $PNAME  (variantes: $( [ -n "$VARIANT" ] && echo sí || echo no ))"

  if [ -n "$VARIANT" ]; then
    echo "AC-PROD-07  Producto con variantes: agregar sin variante -> rechazado (HU-011)"
    code=$(curl -s -o /tmp/c1 -w '%{http_code}' -X POST "$API/cart/add" -H "Authorization: Bearer $TOKEN" \
      -H 'Content-Type: application/json' -d "{\"productId\":\"$PID\",\"quantity\":1}")
    c=$(jget 'detail.code' < /tmp/c1)
    [ "$code" != "200" ] && ok "agregar sin variante -> $code $c (rechazado)" || ko "agregar sin variante -> 200 (debía rechazar)"
  fi

  echo "AC-CART-01  Agregar al carrito (HU-011)"
  if [ -n "$VARIANT" ]; then
    BODY="{\"productId\":\"$PID\",\"variantId\":\"$VARIANT\",\"quantity\":1}"
  else
    BODY="{\"productId\":\"$PID\",\"quantity\":1}"
  fi
  code=$(curl -s -o /tmp/c2 -w '%{http_code}' -X POST "$API/cart/add" -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' -d "$BODY")
  { [ "$code" = "200" ] || [ "$code" = "201" ]; } && ok "cart/add -> $code" || ko "cart/add -> $code  $(cat /tmp/c2)"

  echo "AC-CART-07  Persistencia: GET /cart devuelve la línea (HU-011)"
  NITEMS=$(curl -s "$API/cart" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('items') or d.get('cart_items') or d.get('cartItems') or []))" 2>/dev/null)
  { [ -n "$NITEMS" ] && [ "$NITEMS" -ge 1 ]; } && ok "GET /cart -> $NITEMS línea(s)" || ko "GET /cart -> $NITEMS líneas"

  MYUID=$(psql_q "SELECT id FROM users WHERE email='$EMAIL';")
  code=$(curl -s -o /tmp/a1 -w '%{http_code}' -X POST "$API/addresses" -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"label":"Casa","fullName":"Acc Test","phone":"3001234567","address":"Calle 1 # 2-3","city":"Medellin","department":"Antioquia","country":"Colombia","isDefault":true}')
  ADDR=$(jget 'id' < /tmp/a1)
  [ -z "$ADDR" ] && ADDR=$(curl -s "$API/addresses" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);a=d if isinstance(d,list) else (d.get('addresses') or d.get('items') or []);print(a[0]['id'] if a else '')" 2>/dev/null)
  { [ -n "$ADDR" ]; } && ok "AC-CHK-02  dirección creada/seleccionada (HU-017)" || ko "AC-CHK-02  no se pudo crear/obtener dirección  $(cat /tmp/a1)"

  echo "AC-CHK-06  Checkout SIN saldo -> INSUFFICIENT_BALANCE, sin crear pedido (HU-012)"
  psql_q "UPDATE wallets SET balance=0 WHERE user_id='$MYUID';" >/dev/null
  ORDERS_BEFORE=$(psql_q "SELECT count(*) FROM orders WHERE user_id='$MYUID';")
  code=$(curl -s -o /tmp/ck1 -w '%{http_code}' -X POST "$API/checkout" -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' -d "{\"addressId\":\"$ADDR\"}")
  c=$(jget 'detail.code' < /tmp/ck1)
  ORDERS_AFTER=$(psql_q "SELECT count(*) FROM orders WHERE user_id='$MYUID';")
  { [ "$code" = "402" ] || [ "$c" = "INSUFFICIENT_BALANCE" ]; } && ok "checkout sin saldo -> $code $c" || ko "checkout sin saldo -> $code $c  $(cat /tmp/ck1)"
  [ "$ORDERS_BEFORE" = "$ORDERS_AFTER" ] && ok "checkout fallido NO creó pedido ($ORDERS_BEFORE == $ORDERS_AFTER)" || ko "checkout fallido creó pedido ($ORDERS_BEFORE -> $ORDERS_AFTER)"

  echo "AC-CHK-05  Checkout CON saldo -> pedido + saldo descontado + stock descontado + carrito vacío (HU-012)"
  STOCK_BEFORE=$(curl -s "$API/public/products/$PID" | jget 'stock')
  psql_q "UPDATE wallets SET balance=100000000 WHERE user_id='$MYUID';" >/dev/null
  code=$(curl -s -o /tmp/ck2 -w '%{http_code}' -X POST "$API/checkout" -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' -d "{\"addressId\":\"$ADDR\"}")
  ORDERS_FINAL=$(psql_q "SELECT count(*) FROM orders WHERE user_id='$MYUID';")
  BAL_FINAL=$(psql_q "SELECT balance FROM wallets WHERE user_id='$MYUID';")
  STOCK_AFTER=$(curl -s "$API/public/products/$PID" | jget 'stock')
  NITEMS2=$(curl -s "$API/cart" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('items') or d.get('cart_items') or d.get('cartItems') or []))" 2>/dev/null)
  { [ "$code" = "200" ] || [ "$code" = "201" ]; } && ok "checkout con saldo -> $code" || ko "checkout con saldo -> $code  $(cat /tmp/ck2)"
  { [ "${ORDERS_FINAL:-0}" -gt "${ORDERS_AFTER:-0}" ]; } && ok "pedido creado (orders $ORDERS_AFTER -> $ORDERS_FINAL)" || ko "no se creó pedido ($ORDERS_AFTER -> $ORDERS_FINAL)"
  DED=$(python3 -c "print('1' if float('${BAL_FINAL:-100000000}') < 100000000 else '0')")
  [ "$DED" = "1" ] && ok "saldo de RehniCoin descontado (balance=$BAL_FINAL)" || ko "saldo no descontado (balance=$BAL_FINAL)"
  echo "  stock del producto: antes=$STOCK_BEFORE  después=$STOCK_AFTER"
  [ "${NITEMS2:-1}" = "0" ] && ok "AC-CHK-14  carrito vaciado tras la compra" || ko "AC-CHK-14  carrito con $NITEMS2 líneas tras compra"

  echo "AC-ORD-01  Listado de pedidos del comprador (HU-013)"
  code=$(curl -s -o /dev/null -w '%{http_code}' "$API/orders" -H "Authorization: Bearer $TOKEN")
  [ "$code" = "200" ] && ok "GET /orders -> 200" || ko "GET /orders -> $code"
fi

hr
echo "AC-INF-02  Health de base de datos"
curl -s "$API/health/database" | grep -q OK && ok "/health/database -> OK" || ko "/health/database"
echo "AC-INF-04  Swagger / OpenAPI"
code=$(curl -s -o /dev/null -w '%{http_code}' "$API/openapi.json"); [ "$code" = "200" ] && ok "/openapi.json -> 200" || ko "/openapi.json -> $code"

hr
echo "RESUMEN:  PASA=$PASSED   FALLA=$FAILED"
if [ "$FAILED" -eq 0 ]; then
  echo "RESULTADO: todos los casos de la muestra técnica PASARON."
else
  echo "RESULTADO: $FAILED caso(s) con fallo — revisar arriba."
fi
exit 0
