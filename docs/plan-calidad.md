# Plan de aseguramiento de calidad, informe de evaluación y plan de mejora — RehniMarket

> Cubre los criterios T7-8, T7-10 y T7-11 de la lista de chequeo
> (`checklist-proyectos-adso/listas-de-chequeo/listas-oferta-abierta/t7/7t-lista-de-chequeo-oa.md`).
> Fecha: 2026-11-16. Las cifras salen de comandos reales cuyas salidas están en `docs/pruebas/evidencias/`.

## 1. Estándar adoptado: ISO/IEC 25010 (modelo de calidad del producto)

Se toman las características del modelo que pesan en un marketplace con dinero interno. Para cada
una: la métrica, la meta, la evidencia actual y **la decisión del proyecto que provocó**.

| Característica | Métrica | Meta | Evidencia (2026-11-16) | Decisión que tomó el proyecto por esta característica |
|---|---|---|---|---|
| Adecuación funcional | % de historias RF «Hecho»; casos de aceptación que pasan | ≥ 90 %; 9/9 | 36/36 RF (`docs/backlog-final.md`); aceptación [PENDIENTE] | Backlog medido contra el catálogo RF; los defectos de dinero (H-07, H-08) quedan como incidencias P1 |
| Fiabilidad (tolerancia a fallos, recuperabilidad) | Reembolsos duplicados; RPO/RTO | 0; 24 h / 4 h | Reembolso idempotente con índice único parcial (migración `c3d5e7f9a1b2`) y pruebas de `test_order_cancel_refund.py`; restauración medida 12,8 s (plan §3.5) | Índice único en la BD en vez de solo una comprobación en código; respaldo con huella y `--verify-only` |
| Eficiencia de desempeño | p95 de las rutas públicas y tasa de error bajo carga | p95 catálogo < 800 ms, búsqueda < 600 ms, detalle < 500 ms; errores < 1 % | Ver §2: **medición en local** (p95 15–32 ms, 0 % de errores). [PENDIENTE: repetir contra la URL de producción en Azure] | PgBouncer en modo transacción y sesión de solo lectura para `/public` tras el bloqueo del pool bajo k6 |
| Seguridad | Vulnerabilidades de Sonar; pruebas de autorización; avisos de dependencias | 0 vulnerabilidades sin revisar; 100 % de rutas por rol probadas | 8 vulnerabilidades en Sonar: `S6470` corregida (#46), `S2068` registrada (#47) y 6 de configuración de Docker y HTTP interno como deuda (`docs/cierre-trimestre.md` §4); 12 pruebas de autorización; dependencias: 0 avisos en backend y en el frontend de producción tras la auditoría de v1.0.1 (#45, `docs/calidad/auditoria-dependencias-2026-11-16.md`) | El rol se lee de la BD en cada petición (no del JWT); rate limit por IP real solo desde Caddy; secretos fuera de Git; un único owner garantizado en tres capas (§1.2, #54); auditoría de dependencias en el CI y Dependabot semanal (M-08) |
| Mantenibilidad (capacidad de prueba, modificabilidad) | Cobertura; code smells; deuda | Cobertura ≥ 80 % (referente); sin smells nuevos en el Quality Gate | Backend 70,21 % líneas / 64,89 % combinado; frontend 10,58 %; Quality Gate `OK` | Umbral por ratchet (solo sube: 60 → 64); CI con pruebas en cada push y PR; Sonar en cada PR |
| Capacidad de interacción (usabilidad) | Errores con mensaje legible; tareas de capacitación sin ayuda | 100 % de errores con `{code, message}`; tarea < 5 min | H-04 y H-05 corregidos (`6bc1c81`); sesión de capacitación [PENDIENTE] | Contrato único de errores y validación en vivo espejo del backend (zod) |
| Flexibilidad (portabilidad, instalabilidad) | Instalación desde cero solo con el manual | Gate Docker y simulacro superados | Gate en clon limpio superado (`docs/pruebas/evidencias/2026-11-16_gate-docker.txt`); simulacro [PENDIENTE] | Un solo `docker-compose.yml` y un solo `Caddyfile` para todos los ambientes; solo cambia el `.env` |

### 1.1 Plan de aseguramiento

| Actividad | Cuándo | Herramienta | Responsable | Evidencia |
|---|---|---|---|---|
| Pruebas automáticas con umbral de cobertura | Cada push y PR | `.github/workflows/ci.yml` | Responsable técnico | Runs de GitHub Actions |
| Análisis estático | Cada push a `main`/`develop` y PR | SonarCloud (`sonarqube.yml`) | Responsable técnico | Quality Gate |
| Registro de hallazgos con su prueba | Al encontrar un defecto | `docs/pruebas/REGISTRO.md` + `xfail(strict=True)` + incidencia | Responsable técnico | Incidencias `hallazgo-pruebas` |
| Prueba de humo | Cada despliegue | `scripts/smoke-test.sh` | Administrador de la VM | Salida en el plan §6.4 |
| Prueba de carga | Cada versión mayor y antes de la entrega | k6 (`tests/load/`) | Responsable técnico | `docs/pruebas/evidencias/k6/` |
| Auditoría de dependencias | Cada push y PR, y Dependabot semanal | Job `auditoria` del CI (`pip-audit`, `pnpm audit --prod --audit-level=high`) | Responsable técnico | Runs de GitHub Actions; `docs/calidad/auditoria-dependencias-2026-11-16.md` |
| Pruebas de aceptación | Cada entrega | `docs/aceptacion/pruebas-de-aceptacion.md` | Cliente simulado | Decisión firmada |

### 1.2 Seguridad: defensa en profundidad para el único owner

El owner es el rol de mayor privilegio y RehniMarket admite **uno solo**, creado desde PostgreSQL
([`deploy/OWNER.md`](../deploy/OWNER.md)). Una sola barrera no basta: si el control del backend
falla o alguien entra por `psql`, otra capa debe seguir impidiendo un segundo owner (ISO/IEC 25010,
seguridad: confidencialidad e integridad; la responsabilidad se conserva porque las acciones del
panel quedan en `admin_activities`).

| Capa | Control | Qué cubre | Prueba |
|---|---|---|---|
| Base de datos | `users.is_owner` calculada por trigger a partir de `roles.name`; índice único parcial `uq_users_single_owner`; trigger `roles_protect_owner` (no borrar ni renombrar el rol) | Cualquier camino, incluidos `psql`, scripts y dos transacciones simultáneas; no depende del id del rol | `tests/test_single_owner.py::TestDatabaseGuarantee` (incluye la prueba concurrente) |
| Backend | `PATCH /admin/dashboard/user/update-information/{id}` y `…/status/{id}` responden 403 si piden el rol owner o si la cuenta destino es owner, sin importar quién actúe | La API, aunque el frontend se salte | `tests/test_single_owner.py::TestApiNeverAssignsOwner` |
| Frontend | El panel no ofrece «Propietario» ni deja editar o bloquear la cuenta owner | Errores del usuario en el panel | Revisión de `UserDetailModal.tsx` y `Users.tsx` |
| Procedimiento | `deploy/sql/crear-owner.sql`: transacción, rechaza un segundo owner, valida datos y clave de 8 a 72 bytes; la clave llega por variable de entorno | La creación inicial y los errores de operación | `tests/test_crear_owner_sql.py` |

## 2. Informe de evaluación: RNF de rendimiento medido contra su meta

> **Medición en local**, no en producción. [PENDIENTE: repetir contra la URL de producción en Azure]

| Campo | Valor |
|---|---|
| RNF | Las consultas públicas del catálogo responden rápido bajo concurrencia (metas de `tests/load/02-baseline.js`) |
| Meta | p95 catálogo < 800 ms, búsqueda < 600 ms, detalle < 500 ms; `http_req_failed` < 1 % |
| Herramienta y escenario | k6, `tests/load/02-baseline.js`: 10 usuarios virtuales constantes durante 2 min, solo `GET` a `/public/*` |
| Ambiente | **Local**: equipo de desarrollo, stack completo de `docker-compose.yml`, API directa `http://127.0.0.1:8000` (sin Caddy). No es el servidor de producción |
| Fecha | 2026-11-16 |

| Métrica | Meta | Medido | ¿Cumple? |
|---|---|---|:---:|
| p95 catálogo (`duracion_catalogo`) | < 800 ms | 15,02 ms | ✅ |
| p95 búsqueda (`duracion_busqueda`) | < 600 ms | 31,63 ms | ✅ |
| p95 detalle (`duracion_detalle`) | < 500 ms | 16,28 ms | ✅ |
| Peticiones fallidas | < 1 % | 0,00 % (0 de 5257) | ✅ |
| p95 global | — | 27,18 ms | — |
| Rendimiento | — | 42,96 peticiones/s | — |

Salida completa: `docs/pruebas/evidencias/k6/2026-11-16_02-baseline.txt` y
`2026-11-16_02-baseline-summary.json`. Medición previa con 50 usuarios, también en local (04/11/2026, plan §1.4):
42 940 peticiones, 0 % de fallos, p95 = 75,91 ms.

**Limitaciones**: el ambiente es local, k6 corre en el mismo equipo y no hay concurrencia
acordada con el cliente (plan, decisión D-1). [PENDIENTE: repetir contra la URL de producción en Azure] con
`K6_BASE_URL=https://api.<dominio>` y la concurrencia acordada. El flujo autenticado y el
checkout no están en los escenarios (`tests/load/README.md`).

## 3. Plan de mejora

Acciones que salen de la verificación de calidad (Sonar, pruebas, gate, auditoría). M-01 a M-06,
M-08, M-11 y M-12 ya están implementadas.

| # | Acción | Origen (verificación) | Característica ISO 25010 | Estado | Evidencia |
|---|---|---|---|---|---|
| M-01 | Corregir los bugs de Sonar `S2259` y `S9383` en `AuthProvider` y fijar la acción de Sonar por SHA (`S7637`) | SonarCloud | Fiabilidad, seguridad | Implementada | PR #27 y #28 (`18b3d61`, `cb29acd`, `a03532c`) |
| M-02 | Reducir code smells (`S6903` `datetime.utcnow`, `S6853` etiquetas del modal) | SonarCloud | Mantenibilidad, usabilidad | Implementada | PR #29 (`89f50ce`, `99925f2`) |
| M-03 | Contrato único de errores `{code, message}` para validaciones (H-04, H-05) | Pruebas de API | Usabilidad | Implementada | `6bc1c81` |
| M-04 | Restaurar el CI con pruebas y subir el umbral de cobertura por ratchet | Revisión T7 (línea base) | Mantenibilidad | Implementada | `bd94ed0`, `c7c34e1` |
| M-05 | Hacer que un clon limpio arranque solo con `cp .env.example .env` | Gate Docker | Flexibilidad | Implementada | `6b054d0` + evidencia del gate |
| M-06 | Quitar código de depuración (`print`) y archivos basura del repositorio | Code review final | Mantenibilidad | Implementada | `4652db5`, `c8a7b28` |
| M-11 | Excluir `.git.old` y `.env.*` del contexto de la imagen del backend (Sonar `S6470`) | SonarCloud (revisión de falsos positivos) | Seguridad | Implementada | #46, `RehniMarket-backend/.dockerignore` |
| M-07 | Corregir H-07 y H-08 en liquidaciones | Pruebas de API + BD | Adecuación funcional, fiabilidad | Pendiente (P1) | #36, #37 |
| M-08 | Actualizar dependencias vulnerables y activar Dependabot | Auditoría de dependencias | Seguridad | Implementada (v1.0.1) | #45; python-jose → PyJWT, 0 avisos en backend y frontend de producción, job `auditoria` en el CI, `.github/dependabot.yml`, excepciones con fecha en `.github/auditoria-excepciones.txt`; informe en `docs/calidad/auditoria-dependencias-2026-11-16.md` |
| M-09 | Separar el rol de BD de la app del rol dueño | Revisión de seguridad (plan §7.3) | Seguridad | Pendiente (P2) | #44 |
| M-10 | Subir la cobertura del frontend y agregar E2E | Estrategia de pruebas | Mantenibilidad | Pendiente (P2) | #42, #43 |
| M-12 | Garantizar un único owner en base de datos, API y panel (defensa en profundidad, §1.2) | Revisión de código (B-06) | Seguridad | Implementada | #54 |
