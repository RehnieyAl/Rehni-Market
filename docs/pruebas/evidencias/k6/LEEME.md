# Evidencias k6

| Archivo | Contenido |
|---|---|
| `2026-11-16_02-baseline.txt` | Salida de `k6 run -e K6_BASE_URL=http://127.0.0.1:8000 tests/load/02-baseline.js` |
| `2026-11-16_02-baseline-summary.json` | `--summary-export` de la misma corrida |

**Medición en local**: equipo de desarrollo, stack de `docker-compose.yml`, API directa sin Caddy,
k6 en el mismo equipo. No representa el servidor de producción.
[PENDIENTE: repetir contra la URL de producción en Azure]
