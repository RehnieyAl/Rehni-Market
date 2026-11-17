# Tutorial de pruebas — RehniMarket

Cómo correr **todas** las pruebas del proyecto, en local y contra producción. Los números de este
documento se midieron el 17/11/2026 en el equipo de desarrollo (12 hilos, 7 GB de RAM).
Qué se prueba y por qué: [`docs/estrategia-pruebas.md`](../estrategia-pruebas.md). Hallazgos y
brechas: [`REGISTRO.md`](REGISTRO.md).

## 1. Resumen

| Tipo | Herramienta | Ubicación | Cantidad | Comando | Cuándo |
|---|---|---|---|---|---|
| Backend: unitarias e integración contra PostgreSQL | pytest + pytest-cov | `RehniMarket-backend/tests/` | 376 en 21 archivos (6 `xfail`) | `uv run pytest` | Cada cambio del backend; el CI en cada PR |
| Frontend: unitarias y de componentes | Vitest + Testing Library | `RehniMarket-frontend/src/**/*.test.ts(x)` | 184 en 17 archivos (+1 `todo`) | `pnpm test` | Cada cambio del frontend; el CI en cada PR |
| Móvil | — | `RehniMarket-mobile` | 0 (deuda, §5) | — | — |
| Redes de Docker | bash | `scripts/verificar-redes.sh` | 44 en local (positivas, negativas y resiliencia) | `bash scripts/verificar-redes.sh` | Tras cambiar `docker-compose.yml` o `caddy/Caddyfile`, y en cada despliegue |
| Humo por HTTP | bash + curl | `scripts/smoke-test.sh` | 7 pasos | `bash scripts/smoke-test.sh` | Tras cada despliegue |
| Aceptación (muestra técnica) | bash + curl + psql | `scripts/acceptance_smoke.sh` | 28 verificaciones en 18 casos AC-* | `bash scripts/acceptance_smoke.sh` | Antes de una entrega, **solo en local** |
| Carga | k6 | `tests/load/` | 6 escenarios | `k6 run tests/load/01-smoke.js` | Antes de una versión y tras cambios de rendimiento |
| Rendimiento básico | bash + curl | `scripts/perf_test.sh` | N peticiones por ruta | `bash scripts/perf_test.sh` | Comparaciones rápidas |
| Auditoría de dependencias | pip-audit, pnpm audit | job `auditoria` del CI | `uv.lock` y frontend de producción | §8 | CI en cada PR; Dependabot semanal |
| Calidad estática | ruff, ESLint, tsc, SonarCloud | CI y `sonarqube.yml` | — | §9 | Antes de cada push |

Duración medida: backend completo ~4 min 40 s; frontend 5 s (7,5 s con cobertura); ESLint 7 s;
`tsc` 9 s; build 5 s; ruff 0,03 s; pip-audit y pnpm audit ~1 s cada uno; verificación de redes ~1 min.

## 2. Requisitos

| Herramienta | Versión | Para qué | Comprobar |
|---|---|---|---|
| Docker Engine + Compose | Compose ≥ 2.24 | Stack local y base de pruebas | `docker compose version` |
| uv | La que instala Python 3.13 (`uv python install 3.13`) | Backend | `uv --version` |
| Node.js + pnpm | Node 22, pnpm 11.15.0 (fijada en `package.json`) | Frontend | `pnpm --version` |
| k6 | ≥ 0.50 (medido con 2.1.0) | Carga | `k6 version` |
| curl, python3, ss | Las del sistema | Scripts de `scripts/` | — |
| psql (opcional) | Cliente de PostgreSQL | 12 pruebas de `deploy/sql/crear-owner.sql` | `psql --version` |

**Los comandos son de bash.** Si tu terminal es fish (o zsh con otra sintaxis), escribe `bash` y
pega los comandos dentro, o ejecuta cada uno con `bash -c '…'`. Todos se corren desde la raíz del
repositorio salvo que el bloque haga `cd`.

## 3. Backend (pytest)

### 3.1 Levantar la base de pruebas

Un PostgreSQL desechable, en memoria (`tmpfs`), en `127.0.0.1:55433`. No toca la base de desarrollo.

```bash
docker compose --profile test up -d --wait postgres-test
```

```
 Container rehni-market-postgres-test-1  Healthy
```

### 3.2 Variable de la base de pruebas

`tests/conftest.py` crea y borra la base `rehnimarket_test` en cada corrida.

```bash
cd RehniMarket-backend
export TEST_DATABASE_URL=postgresql://rehni_test:rehni_test@127.0.0.1:55433/rehnimarket_test
```

### 3.3 Correr todo

```bash
uv run pytest
```

```
collected 376 items
...
358 passed, 12 skipped, 6 xfailed, 4756 warnings in 281.40s (0:04:41)
```

Los 12 `skipped` son las pruebas de `crear-owner.sql`: necesitan `psql`. Sin él se omiten en local;
en el CI corren siempre (allí faltar `psql` es un error). Con `psql` instalado: 370 passed.

### 3.4 Un archivo o una sola prueba

```bash
uv run pytest tests/test_jwt.py
```

```
22 passed, 27 warnings in 15.57s
```

```bash
uv run pytest "tests/test_jwt.py::TestAccessToken::test_valid_token_is_accepted"
```

```
1 passed, 3 warnings in 1.49s
```

Por nombre (subcadena):

```bash
uv run pytest -k refresh
```

```
9 passed, 367 deselected, 11 warnings in 5.54s
```

Detenerse en el primer fallo: `uv run pytest -x`.

### 3.5 Cobertura y reporte HTML

```bash
uv run pytest --cov=app --cov-report=term --cov-report=html
```

```
TOTAL      8228   2322   1464    224  66.82%
Required test coverage of 64.0% reached. Total coverage: 66.82%
```

El reporte queda en `RehniMarket-backend/htmlcov/index.html` (fuera de Git):

```bash
xdg-open htmlcov/index.html
```

**Umbral:** `fail_under = 64` en `[tool.coverage.report]` de `pyproject.toml`. Con `--cov`, una
cobertura menor hace fallar la corrida (así la corre el CI); `uv run pytest` sin `--cov` no la mide. Solo sube (ratchet): cuando la cobertura mejore, se sube el número.

**`xfail`:** 6 pruebas marcadas `@pytest.mark.xfail(strict=True)`. Cada una prueba un hallazgo conocido
y abierto (H-02, H-03, H-06, H-07 y H-08 en `REGISTRO.md`, con su incidencia). Mientras el defecto
exista, la prueba falla y pytest la cuenta como `xfailed` (esperado). Si alguien lo corrige, la
prueba pasa, `strict=True` la convierte en error y obliga a quitar la marca.

### 3.6 Apagar la base de pruebas

```bash
docker compose --profile test stop postgres-test
```

Como vive en `tmpfs`, al apagarla no queda ningún dato.

## 4. Frontend (Vitest, ESLint, tsc)

```bash
cd RehniMarket-frontend
pnpm install --frozen-lockfile
```

### 4.1 Pruebas

```bash
pnpm test
```

```
 Test Files  17 passed (17)
      Tests  184 passed | 1 todo (185)
```

Con cobertura (umbrales en `coverage.thresholds` de `vitest.config.ts`; reporte HTML en
`RehniMarket-frontend/coverage/index.html`):

```bash
pnpm test:coverage
```

Un solo archivo:

```bash
pnpm test src/features/admin/components/dashboard/user/RechargeWalletModal.test.tsx
```

```
 Test Files  1 passed (1)
      Tests  6 passed (6)
```

Una prueba por nombre:

```bash
pnpm test -t "muestra el monto máximo de recarga"
```

```
 Test Files  2 passed | 15 skipped (17)
      Tests  2 passed | 183 skipped (185)
```

Modo watch (vuelve a correr al guardar; `q` para salir):

```bash
pnpm exec vitest
```

### 4.2 Lint, tipos y build

```bash
pnpm lint:ci
```

`--max-warnings 11`: hay 11 avisos `react-hooks/exhaustive-deps` aceptados (incidencia #41); uno más
hace fallar el CI. `pnpm lint` muestra lo mismo sin límite.

```bash
pnpm typecheck
```

Revisa los tres `tsconfig` (app, node y pruebas); sin salida si no hay errores.

```bash
pnpm build
```

```
✓ 2182 modules transformed.
✓ built in 689ms
```

## 5. Móvil

`RehniMarket-mobile` **no tiene pruebas automáticas**. `package.json` declara `"test": "jest --watchAll"`,
pero no hay ningún archivo de prueba. Es deuda declarada en `docs/estrategia-pruebas.md` §3: la app
móvil quedó fuera del alcance de la entrega. Si se agregan, usar `jest --ci` (nunca `--watchAll`
en el CI). Su auditoría de dependencias está en `docs/calidad/auditoria-dependencias-2026-11-16.md` §6.

## 6. Pruebas de infraestructura

### 6.1 Segmentación de redes (`scripts/verificar-redes.sh`)

Con el stack arriba (`docker compose up -d --wait`). Comprueba la topología `edge`/`data` del
`docker-compose.yml` desde dentro de los contenedores:

- **Positivas** (deben pasar): el sitio y la API responden por Caddy; backend → PgBouncer → PostgreSQL;
  backend → MinIO; PgBouncer → PostgreSQL; PostgreSQL en `127.0.0.1:5433`; y **resiliencia**: reinicia
  el backend y exige que Caddy no devuelva ningún 502.
- **Negativas** (deben fallar, eso prueba el aislamiento): Caddy no llega a PostgreSQL, PgBouncer ni
  MinIO; la consola de MinIO no responde; nada salvo Caddy escucha en `0.0.0.0`.

```bash
bash scripts/verificar-redes.sh
```

```
Resultado: 44 pasan, 0 fallan
```

En producción, en la VM (`cd ~/Rehni-Market`): el mismo comando. Con la base recién instalada, sin
productos, la prueba de imágenes aparece como `⏭ omitida`. **Reinicia el backend una vez**: no correrlo
con tráfico real. Evidencia: `docs/evidencias/verificacion-redes-produccion-2026-11-17.txt`.

### 6.2 Prueba de humo (`scripts/smoke-test.sh`)

Solo HTTP: salud, catálogo, ruta protegida, login fallido, login con una cuenta **ya verificada**,
`/auth/me` y frontend. No registra usuarios ni envía correos.

| Variable | Obligatoria | Ejemplo |
|---|:---:|---|
| `BASE_URL` | Sí | `https://api.localhost` · producción `https://apirehnimarket.duckdns.org` |
| `FRONTEND_URL` | No | `https://localhost` · producción `https://rehnimarket.duckdns.org` |
| `SMOKE_EMAIL` | Sí | `<correo-de-una-cuenta-verificada>` |
| `SMOKE_PASSWORD` | Sí | Se escribe sin que se vea (abajo) |

La clave se escribe con `read -rsp`: no se ve en pantalla ni queda en el historial. **Hazlo en bash,
en una terminal normal**: ver §12.

En local:

```bash
read -rsp 'Clave: ' SMOKE_PASSWORD; echo; export SMOKE_PASSWORD
SMOKE_EMAIL='<correo-de-una-cuenta-verificada>' BASE_URL=https://api.localhost FRONTEND_URL=https://localhost \
  bash scripts/smoke-test.sh
unset SMOKE_PASSWORD
```

```
RESULTADO: 7 pasan, 0 fallan
```

Contra producción, guardando la evidencia:

```bash
read -rsp 'Clave del owner: ' SMOKE_PASSWORD; echo; export SMOKE_PASSWORD
SMOKE_EMAIL='<correo-del-owner>' BASE_URL=https://apirehnimarket.duckdns.org \
  FRONTEND_URL=https://rehnimarket.duckdns.org bash scripts/smoke-test.sh \
  | tee "docs/evidencias/smoke-produccion-$(date +%F).txt"
unset SMOKE_PASSWORD
```

La salida muestra `SMOKE_EMAIL=(definido)`, nunca el correo ni la clave.

### 6.3 Aceptación (`scripts/acceptance_smoke.sh`)

18 casos AC-* de las historias de usuario: registro, verificación con el código real de la base,
login, refresh, permisos por rol, catálogo, ofertas, novedades, carrito, checkout con y sin saldo,
pedidos y salud. **Escribe en la base** (crea una cuenta, fija su saldo con `UPDATE` y hace una compra
que descuenta stock): **solo contra la base de desarrollo, nunca en producción**.

```bash
API=http://127.0.0.1:8000 bash scripts/acceptance_smoke.sh
```

```
RESULTADO: 28 pasan, 0 fallan
```

Sale con 1 si algún caso falla. La cuenta creada (`acc.<fecha>@gmail.com`, clave fija del script)
sirve después para la prueba de humo local.

## 7. Carga (k6)

Todos los escenarios son de **solo lectura** contra `/public/*`. Detalle y qué observar en paralelo:
[`tests/load/README.md`](../../tests/load/README.md).

| Escenario | Carga | Mide | Umbrales |
|---|---|---|---|
| `01-smoke.js` | 2 VUs, 30 s | Que todo responde | p95 < 1 s; errores < 1 % |
| `02-baseline.js` | 10 VUs, 2 min | Línea base por ruta | p95 catálogo < 800 ms, búsqueda < 600 ms, detalle < 500 ms; errores < 1 % |
| `03-ramping.js` | 20 → 50 → 100 → 200 VUs, ~7 min | Dónde empieza a degradarse | p95 < 3 s |
| `04-sustained.js` | `SUSTAINED_VUS` (30), 5 min | Estabilidad sostenida | p95 < 1,5 s |
| `05-stress.js` | Hasta `STRESS_MAX_VUS` (400), ~3,5 min | Punto de quiebre (5xx y reinicios a propósito) | Informativo |
| `06-recovery.js` | Pico de `PEAK_VUS` (150) y 1 min a 5 VUs | Que vuelve a la normalidad | Tras el pico: p95 < 800 ms; errores < 1 % |

Contra local (la API directa, sin Caddy), guardando el resumen:

```bash
k6 run -e K6_BASE_URL=http://127.0.0.1:8000 \
  --summary-export "docs/pruebas/evidencias/k6/$(date +%F)_02-baseline-summary.json" \
  tests/load/02-baseline.js
```

```
✓ 'p(95)<800' p(95)=15.02ms     (catálogo)
✓ 'p(95)<600' p(95)=31.63ms     (búsqueda)
✓ 'p(95)<500' p(95)=16.28ms     (detalle)
✓ 'rate<0.01' rate=0.00%        (http_req_failed)
```

Esa es la corrida guardada en `docs/pruebas/evidencias/k6/2026-11-16_02-baseline.txt`.

Ejecutarlos en orden (`01` → `06`): cada uno supone que el anterior no mostró problemas.

**Contra producción:** `-e K6_BASE_URL=https://apirehnimarket.duckdns.org`. **Aviso:** producción tiene
`RATE_LIMIT_ENABLED=true` (100 peticiones por minuto y por IP en cada worker). Desde una sola IP, k6
recibirá **429** en cuanto pase ese límite: es el rate limit funcionando, no una caída. En producción
solo `01-smoke.js` y, como mucho, `02-baseline.js`, y fuera del horario de uso; nunca `05-stress.js`.

## 8. Auditoría de dependencias

Los mismos pasos del job `auditoria` del CI.

```bash
cd RehniMarket-backend
uv export --frozen --no-emit-project --format requirements-txt -o /tmp/requirements.txt
uvx pip-audit@2.10.1 -r /tmp/requirements.txt --require-hashes --disable-pip
```

```
No known vulnerabilities found
```

```bash
cd RehniMarket-frontend
pnpm audit --prod --audit-level=high
```

```
No known vulnerabilities found
```

`pnpm audit` (sin `--prod`) incluye las de desarrollo. Las vulnerabilidades aceptadas a propósito
están en [`.github/auditoria-excepciones.txt`](../../.github/auditoria-excepciones.txt), con motivo y
fecha de revisión: el CI las ignora hasta esa fecha y falla cuando vence. Para ignorarlas también en
local: `--ignore-vuln <ID>` (pip-audit) o `--ignore <GHSA>` (pnpm). Informe:
[`docs/calidad/auditoria-dependencias-2026-11-16.md`](../calidad/auditoria-dependencias-2026-11-16.md).

## 9. Calidad estática

```bash
cd RehniMarket-backend
uv run ruff check .
```

```
All checks passed!
```

Frontend: `pnpm lint:ci` y `pnpm typecheck` (§4.2).

**SonarCloud** (`.github/workflows/sonarqube.yml`) analiza fiabilidad, seguridad, mantenibilidad,
duplicación y *security hotspots* en cada PR y en cada push a `main`/`develop`. El resultado aparece
como check «SonarCloud Code Analysis» en el PR y en
<https://sonarcloud.io/project/overview?id=RehnieyAl_Rehni-Market>. Desde la terminal:

```bash
curl -s "https://sonarcloud.io/api/qualitygates/project_status?projectKey=RehnieyAl_Rehni-Market"
```

```
{"projectStatus":{"status":"OK", ...
```

## 10. Integración continua

| Workflow | Job | Cuándo | Qué corre |
|---|---|---|---|
| `ci.yml` | `backend` | Cada PR y push a `main`/`develop` | ruff, `alembic upgrade head`, pytest con cobertura (con `psql`) |
| `ci.yml` | `frontend` | Igual | `pnpm lint:ci`, `pnpm typecheck`, `pnpm test:coverage` |
| `ci.yml` | `auditoria` | Igual | pip-audit sobre `uv.lock` y `pnpm audit --prod --audit-level=high` |
| `sonarqube.yml` | `SonarCloud` | Cada PR y push a `main`/`develop` | Análisis y Quality Gate |

**Qué bloquea el merge:** el ruleset de `main` declara `backend` y `frontend` como checks obligatorios,
pero el 17/11/2026 está **desactivado**: hoy ningún check bloquea el merge y la regla del proyecto es
no mergear sin todo en verde. Al reactivarlo conviene sumar `auditoria`.

Ver los checks de un PR y esperar a que terminen:

```bash
gh pr checks <número> --watch
```

Relanzar un run (por ejemplo, para confirmar dos verdes seguidos):

```bash
gh run list --branch <rama> -L 5
gh run rerun <id-del-run>
```

## 11. Antes de hacer push

Lo mismo que `/verificar-calidad` y que el CI, en bash, desde la raíz:

```bash
docker compose --profile test up -d --wait postgres-test
(cd RehniMarket-backend && uv run ruff check . && \
  TEST_DATABASE_URL=postgresql://rehni_test:rehni_test@127.0.0.1:55433/rehnimarket_test uv run pytest -q)
(cd RehniMarket-frontend && pnpm lint:ci && pnpm typecheck && pnpm test:coverage && pnpm build)
(cd RehniMarket-frontend && pnpm audit --prod --audit-level=high)
```

Si tocaste `docker-compose.yml` o `caddy/Caddyfile`, además `bash scripts/verificar-redes.sh`.

## 12. Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `postgres-test` no llega a `healthy` | Docker apagado o el contenedor quedó a medias | `docker compose --profile test logs postgres-test`; `docker compose --profile test up -d --force-recreate --wait postgres-test` |
| `address already in use` en 55433, 5433, 8000, 80 o 443 | Otro proceso o un stack de otro clon usa el puerto | `ss -tlnp \| grep -E ':(55433\|5433\|8000\|80\|443)\b'`; apagar el otro stack (`docker compose down` en su carpeta) |
| Las pruebas fallan con errores de conexión a `pgbouncer` o `postgres` | Falta `TEST_DATABASE_URL` o la base de pruebas está apagada | §3.1 y §3.2 |
| Fallos raros que no se repiten, `deadlock detected` o datos de otra corrida | Dos corridas de pytest a la vez contra la misma `rehnimarket_test` (cada una la borra y la crea) | Una sola corrida por base; si quedó sucia, `docker compose --profile test restart postgres-test` (vive en `tmpfs` y vuelve vacía) |
| Con 8 GB de RAM el equipo se queda sin memoria | Stack completo + pytest + build del frontend + k6 a la vez | Para el backend basta `postgres-test` (`docker compose stop` del resto); no compilar mientras corre k6; activar swap |
| `read -rsp` no pide la clave y el smoke test da 5 pasan / 2 fallan («SMOKE_EMAIL y SMOKE_PASSWORD son obligatorias») | `read -rsp` es de bash: no funciona dentro de `!` (sin terminal interactiva) ni en fish | Correrlo en **bash desde una terminal normal** (`bash` y luego el bloque de §6.2) |
| k6 muestra muchos **429** | Rate limit por IP (producción, o `RATE_LIMIT_ENABLED=true` en local) | Esperado desde una sola IP: §7. En local, la API directa en `127.0.0.1:8000` con `RATE_LIMIT_ENABLED=false` |
| Las pruebas de `crear-owner.sql` salen `skipped` | No hay `psql` en el equipo | Instalar el cliente de PostgreSQL, o definir `PSQL_BIN` con un `psql` alternativo; en el CI no se omiten |
| `verificar-redes.sh` falla la prueba de resiliencia | El backend tardó más de `RESTART_WAIT` (90 s) en volver | Revisar `docker compose logs backend`; con poca CPU, `RESTART_WAIT=180 bash scripts/verificar-redes.sh` |
