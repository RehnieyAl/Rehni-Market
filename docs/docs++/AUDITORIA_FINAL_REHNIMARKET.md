# Auditoría Final — RehniMarket (entrega SENA)

> **Fecha:** 2026-08-31. **Rama:** `feature/owner` (commit `917a647` + trabajo en curso).
> **Autor:** desarrollador único (RehnieyAL).
>
> Este documento consolida el estado real de los **11 criterios de evaluación** tras la
> preparación de la entrega. **No oculta pendientes.** Cada criterio se marca:
>
> - 🟢 **COMPLETO** — implementado + documentado + evidenciado; listo para sustentar.
> - 🟡 **PARCIAL** — hay base sólida y evidencia, pero falta un elemento (indicado).
> - 🔴 **PENDIENTE** — falta lo esencial del criterio.
>
> Toda la evidencia citada está en `evidencias/` (ver `evidencias/README.md`) y es
> **reproducible** con los comandos allí listados. Lo que requiere una persona (capturas
> de navegador, usuario final, capacitación, firmas) se marca explícitamente.

---

> **Nota de normalización Docker (posterior a este documento):** donde el texto diga `docker-compose.prod.yml` / `Dockerfile.prod` / `.env.prod` / `.env.prod.example` / imágenes `*:prod` / contenedores `*-prod` / volumen `minio_prod_data`, léase la configuración **por defecto** ya normalizada: `docker-compose.yml`, `RehniMarket-frontend/Dockerfile`, `RehniMarket-backend/.env`, `.env.public.example`, `rehni-market-backend` / `rehni-market-frontend`, `rehni-backend` / `rehni-frontend`, `minio_data`. El modo desarrollo pasa a `docker-compose.dev.yml` / `Dockerfile.dev` / `.env.dev`. Se levanta con `docker compose up -d` (sin `-f`). La evidencia `evidencias/deployment/10_prod_compose_smoke.txt` conserva el nombre antiguo. Tabla completa en `docs/DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md`.

## Matriz de criterios
| # | Criterio | Estado | Evidencia (archivo real) | Documento | Pendiente |
|---|---|:--:|---|---|---|
| 1 | Preparación de plataforma e infraestructura | 🟢 | `evidencias/deployment/01..10`, `evidencias/hardware/entorno_medido.txt` | `DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md` §2–7, §12 (hardware §3.0/3.1 con medición real) | Requisitos **oficiales** de producción (necesitan campaña de carga) — documentado como "sin especificación oficial". |
| 2 | Plan de migración y respaldos | 🟢 | `evidencias/backup/` (backup.txt, checksums.txt, contenido_dump.txt, restore.txt, manifest.txt) | `PLAN_MIGRACION_REHNIMARKET.md` §5–12 (§12.3 diligenciada), `scripts/backup_rehnimarket.sh`, `scripts/restore_rehnimarket.sh` | Automatización (`cron`/`systemd`) y copia externa cifrada — no implementadas (documentado). |
| 3 | Despliegue y publicación | 🟡 | `evidencias/deployment/` (stack dev `Up`+healthy; **`10_prod_compose_smoke.txt`**: stack de PRODUCCIÓN construido y probado en proyecto aislado) | `DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md` §10.7, §13; `docker-compose.prod.yml`, `Dockerfile.prod` | (a) **Publicación en producción/nube/dominio**: no realizada — requiere servidor + reverse proxy TLS. (b) Capturas de navegador. |
| 4 | Gestión de usuarios y permisos | 🟢 | `evidencias/acceptance/resultados.txt` (401/403 por rol), `evidencias/security/roles/` | `MANUAL_USUARIO_REHNIMARKET.md` §4, `MANUAL_TECNICO_REHNIMARKET.md` §12–14 | Ambiente de producción real; usuario de MinIO con mínimo privilegio (documentado como mejora). |
| 5 | Documentación técnica y manuales | 🟢 | Los documentos mismos + `evidencias/deployment/03` (Swagger) | `MANUAL_TECNICO_REHNIMARKET.md` (nuevo), `DOCUMENTACION_DESPLIEGUE` (instalación), `MANUAL_USUARIO_REHNIMARKET.md`; `README.md`/`CHANGELOG.md` del backend actualizados | Diagrama ER gráfico (el textual está en el Manual Técnico §11). |
| 6 | Pruebas de aceptación y entrega formal | 🟡 | `evidencias/acceptance/resultados.txt` (muestra técnica), `evidencias/tests/pytest.txt` (113/113) | `PLAN_PRUEBAS_ACEPTACION_REHNIMARKET.md` (§19 actualizado), `ACTA_ENTREGA_REHNIMARKET.md` (plantilla) | **Requiere persona:** ejecutar la matriz §7 con un usuario final, capturas de navegador, capacitación (asistencia + grabación), **firmar el acta**. |
| 7 | Marcos de calidad y PSP | 🟢 | `evidencias/security/pip-audit.txt`, `evidencias/tests/` | `INFORME_CALIDAD_REHNIMARKET.md` (ISO/IEC 25010, §4.2 nuevo), `BITACORA_PSP_REHNIMARKET.md` (nuevo) | Llevar el registro de tiempo PSP **en vivo** en el próximo proyecto (la bitácora actual es retrospectiva, declarado). |
| 8 | Evaluación de requisitos no funcionales | 🟡 | `evidencias/performance/resultado.txt` (rendimiento básico), `evidencias/tests/`, `evidencias/security/` | `INFORME_CALIDAD_REHNIMARKET.md` §6, §7; `scripts/load_test.k6.js` (plantilla) | **Ejecutar** `scripts/load_test.k6.js` con k6 + acordar SLO; **auditoría de accesibilidad** (WCAG/axe) — no realizada. |
| 9 | Registro e informe de evaluación de calidad | 🟢 | `INFORME_CALIDAD` §11 (hallazgos) + §12 (lecciones) + `evidencias/tests/pytest.txt` | `INFORME_CALIDAD_REHNIMARKET.md` | — (adjuntar la salida de `pytest` completo: hecho). |
| 10 | Plan de mejora continua | 🟢 | `INFORME_CALIDAD` §13 (27 acciones, ~10 cerradas en esta entrega) | `INFORME_CALIDAD_REHNIMARKET.md` §13 (responsable = "Desarrollador del proyecto", con Horizonte) | Ejecutar el resto de acciones (PENDIENTE con horizonte asignado). |
| 11 | Avance mínimo del 90 % | 🟡 | `docs/CONSOLIDADO_AVANCE_REHNIMARKET.md`, `RehniMarket-Requisitos.docx` §7 | `CONSOLIDADO_AVANCE_REHNIMARKET.md` | Avance funcional backend+web **> 95 %**; entregable SENA **≈ 85 %**. Lo separa del 90 %: criterios 6 (usuario final + acta), 3 (despliegue real con TLS) y 8 (k6 + accesibilidad). Tablero: sustituido por el consolidado. |

**Resumen: 7 🟢 · 4 🟡 · 0 🔴.**  (los 4 🟡 son 3, 6, 8 y 11 — ver detalle)

---

## Detalle por criterio

### 🟢 Criterio 1 — Preparación de plataforma e infraestructura

- **Implementado:** `docker-compose.yml` con 4 servicios + healthchecks; versiones de SW
  fijadas (`pyproject.toml`, `uv.lock`, `package.json`, Dockerfiles).
- **Evidenciado (2026-08-31):** `docker compose up -d` levanta los 4 servicios;
  `/health/database` OK; `/health/internet` OK; `/docs` y `/openapi.json` 200 (130 rutas);
  frontend `:5173` 200; MinIO health 200; `alembic current` = `a1b2c3d4e5f6 (head)`.
  Hardware medido: 12 hilos / 7 GiB RAM / NVMe; contenedores ≈613 MiB RAM en reposo;
  imágenes ≈10,4 GB.
- **Pendiente:** requisitos **oficiales** de producción (necesitan pruebas de carga
  formales) — el documento lo declara explícitamente como "sin especificación oficial".

### 🟢 Criterio 2 — Plan de migración y respaldos

- **Implementado:** `scripts/backup_rehnimarket.sh` (PostgreSQL `pg_dump -F c` + MinIO
  `mc mirror` + SHA-256 + manifiesto + rotación) y `scripts/restore_rehnimarket.sh`
  (restauración en entorno aislado + validación). `.gitignore` / `.dockerignore`
  actualizados para no versionar backups.
- **Evidenciado (2026-08-31):** un backup real (`TS=2026-08-31_16-59`): dump 220 KB /
  37 tablas, tar MinIO 8,9 MB / 166 objetos, SHA-256 verificado. Restauración en entorno
  aislado: **37 tablas, conteos idénticos al origen** (roles 4, users 11, company 6,
  products 33, product_variants 112, orders 22, order_items 30, wallets 4,
  wallet_transactions 26), 166/166 objetos, extensiones OK, `rehni_search_norm('Audífonos')`
  = `audifonos`, `alembic_version` = `a1b2c3d4e5f6`. Entorno destruido al terminar.
- **Pendiente:** agendar el script (`cron`/`systemd`) y la copia externa cifrada
  (documentado en §15 del plan como PROPUESTO).

### 🟡 Criterio 3 — Despliegue y publicación

- **Demo local:** despliegue completo y reproducible desde el `docker-compose.yml`
  versionado (healthchecks; los 4 servicios *healthy*). Migraciones automáticas. Swagger.
- **Configuración de PRODUCCIÓN entregada y PROBADA (2026-08-31):** `docker-compose.prod.yml`
  + `RehniMarket-frontend/Dockerfile.prod` (Nginx) + `nginx.conf` + `.dockerignore` +
  `.env.prod.example`. Se **construyó y se levantó en un proyecto Compose aislado**
  (`rehni-prod-test`, puertos 18000/18080): los 4 servicios arrancaron respetando los
  `healthcheck`, `/health/database` OK, SPA servido por Nginx con *fallback* y cabeceras de
  seguridad, **postgres/minio sin puertos en el host**, backend solo en `127.0.0.1` y sin
  `--reload`. Evidencia: `evidencias/deployment/10_prod_compose_smoke.txt`. Stack de prueba
  desmontado con `down -v`.
- **Correcciones de esta entrega:** `build_media_url()` usa `URL_BACKEND`; CORS restringido;
  `RATE_LIMIT_ENABLED`; healthchecks; Swagger con título/versión; MinIO fijado por digest en prod.
- **Pendiente (requiere servidor + persona):**
  1. **Despliegue real** en un servidor con dominio y **reverse proxy con TLS** (Caddy/
     Traefik/Nginx) delante. *(No se afirma que exista publicación en producción.)*
  2. Capturas de navegador del frontend y de la app móvil en Expo Go.
  3. Usuario/política de MinIO de mínimo privilegio (mejora).

### 🟢 Criterio 4 — Gestión de usuarios y permisos

- **Implementado:** 5 roles, middleware con lista blanca por rol + revalidación de estado
  en cada petición, `bcrypt`, JWT access+refresh, verificación de correo.
- **Evidenciado (2026-08-31):** `scripts/acceptance_smoke.sh` — ruta protegida sin token →
  401; comprador → `/admin/...` → 403; comprador → `/company/dashboard/me` → 403;
  comprador → `POST /wallet/recharge` → no autorizado. Login exitoso por credenciales
  válidas; `INVALID_CREDENTIALS` sin revelar cuál dato falló.
- **Pendiente:** ambiente de producción; usuario de MinIO con mínimo privilegio (mejora).

### 🟢 Criterio 5 — Documentación técnica y manuales

- **Manual técnico:** `docs/MANUAL_TECNICO_REHNIMARKET.md` (nuevo) — 30 secciones:
  arquitectura, capas, modelos y relaciones, ER textual, autenticación, JWT, roles,
  productos, empresas, checkout, PostgreSQL, Alembic, MinIO, Docker, variables de entorno,
  endpoints, Swagger, errores, seguridad, pruebas, despliegue, limitaciones, mantenimiento.
- **Manual de instalación:** `DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md` §7 y §13.
- **Manual de usuario final:** `MANUAL_USUARIO_REHNIMARKET.md` (ya existía; verificado).
- **Correcciones:** `RehniMarket-backend/README.md` y `CHANGELOG.md` reescritos (ya no
  dicen "Lubix" como nombre actual; versiones 1.3.x–2.4 reflejadas). `Historia de usuario.md`
  (raíz) reencuadrado como no autoritativo (fuente = `docs/RehniMarket-HU.md`).
  `ARQUITECTURA-VARIANTES.md`: cadena de migraciones actualizada a HEAD real.
  `DOCUMENTACION_DESPLIEGUE`: "12 migraciones / 8 tests" → "10 migraciones / 7 archivos /
  113 tests".
- **Pendiente:** un diagrama ER **gráfico** (el textual está en el Manual Técnico §11).

### 🟡 Criterio 6 — Pruebas de aceptación y entrega formal

- **Evidenciado (2026-08-31):**
  - **Suite `pytest` del backend: 113/113 PASAN** (`evidencias/tests/pytest.txt` +
    `pytest-cov.txt`, cobertura de `app/` **62 %**), incluye checkout atómico y concurrencia.
  - **Muestra técnica de aceptación: `scripts/acceptance_smoke.sh` → 28/28 PASAN**
    (`evidencias/acceptance/resultados.txt`): registro, `EMAIL_NOT_VERIFIED`, cooldown
    `429`, verificación con código real, login, `INVALID_CREDENTIALS`, refresh, protección
    de rutas (401), roles (comprador→admin/empresa/`wallet/recharge` → 403), catálogo,
    búsqueda difusa, ofertas, novedades, variante obligatoria, carrito + persistencia,
    checkout sin saldo (`402 INSUFFICIENT_BALANCE`, sin pedido), **checkout con saldo**
    (pedido creado, saldo −119 = 100 + IVA 19 %, carrito vaciado), listado de pedidos.
  - **Roles y permisos:** `evidencias/security/roles/roles_permisos.txt`.
  - Verificación estática frontend/móvil ✅.
- **Pendiente — REQUIERE INTERVENCIÓN HUMANA:**
  1. Ejecutar la matriz `PLAN_PRUEBAS` §7 **con un usuario final** operando la interfaz.
  2. Tomar las **capturas de navegador** de §11.
  3. Realizar la(s) **capacitación(es)** (§14) — lista de asistencia + grabación.
  4. **Diligenciar y firmar** `docs/ACTA_ENTREGA_REHNIMARKET.md`.

### 🟢 Criterio 7 — Marcos de calidad y PSP

- **ISO/IEC 25010 / 25000 / CMMI:** `INFORME_CALIDAD_REHNIMARKET.md` (evaluación de las 8
  características + §4.2 con todas las verificaciones ejecutadas).
- **PSP:** `docs/BITACORA_PSP_REHNIMARKET.md` (nuevo) — planificación, seguimiento por
  hitos reales de Git, **registro de 20 defectos** (proceso + código + deuda) con fase de
  inyección/detección/corrección, esfuerzo estimado retrospectivo, estimado vs. real,
  lecciones y plan de mejora del proceso personal. Declara abiertamente que el registro de
  tiempo no se llevó en vivo.
- **`pip-audit` / `pnpm audit` ejecutados:** backend **8 → 1** vulnerabilidad (la restante,
  `ecdsa`, sin parche y **no explotable** — HS256, no ECDSA); frontend **7 → 6** (bump de
  `react-router-dom` a 7.18.3; resto de build/lint); móvil 7 (transitivas de Expo).
  Evidencia: `evidencias/security/`.

### 🟡 Criterio 8 — Requisitos no funcionales

- **Evidenciado:** rendimiento medido (`evidencias/performance/resultado.txt`): 900
  solicitudes, **0 errores**, catálogo p95 66 ms secuencial / 353 ms concurrente x10,
  búsqueda p95 28 ms, detalle p95 26 ms. Antes **no existía ninguna medición**. Seguridad,
  mantenibilidad, portabilidad, compatibilidad, responsive: `INFORME_CALIDAD` §6/§7.
- **Procedimiento de carga PREPARADO:** `scripts/load_test.k6.js` (plantilla k6 lista
  para ejecutar, con objetivos de partida — **NO ejecutada, sin resultados k6**).
- **Pendiente:** ejecutar `scripts/load_test.k6.js` con k6 instalado y acordar SLO en el
  acta; auditoría de accesibilidad (WCAG / axe / Lighthouse) — **no realizada**.

### 🟢 Criterio 9 — Registro e informe de evaluación de calidad

- `INFORME_CALIDAD_REHNIMARKET.md`: registro de hallazgos (§11: positivos, negativos,
  riesgos, pendientes), lecciones aprendidas (§12), matriz de calidad (§14), estado final
  (§17). Actualizado con §4.2 (verificaciones ejecutadas) y §13 (estado de las acciones).
- Salida de `pytest -q` completo (113/113) adjunta.

### 🟢 Criterio 10 — Plan de mejora continua

- `INFORME_CALIDAD` §13: **27 acciones** (10 correctivas + 9 preventivas + 8 mejoras),
  cada una con ID, acción, hallazgo que resuelve, prioridad, **horizonte** y **estado**.
  Responsable único: "Desarrollador del proyecto".
- **~10 acciones cerradas en esta entrega** (CORS, build_media_url, SECRET_KEY,
  README/CHANGELOG, .env.example, healthchecks, backup+restauración, PSP, pip-audit,
  rendimiento básico). El resto PENDIENTE con horizonte asignado (corto/medio plazo).

### 🟡 Criterio 11 — Avance mínimo del 90 %

- `docs/CONSOLIDADO_AVANCE_REHNIMARKET.md` — cálculo transparente:
  - **Avance funcional (backend + web): > 95 %** (62/65 RF completos; 27/31 RNF).
  - **Avance funcional global (incl. móvil e infra): ≈ 86 %.**
  - **Avance del entregable SENA (11 criterios): ≈ 85 %.**
- **Lo que separa el entregable del 90 %** es exclusivamente el **criterio 6** (pruebas con
  usuario final + capacitación + acta firmada), no automatizable.

---

## Cambios de código de esta entrega (resumen)

Todos mínimos, sin cambiar arquitectura ni eliminar funcionalidad. Detalle en el
informe final de la sesión.

| Archivo | Cambio | Riesgo |
|---|---|---|
| `app/services/NasService.py` | `build_media_url()` usa `config.URL_BACKEND` (antes IP fija) | Nulo — comportamiento idéntico en el entorno actual |
| `app/middleware/CorsMiddleware.py` | Orígenes desde `URL_FRONTEND` + locales; `allow_credentials` coherente | Bajo — el frontend usa `Authorization: Bearer`, no cookies |
| `app/middleware/RateLimitMiddleware.py` + `app/Config.py` + `app/main.py` | Rate limit activable por `RATE_LIMIT_ENABLED` (default `false` = comportamiento actual) | Nulo por defecto |
| `app/main.py` | `title`/`version`/`description` en `FastAPI(...)` | Nulo |
| `.env.example` | `SECRET_KEY` con placeholder + instrucción; `USER_NAME_ADMIN`; `RATE_LIMIT_ENABLED` | Solo plantilla |
| `pyproject.toml` + `uv.lock` | `click 8.3.3`, `pip 26.2`, `pyasn1 0.6.4`, `pydantic-settings 2.14.2` (CVE: 8→1) | Bajo — no en rutas probadas; **113/113 pytest pasan** con estas deps |
| `RehniMarket-frontend/package.json` + `pnpm-lock.yaml` | `react-router-dom` 7.18.1 → 7.18.3 (CVE CSRF en modo RSC, no usado) | Bajo — patch dentro de `^7.18`; `tsc`/`eslint`/`vite build` OK |
| `docker-compose.yml` | `healthcheck` para postgres, minio, backend | Bajo — informativo, sin `condition: service_healthy` |
| `.gitignore` / `RehniMarket-backend/.dockerignore` | Ignorar `backups/`, `*.dump`, `*.tar.gz`, `*.sha256` | Nulo |
| **NUEVO** `docker-compose.prod.yml`, `RehniMarket-frontend/Dockerfile.prod`, `nginx.conf`, `.dockerignore`, `RehniMarket-backend/.env.prod.example` | Configuración de producción endurecida (no toca el compose de desarrollo) | Nulo para el flujo actual — construida y probada en aislado |
| **NUEVO** `scripts/load_test.k6.js` | Plantilla de prueba de carga (no ejecutada) | Nulo |
| `RehniMarket-backend/.gitignore` | Añadido `.env.prod` / `.env.*` (con excepciones `*.example`) | Nulo |
| `RehniMarket-backend/README.md`, `CHANGELOG.md` | Reescritos al estado real | Solo documentación |
| `RehniMarket-backend/app/docs/ARQUITECTURA-VARIANTES.md` | Cadena de migraciones al HEAD real | Solo documentación |
| `Historia de usuario.md` (raíz) | Reencuadrado como no autoritativo (contenido histórico conservado) | Solo documentación |

**Verificación tras los cambios:** `pytest` 113/113 · `tsc -b` frontend 0 · `eslint`
frontend 0 · `tsc --noEmit` móvil 0 · `vite build` OK · `docker compose config` (dev y
**prod**) válido · stack de desarrollo *healthy* · stack de **producción** construido y
levantado en aislado (`evidencias/deployment/10_prod_compose_smoke.txt`).

---

*Fin de la Auditoría Final — RehniMarket.*
