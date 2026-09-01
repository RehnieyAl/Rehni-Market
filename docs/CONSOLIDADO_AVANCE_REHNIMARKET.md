# Consolidado de Avance — RehniMarket

> **Criterio de evaluación:** 11 — *El proyecto debe demostrar un avance mínimo del 90 %*.
> **Fecha:** 2026-08-31. **Rama:** `feature/owner` (commit `917a647` + trabajo en curso).
> **Autor:** desarrollador único (RehnieyAL).
>
> **Regla:** los porcentajes se calculan de forma transparente (se muestra numerador
> y denominador). **No se manipulan para llegar al 90 %.** Se distingue explícitamente:
>
> - **AVANCE FUNCIONAL** = cuánto del producto de software está implementado.
> - **AVANCE DEL ENTREGABLE SENA** = cuánto de lo que exigen los 11 criterios
>   (implementado + documentado + evidenciado) está listo.

---

> **Nota de normalización Docker (posterior a este documento):** donde el texto diga `docker-compose.prod.yml` / `Dockerfile.prod` / `.env.prod` / `.env.prod.example` / imágenes `*:prod` / contenedores `*-prod` / volumen `minio_prod_data`, léase la configuración **por defecto** ya normalizada: `docker-compose.yml`, `RehniMarket-frontend/Dockerfile`, `RehniMarket-backend/.env`, `.env.public.example`, `rehni-market-backend` / `rehni-market-frontend`, `rehni-backend` / `rehni-frontend`, `minio_data`. El modo desarrollo pasa a `docker-compose.dev.yml` / `Dockerfile.dev` / `.env.dev`. Se levanta con `docker compose up -d` (sin `-f`). La evidencia `evidencias/deployment/10_prod_compose_smoke.txt` conserva el nombre antiguo. Tabla completa en `docs/DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md`.

## 1. Avance funcional

### 1.1 Requisitos Funcionales (fuente: `docs/RehniMarket-Requisitos.docx` §7)

| Estado | Cantidad | RF |
|---|---:|---|
| Implementado completo (backend + todos los clientes aplicables) | 62 | RF-001 … RF-064 salvo los de abajo |
| Implementado solo en web (no en móvil) | 2 | RF-020 (Favoritos), RF-021 (Carrito) — **nota:** el árbol de trabajo actual añade pantallas de carrito/favoritos/pedidos en móvil, pendientes de validar |
| No implementado | 1 | RF-065 (reembolso automático al cancelar un pedido individual) |
| **Total** | **65** | |

**Avance funcional RF = 62/65 = 95,4 %** (completos) · **64/65 = 98,5 %** (al menos en web).

### 1.2 Requisitos No Funcionales (fuente: `docs/RehniMarket-Requisitos.docx` §7)

| Estado | Cantidad |
|---|---:|
| Implementado | 27 |
| Parcial | 2 |
| No implementado | 2 |
| **Total** | **31** |

**Avance RNF = 27/31 = 87,1 %** (implementados) · **29/31 = 93,5 %** (implementado + parcial).

### 1.3 Por componente

| Componente | Estado | Evidencia |
|---|---|---|
| **Backend (API FastAPI)** | ✅ Completo para el alcance. 24 routers, ~36 tablas ORM, 10 migraciones Alembic, ~130 rutas OpenAPI. **113 pruebas automatizadas — 113 PASAN** (`evidencias/tests/pytest.txt`, 2026-08-31, 10:51 min); cobertura de `app/` **62 %** (`pytest-cov.txt`). Muestra de aceptación por API: **28/28 PASAN**. | `evidencias/tests/`, `evidencias/acceptance/`, `evidencias/deployment/` |
| **Frontend web (React 19)** | ✅ Completo para los 4 roles. `tsc -b` ✅, `eslint .` ✅, `vite build` ✅ (bundle 729 kB). Sin pruebas automatizadas. | `evidencias/tests/frontend-tsc-eslint.txt` |
| **App móvil (Expo)** | 🟡 Alcance mínimo garantizado (Home, detalle de producto, autenticación) + expansión en curso (carrito, checkout, pedidos, billetera, direcciones — en el árbol de trabajo). `tsc --noEmit` ✅ (strict), `eslint` ✅ (0 errores, 3 warnings cosméticos). Sin empaquetado nativo. Sin pruebas. | `evidencias/tests/mobile-lint.txt` |
| **Base de datos** | ✅ PostgreSQL 17, esquema versionado con Alembic (HEAD `a1b2c3d4e5f6`), extensiones `pg_trgm`/`unaccent`. | `evidencias/deployment/08_alembic_current.txt` |
| **Infraestructura (Docker)** | 🟡 `docker-compose.yml` (dev) con healthchecks + **`docker-compose.prod.yml` endurecido, construido y probado en aislado** (`evidencias/deployment/10_prod_compose_smoke.txt`). Falta el despliegue real con reverse proxy TLS. | `evidencias/deployment/` |
| **Documentación** | ✅ Despliegue, Manual Técnico, Manual de Usuario, Plan de Migración, Plan de Pruebas de Aceptación, Informe de Calidad, Bitácora PSP, Requisitos, Historias de Usuario, Consolidado de Avance, Auditoría Final. | `docs/` |
| **Pruebas** | 🟡 Backend 113/113. Frontend/móvil: solo verificación estática. Aceptación con usuario: pendiente (requiere persona). | `evidencias/` |
| **Despliegue** | 🟡 Local reproducible y evidenciado. Producción: no realizada. | `evidencias/deployment/` |
| **Calidad** | ✅ Informe ISO/IEC 25010 completo + plan de mejora continua (27 acciones, varias cerradas en esta entrega). | `docs/INFORME_CALIDAD_REHNIMARKET.md` |

### 1.4 Cálculo del avance funcional global

| Dimensión | Peso | Avance | Aportado |
|---|---:|---:|---:|
| RF (backend + web) | 45 % | 98,5 % | 44,3 % |
| RNF | 15 % | 90,3 % (media impl.+parcial) | 13,5 % |
| Frontend web | 15 % | 100 % (compila y funciona; sin tests) → 90 % | 13,5 % |
| App móvil | 10 % | 45 % (alcance mínimo + expansión sin validar/empaquetar) | 4,5 % |
| Infraestructura | 10 % | 80 % (dev + prod compose probado; falta despliegue real con TLS) | 8,0 % |
| Pruebas automatizadas | 5 % | 60 % (backend sí, clientes no) | 3,0 % |
| **AVANCE FUNCIONAL GLOBAL** | 100 % | | **≈ 86,8 %** |

> Si se pondera solo **backend + web** (el alcance principal comprometido), el avance
> funcional supera el **95 %**. Contando la app móvil (con menor alcance) y la
> ausencia de configuración de producción y de pruebas de cliente, el avance
> funcional global se sitúa en **≈ 86 %**.

---

## 2. Avance del entregable SENA (criterios 1–11)

Para cada criterio: **I** = implementado, **D** = documentado, **E** = evidenciado.
Estado 🟢 completo · 🟡 parcial · 🔴 pendiente. Detalle en `docs/AUDITORIA_FINAL_REHNIMARKET.md`.

| # | Criterio | I | D | E | Estado | % |
|---|---|:-:|:-:|:-:|:-:|--:|
| 1 | Preparación de plataforma e infraestructura | ✅ | ✅ | ✅ | 🟢 | 90 % |
| 2 | Plan de migración y respaldos | ✅ | ✅ | ✅ (backup + restauración ejecutados) | 🟢 | 90 % |
| 3 | Despliegue y publicación | 🟡 (local + prod compose probado; sin publicación real) | ✅ (§10.7 + `docker-compose.prod.yml`) | ✅ (`10_prod_compose_smoke.txt`) | 🟡 | 82 % |
| 4 | Gestión de usuarios y permisos | ✅ | ✅ | ✅ (pruebas de rol 401/403) | 🟢 | 90 % |
| 5 | Documentación técnica y manuales | — | ✅ (técnico + instalación + usuario) | ✅ | 🟢 | 95 % |
| 6 | Pruebas de aceptación y entrega formal | — | ✅ (plan + acta plantilla) | 🟡 (muestra técnica ejecutada; falta usuario + capacitación + acta firmada) | 🟡 | 55 % |
| 7 | Marcos de calidad y PSP | ✅ | ✅ (ISO 25010 + PSP) | ✅ (pip-audit, pytest) | 🟢 | 90 % |
| 8 | Requisitos no funcionales | ✅ | ✅ (+ plantilla k6 lista) | 🟡 (rendimiento básico medido; k6/SLO/accesibilidad pendientes) | 🟡 | 78 % |
| 9 | Registro e informe de calidad | — | ✅ | ✅ (el informe + pytest) | 🟢 | 95 % |
| 10 | Plan de mejora continua | — | ✅ (27 acciones, ~10 cerradas) | ✅ | 🟢 | 95 % |
| 11 | Avance mínimo del 90 % | ✅ | ✅ (este documento) | 🟡 (sin tablero formal) | 🟡 | 80 % |

**Avance del entregable SENA = media de los 11 criterios ≈ 85 %** (criterio 3 sube por la
plantilla de producción probada; criterio 8 se ajusta a 🟡 por honestidad — la campaña de
carga con k6 y la auditoría de accesibilidad **no** se ejecutaron).

- 🟢 Completos o casi: **7 de 11** (criterios 1, 2, 4, 5, 7, 9, 10).
- 🟡 Parciales: **criterio 3** (falta el despliegue real con TLS), **criterio 6** (pruebas
  con usuario final + capacitación + acta firmada — **requiere una persona**), **criterio 8**
  (falta k6/SLO y auditoría de accesibilidad), **criterio 11** (el consolidado sustituye al
  tablero).
- 🔴 Pendientes puros: ninguno.

---

## 3. Qué falta para el 90 % del entregable

| Acción | Criterio | ¿Automatizable? |
|---|---|---|
| Ejecutar las pruebas de aceptación **con un usuario final** y registrar resultados en `PLAN_PRUEBAS` §7/§12 | 6 | ❌ requiere una persona |
| Realizar la(s) sesión(es) de **capacitación** (lista de asistencia + grabación) | 6 | ❌ requiere una persona |
| **Diligenciar y firmar** el acta de entrega (`PLAN_PRUEBAS` §15) | 6 | ❌ requiere firmas |
| Tomar las **capturas de navegador** listadas en `PLAN_PRUEBAS` §11 y `evidencias/README.md` | 6, 3 | ❌ requiere operar la UI |
| (Opcional) Tablero de tareas con el % de avance | 11 | 🟡 este documento lo sustituye en gran parte |
| (Opcional) `docker-compose.prod.yml` + despliegue en nube/LAN accesible | 3 | 🟡 config; la publicación real es decisión del autor |

**Con las 4 primeras acciones (todas de intervención humana) el criterio 6 pasa a 🟢
y el avance del entregable supera el 90 %.**

---

## 4. Resumen

| Métrica | Valor |
|---|---|
| **Avance funcional (backend + web)** | **> 95 %** |
| **Avance funcional global (incl. móvil e infraestructura)** | **≈ 87 %** |
| **Avance del entregable SENA (11 criterios)** | **≈ 85 %** (media: 1:90 · 2:90 · 3:82 · 4:90 · 5:95 · 6:55 · 7:90 · 8:78 · 9:95 · 10:95 · 11:80) |
| Criterios 🟢 completos/casi | **7 / 11** (1, 2, 4, 5, 7, 9, 10) |
| Criterios 🟡 parciales | **4 / 11** (3, 6, 8, 11) |
| Criterios 🔴 pendientes | 0 / 11 |
| Pruebas backend | **113 / 113 PASAN** · cobertura `app/` **62 %** |
| Muestra de aceptación (`acceptance_smoke.sh`) | **28/28 PASAN** |
| Vulnerabilidades backend (pip-audit) | **8 → 1** (la restante `ecdsa` sin parche, no explotable — HS256) |
| Vulnerabilidades frontend (pnpm audit) | 7 → 6 (bump `react-router-dom`; resto de build/lint) |
| Prueba de rendimiento (`perf_test.sh`) | 900 solicitudes, **0 errores**; catálogo p95 66 ms (seq) |
| Prueba de carga con k6 | **plantilla lista, NO ejecutada** (`scripts/load_test.k6.js`) |
| Backup + restauración | ejecutados y validados (37 tablas, conteos = origen, 166 objetos) |
| Stack de producción (`docker-compose.prod.yml`) | **construido y probado en aislado**; NO desplegado a un servidor real |

**Conclusión honesta:** el proyecto **supera el 90 % en avance funcional del alcance
principal (backend + web)**. El entregable SENA global está en **≈ 85 %**. Lo que lo
separa del 90 %:

- **Criterio 6 (el principal freno):** pruebas de aceptación **con un usuario final**,
  capacitación y **acta firmada** — **no se puede completar sin una persona**.
- **Criterio 3:** el despliegue real en un servidor con reverse proxy TLS — requiere
  servidor y dominio (la plantilla ya está probada).
- **Criterio 8:** ejecutar la prueba de carga con k6 y acordar SLO; auditoría de
  accesibilidad — no realizadas (la plantilla k6 está lista).
- **Criterio 11:** el 90 % se alcanza cuando se cierre el criterio 6.

**No se manipula la metodología para aparentar el 90 %.** El avance real del entregable
es **≈ 85 %** y las acciones que faltan están listadas en la sección 3.
