# Revisión T7 · RehniMarket · 2026-11-16 (cierre, después del trabajo de S9)

> Estimación de avance, no nota. Lista oficial:
> `bc/checklist-proyectos-adso/listas-de-chequeo/listas-oferta-abierta/t7/7t-lista-de-chequeo-oa.md`.
> Comparada con la línea base del mismo día: `revision-t7-2026-11-16.md`.
>
> **Ojo con dónde está el trabajo:** los commits nuevos están en la rama local
> `docs/actualizar-manuales` (por delante de `main`, **sin push**). Por la regla 4 del skill, un
> documento que solo existe en una rama sin integrar cuenta como máximo 50 %. Por eso hay dos
> columnas: **Hoy (estricto)**, con ese tope, y **Al integrar en `main`**, la que vale después del
> push y el merge.

## 1. Resumen

- **Total ponderado al integrar en `main`: 61 %** (amarillo). Hoy, estricto: **45 %**. Línea base: **33 %**.
- Días hábiles hasta la entrega: semana del 23 al 27 de noviembre de 2026 (día exacto por confirmar): de 5 a 9 días hábiles desde el 2026-11-16.
- Bloqueantes que quedan (todos dependen del responsable):
  1. Push + PR a `main` y dos runs seguidos del CI en verde (T7-9, T7-1).
  2. Despliegue en la VM de Azure con HTTPS, etiqueta `v1.0.0` y prueba de humo contra la URL (T7-5).
  3. Simulacro por un tercero y sesión de aceptación con cliente simulado (T7-6, T7-7).

## 2. Dimensiones

| Dim | Peso | Línea base | Hoy (estricto) | Al integrar | Aporte al integrar | Variación |
|---|---|---|---|---|---|---|
| D1 Cierre de construcción | 20 % | 37 % | 52 % | 63 % | 12,7 | ↑ |
| D2 Implantación y despliegue | 25 % | 30 % | 40 % | 46 % | 11,6 | ↑ |
| D3 Aseguramiento de la calidad | 25 % | 23 % | 41 % | 76 % | 19,1 | ↑ |
| D4 Documentación de entrega | 20 % | 45 % | 50 % | 65 % | 13,0 | ↑ |
| D5 Proceso y reflexión | 10 % | 35 % | 43 % | 45 % | 4,5 | ↑ |
| **Total** | | **33,0** | **44,9** | | **60,9** | ↑ +28 |

## 3. Criterios

| # | Criterio | Base | Al integrar | Var. | Evidencia nueva | Tarea que queda |
|---|---|---|---|---|---|---|
| 1 | Sistema integrado y estable | 50 | 65 | ↑ | Gate Docker en clon limpio: 5 servicios `healthy` en 2:04 y humo 7/7 (`docs/pruebas/evidencias/2026-11-16_gate-docker.txt`); `6b054d0` | Demo en vivo sobre contenedores (`docs/demo-e2e.md`); 53 `S9383` en Sonar |
| 2 | Backlog vs. SRS | 5 | 50 | ↑ | `docs/backlog-final.md`: 36/36 RF «Hecho», 24 con pruebas | Agregar el SRS original y su % |
| 3 | Código limpio y seguridad | 55 | 75 | ↑ | 0 `print(` en `app/` (`4652db5`), 0 `console.log`; vulnerabilidades de Sonar revisadas (`docs/cierre-trimestre.md` §3) | Dependencias vulnerables (#45), roles de BD (#44) |
| 4 | Plan de implantación | 65 | 85 | ↑ | `docs/plan-implantacion.md` v1.0 con secciones 1-10, RPO/RTO, rollback, runbooks | Evidencia en la VM (§1.7, §5.2, §7.2) |
| 5 | Desplegado con URL | 15 | 20 | ↑ | `.env.example` funcional para desarrollo; `deploy/env.prod.example` | VM de Azure, URL HTTPS, `v1.0.0`, fecha en `CHANGELOG.md` |
| 6 | Despliegue reproducible | 30 | 40 | ↑ | Gate en clon limpio; guion y registro del simulacro (`docs/aceptacion/`) | Simulacro hecho por un tercero |
| 7 | Capacitación y ≥5 aceptación | 10 | 40 | ↑ | 9 casos Dado/Cuando/Entonces con criterios de salida; plan y formato de la sesión de capacitación | Ejecutar con cliente simulado, decisión y asistencia |
| 8 | ISO 25010 y aseguramiento | 5 | 75 | ↑ | `docs/plan-calidad.md` §1: 7 características con métrica, meta, evidencia y decisión | Cifras de aceptación y simulacro |
| 9 | CI ejecuta pruebas | 10 | 70 | ↑ | `.github/workflows/ci.yml` (`bd94ed0`): ruff, alembic, pytest (319 + 6 xfail, 64,91 %), eslint, tsc, Vitest (184), verificado en local | Push, PR y 2 runs verdes en `main`; activar el ruleset |
| 10 | RNF medido vs. meta | 20 | 70 | ↑ | k6 base **en local**: p95 15/32/16 ms vs. 800/600/500 ms, 0 % errores (`docs/pruebas/evidencias/k6/`) | [PENDIENTE: repetir contra la URL de producción en Azure] |
| 11 | Plan de mejora ≥3, ≥2 hechas | 55 | 90 | ↑ | `docs/plan-calidad.md` §3: 10 acciones, 6 implementadas con commit o PR | — |
| 12 | Manual técnico | 70 | 70 | = | PDF en `main`; 3.0 en la rama | Integrar la rama de manuales |
| 13 | Manual de usuario con capturas y FAQ | 50 | 40 | ↓ | Revisado más a fondo: `contenido_usuario.py` no tiene sección de preguntas frecuentes | FAQ ≥8 y capturas del sistema desplegado |
| 14 | Mantenimiento y repo limpio | 10 | 70 | ↑ | Plan §9 (calendario, fin de soporte, auditoría, soporte, runbooks); `.git.old` fuera del índice (`c8a7b28`) | Integrar a `main` (allí siguen `.git.old`, `__pycache__`, `_piloto/`) |
| 15 | Documentación de API | 50 | 80 | ↑ | `docs/api/openapi.json` (135 rutas) importable en Postman + Swagger | Swagger accesible en la URL desplegada |
| 16 | Historial coherente | 70 | 75 | ↑ | Commits convencionales nuevos; 14 incidencias (#32-#45) enlazadas desde tests y documentos | Merge por PR; `a954d28 update(docs)` sin prefijo convencional |
| 17 | Hoja de ruta y reflexión | 0 | 15 | ↑ | `docs/hoja-de-ruta-y-reflexion.md` (estructura y preguntas guía) | Escribir el texto (autor) |

## 4. Criterio mínimo para sustentar

| Condición | Base | Ahora |
|---|---|---|
| Total ≥70 % y ninguna dimensión <40 % | No cumple | No cumple (61 % al integrar) |
| 2 últimos runs de `main` con pruebas en verde | No cumple | No cumple (falta push y merge) |
| URL HTTPS con `smoke-test.sh` en verde | No cumple | No cumple (humo 7/7 solo en local) |
| Simulacro superado por un tercero | No cumple | No cumple (guion y registro listos) |
| 0 `.git.old` en `main` y rama de manuales integrada | No cumple | No cumple hasta el merge (en la rama: 0) |

## 5. Próximas tareas

| Prioridad | Tarea | Horas | Depende de | Criterio |
|---|---|---|---|---|
| P0 | Push de `docs/actualizar-manuales`, PR a `main`, 2 runs verdes de `ci.yml`, activar el ruleset | 1 | Responsable | 9, 1, 14, 12 |
| P0 | Desplegar en la VM de Azure (plan §5.2), dominio, `v1.0.0`, humo y k6 contra la URL | 4 | Cuenta de Azure, dominio | 5, 1, 10 |
| P0 | Simulacro con un tercero (`docs/aceptacion/guion-del-simulacro.md`) | 2 | Despliegue, otra persona | 6 |
| P1 | Sesión de aceptación y capacitación con cliente simulado | 2 | Despliegue, otra persona | 7 |
| P1 | SRS en el backlog, FAQ del manual, reflexión y hoja de ruta | 4 | Responsable | 2, 13, 17 |
