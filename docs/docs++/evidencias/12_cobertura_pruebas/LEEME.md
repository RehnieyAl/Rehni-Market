# Evidencias — Cobertura de pruebas (2026-10-21)

| Archivo | Contenido |
|---|---|
| `2026-10-21_backend_pytest_cov.txt` | Salida completa `pytest -v --cov=app --cov-report=term-missing` |
| `2026-10-21_backend_coverage.json` | Reporte JSON de coverage.py (backend) |
| `2026-10-21_frontend_vitest_cov.txt` | Salida completa `vitest run --coverage` (por archivo) |
| `2026-10-21_frontend_coverage-summary.json` | Resumen JSON de @vitest/coverage-v8 |

## Resultados medidos

- **Backend:** 238/238 pruebas en verde (2 corridas). Cobertura de `app/`: **66 %** (8159 sentencias, 2776 sin cubrir).
- **Frontend:** 69/69 pruebas en verde (11 archivos, 3 corridas con cobertura). Cobertura de `src/`:
  sentencias **7,47 %**, ramas 7,37 %, funciones 4,75 %, líneas 7,73 %.

## Cómo se reprodujo

Backend (contenedor `rehni-backend`, BD aislada `rehnimarket_test`, seed desactivado):

```
docker cp RehniMarket-backend/tests rehni-backend:/tmp/localtests
docker exec -e RUN_SEED=false -w /app rehni-backend \
  .venv/bin/python -m pytest /tmp/localtests -v --cov=app --cov-report=term-missing
```

Frontend (`RehniMarket-frontend/`): `pnpm exec vitest run --coverage`
