# Pruebas de carga — RehniMarket (k6)

Scripts de k6 para auditar la estabilidad del backend bajo concurrencia.
Sustituyen a `scripts/load_test.k6.js` (se deja sin borrar, pero ya no se
recomienda usarlo: saltaba directo a 1000 VUs sin humo/base previos, usaba
una IP privada hardcodeada y su función `compra()` estaba vacía).

## Alcance

Todos los escenarios son de **solo lectura** contra endpoints públicos del
catálogo (`/public/...`). No ejecutan registro, login, checkout ni ninguna
escritura: el objetivo es medir la infraestructura (pool de conexiones,
PgBouncer, event loop, contenedores) sin mutar datos reales ni de prueba.

El flujo de compra/checkout y el camino autenticado (que ejercitan
`auth_middleware`, corregido en esta auditoría — ver hallazgo #5 del
informe) **no están cubiertos** por estos scripts: hacerlo de forma segura
requeriría crear cuentas de prueba descartables y resolver la verificación
de correo de forma automática, lo cual queda fuera del alcance de "sin
operaciones destructivas" de esta tarea. Queda como pendiente documentado
en el informe final (Fase 6).

## Requisitos

- `k6` instalado (`k6 version`).
- El stack de `docker-compose.yml` levantado y saludable (`docker compose ps`).
- Conectividad desde donde corre k6 hacia `BACKEND_BIND:BACKEND_PORT`
  (por defecto `127.0.0.1:8000`; revisa tu `.env` raíz si cambiaste
  `BACKEND_BIND`/`BACKEND_PORT`).

## Comandos exactos

Ejecuta siempre en este orden — cada etapa depende de que la anterior no
haya mostrado problemas:

```bash
# 1. Humo (2 VUs, 30s)
k6 run -e K6_BASE_URL=http://127.0.0.1:8000 tests/load/01-smoke.js

# 2. Carga base (10 VUs constantes, 2 min)
k6 run -e K6_BASE_URL=http://127.0.0.1:8000 tests/load/02-baseline.js

# 3. Carga gradual (20 -> 50 -> 100 -> 200 VUs por etapas, ~5 min)
k6 run -e K6_BASE_URL=http://127.0.0.1:8000 tests/load/03-ramping.js

# 4. Carga sostenida (ajusta SUSTAINED_VUS según el punto de degradación
#    observado en el paso 3; por defecto 30 VUs, 5 min)
k6 run -e K6_BASE_URL=http://127.0.0.1:8000 -e SUSTAINED_VUS=30 tests/load/04-sustained.js

# 5. Estrés (ajusta STRESS_MAX_VUS; por defecto 400, ~3.5 min) — avisa antes
#    de correrla si el entorno es compartido: puede provocar 5xx, timeouts
#    y reinicios de contenedor a propósito.
k6 run -e K6_BASE_URL=http://127.0.0.1:8000 -e STRESS_MAX_VUS=400 tests/load/05-stress.js

# 6. Recuperación (pico breve + comprobación de que vuelve a la normalidad)
k6 run -e K6_BASE_URL=http://127.0.0.1:8000 -e PEAK_VUS=150 tests/load/06-recovery.js
```

Para guardar resultados crudos (recomendado antes de comparar antes/después):

```bash
k6 run --out json=resultados/03-ramping.json -e K6_BASE_URL=http://127.0.0.1:8000 tests/load/03-ramping.js
```//
(crea la carpeta `resultados/` si no existe; no se versiona en git — añádela a `.gitignore` si vas a guardar corridas localmente)

## Qué observar en paralelo (fuera de k6)

k6 solo ve la respuesta HTTP. Para diagnosticar la causa (no solo el
síntoma), observa en paralelo, en otra terminal:

```bash
# CPU/memoria por contenedor en vivo
docker stats rehni-backend pgbouncer_pool rehni-postgres

# Conexiones activas en Postgres (requiere las credenciales reales del .env)
docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Estado de salud / reinicios de los contenedores
docker compose ps

# Logs del backend (errores de pool, excepciones) durante la corrida
docker compose logs -f backend

# Logs de PgBouncer (timeouts de pool, conexiones rechazadas)
docker compose logs -f pgbouncer

# Health check funcional del backend
curl -s http://127.0.0.1:8000/health/database
```

## Métricas que reporta cada corrida de k6

- Solicitudes por segundo (`http_reqs`, en el resumen final de k6).
- Latencia p50/p90/p95/p99 (`http_req_duration`, k6 las imprime en el resumen
  por defecto; p50/p90/p99 no se muestran en pantalla salvo que se agregue
  `--summary-trend-stats` o se exporte con `--out json=...` y se calculen).
- `http_req_failed`: porcentaje de respuestas fallidas (incluye timeouts y
  errores de conexión, no solo códigos 4xx/5xx).
- `errores_negocio`: tasa de checks fallidos definidos en cada script
  (respuesta 200 pero contenido inesperado, por ejemplo).
- Duración por grupo (`duracion_catalogo`, `duracion_busqueda`,
  `duracion_detalle`, `duracion_secciones`).

Para p50/p90/p99 explícitos en el resumen de consola:

```bash
k6 run --summary-trend-stats="avg,min,med,p(90),p(95),p(99),max" \
  -e K6_BASE_URL=http://127.0.0.1:8000 tests/load/02-baseline.js
```

Lo que k6 **no puede medir por sí solo** (debe cruzarse manualmente con lo
de la sección anterior): errores `QueuePool`/timeouts de PgBouncer,
conexiones activas en Postgres, CPU/memoria de los contenedores, y
reinicios/estado de los healthchecks.

## Umbrales (`thresholds`)

Los umbrales definidos en cada script (`p(95)<...`, `rate<0.01`, etc.) son
**objetivos de aceptación propuestos para esta auditoría**, no límites ya
acordados con el equipo del proyecto ni SLAs contractuales. Ajústalos una
vez que el equipo defina formalmente qué latencia/tasa de error es
aceptable para producción.

## No confundas estas tres cosas

- **VUs (usuarios virtuales de k6):** clientes HTTP concurrentes que
  generan tráfico hacia el backend. 200 VUs no son 200 conexiones a
  Postgres.
- **Solicitudes por segundo:** depende de cuántos VUs hay y de la
  latencia/`sleep()` de cada iteración; dos corridas con los mismos VUs
  pueden tener RPS muy distinto.
- **Conexiones simultáneas a PostgreSQL:** gobernadas por el pool de
  SQLAlchemy del backend (`pool_size`/`max_overflow` en
  `RehniMarket-backend/app/database/Connection.py`) multiplicado por el
  número de workers, y acotadas después por `DEFAULT_POOL_SIZE`/
  `MAX_CLIENT_CONN` de PgBouncer y por `max_connections` de Postgres. Ver
  el informe de auditoría para el cálculo completo.
