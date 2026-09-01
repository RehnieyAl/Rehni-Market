#!/usr/bin/env bash
set -uo pipefail

API="${API:-http://localhost:8000}"
N="${1:-200}"
CONC="${2:-10}"

command -v curl >/dev/null || { echo "curl no disponible"; exit 1; }

echo "# Prueba de rendimiento básica — RehniMarket"
echo "# $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "# API=$API   N=$N solicitudes   concurrencia=$CONC"
echo "# Método: curl secuencial + ráfagas concurrentes; latencia = %{time_total} de curl."
echo "# Nota: ejecutado en el mismo equipo que el backend (latencia de red ~0);"
echo "#       los números reflejan el tiempo de proceso del backend, no la red."
echo "============================================================"

bench() {
  local label="$1" url="$2"
  local tmp; tmp="$(mktemp)"
  echo
  echo ">>> $label"
  echo "    URL: $url"

  local i=0 ok=0 err=0
  : > "$tmp"
  local start; start=$(date +%s.%N)
  while [ "$i" -lt "$N" ]; do
    local out; out=$(curl -s -o /dev/null -w '%{http_code} %{time_total}' "$url" 2>/dev/null)
    local codeh="${out%% *}" t="${out##* }"
    if [ "$codeh" = "200" ]; then ok=$((ok+1)); echo "$t" >> "$tmp"; else err=$((err+1)); fi
    i=$((i+1))
  done
  local end; end=$(date +%s.%N)
  local wall; wall=$(python3 -c "print($end - $start)")

  python3 - "$tmp" "$N" "$ok" "$err" "$wall" "$CONC" "$url" <<'PY'
import sys, statistics, subprocess, time, concurrent.futures
tmp, N, ok, err, wall, conc, url = sys.argv[1:8]
N=int(N); ok=int(ok); err=int(err); wall=float(wall); conc=int(conc)
xs=sorted(float(l) for l in open(tmp) if l.strip())
def pct(p):
    if not xs: return 0.0
    k=(len(xs)-1)*p/100
    f=int(k); c=min(f+1,len(xs)-1)
    return xs[f]+(xs[c]-xs[f])*(k-f)
print(f"    [secuencial] solicitudes={N}  éxito(200)={ok}  errores={err}  tasa_éxito={ok/N*100:.1f}%")
if xs:
    print(f"    [secuencial] latencia  media={statistics.mean(xs)*1000:.1f}ms  "
          f"mín={min(xs)*1000:.1f}ms  máx={max(xs)*1000:.1f}ms  "
          f"p50={pct(50)*1000:.1f}ms  p95={pct(95)*1000:.1f}ms")
    print(f"    [secuencial] throughput ≈ {N/wall:.1f} req/s  (wall={wall:.1f}s)")

def one(_):
    t0=time.perf_counter()
    r=subprocess.run(["curl","-s","-o","/dev/null","-w","%{http_code}",url],
                     capture_output=True, text=True)
    return (r.stdout.strip()=="200", time.perf_counter()-t0)
t0=time.perf_counter()
with concurrent.futures.ThreadPoolExecutor(max_workers=conc) as ex:
    res=list(ex.map(one, range(N)))
wall2=time.perf_counter()-t0
cok=sum(1 for s,_ in res if s); cerr=len(res)-cok
lat=sorted(t for _,t in res)
def pct2(p):
    k=(len(lat)-1)*p/100; f=int(k); c=min(f+1,len(lat)-1)
    return lat[f]+(lat[c]-lat[f])*(k-f)
print(f"    [concurrente x{conc}] solicitudes={N}  éxito={cok}  errores={cerr}  tasa_éxito={cok/N*100:.1f}%")
print(f"    [concurrente x{conc}] latencia  media={statistics.mean(lat)*1000:.1f}ms  "
      f"mín={min(lat)*1000:.1f}ms  máx={max(lat)*1000:.1f}ms  p95={pct2(95)*1000:.1f}ms")
print(f"    [concurrente x{conc}] throughput ≈ {N/wall2:.1f} req/s  (wall={wall2:.1f}s)")
PY
  rm -f "$tmp"
}

bench "Catálogo público — GET /public/products?limit=12" "$API/public/products?limit=12"
bench "Catálogo con búsqueda difusa — GET /public/products?search=audio&limit=12" "$API/public/products?search=audio&limit=12"

PID=$(curl -s "$API/public/products?limit=1" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['products'][0]['id'] if d.get('products') else '')" 2>/dev/null)
[ -n "$PID" ] && bench "Detalle de producto — GET /public/products/{id}" "$API/public/products/$PID"

echo
echo "============================================================"
echo "# Interpretación: RehniMarket no define SLO de latencia. Estos números son"
echo "# una LÍNEA BASE del entorno de desarrollo, no un compromiso de servicio."
echo "# El checkout NO se mide aquí para no generar pedidos/movimientos de saldo"
echo "# masivos; su corrección y su comportamiento bajo concurrencia están cubiertos"
echo "# por la suite pytest (test_concurrent_checkout_of_last_unit_lets_only_one_win)."
