# 01 – Escaneo inicial (paso 2 del taller, Guía N°08)

## Datos del análisis

| Dato | Valor |
|---|---|
| Proyecto | `RehnieyAl_Rehni-Market` (SonarCloud, organización `rehnieyal`) |
| Rama | `main` |
| Fecha del análisis | 2026-11-09 05:30:26 UTC (00:30 hora Colombia) |
| Commit analizado | `f1b490bd1efbad6333aafb50032b300aee1bb46d` (Merge pull request #25) |
| Run de GitHub Actions | `42567669823` (SonarCloud Analysis, push a `main`) |
| Configuración | `sonar-project.properties` con las exclusiones de los PRs #23 y #24 |
| Quality Gate | Sonar way |
| Tamaño | 60 933 líneas de código (ncloc) · 71 708 líneas totales · 634 archivos |

## Resumen de métricas (estado inicial)

| Métrica | Valor | Calificación |
|---|---|---|
| Bugs | **195** | Reliability **E** |
| Vulnerabilidades | **12** | Security **D** |
| Security Hotspots | **0** (100 % revisados) | Security Review **A** |
| Code Smells | **188** | Maintainability **A** |
| Duplicación | **2.0 %** (1 441 líneas duplicadas) | — |
| Deuda técnica | **629 min = 10 h 29 min ≈ 1,3 días** (jornada de 8 h) | ratio de deuda 0.0 % |
| Cobertura | sin datos (excluida a propósito: `sonar.coverage.exclusions=**`) | — |

### Vista por cualidad de software (modo MQR del dashboard)

| Cualidad | Issues abiertos |
|---|---|
| Reliability | 382 |
| Security | 13 |
| Maintainability | 24 |

En total hay 395 issues abiertos: 195 BUG, 188 CODE_SMELL y 12 VULNERABILITY. Por severidad: 140 BLOCKER, 19 CRITICAL, 230 MAJOR y 6 MINOR.

En la vista MQR, Security cuenta 13 issues porque suma las 12 vulnerabilidades y un code smell (`python:S1313`, IP escrita en el código, `NasService.py:134`).

## Estado del Quality Gate: **FAILED**

Las condiciones se evalúan sobre el código nuevo. El periodo es `previous_version`, desde el 2026-11-05.

| Condición | Valor actual | Umbral | Estado |
|---|---|---|---|
| Security rating en código nuevo | **C** | A | ❌ **ERROR** |
| Reliability rating en código nuevo | A | A | OK |
| Maintainability rating en código nuevo | A | A | OK |
| Duplicación en código nuevo | 0.0 % | ≤ 3 % | OK |
| Security Hotspots revisados | 100 % | 100 % | OK |

La condición de cobertura no aparece. El CI solo hace análisis estático y no ejecuta tests, así que con `sonar.coverage.exclusions=**` no queda código que medir y SonarCloud omite la condición.

## Reglas con más hallazgos

| Regla | Issues | Descripción |
|---|---|---|
| `python:S930` | 139 | Argumento con nombre inesperado (`scope`) → **falso positivo, ver nota** |
| `shell:S7688` | 111 | Usar `[[` en vez de `[` en scripts bash |
| `typescript:S9383` | 54 | Promesas sin `await`, `.catch` ni `.then` con manejo de error |
| `typescript:S6853` | 52 | `label` sin control asociado |
| `python:S6903` | 18 | Uso de `datetime.utcnow` (deprecado) |
| `typescript:S6848` | 4 | Elementos interactivos no nativos sin rol ni teclado |

Origen de los 382 issues de Reliability: backend `app/` 158, frontend `src/` 109, `scripts/` 113 y mobile `src/` 2. **Ninguno viene de código generado, de terceros o de build.**

## Nota: 139 issues de Reliability son un falso positivo (`python:S930`)

De los 382 issues de Reliability, **139 son la regla `python:S930`**, todos con severidad BLOCKER y todos en `RehniMarket-backend/app/routers/`. Sonar marca *"Remove this unexpected named argument 'scope'"* en las declaraciones `Depends(get_db, scope="function")`. Estos 139 BLOCKER son los que llevan Reliability a **E**.

**Justificación técnica:**

> Falso positivo. `fastapi.Depends` acepta el argumento de palabra clave `scope: Literal["function", "request"] | None` desde FastAPI 0.121.0. El proyecto usa FastAPI 0.135.1 (fijado en `RehniMarket-backend/pyproject.toml` y `uv.lock`). La firma está en `fastapi/param_functions.py`, función `Depends(dependency=None, *, use_cache=True, scope=None)`, y la comprobé en ejecución con `inspect.signature(fastapi.Depends)` en el contenedor del backend. El valor `"function"` hace que la dependencia con `yield` (`get_db`) cierre la sesión de base de datos al terminar la función del endpoint y antes de enviar la respuesta. Es un uso documentado (FastAPI docs, *Dependencies with yield → Early exit and scope*). La regla S930 se basa en una definición de `Depends` anterior a 0.121 y no reconoce el parámetro. El código es correcto y no hay error en tiempo de ejecución.

**Evidencia de la verificación:**
- `.venv/lib/python3.13/site-packages/fastapi-0.135.1.dist-info/METADATA` → `Version: 0.135.1`
- `fastapi/param_functions.py:2317` → `scope: Annotated[Literal["function", "request"] | None, ...] = None`
- `fastapi/params.py:750` → `scope: Literal["function", "request"] | None = None`
- Contenedor `rehni-backend`: `inspect.signature(fastapi.Depends)` incluye `scope`.

**Tratamiento:** estos issues se marcan como *False Positive* en SonarCloud con la justificación de arriba, **después** de este escaneo inicial, para que este informe muestre lo que Sonar reportó originalmente. No se usan como hallazgos de la matriz.
