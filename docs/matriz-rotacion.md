# Matriz de rotación de capas

> Plantilla: `bc-testing-adso/plantillas/matriz-rotacion.md`. Llenada al cierre (S9) con la
> evidencia del historial de git; equipo de 1 persona, así que la rotación es de una sola fila.

**Grupo**: RehniMarket · **Ficha**: [PENDIENTE: número de ficha] · **Stack**: React + FastAPI + PostgreSQL

Capas: **Front** (React) · **API** (backend) · **BD** (integración) · **E2E** (Playwright)

Reglas del referente adaptadas a un equipo de 1 persona: no hay revisor de otra capa; cada PR de
tests lo revisa la misma persona o un tercero (`.claude/referentes-sena.md`, regla 4).

| Integrante (usuario GitHub) | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 |
|---|---|---|---|---|---|---|---|---|---|
| RehnieyAL | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | Todas |

[PENDIENTE: fecha de inicio de la semana 1 del bootcamp para ubicar cada commit en su semana.]
Mientras tanto, esta es la evidencia por capa, con fecha y commit:

| Fecha | Capa | Evidencia |
|---|---|---|
| 2026-11-03 | BD | `5e22c8b` Postgres desechable y `TEST_DATABASE_URL` en `conftest.py` |
| 2026-11-03 | Front | `40f23bb` `tsconfig.test.json`; `f348d3c`, `533adff` validación zod con pruebas (PR #3) |
| 2026-11-03 | API | `760ae21` reglas de registro y contrato 422; `6bc1c81` corrige H-04/H-05 |
| 2026-11-03 | CI | `0366318` workflow con jobs `backend` y `frontend` (PR #2) |
| 2026-11-05 | API + BD | `001d631` direcciones, cuentas bancarias y liquidaciones (PR #11); encuentra H-06, H-07, H-08 |
| 2026-11-16 | CI | `bd94ed0` restaura `ci.yml` (se había quitado en `c7cba6b` el 2026-11-05) |
| 2026-11-16 | Todas | `31d87a9` cada xfail enlazado a su incidencia (#32–#41) |
| — | E2E | Sin pruebas (#43) |

## Cobertura semanal

| Semana | Frontend (%) | Backend (%) | Umbral configurado para la semana siguiente |
|---|---|---|---|
| Línea base (2026-10-21) | 7,73 líneas | 66 (sentencias, `--cov=app`) | — |
| Fase 0 (2026-11-03) | 7,73 líneas · 7,37 ramas | 65,91 líneas · 28,62 ramas | Front 7/7/7/4 · Back 60 combinado |
| Fase 2 (2026-11-03, PR #3) | 10,58 líneas · 9,20 ramas | 66,39 líneas · 30,03 ramas · 60,90 combinado | Front 10/9/10/7 · Back 60 combinado |
| S9 (2026-11-16) | 10,58 líneas · 9,2 ramas | 70,21 líneas · 34,96 ramas · 64,89 combinado | Front 10/9/10/7 · Back 64 combinado (ratchet del referente) |

Fuentes: `docs/pruebas/evidencias/` (archivos con la fecha en el nombre y `LEEME.md`).

## Registro de vocero aleatorio

| Semana | Vocero | Capa preguntada | Respuesta escrita | Resultado (Alto / Medio / Bajo) |
|---|---|---|---|---|
| S9 | RehnieyAL | [PENDIENTE: capa que escoja el instructor] | [PENDIENTE] | [PENDIENTE] |
