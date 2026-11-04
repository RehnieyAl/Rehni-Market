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

---

# Línea base Fase 0 (2026-11-03, commit base 4554aa4)

| Archivo | Contenido |
|---|---|
| `2026-11-03_backend_pytest_cov.txt` | `pytest --cov --cov-report=term-missing` con `[tool.coverage]` de `pyproject.toml` (ramas activadas) |
| `2026-11-03_backend_coverage.json` | Reporte JSON de coverage.py |
| `2026-11-03_frontend_vitest_cov.txt` | `vitest run --coverage` con las exclusiones de `vitest.config.ts` |
| `2026-11-03_frontend_coverage-summary.json` | Resumen JSON de @vitest/coverage-v8 |

## Resultados medidos

- **Backend:** 238/238 en verde. Líneas **65,91 %** (5378/8159), ramas **28,62 %** (415/1450).
  Sin exclusiones dentro de `app/` (seed, CheckNetwork y TestDatabase se usan en producción).
- **Frontend:** 69/69 en verde (11 archivos). Líneas **7,73 %** (423/5469), ramas **7,37 %** (305/4133).
  Sin exclusiones nuevas: 7,73 % (423/5470), es decir, la única diferencia es `main.tsx`.

## Cómo se reprodujo (sin depender del stack de desarrollo)

```
docker compose -f docker-compose.test.yml up -d --wait
cd RehniMarket-backend
UV_PROJECT_ENVIRONMENT=<venv> uv sync --group dev --python 3.13 --frozen
RUN_SEED=false TEST_DATABASE_URL=postgresql://rehni_test:rehni_test@127.0.0.1:55433/rehnimarket_test \
  <venv>/bin/python -m pytest --cov --cov-report=term-missing --cov-report=json

cd RehniMarket-frontend && pnpm exec vitest run --coverage
```
