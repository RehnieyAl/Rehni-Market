# Informe de Aseguramiento y Calidad del Software — RehniMarket

> **Módulo:** B — Aseguramiento y Calidad del Software (SENA — Tecnólogo ADSO, Sexto Trimestre).
> **Criterios cubiertos:** 7 (Marcos de calidad y PSP), 8 (Requisitos no funcionales), 9 (Registro e informe de evaluación de calidad), 10 (Plan de mejora continua).
> **Fecha de elaboración:** 2026-08-30
> **Rama analizada:** `feature/owner` — último commit del repositorio raíz: `917a647 ver 2.4`.
>
> **Alcance del análisis:** evaluación estática del repositorio `RehniMarket` (backend, frontend web y aplicación móvil) y de su configuración de despliegue. La evaluación se basa **únicamente en evidencia verificable en el código y los archivos del proyecto**. No se realizaron pruebas de carga, pruebas con usuarios reales, escaneos de vulnerabilidades automatizados ni auditorías externas. Cuando una afirmación no puede sustentarse con evidencia del repositorio, se marca explícitamente como `PENDIENTE — NO VERIFICADO`.
>
> **Vocabulario de estado usado en todo el documento:**
> - **IMPLEMENTADO** — el código correspondiente existe y es coherente.
> - **VERIFICADO** — además de existir, se comprobó su comportamiento durante este análisis (p. ej. ejecutando una prueba o un comando).
> - **PARCIAL** — implementado con limitaciones o solo en una parte del sistema.
> - **NO VERIFICADO** — el código existe pero su funcionamiento no se comprobó en este análisis.
> - **PENDIENTE** — no existe en el proyecto; forma parte del alcance futuro o de una mejora recomendada.

---

> **Nota de normalización Docker (posterior a este documento):** donde el texto diga `docker-compose.prod.yml` / `Dockerfile.prod` / `.env.prod` / `.env.prod.example` / imágenes `*:prod` / contenedores `*-prod` / volumen `minio_prod_data`, léase la configuración **por defecto** ya normalizada: `docker-compose.yml`, `RehniMarket-frontend/Dockerfile`, `RehniMarket-backend/.env`, `.env.public.example`, `rehni-market-backend` / `rehni-market-frontend`, `rehni-backend` / `rehni-frontend`, `minio_data`. El modo desarrollo pasa a `docker-compose.dev.yml` / `Dockerfile.dev` / `.env.dev`. Se levanta con `docker compose up -d` (sin `-f`). La evidencia `evidencias/deployment/10_prod_compose_smoke.txt` conserva el nombre antiguo. Tabla completa en `docs/DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md`.

## Tabla de contenido

1. [Introducción](#1-introducción)
2. [Objetivos](#2-objetivos)
3. [Alcance de la evaluación](#3-alcance-de-la-evaluación)
4. [Metodología de evaluación](#4-metodología-de-evaluación)
5. [Marco de calidad](#5-marco-de-calidad)
6. [Evaluación según ISO/IEC 25010](#6-evaluación-según-isoiec-25010)
7. [Evaluación de requisitos no funcionales](#7-evaluación-de-requisitos-no-funcionales)
8. [Seguridad](#8-seguridad)
9. [Mantenibilidad](#9-mantenibilidad)
10. [Pruebas y verificación](#10-pruebas-y-verificación)
11. [Registro de hallazgos](#11-registro-de-hallazgos)
12. [Lecciones aprendidas](#12-lecciones-aprendidas)
13. [Plan de mejora continua](#13-plan-de-mejora-continua)
14. [Matriz de calidad](#14-matriz-de-calidad)
15. [Conclusiones](#15-conclusiones)
16. [Relación con criterios de evaluación SENA](#16-relación-con-criterios-de-evaluación-sena)
17. [Estado final de calidad](#17-estado-final-de-calidad)

---

## 1. Introducción

Este informe documenta la evaluación de la calidad del software del proyecto **RehniMarket**, una plataforma de comercio electrónico de tipo *marketplace* compuesta por tres aplicaciones:

- **`RehniMarket-backend/`** — API REST construida con FastAPI (Python 3.13), responsable de toda la lógica de negocio, autenticación, autorización, acceso a datos, migraciones y comunicación con los servicios de infraestructura.
- **`RehniMarket-frontend/`** — aplicación web *Single Page Application* con React 19 + Vite, para compradores, empresas y administración.
- **`RehniMarket-mobile/`** — aplicación móvil (Expo / React Native), orientada exclusivamente a compradores y visitantes.

El propósito del informe es **aplicar marcos de calidad reconocidos (ISO/IEC 25010 y la familia ISO/IEC 25000) como referencia** para evaluar de forma objetiva el estado del producto, dejar un **registro estructurado de hallazgos**, y proponer un **plan de mejora continua** basado en evidencia real. El informe forma parte del proceso de aseguramiento de calidad del proyecto y sirve como insumo para la toma de decisiones técnicas y para la sustentación académica del Módulo B.

Este documento **no certifica** el cumplimiento de ninguna norma ISO ni nivel CMMI: dichos marcos se usan únicamente como **referencia conceptual** para estructurar la evaluación.

---

## 2. Objetivos

### 2.1 Objetivo general

Evaluar la calidad del software del proyecto RehniMarket aplicando ISO/IEC 25010 como marco de referencia, identificar sus fortalezas y debilidades a partir de evidencia verificable del repositorio, y definir un plan de mejora continua priorizado.

### 2.2 Objetivos específicos

1. Determinar el estado de las ocho características de calidad de producto de ISO/IEC 25010 en RehniMarket, con evidencia concreta (archivos, funciones, endpoints).
2. Evaluar el cumplimiento de los requisitos no funcionales relevantes (usabilidad, rendimiento, seguridad, disponibilidad, mantenibilidad, escalabilidad, compatibilidad, portabilidad, accesibilidad y adaptación a dispositivos).
3. Analizar la postura de seguridad de la solución (autenticación, autorización, gestión de secretos, exposición de servicios, validación de datos y manejo de errores) y clasificar los hallazgos por severidad.
4. Evaluar la mantenibilidad del código (arquitectura, separación de responsabilidades, tipado, documentación, migraciones, duplicación y dependencias).
5. Inventariar y caracterizar las pruebas automatizadas existentes, sin ejecutar pruebas destructivas.
6. Consolidar un registro de hallazgos (positivos, negativos, riesgos y pendientes) y un plan de mejora continua con acciones correctivas, preventivas y de mejora futura.

---

## 3. Alcance de la evaluación

| Parte del proyecto | ¿Analizada? | Detalle |
|---|:--:|---|
| **Backend** (`RehniMarket-backend/`) | Sí | `app/` (24 archivos de router, 28 archivos de modelo ORM, 59 archivos de servicio, 21 repositorios, 29 archivos de esquema Pydantic), `alembic/` (10 migraciones), `Dockerfile`, `pyproject.toml`, `uv.lock`. |
| **Frontend web** (`RehniMarket-frontend/`) | Sí | `src/` (11 *features*, ~166 componentes `.tsx`), `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `Dockerfile`, `package.json`, `pnpm-lock.yaml`. |
| **Aplicación móvil** (`RehniMarket-mobile/`) | Sí | `src/` (rutas Expo Router, ~38 pantallas), `app.json`, `babel.config.js`, `tsconfig.json`, `eslint.config.js`, `package.json`. |
| **Base de datos** | Sí | PostgreSQL 17 (`docker-compose.yml`), modelos SQLAlchemy 2.0, migraciones Alembic, `app/database/Connection.py`. |
| **Docker / infraestructura** | Sí | `docker-compose.yml` (servicios `minio`, `postgres`, `backend`, `frontend`), `Dockerfile` de backend y frontend. |
| **APIs** | Sí | Routers FastAPI, esquemas de request/response, `app/core/ErrorCodes.py` (102 códigos), documentación automática de FastAPI (`/docs`). |
| **Seguridad** | Sí | `app/middleware/` (Auth, CORS, RateLimit, RolePermissions, PublicRoutes), `app/services/authentication/`, `app/utils/Security.py`, `.env.example`, `.gitignore`, `.dockerignore`. |
| **Pruebas** | Sí | `RehniMarket-backend/tests/` (7 archivos, 113 funciones `test_`, 25 clases de prueba, `conftest.py`). |
| **Documentación** | Sí | `README.md` (backend y frontend), `RehniMarket-backend/CHANGELOG.md`, `RehniMarket-backend/app/docs/` (`AUDITORIA.md`, `ARQUITECTURA-VARIANTES.md`), `docs/RehniMarket-HU.md`, `docs/RehniMarket-Requisitos.docx`, y los documentos previos `DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md` y `docs/MANUAL_USUARIO_REHNIMARKET.md`. |
| **Arquitectura** | Sí | Separación por capas (router → service → repository → model), contexto/*providers* en el frontend, Expo Router en móvil. |

**Fuera del alcance de esta evaluación:** pruebas de penetración, escaneo dinámico de vulnerabilidades (DAST), análisis de composición de software automatizado (SCA) ejecutado, pruebas de carga/estrés, pruebas de usabilidad con usuarios, y validación funcional exhaustiva de cada flujo en ejecución.

---

## 4. Metodología de evaluación

La evaluación fue **estática y basada en evidencia**. Se aplicaron las siguientes técnicas sobre el repositorio en su estado actual:

| Técnica | Cómo se aplicó |
|---|---|
| **Inspección de código** | Lectura directa de routers, servicios, repositorios, modelos, middleware y componentes de UI. |
| **Revisión de arquitectura** | Análisis de la separación por capas en el backend, de la organización por *features* en el frontend y de la estructura de rutas en móvil. |
| **Revisión de configuración** | `docker-compose.yml`, `Dockerfile` (backend y frontend), `pyproject.toml`, `package.json`, `vite.config.ts`, `alembic.ini`, `.env.example`. |
| **Revisión de pruebas existentes** | Conteo e identificación de tipo de las pruebas en `RehniMarket-backend/tests/`; lectura de `conftest.py`. |
| **Revisión de documentación** | `README`, `CHANGELOG`, `app/docs/`, `docs/RehniMarket-HU.md`, y contraste con el código. |
| **Revisión de manejo de errores** | `app/core/Exceptions.py` (`api_error`), `app/core/ErrorCodes.py`, patrón `try/except` en servicios, manejador global en `app/main.py`, `src/api/apiErrorHandler.ts` y `src/api/setupAuthInterceptor.ts`. |
| **Revisión de seguridad** | Middleware de autenticación/autorización, firma y verificación de JWT, hash de contraseñas, política CORS, exposición de puertos, uso de secretos. |
| **Revisión de mantenibilidad** | Tipado (Pydantic / TypeScript), consistencia de nomenclatura, duplicación, tamaño de bundle, dependencias declaradas vs. usadas. |
| **Revisión responsive** | Uso de *breakpoints* de Tailwind en el frontend; `useResponsive` y `Dimensions` en móvil. |
| **Revisión de validaciones** | Esquemas Pydantic (`Field(..., ge=, max_length=)`), validaciones de formulario en el frontend, validación de negocio en los servicios. |

### 4.1 Comandos ejecutados durante este análisis

Los siguientes comandos **sí fueron ejecutados** durante el trabajo asociado a este proyecto y sus resultados se citan tal cual. **No se ejecutó la suite de pruebas completa** ni ningún comando destructivo.

| Comando | Resultado real observado |
|---|---|
| `docker exec rehni-backend sh -c 'cd /app && uv run --group dev pytest tests/test_public_and_commerce.py -q'` | **`21 passed, 203 warnings in 128.35s`** (código de salida 0). Cubre catálogo público, carrito y checkout, incluida la reserva atómica de stock y la concurrencia (`TestCheckoutStockDiscount`). |
| `npx tsc -b` (en `RehniMarket-frontend/`) | Código de salida **0**, sin errores de tipos. |
| `npx eslint .` (en `RehniMarket-frontend/`) | Código de salida **0**, sin *warnings* ni errores. |
| `npx vite build --outDir <dir temporal>` (en `RehniMarket-frontend/`) | **`✓ built in 687ms`**. Aviso: *"Some chunks are larger than 500 kB after minification"* — bundle principal `index-*.js` **728.88 kB (gzip 188.23 kB)**, CSS `index-*.css` 69.24 kB (gzip 12.04 kB). |
| `npx vite build` (salida por defecto, en `RehniMarket-frontend/`) | **Falló** con `EACCES, Permission denied: .../RehniMarket-frontend/dist/assets`. Causa: la carpeta `dist/` existente es propiedad de `root` (residuo de un *build* previo en contenedor). No es un fallo del código. |
| `which docker docker-compose psql pg_dump node pnpm python3 git uv` + `--version` | Host: Docker 29.6.2, Docker Compose 5.3.1, Node v26.4.0, pnpm 11.3.0, Python 3.14.6, Git 2.55.0, uv 0.11.29. `psql` y `pg_dump` **no están instalados en el host** (solo dentro del contenedor `postgres:17-alpine`). |

**No ejecutado durante el análisis original (agosto 30):** `pytest` sobre los otros 6 archivos de prueba, `pytest --cov`, `expo lint`, `pip-audit`, prueba de carga.

### 4.2 Ejecución completa de verificaciones — actualización 2026-08-31

Durante la preparación de la entrega se ejecutaron **todas** las verificaciones que
quedaban pendientes. Evidencia en `evidencias/`:

| Verificación | Comando | Resultado | Evidencia |
|---|---|---|---|
| **Suite `pytest` COMPLETA (backend)** | `docker compose run --rm --no-deps -T backend sh -c 'cd /app && uv run --group dev pytest -q'` | **`113 passed, 783 warnings in 651.19s`** — código de salida 0. Los *warnings* son todos `DeprecationWarning: datetime.utcnow()` (deuda menor, sin efecto funcional). | `evidencias/tests/pytest.txt` |
| **Cobertura `pytest --cov`** | `... pytest --cov=app --cov-report=term-missing` | ver `evidencias/tests/pytest-cov.txt` (cobertura de `app/` medida; sin umbral fijado aún — acción AP-03). | `evidencias/tests/pytest-cov.txt` |
| **`tsc -b` frontend web** | `./node_modules/.bin/tsc -b` | código de salida **0**, sin errores de tipos. | `evidencias/tests/frontend-tsc-eslint.txt` |
| **`eslint .` frontend web** | `./node_modules/.bin/eslint .` | código de salida **0**, sin *warnings* ni errores. | `evidencias/tests/frontend-tsc-eslint.txt` |
| **`vite build` frontend web** | `vite build --outDir <tmp>` | **`✓ built in 878ms`**; bundle `index-*.js` **729,00 kB** (gzip 188,27 kB), CSS 69,24 kB. Aviso de *chunk* > 500 kB (MF-05). | `evidencias/tests/frontend-tsc-eslint.txt` |
| **`tsc --noEmit` app móvil** | `./node_modules/.bin/tsc --noEmit` | código de salida **0** (con `"strict": true`). | `evidencias/tests/mobile-lint.txt` |
| **`eslint` app móvil** | `./node_modules/.bin/eslint .` | **0 errores, 3 warnings** cosméticos (`import/no-named-as-default-member` sobre `axios`). | `evidencias/tests/mobile-lint.txt` |
| **`pip-audit` backend** | `uv run --group dev pip-audit` | **8 vulnerabilidades en 5 paquetes**; 7 con fix aplicado (`click`, `pip`, `pyasn1`, `pydantic-settings`); 1 sin fix (`ecdsa`, no explotable — el proyecto usa HS256). Ver §8 (S-17) y §13 (AC-11). | `evidencias/security/pip-audit.txt`, `reporte.json` |
| **`pnpm audit` frontend / móvil** | `pnpm audit` | ver evidencia. | `evidencias/security/pnpm-audit-*.txt` |
| **Backup + restauración** | `scripts/backup_rehnimarket.sh` + `scripts/restore_rehnimarket.sh` | backup + restauración en entorno aislado **APROBADOS**: 37 tablas, conteos = origen, 166 objetos MinIO, `alembic_version` = `a1b2c3d4e5f6`. | `evidencias/backup/` |
| **Prueba de rendimiento básica** | `scripts/perf_test.sh` | línea base de latencia/throughput del catálogo público. Ver §7.2. | `evidencias/performance/resultado.txt` |
| **Despliegue completo** | `docker compose up -d` (desde el compose versionado) | 4 servicios *Up*; `/health/database` OK; `/docs` 200; frontend `:5173` 200; MinIO health 200; `alembic current` = `a1b2c3d4e5f6 (head)`. | `evidencias/deployment/` |
| **Muestra de aceptación** | `scripts/acceptance_smoke.sh` | registro→verificación→login→roles→catálogo→carrito→checkout con RehniCoin→pedidos + casos negativos, contra la API real. | `evidencias/acceptance/resultados.txt` |

> **Efecto en el informe:** los hallazgos y estados que abajo dicen *"NO VERIFICADO"* o
> *"ejecución no verificada durante este análisis"* deben leerse ahora como **VERIFICADOS**
> para la suite `pytest` (113/113), las verificaciones estáticas y `pip-audit`. Las
> secciones se conservan con su redacción original + esta actualización para trazabilidad.

---

## 5. Marco de calidad

### 5.1 Marcos de referencia utilizados

| Marco | Uso en este informe |
|---|---|
| **ISO/IEC 25010** (modelo de calidad de producto) | Estructura la [sección 6](#6-evaluación-según-isoiec-25010): las ocho características de calidad de producto (adecuación funcional, eficiencia de desempeño, compatibilidad, usabilidad, fiabilidad, seguridad, mantenibilidad, portabilidad). |
| **ISO/IEC 25000** (SQuaRE — familia de normas de calidad de software) | Marco general que agrupa el modelo de calidad, la medición y la evaluación. Se usa como referencia conceptual para organizar el proceso de evaluación (definición de requisitos → medición → registro → mejora). |
| **CMMI** (Capability Maturity Model Integration) | **Referencia conceptual únicamente.** Se usa para situar el nivel de madurez de las prácticas de proceso observadas (gestión de configuración, pruebas, aseguramiento de calidad), sin realizar una valoración formal ni asignar un nivel de madurez oficial. |
| **PSP** (Personal Software Process) | Aplicable al trabajo individual. Se evalúa qué artefactos de proceso personal (registro de defectos, estimación de tamaño/tiempo, seguimiento) existen en el repositorio. Ver [sección 16, Criterio 7](#criterio-7--marcos-de-calidad-y-psp). |

> **Aclaración obligatoria:** RehniMarket **no está certificado** en ninguna norma ISO ni evaluado formalmente en CMMI. Estos marcos se aplican como **guía de evaluación**, no como sello de conformidad.

### 5.2 Características de calidad más relevantes para RehniMarket

Dado que RehniMarket es un marketplace que mueve **stock, precios y un saldo interno (RehniCoin) equivalente a dinero**, las características de calidad prioritarias son:

1. **Seguridad** — autenticación, autorización por rol y protección de las operaciones que afectan saldo y stock.
2. **Adecuación funcional** — que las reglas de negocio (IVA, comisión, descuentos, reserva de stock, estados de pedido) sean correctas y completas.
3. **Fiabilidad** — que las operaciones críticas (checkout, cobro, descuento de stock) sean atómicas y consistentes ante concurrencia.
4. **Mantenibilidad** — el proyecto es amplio (3 aplicaciones) y evoluciona activamente; la facilidad de modificación es clave.
5. **Usabilidad** y **adaptación a dispositivos** — la plataforma la usan compradores no técnicos en web y móvil.

---

## 6. Evaluación según ISO/IEC 25010

| Característica | Evaluación | Evidencia | Estado |
|---|---|---|---|
| **Adecuación funcional** | Amplia cobertura funcional del dominio marketplace: catálogo público con búsqueda difusa, carrito, checkout con IVA del 19% y comisión del 5%, RehniCoin, pedidos con máquina de estados, reseñas condicionadas a compra entregada, favoritos, panel de empresa y panel de administración. Las reglas de negocio están centralizadas (`app/core/TaxConfig.py`, `app/core/PayoutConfig.py`, `app/services/pricing.py`). Existen contradicciones puntuales entre la documentación (`docs/RehniMarket-HU.md`) y el código (anuncios "con texto" vs. banners visuales; login de empresa "pendiente" permitido vs. bloqueado). | 24 routers en `app/routers/`; `app/services/commerce/CheckoutService.py`; `docs/RehniMarket-HU.md` (29 historias de usuario); hallazgos H-14 y H-15. | **PARCIAL** (funcionalidad extensa e implementada; completitud/consistencia documental con desviaciones registradas) |
| **Eficiencia de desempeño** | **Línea base ejecutada el 2026-08-31** (`scripts/perf_test.sh`, `evidencias/performance/resultado.txt`): 900 solicitudes, **0 errores**; catálogo p95 66 ms secuencial / 353 ms concurrente x10; búsqueda y detalle p95 ≈ 26 ms. Positivo: `pool_pre_ping=True`, índice GIN de trigramas, paginación. Negativo: *bundle* JS de ~729 kB sin *code-splitting*. Plantilla k6 lista (`scripts/load_test.k6.js`), **no ejecutada**; sin SLO acordado. | `evidencias/performance/`, `scripts/perf_test.sh`, `scripts/load_test.k6.js` | **MEDICIÓN BÁSICA REALIZADA** (falta k6 + SLO) |
| **Compatibilidad** | Backend y clientes se comunican por HTTP/JSON con un contrato de error uniforme (`{ detail: { code, message } }`). El frontend web consume la misma API que la app móvil (`VITE_API_URL` / `EXPO_PUBLIC_API_URL`). Interoperabilidad con servicios externos: SMTP de Gmail (correo), MinIO (S3) para archivos, WhatsApp (enlace `wa.me` para solicitar recargas). Coexistencia: los servicios corren aislados en contenedores en la red de Compose. | `app/core/Exceptions.py`; `src/api/Client.ts`; `src/config/env.ts` (móvil); `docker-compose.yml`. | **IMPLEMENTADO** |
| **Usabilidad** | Frontend con sistema de diseño propio (tokens, primitivas `ui/`, estados de carga con `Skeleton`, estados vacíos con `EmptyState`, alertas globales), navegación por rol con *deep-links* (`?tab=`), y mensajes de error en español provenientes del backend. Atención a accesibilidad presente pero no auditada (52 componentes con atributos `aria-*`/`role`, incluidos `aria-live`, `aria-modal`, `aria-invalid`). No hay pruebas de usabilidad con usuarios ni métricas (SUS, tasa de éxito de tareas). | `src/shared/components/ui/`, `src/shared/components/alert/`; conteo de atributos `aria-*` en `src/**/*.tsx`. | **PARCIAL** (buenas prácticas implementadas; sin evaluación formal de usabilidad) |
| **Fiabilidad** | Punto fuerte del proyecto: el checkout descuenta stock con un `UPDATE` condicional atómico por línea (`stock = stock - qty WHERE stock >= qty`), ordenado de forma determinista para evitar *deadlocks*, y bloquea la billetera con `SELECT ... FOR UPDATE`; ante fallo hace `rollback` completo. Existe una prueba de concurrencia (`test_concurrent_checkout_of_last_unit_lets_only_one_win`). Patrón `try/except HTTPException / except Exception → rollback` consistente en los servicios. Debilidades: sin *healthchecks* en `docker-compose.yml`, sin monitorización de errores en ejecución (`sentry-sdk` está declarado pero no inicializado), *logging* mínimo (3 usos de `logging`; 38 usos de `traceback.print_exc()`). | `app/services/commerce/CheckoutService.py`; `tests/test_public_and_commerce.py::TestCheckoutStockDiscount`; `grep` de `sentry`, `logging`, `traceback` en `app/`. | **PARCIAL** (operaciones críticas robustas y probadas; observabilidad y tolerancia a fallos de infraestructura débiles) |
| **Seguridad** | Autenticación JWT (HS256) con *access* + *refresh token*; middleware que revalida en cada petición el estado de la cuenta y de la empresa; autorización por lista blanca de rutas por rol; hash de contraseñas con `bcrypt`; secretos fuera del control de versiones. **Corregido en esta entrega (2026-08-31):** CORS restringido a `URL_FRONTEND`; *rate limiting* activable por `RATE_LIMIT_ENABLED` y forzado en `docker-compose.prod.yml`; `SECRET_KEY` con placeholder + instrucción; `docker-compose.prod.yml` endurecido; dependencias con CVE actualizadas (8→1). Debilidades residuales: falta el **reverse proxy con TLS** para una publicación real; MinIO con `secure=False` en red interna y credenciales *root* como credenciales de aplicación. Ver [sección 8](#8-seguridad). | `app/middleware/AuthMiddleware.py`, `RolePermissions.py`, `CorsMiddleware.py`; `docker-compose.prod.yml`; `app/services/NasService.py`. | **PARCIAL → mejorado** |
| **Mantenibilidad** | Arquitectura por capas clara y consistente en el backend (router → service → repository → model), organización por *features* en el frontend, tipado fuerte (Pydantic en backend, TypeScript en frontend/móvil), migraciones versionadas en cadena lineal (10, sin ramas), configuración centralizada (`app/Config.py`, `.env`), documentación de arquitectura (`app/docs/ARQUITECTURA-VARIANTES.md`). Debilidades: `strict` de TypeScript **no activado** en el frontend (sí en móvil); sin linter/formateador ni verificador de tipos para Python; sin CI; historial de *commits* pobre (12 *commits*, mensajes tipo "ver 2.4", "new feature"); `README.md` del backend desactualizado (nombre "Lubix", versión 1.1.2); dependencia declarada y no usada (`sentry-sdk`, `react-device-detect`). | `app/services/`, `app/repository/`; `RehniMarket-frontend/tsconfig.app.json`; `pyproject.toml`; `git log`. | **PARCIAL** (estructura sólida; brechas en tooling de calidad y disciplina de proceso) |
| **Portabilidad** | Toda la plataforma de servidor está contenerizada (`docker-compose.yml`); dependencias fijadas de forma reproducible (`uv.lock`, `pnpm-lock.yaml`, `uv sync --frozen`); configuración externalizada por variables de entorno. Limitaciones: solo existe una configuración de Compose orientada a desarrollo (sin variante de producción); modelos ORM específicos del dialecto PostgreSQL (extensiones `pg_trgm`/`unaccent`); la app móvil no tiene empaquetado nativo configurado (sin `eas.json`, sin `android/`/`ios/`). | `docker-compose.yml`; `RehniMarket-backend/Dockerfile`; `uv.lock`; `RehniMarket-mobile/` (ausencia de `eas.json`). | **PARCIAL** |

---

## 7. Evaluación de requisitos no funcionales

### 7.1 Usabilidad

| Aspecto | Detalle |
|---|---|
| **Requisito esperado** | Interfaz clara, en español, con retroalimentación de estados (carga, error, vacío) y navegación coherente por rol. |
| **Evidencia encontrada** | Sistema de diseño en `src/shared/components/ui/` (primitivas `Button`, `Modal`, `Skeleton`, `EmptyState`). Alertas globales (`src/shared/components/alert/`). Mensajes de error en español provenientes del backend (`app/core/ErrorCodes.py`, 102 códigos con mensaje). Navegación por pestañas con `?tab=` para *deep-linking* (`src/pages/user/Dashboard.tsx`, `src/pages/dashboard/Admin.tsx`). En móvil, navegación por *tabs* inferiores (`src/app/(user)/(tabs)/_layout.tsx`) y hojas (*sheets*) para formularios. Retorno al contexto tras iniciar sesión (`RequireAuth`, `redirectToLoginWithMessage`). |
| **Estado** | **IMPLEMENTADO** (a nivel de construcción de la interfaz) |
| **Observaciones** | No hay pruebas de usabilidad con usuarios, ni métricas (SUS, tiempos de tarea, tasa de error). No hay guía de estilo/UX escrita en el repositorio más allá del código. |

### 7.2 Rendimiento

| Aspecto | Detalle |
|---|---|
| **Requisito esperado** | Tiempos de respuesta aceptables bajo carga representativa; frontend que carga en un tiempo razonable. |
| **Evidencia encontrada** | Positiva: paginación en todos los listados grandes; índice GIN de trigramas para búsqueda (`alembic/versions/a1b2c3d4e5f6_...py`); `pool_pre_ping=True` en el motor de BD; el checkout agrupa y calcula por empresa en memoria evitando N+1 evidentes. Negativa: *bundle* JS único de ~729 kB sin *code-splitting* (aviso de Vite); `docker-compose.yml` en modo desarrollo (`--reload`, `pnpm dev`); sin `mem_limit`/`cpus` en Compose; `echo=False` en el motor (sin *log* de consultas lentas). |
| **Estado** | **MEDICIÓN BÁSICA REALIZADA (2026-08-31)** — línea base, sin SLO. |
| **Observaciones** | **Antes:** no existía ninguna medición. **Ahora:** `scripts/perf_test.sh` (150 solicitudes secuenciales + 150 concurrentes x10 por endpoint, `evidencias/performance/resultado.txt`), en el equipo de validación (backend y cliente en la misma máquina): <br>• `GET /public/products?limit=12` — secuencial: media **60,8 ms**, p50 63,7 ms, p95 66,1 ms; concurrente x10: media 276,7 ms, p95 353,5 ms, ~36 req/s. **0 errores.** <br>• `GET /public/products?search=audio` — secuencial: media **26,1 ms**, p95 27,6 ms; concurrente x10: p95 244,6 ms, ~84 req/s. **0 errores.** <br>• `GET /public/products/{id}` — secuencial: media **23,6 ms**, p95 26,4 ms; concurrente x10: p95 127,6 ms, ~97 req/s. **0 errores.** <br>**900 solicitudes, 0 errores, 100 % de éxito.** El listado de catálogo es ~2,5× más lento que el detalle o la búsqueda (cálculo de precio/descuento por producto) — candidato a optimización si se necesita. **Sigue sin haber SLO ni campaña de carga con `k6`/`locust`** (MF-03). |

### 7.3 Seguridad

| Aspecto | Detalle |
|---|---|
| **Requisito esperado** | Acceso controlado por identidad y rol; protección de credenciales y secretos; operaciones sobre saldo/stock no manipulables desde el cliente. |
| **Evidencia encontrada** | JWT HS256 con *access*/*refresh* (`app/services/authentication/JWTService.py`); middleware que valida token, rol y revalida `Users.isActive` y `Company.CompanyStatus` en cada petición (`app/middleware/AuthMiddleware.py`); autorización por lista blanca de prefijos de ruta por rol (`app/middleware/RolePermissions.py`); hash `bcrypt` (`app/utils/Security.py`); el checkout revalida stock y saldo en el servidor sin confiar en el cliente. Debilidades detalladas en la [sección 8](#8-seguridad). |
| **Estado** | **PARCIAL** |
| **Observaciones** | La autoridad de negocio reside correctamente en el servidor. Las brechas están en la capa de transporte/infraestructura (CORS, TLS, *rate limiting*, credenciales de MinIO) y no en la lógica de autorización. No se ejecutó ningún escaneo de vulnerabilidades. |

### 7.4 Disponibilidad

| Aspecto | Detalle |
|---|---|
| **Requisito esperado** | El servicio se recupera de reinicios y fallos transitorios; se puede diagnosticar su estado. |
| **Evidencia encontrada** | `restart: always` en los servicios `minio`, `postgres` y `backend` (`docker-compose.yml`). Endpoints de diagnóstico: `GET /health/database` (ejecuta `SELECT 1`) y `GET /health/internet` (`app/routers/HealthRouter.py`, `app/utils/TestDatabase.py`, `app/utils/CheckNetwork.py`). El bucket de MinIO se crea en el arranque sin abortar si MinIO no responde (`ensure_bucket()` en `app/main.py`). |
| **Estado** | **PARCIAL** |
| **Observaciones** | No hay `healthcheck` declarado en `docker-compose.yml` (Docker no conoce el estado real de los contenedores). Sin redundancia (una sola instancia de cada servicio). Sin monitorización ni alertas. Sin plan de respaldo de base de datos implementado (ver `DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md`, sección 9). |

### 7.5 Mantenibilidad

| Aspecto | Detalle |
|---|---|
| **Requisito esperado** | Código modular, tipado, documentado, con cambios de esquema controlados y dependencias fijadas. |
| **Evidencia encontrada** | Backend por capas: `app/routers/` → `app/services/` → `app/repository/` → `app/models/`. Frontend por *features* (`src/features/<dominio>/{api,components,context,types}`). Tipado: Pydantic en el 100% de los endpoints; TypeScript en frontend y móvil. Migraciones Alembic en cadena lineal de 10 revisiones (`29fe206320ce` … `a1b2c3d4e5f6`), sin ramas. `uv.lock` y `pnpm-lock.yaml` fijan versiones. Documentación de arquitectura: `app/docs/ARQUITECTURA-VARIANTES.md`. Comentarios explicativos abundantes en el código (middleware, seed, checkout). |
| **Estado** | **PARCIAL** |
| **Observaciones** | Ver hallazgos negativos H-06 a H-13. Puntos débiles: sin `strict` de TS en el frontend; sin `ruff`/`mypy`/`black` para Python; sin CI; historial de *commits* pobre; `README` del backend desactualizado; dependencias declaradas y no usadas. |

### 7.6 Escalabilidad

| Aspecto | Detalle |
|---|---|
| **Requisito esperado** | Posibilidad de crecer horizontal u verticalmente sin reescritura. |
| **Evidencia encontrada** | El backend FastAPI es sin estado a nivel de aplicación (la sesión vive en el JWT y en la tabla de *refresh tokens*), lo que en principio permite varias réplicas detrás de un balanceador. La base de datos es el punto central de estado. |
| **Estado** | **PARCIAL** |
| **Observaciones** | El `RateLimitMiddleware` mantiene el conteo **en memoria del proceso**, lo que **no** funciona con múltiples réplicas (aunque ya es activable con `RATE_LIMIT_ENABLED`). No hay caché (Redis u otro) ni configuración con réplicas. La escalabilidad es *posible* por diseño (backend sin estado) pero **no está preparada ni probada**. |

### 7.7 Compatibilidad

| Aspecto | Detalle |
|---|---|
| **Requisito esperado** | Un único contrato de API servido a web y móvil; interoperabilidad con servicios externos. |
| **Evidencia encontrada** | Contrato de error uniforme `{ detail: { code, message[, extra] } }` (`app/core/Exceptions.py`). Web (`src/api/Client.ts`) y móvil (`src/api/client.ts`) consumen los mismos endpoints. Integraciones: SMTP Gmail (`app/services/email/EmailService.py`), MinIO/S3 (`app/services/NasService.py`), enlace WhatsApp (`src/features/wallet/utils/rechargeWhatsapp.ts`). Documentación de API autogenerada por FastAPI en `/docs`. |
| **Estado** | **IMPLEMENTADO** |
| **Observaciones** | Los códigos de error del backend (`app/core/ErrorCodes.py`) están replicados en el frontend (`src/shared/types/ErrorCode.ts`) y en móvil (`src/types/ErrorCode.ts`): la sincronización es manual, lo que constituye un riesgo de desincronización (R-03). |

### 7.8 Portabilidad

| Aspecto | Detalle |
|---|---|
| **Requisito esperado** | Instalable y ejecutable en distintos entornos con esfuerzo bajo. |
| **Evidencia encontrada** | `docker compose build && docker compose up -d` levanta toda la plataforma de servidor. Imágenes base multiplataforma Linux (`python:3.13-slim`, `node:22-alpine`, `postgres:17-alpine`, `minio/minio:latest`). Configuración 100% por variables de entorno (`.env.example` en los 3 componentes). `.python-version` fija el intérprete. |
| **Estado** | **PARCIAL** |
| **Observaciones** | Solo hay una configuración de Compose (desarrollo). Modelos atados a PostgreSQL (`pg_trgm`, `unaccent`, función `rehni_search_norm`, tipos `Enum` nativos). App móvil sin empaquetado configurado (uso vía Expo Go). `build_media_url` **corregido** (usa `URL_BACKEND`, H-16). |

### 7.9 Accesibilidad

| Aspecto | Detalle |
|---|---|
| **Requisito esperado** | Interfaz utilizable con tecnologías de asistencia (lectores de pantalla, navegación por teclado). |
| **Evidencia encontrada** | En el frontend web hay atención explícita a la semántica accesible: 52 componentes `.tsx` con atributos `aria-*` / `role`. Uso de `aria-label` (81 ocurrencias), `aria-hidden` (10), `aria-pressed` (5), `aria-describedby` (5), `aria-current` (5), `aria-invalid` (4), `aria-modal` (2), `aria-live` (1), `aria-labelledby` (1), `aria-expanded` (1). |
| **Estado** | **PARCIAL** |
| **Observaciones** | No hay una **auditoría formal de accesibilidad** (axe, Lighthouse, WCAG) ni evidencia de pruebas con lectores de pantalla. La cobertura de `aria-live` (una sola ocurrencia) sugiere que los anuncios dinámicos para lectores de pantalla son limitados. En la app móvil el uso de `accessibilityLabel` es puntual. |

### 7.10 Responsive / adaptación a dispositivos

| Aspecto | Detalle |
|---|---|
| **Requisito esperado** | El frontend web se adapta a escritorio y móvil; la app móvil se adapta a distintos tamaños de pantalla. |
| **Evidencia encontrada** | Frontend web: 64 componentes `.tsx` usan *breakpoints* de Tailwind (`sm:`, `md:`, `lg:`); rejillas con `grid` y `flex`; `max-w-*` y unidades relativas. El `README.md` de RehniMarket-HU y los propios componentes muestran diseño *mobile-first*. App móvil: `src/hooks/useResponsive.ts` calcula columnas/anchos según el ancho del dispositivo (usado en `FavoritesScreen`, `CheckoutScreen`, etc.); `react-native-safe-area-context` para *safe areas*. La memoria del proyecto documenta un "rebuild del sistema de diseño" bloque por bloque, incluyendo navegación responsiva. |
| **Estado** | **IMPLEMENTADO** |
| **Observaciones** | No hay pruebas visuales automatizadas ni matriz de dispositivos probados documentada. La dependencia `react-device-detect` está declarada en `package.json` pero **no se usa** en `src/` (dependencia muerta). |

---

## 8. Seguridad

Análisis por área. La severidad se asigna considerando el contexto (proyecto académico, despliegue controlado) y **no se exagera**.

| # | Área | Hallazgo | Severidad | Evidencia |
|---|---|---|---|---|
| S-01 | Autenticación | JWT HS256 con `access` (exp. corta) y `refresh` (exp. en días); se distingue `type` y se rechaza un `refresh` usado como `access`. | Positivo | `app/services/authentication/JWTService.py`, `app/middleware/AuthMiddleware.py` |
| S-02 | *Refresh tokens* | Persistidos en tabla propia (`ModelRefreshToken`), con servicio de renovación que rechaza cuentas bloqueadas/suspendidas. | Positivo | `app/models/ModelRefreshToken.py`, `app/services/authentication/RefreshTokenService.py` |
| S-03 | Autorización / roles | 5 roles (`user`, `company`, `admin`, `owner` + Visitante). Middleware con *bypass* total para `admin`/`owner` y **lista blanca de prefijos de ruta** para `user`/`company`. Revalidación de `isActive`/`CompanyStatus` en cada petición aunque el JWT siga vigente. Capacidades exclusivas de `owner` protegidas a nivel de servicio. | Positivo | `app/middleware/AuthMiddleware.py`, `app/middleware/RolePermissions.py` |
| S-04 | Contraseñas | Hash con `bcrypt` vía `passlib`, truncado seguro a 72 bytes; nunca se almacenan ni se registran en claro. | Positivo | `app/utils/Security.py` |
| S-05 | Verificación de cuenta | Códigos con expiración de 5 min, un único código activo, *cooldown* de reenvío de 60 s. | Positivo | `app/services/email/CodeService.py`, `app/models/ModelCode.py` |
| S-06 | Gestión de secretos | Los `.env` reales están en `.gitignore` (backend, frontend, móvil); `.dockerignore` excluye `.env` de la imagen; solo se versionan los `.env.example` sin valores sensibles. | Positivo | `RehniMarket-backend/.gitignore`, `.dockerignore`, `RehniMarket-frontend/.gitignore`, `RehniMarket-mobile/.gitignore` |
| S-07 | Validación de datos | Esquemas Pydantic en todos los endpoints con restricciones (`Field(ge=1)`, `max_length`, tipos `UUID`, `EmailStr` vía `email-validator`); manejador global de `ValidationError` → HTTP 422 con código `VALIDATION_ERROR`. | Positivo | `app/schemas/`, `app/main.py` |
| S-08 | Manejo de errores | Contrato uniforme `{ detail: { code, message } }` (`api_error`); los servicios hacen `rollback` ante excepción; no se filtran *stack traces* al cliente (van a *stdout* vía `traceback.print_exc()`). | Positivo (con reserva, ver S-14) | `app/core/Exceptions.py`, servicios de `app/services/` |
| S-09 | CORS | **CORREGIDO 2026-08-31.** `CorsMiddleware.py` ahora construye `allow_origins` desde `URL_FRONTEND` + orígenes locales de desarrollo, con `allow_credentials` coherente. Solo cae a `["*"]` si `URL_FRONTEND` no está definido (con `allow_credentials=False`). | Positivo (con `URL_FRONTEND` definido) | `app/middleware/CorsMiddleware.py` |
| S-10 | *Rate limiting* | **AJUSTADO 2026-08-31.** Ya no está "comentado": se activa con `RATE_LIMIT_ENABLED=true` (`Config.py` + `main.py`), y `docker-compose.prod.yml` lo fuerza a `true`. Por defecto `false` en desarrollo para no interferir con demo/pruebas. Sigue siendo en memoria del proceso (un almacén compartido queda pendiente para varias réplicas). | **Bajo** (activable) | `app/main.py`, `app/Config.py`, `.env.example` |
| S-11 | TLS / HTTPS | En el Compose de **desarrollo** todo es HTTP plano. `docker-compose.prod.yml` (nuevo) deja de publicar BD/MinIO y expone el backend solo en `127.0.0.1`, **asumiendo un reverse proxy con TLS por delante** (su configuración depende del dominio y NO se incluye). MinIO sigue con `secure=False` en la red interna. | **Medio** para una publicación real; **Bajo** en aula | `docker-compose.prod.yml`, `docs/DOCUMENTACION_DESPLIEGUE` §10.7 |
| S-12 | Credenciales de MinIO | Se usa el usuario **root** de MinIO (`MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`) también como credenciales de la aplicación. Sin política de mínimo privilegio. | **Bajo** | `app/services/NasService.py`, `.env.example` |
| S-13 | `SECRET_KEY` | **CORREGIDO 2026-08-31.** `.env.example` y `.env.prod.example` traen un placeholder explícito (`REEMPLAZAR_POR_openssl_rand_hex_32`) e instrucción de generación. Generar el valor real sigue siendo acción del despliegue. | **Bajo** (documental) | `.env.example`, `.env.prod.example` |
| S-14 | Observabilidad de errores | `except Exception` amplio en los servicios + `traceback.print_exc()` (38 usos) hacia *stdout*, sin *logging* estructurado ni monitor de errores (`sentry-sdk` declarado pero **no inicializado**). Dificulta detectar y diagnosticar fallos en ejecución. | **Bajo** | `grep` de `traceback.print_exc`, `sentry`, `logging` en `app/` |
| S-15 | Exposición de puertos | `postgres` (`5434`) y `minio` (`9000`) publican sus puertos en el *host* en la única configuración de Compose existente. | **Bajo** (aceptable en desarrollo; no debe ir a producción) | `docker-compose.yml` |
| S-16 | Endpoint de recarga de saldo | `POST /wallet/recharge` existe en `WalletRouter`, pero el rol `user` **no** lo tiene en su lista blanca (`RolePermissions.py`): solo `admin`/`owner` pueden acreditar saldo (vía `/admin/wallet/recharge`). La restricción está correctamente aplicada. | Positivo | `app/routers/WalletRouter.py`, `app/middleware/RolePermissions.py` |
| S-17 | Auditoría de dependencias | **EJECUTADA el 2026-08-31.** `pip-audit` backend: **8 vulnerabilidades → 1** tras actualizar `click`, `pip`, `pyasn1`, `pydantic-settings` (`pyproject.toml`/`uv.lock`). La restante (`ecdsa 0.19.2`, sin parche) **no es explotable**: el proyecto firma JWT con HS256, no usa ECDSA. `pnpm audit` frontend: 7 → 6 (bump de `react-router-dom` a 7.18.3; las 6 restantes son de *build/lint*, no van en el bundle). `pnpm audit` móvil: 7 (transitivas del tooling de Expo, no empaquetadas). Evidencia: `evidencias/security/pip-audit.txt`, `reporte.json`, `pnpm-audit-*.txt`. | Positivo (con seguimiento) | `evidencias/security/`, `app/docs/AUDITORIA.md` |

**Resumen de severidad — actualizado 2026-08-31:** 0 Críticos · 0 Altos · **1 Medio** (S-11 TLS, solo para una publicación real; el reverse proxy TLS depende del dominio) · **4 Bajos** (S-10, S-12, S-14, S-15). **S-09 (CORS), S-13 (`SECRET_KEY`) y S-17 (auditoría de dependencias) pasaron a Positivo** tras las correcciones de esta entrega. El resto son hallazgos **positivos**.

> **Contexto:** tras las correcciones del 2026-08-31 queda **1 hallazgo Medio** (S-11 TLS), que se cubre con el reverse proxy del `docker-compose.prod.yml` (no incluido — depende del dominio). Ninguno es explotable de forma trivial en el entorno de aula/demo local.

---

## 9. Mantenibilidad

### 9.1 Separación de responsabilidades y arquitectura

**Backend** — patrón por capas, aplicado de forma consistente:

```
app/routers/     → define endpoints, valida el request (Pydantic), delega
app/services/    → lógica de negocio (precios, IVA, stock, estados, correos)
app/repository/  → acceso a datos (consultas SQLAlchemy encapsuladas)
app/models/      → entidades ORM (SQLAlchemy 2.0, Mapped[...])
app/schemas/     → contratos de entrada/salida (Pydantic)
app/core/        → configuración transversal (ErrorCodes, Exceptions, TaxConfig, PayoutConfig)
app/middleware/  → autenticación, autorización, CORS
```

**Frontend web** — organización por *feature* (dominio), cada una con su `api/`, `components/`, `context/`, `types/`:

```
src/features/{cart,orders,favorites,wallet,addresses,company,admin,public,...}
src/shared/     → componentes UI reutilizables, utilidades, tipos y config comunes
src/api/        → cliente axios único + interceptores (auth, manejo de errores)
src/routers/    → definición de rutas
src/pages/      → páginas "delgadas" que arman layout + vista
```

**App móvil** — Expo Router (rutas basadas en archivos) + pantallas en `src/screens/` + *features* espejo del frontend (`src/features/{cart,orders,favorites,wallet,addresses}`).

**Estado:** **IMPLEMENTADO** — la arquitectura es clara y se respeta en todo el proyecto.

### 9.2 Reutilización

| Evidencia | Estado |
|---|---|
| Primitivas de UI compartidas (`src/shared/components/ui/`: `Button`, `Modal`, `Skeleton`, `EmptyState`, etc.). | IMPLEMENTADO |
| Cliente HTTP único con interceptores; ningún servicio crea su propia instancia de axios (`src/api/Client.ts`, comentario explícito en móvil `src/api/client.ts`). | IMPLEMENTADO |
| Lógica de disponibilidad de carrito extraída a utilidad reutilizable (`src/features/cart/utils/availability.ts`, usada por `CartView` y `CheckoutView`). | IMPLEMENTADO |
| Plantillas de correo con base común (`app/services/email/template/EmailBase.py`). | IMPLEMENTADO |
| Repositorios reutilizados entre servicios (p. ej. `CartRepository` usado por `CartService` y `CheckoutService`). | IMPLEMENTADO |
| Duplicación conocida: los enumerados de códigos de error existen en 3 lugares y se sincronizan a mano (`app/core/ErrorCodes.py`, `src/shared/types/ErrorCode.ts`, `RehniMarket-mobile/src/types/ErrorCode.ts`). | PARCIAL — riesgo R-03 |

### 9.3 Tipado y consistencia

| Aspecto | Evidencia | Estado |
|---|---|---|
| Tipado backend | Pydantic en el 100% de los endpoints; anotaciones de tipo en firmas de servicios (`-> CartResponse`, `user_id: UUID`, `database: Session`). | IMPLEMENTADO |
| Tipado móvil | `"strict": true` en `RehniMarket-mobile/tsconfig.json`. | IMPLEMENTADO |
| Tipado frontend web | `RehniMarket-frontend/tsconfig.app.json` **no** activa `"strict"` (sí `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`). Menor rigor de tipos que en móvil. | PARCIAL — hallazgo H-06 |
| Nomenclatura | Inconsistencias menores: mezcla de español e inglés en nombres (`nameCompany`, `CompanyStatus`, `isActive`, `descripcion`); un archivo de esquema mal nombrado (`app/schemas/SchemaDashboard/ShemaCompany.py`, falta la "c"). | PARCIAL |
| Idioma de mensajes | Consistentemente en español de cara al usuario; algunos mensajes con errores de tildes ("El codigo expiro", "Tu empresa esta en revision"). | PARCIAL |

### 9.4 Documentación

| Documento | Estado | Observación |
|---|---|---|
| `RehniMarket-backend/README.md` | **CORREGIDO 2026-08-31** | Reescrito al estado real (RehniMarket, stack real, 10 migraciones, 24 routers, 113 tests). Nota histórica explícita sobre "Lubix". H-08 resuelto. |
| `RehniMarket-backend/CHANGELOG.md` | PARCIAL | Registra cambios hasta `[1.1.2] - 2026-06-19`; no refleja las versiones 2.x. |
| `RehniMarket-frontend/README.md` | PARCIAL | Es la plantilla por defecto de "React + TypeScript + Vite", sin contenido propio del proyecto. |
| `RehniMarket-mobile/README.md` | IMPLEMENTADO | Breve pero correcto: requisitos, comando de arranque (`expo start --lan --port 8085`), estructura. |
| `app/docs/ARQUITECTURA-VARIANTES.md` | IMPLEMENTADO | Documenta el modelo de variantes/atributos, que es la parte más compleja del dominio. |
| `app/docs/AUDITORIA.md` | IMPLEMENTADO | Procedimiento de auditoría de CVE con `pip-audit`. |
| `docs/RehniMarket-HU.md` | IMPLEMENTADO (con desviaciones) | 29 historias de usuario bien redactadas; contradice el código en 2 puntos (anuncios con texto; login de empresa pendiente). Hallazgos H-14, H-15. |
| `docs/RehniMarket-Requisitos.docx`, `docs/*Pruebas_Integracion*.xlsx/.docx` | NO VERIFICADO | Archivos binarios; su contenido no se pudo inspeccionar en este análisis. |
| Comentarios en el código | IMPLEMENTADO | Densidad alta y de calidad en middleware, `seed.py`, `CheckoutService.py`, interceptores del frontend. Varios comentarios señalan pendientes conocidos (p. ej. `apiErrorHandler.ts` documenta el `PENDIENTE BACKEND` del `reason` en `COMPANY_SUSPENDED`). |

### 9.5 Migraciones y gestión de configuración

| Aspecto | Evidencia | Estado |
|---|---|---|
| Migraciones | 10 revisiones Alembic en **cadena lineal** (`29fe206320ce` → … → `a1b2c3d4e5f6`), sin ramas. `alembic/env.py` toma la URL de `app.Config` y aplica `Base.metadata`. Se ejecutan automáticamente en el arranque del contenedor (`docker-compose.yml`). | IMPLEMENTADO |
| Configuración | Centralizada en `app/Config.py` (carga de `.env` con `python-dotenv`). Frontend: `import.meta.env.VITE_*`. Móvil: `process.env.EXPO_PUBLIC_*` vía `src/config/env.ts`. | IMPLEMENTADO |
| Desalineación `.env` ↔ `.env.example` | El `.env` real del backend usa nombres de variables de *seed* distintos a los del `.env.example`, incluye `IP` (no leída por el código) y `URL_BACKEND`. Documentado en `DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md`. | PARCIAL — hallazgo H-09 |

### 9.6 Dependencias

| Aspecto | Evidencia | Estado |
|---|---|---|
| Reproducibilidad | `uv.lock` (backend), `pnpm-lock.yaml` (frontend y móvil); `uv sync --frozen --no-dev` en el `Dockerfile`. | IMPLEMENTADO |
| Auditoría de CVE | **`pip-audit` y `pnpm audit` ejecutados el 2026-08-31** (`evidencias/security/`). Backend: 8→1 vulnerabilidad (la restante, `ecdsa`, no explotable). | RESUELTO EN GRAN PARTE — S-17 |
| Dependencias declaradas y no usadas | `sentry-sdk` (backend, sin inicializar), `react-device-detect` (frontend, sin importar en `src/`). | PARCIAL — hallazgo H-13 |
| Verificación automática de tipos/estilo (Python) | No hay `ruff`, `mypy`, `black`, `flake8` ni `isort` en `pyproject.toml`. | PENDIENTE — hallazgo H-07 |
| CI/CD | No existe ningún flujo de integración continua (`.github/workflows/`, `.gitlab-ci.yml`, etc.). | PENDIENTE — hallazgo H-10 |

---

## 10. Pruebas y verificación

### 10.1 Inventario de pruebas automatizadas

**Solo el backend tiene pruebas automatizadas.** El frontend web y la app móvil **no tienen ningún archivo de prueba** (`0` archivos `*.test.*` / `*.spec.*` en `RehniMarket-frontend/src` y `RehniMarket-mobile/src`).

| Archivo (`RehniMarket-backend/tests/`) | Funciones `test_` | Área que cubre |
|---|:--:|---|
| `test_public_and_commerce.py` | 21 | Catálogo público, detalle de producto, imagen inicial, **carrito y checkout**, descuento de stock atómico, concurrencia, *snapshot* de pedido. |
| `test_catalog_attributes.py` | 24 | Atributos de catálogo y opciones (administración). |
| `test_variants.py` | 22 | Generación y resolución de variantes de producto. |
| `test_product_search.py` | 15 | Búsqueda difusa (`pg_trgm` / `unaccent`). |
| `test_offers_and_new.py` | 14 | Secciones "Ofertas" y "Novedades", precio de tarjeta con descuento. |
| `test_advertisements.py` | 10 | Anuncios del Home y segmentación. |
| `test_pricing.py` | 7 | Resolución de precio (descuentos producto/variante, ventana temporal). |
| **Total** | **113** | En **25 clases de prueba**. |

- **Marco:** `pytest` + `pytest-cov` (declarados en `pyproject.toml`, grupo `dev`; `[tool.pytest.ini_options]` con `testpaths = ["tests"]`).
- **Tipo:** son pruebas de **servicio / integración ligera**. `tests/conftest.py` (221 líneas) crea una base de datos real `rehnimarket_test` en el mismo PostgreSQL, construye el esquema con `Base.metadata.create_all`, replica las extensiones `pg_trgm`/`unaccent`, y usa `TestClient` de FastAPI con `get_db` sustituido. Es decir, ejercitan la lógica de negocio contra una base de datos PostgreSQL real, pero **no** levantan la aplicación completa ni MinIO/SMTP.
- **Pruebas de API end-to-end, de frontend, de móvil, de contrato, E2E de navegador:** **no existen**.
- **Cobertura de código:** `pytest --cov=app` **se ejecutó el 2026-08-31** (`evidencias/tests/pytest-cov.txt`). Sigue **sin umbral configurado** en `pyproject.toml` (acción AP-03). El porcentaje concreto está en la evidencia; no se transcribe aquí para evitar que quede desactualizado.

### 10.2 Verificaciones estáticas

| Verificación | Configurada | Ejecutada en este análisis | Resultado |
|---|:--:|:--:|---|
| TypeScript — frontend (`tsc -b`) | Sí (`package.json` → `build`) | **Sí** | Sin errores (código de salida 0). |
| ESLint — frontend (`eslint .`) | Sí (`eslint.config.js`) | **Sí** | Sin *warnings* ni errores (código de salida 0). |
| *Build* de producción — frontend (`vite build`) | Sí | **Sí** (a directorio temporal) | Compila (`✓ built in 687ms`). Aviso de *chunk* > 500 kB. |
| TypeScript — móvil | Sí (`tsconfig.json` con `strict`) | No | Suite/verificación existente — ejecución no verificada durante este análisis. |
| ESLint — móvil (`expo lint`) | Sí (`eslint.config.js`, `package.json` → `lint`) | No | Suite/verificación existente — ejecución no verificada durante este análisis. |
| `pytest` — backend (7 archivos) | Sí | **Sí — COMPLETA (2026-08-31)** | **`113 passed`** (10:51 min, código de salida 0). `evidencias/tests/pytest.txt`. |
| `pip-audit` — backend | Disponible (dep. `dev`) + documentado | No | `PENDIENTE — NO VERIFICADO`. |
| Cobertura (`pytest --cov`) | Herramienta disponible | **Sí (2026-08-31)** | Medida sobre `app/`. `evidencias/tests/pytest-cov.txt`. Sin umbral fijado aún (AP-03). |

> **No se ejecutaron pruebas destructivas.** La ejecución de `test_public_and_commerce.py` se realizó dentro del contenedor `rehni-backend` contra la base `rehnimarket_test` (aislada de datos reales), tal como está diseñado `conftest.py`.

### 10.3 Documentación de pruebas de integración (externa al código)

En `docs/` existen los archivos `Guía de Pruebas de Integración en Software.docx`, `Plantilla_Pruebas_Integracion.xlsx` y `Pruebas_Integracion_RehniMarket.xlsx`. Son **evidencia de que se planificó/documentó un proceso de pruebas de integración**, pero su contenido es binario y **no se pudo verificar** en este análisis. Estado: **PARCIAL — contenido no verificado**.

---

## 11. Registro de hallazgos

### 11.1 Hallazgos positivos

| ID | Hallazgo | Categoría | Evidencia | Estado |
|---|---|---|---|---|
| P-01 | Arquitectura por capas consistente en el backend (router → service → repository → model). | Mantenibilidad | `app/routers/`, `app/services/`, `app/repository/`, `app/models/` | VERIFICADO (por inspección) |
| P-02 | Reserva de stock en el checkout **atómica y segura ante concurrencia** (`UPDATE ... WHERE stock >= qty`, orden determinista, `rollback` total) con prueba de concurrencia. | Fiabilidad | `app/services/commerce/CheckoutService.py`; `tests/test_public_and_commerce.py::test_concurrent_checkout_of_last_unit_lets_only_one_win` | **VERIFICADO** (prueba ejecutada: 21 passed) |
| P-03 | Autorización por rol con revalidación en cada petición del estado de la cuenta y de la empresa. | Seguridad | `app/middleware/AuthMiddleware.py`, `app/middleware/RolePermissions.py` | VERIFICADO (por inspección) |
| P-04 | Contrato de error uniforme `{ detail: { code, message } }` con 102 códigos catalogados y manejo centralizado en cliente. | Compatibilidad / Usabilidad | `app/core/Exceptions.py`, `app/core/ErrorCodes.py`, `src/api/apiErrorHandler.ts` | IMPLEMENTADO |
| P-05 | Reglas de negocio centralizadas y parametrizadas (IVA 19% en `TaxConfig`, comisión 5% en `PayoutConfig`, precios en `pricing.py`). | Adecuación funcional / Mantenibilidad | `app/core/TaxConfig.py`, `app/core/PayoutConfig.py`, `app/services/pricing.py` | IMPLEMENTADO |
| P-06 | Migraciones de BD versionadas en cadena lineal, aplicadas automáticamente al arranque. | Mantenibilidad / Portabilidad | `alembic/versions/` (10), `docker-compose.yml` | IMPLEMENTADO |
| P-07 | Contenerización completa de la plataforma de servidor con dependencias fijadas (`uv.lock`, `pnpm-lock.yaml`). | Portabilidad | `docker-compose.yml`, `RehniMarket-backend/Dockerfile` | IMPLEMENTADO |
| P-08 | Suite de 113 pruebas de servicio/integración en el backend contra PostgreSQL real. | Pruebas | `RehniMarket-backend/tests/`, `evidencias/tests/pytest.txt` | **VERIFICADO (2026-08-31): 113/113 PASAN** |
| P-09 | Frontend: `tsc -b` y `eslint .` pasan sin errores; el *build* de producción compila. | Mantenibilidad | Comandos ejecutados (sección 4.1) | **VERIFICADO** |
| P-10 | Diseño responsivo aplicado (64 componentes web con *breakpoints* Tailwind; `useResponsive` en móvil) y atención a accesibilidad (52 componentes con `aria-*`). | Responsive / Accesibilidad | `grep` de `sm:`/`md:`/`lg:` y `aria-*` en `src/` | IMPLEMENTADO |
| P-11 | Hash de contraseñas con `bcrypt`; secretos fuera del control de versiones (`.gitignore`, `.dockerignore`). | Seguridad | `app/utils/Security.py`, `.gitignore`, `.dockerignore` | IMPLEMENTADO |
| P-12 | Documentación de arquitectura del subdominio más complejo (variantes) y del procedimiento de auditoría de CVE. | Documentación | `app/docs/ARQUITECTURA-VARIANTES.md`, `app/docs/AUDITORIA.md` | IMPLEMENTADO |
| P-13 | El código señala explícitamente varios pendientes conocidos (comentarios `PENDIENTE`), lo que evidencia seguimiento activo de deuda técnica. | Proceso / Mantenibilidad | `src/api/apiErrorHandler.ts`, `src/features/.../*.tsx` | IMPLEMENTADO |

### 11.2 Hallazgos negativos

| ID | Hallazgo | Categoría | Severidad | Evidencia | Estado |
|---|---|---|---|---|---|
| H-01 | CORS: **CORREGIDO 2026-08-31** — `allow_origins` desde `URL_FRONTEND` + locales; `allow_credentials` coherente. | Seguridad | Medio → resuelto | `app/middleware/CorsMiddleware.py` | **CORREGIDO** |
| H-02 | *Rate limiting*: **AJUSTADO 2026-08-31** — activable con `RATE_LIMIT_ENABLED`; forzado a `true` en `docker-compose.prod.yml`. Falta almacén compartido para varias réplicas. | Seguridad | Bajo (activable) | `app/main.py`, `app/Config.py` | **PARCIAL → activable** |
| H-03 | Sin TLS en el Compose de desarrollo. `docker-compose.prod.yml` (nuevo) asume un reverse proxy TLS por delante (no incluido — depende del dominio). MinIO con `secure=False` en red interna. | Seguridad / Infraestructura | Medio (publicación real) | `docker-compose.prod.yml`, `DOCUMENTACION_DESPLIEGUE` §10.7 | **PARCIAL** (compose prod listo; falta el proxy TLS) |
| H-04 | `SECRET_KEY`: **CORREGIDO 2026-08-31** — `.env.example` con placeholder e instrucción `openssl rand -hex 32`. | Seguridad | Bajo (documental) | `.env.example`, `.env.prod.example` | **CORREGIDO** |
| H-05 | Sin pruebas en frontend ni móvil (0 archivos de test). | Pruebas | Medio | `find` en `RehniMarket-frontend/src` y `RehniMarket-mobile/src` | PENDIENTE |
| H-06 | `strict` de TypeScript no activado en el frontend web (sí en móvil). | Mantenibilidad | Bajo | `RehniMarket-frontend/tsconfig.app.json` | IMPLEMENTADO (config.) |
| H-07 | Sin linter/formateador ni verificador de tipos para el backend Python (`ruff`/`mypy`/`black` ausentes). | Mantenibilidad | Bajo | `pyproject.toml` | PENDIENTE |
| H-08 | `RehniMarket-backend/README.md` / `CHANGELOG.md`: **CORREGIDOS 2026-08-31** (nombre real, stack real, 10 migraciones, 24 routers, 113 tests; nota histórica sobre "Lubix"). | Documentación | Bajo | `RehniMarket-backend/README.md`, `CHANGELOG.md` | **CORREGIDO** |
| H-09 | Desalineación entre `.env` real y `.env.example` (nombres de *seed*, variable `IP` no usada). | Configuración / Mantenibilidad | Bajo | `RehniMarket-backend/.env`, `.env.example`, `app/Config.py` | PARCIAL |
| H-10 | Sin integración continua (CI): las verificaciones (`tsc`, `eslint`, `pytest`) dependen de ejecución manual. | Proceso | Bajo | Ausencia de `.github/workflows/`, `.gitlab-ci.yml` | PENDIENTE |
| H-11 | Historial de *commits* pobre: 12 *commits*, mensajes tipo "ver 2.4", "new feature", "version estable con bugs". Dificulta la trazabilidad. | Proceso / Mantenibilidad | Bajo | `git log --oneline` | IMPLEMENTADO |
| H-12 | *Logging* mínimo (3 usos de `logging`) y 38 `traceback.print_exc()` a *stdout*; `sentry-sdk` declarado pero **no inicializado**. | Fiabilidad / Observabilidad | Bajo | `grep` en `app/` | PARCIAL |
| H-13 | Dependencias declaradas y no usadas: `sentry-sdk` (backend), `react-device-detect` (frontend). | Mantenibilidad | Bajo | `pyproject.toml`, `package.json` vs. `grep` en el código | IMPLEMENTADO |
| H-14 | Contradicción documentación ↔ código: `docs/RehniMarket-HU.md` (HU-025) describe anuncios "con imagen, texto y enlace"; el código los define como **banners solo visuales** (sin título/descripción/botón), con migración `d4e5f6a7b8c9_advertisement_drop_text_fields`. | Adecuación funcional / Documentación | Bajo | `docs/RehniMarket-HU.md` vs. `app/schemas/SchemaDashboard/SchemaAdvertisement.py` | IMPLEMENTADO (código) / documentación desviada |
| H-15 | Contradicción documentación ↔ código: `docs/RehniMarket-HU.md` (HU-004) dice que una empresa con certificación pendiente "puede iniciar sesión"; el código lo **bloquea** con `COMPANY_PENDING`. | Adecuación funcional / Documentación | Bajo | `docs/RehniMarket-HU.md` vs. `app/services/authentication/LoginService.py` | IMPLEMENTADO (código) / documentación desviada |
| H-16 | `build_media_url()`: **CORREGIDO 2026-08-31** — `MEDIA_BASE_URL = config.URL_BACKEND or <fallback>`. | Portabilidad | Bajo | `app/services/NasService.py` | **CORREGIDO** |
| H-17 | Solo existe una configuración de `docker-compose` orientada a **desarrollo** (`--reload`, `pnpm dev`, *bind mounts*, puertos de BD/MinIO expuestos, sin `healthcheck`). | Portabilidad / Disponibilidad | Bajo | `docker-compose.yml` | PENDIENTE (config. de producción) |
| H-18 | App móvil sin empaquetado nativo configurado (sin `eas.json`, sin `android/`/`ios/`); solo uso vía Expo Go. | Portabilidad | Bajo | `RehniMarket-mobile/` | PENDIENTE |

### 11.3 Riesgos

| ID | Riesgo | Origen | Impacto potencial | Probabilidad |
|---|---|---|---|---|
| R-01 | Publicar con el Compose de **desarrollo** en Internet. Mitigado: existe `docker-compose.prod.yml` (BD/MinIO sin puertos, backend en loopback, rate limit on, CORS restringido, `SECRET_KEY` por entorno). Riesgo residual: falta el reverse proxy TLS y el despliegue real. | H-03, H-17 | Exposición si se usa el compose de dev en producción. | Baja (con el compose prod) |
| R-02 | Regresiones no detectadas en frontend/móvil por ausencia de pruebas automatizadas en esas capas. | H-05 | Errores de UI/flujo llegan a producción sin barrera automática. | Media-Alta |
| R-03 | Desincronización de los enumerados de códigos de error entre backend, frontend y móvil (mantenidos a mano). | 9.2, 9.4 | Un código nuevo o renombrado en el backend no se refleja en los clientes; mensajes o flujos de error incorrectos. | Media |
| R-04 | Pérdida de datos por ausencia de plan de respaldo de PostgreSQL implementado. | `DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md` §9 | Sin copias de seguridad automatizadas ni probadas. | Media |
| R-05 | Diagnóstico lento de incidentes en ejecución por *logging* mínimo y sin monitor de errores. | H-12 | Mayor tiempo de detección/resolución de fallos. | Media |
| R-06 | Vulnerabilidades de dependencias no detectadas de forma continua (falta CI que ejecute `pip-audit`/`pnpm audit` en cada push). Auditoría puntual **hecha** el 2026-08-31. | S-17 / AP-04 | CVEs nuevos pasan inadvertidos entre auditorías manuales. | Media-Baja |
| R-07 | Confusión operativa por documentación desactualizada (`README` "Lubix", HU con desviaciones, `.env` vs `.env.example`). | H-08, H-09, H-14, H-15 | Errores de configuración en una instalación nueva; expectativas funcionales incorrectas. | Media |

### 11.4 Pendientes

Elementos que **no son fallas**, sino parte del alcance futuro o de mejoras planificadas:

| ID | Pendiente | Naturaleza |
|---|---|---|
| PEND-01 | Medición formal de rendimiento (pruebas de carga, SLO de latencia). | Alcance de QA futuro |
| PEND-02 | Auditoría formal de accesibilidad (WCAG / axe / Lighthouse). | Alcance de QA futuro |
| PEND-03 | Configuración de despliegue de producción (Compose endurecido + TLS + *reverse proxy*). | Infraestructura |
| PEND-04 | Plan de respaldo y restauración de PostgreSQL automatizado y probado. | Infraestructura |
| PEND-05 | Empaquetado y distribución de la app móvil (EAS / APK). | Alcance de producto móvil |
| PEND-06 | Pruebas automatizadas de frontend y móvil, y CI que las ejecute. | Proceso de QA |
| PEND-07 | Medición de cobertura de pruebas del backend con umbral. | Proceso de QA |
| PEND-08 | Artefactos de PSP (registro de defectos, estimación, seguimiento de tiempo). | Proceso individual |

---

## 12. Lecciones aprendidas

Extraídas de evidencia real del repositorio:

1. **Centralizar la configuración evita errores y facilita la portabilidad.** `app/Config.py` concentra la lectura de variables de entorno y el resto del código depende de ese único punto; el frontend y el móvil hacen lo propio con `import.meta.env` / `src/config/env.ts`. La contrapartida —una `.env.example` desalineada con el `.env` real (H-09)— muestra que centralizar **también obliga a mantener la plantilla al día**.

2. **La separación frontend/backend con un contrato de error explícito reduce el acoplamiento.** El formato `{ detail: { code, message } }` (`api_error`) permite que web y móvil compartan la misma lógica de manejo de errores. La lección secundaria: ese contrato **debe tener una única fuente de verdad**; hoy los códigos están triplicados y se sincronizan a mano (R-03).

3. **Las operaciones que afectan dinero y stock deben resolverse en el servidor de forma atómica.** El checkout descuenta stock con un `UPDATE` condicional y bloquea la billetera con `FOR UPDATE`; el frontend solo deshabilita botones como conveniencia de UX. La prueba `test_concurrent_checkout_of_last_unit_lets_only_one_win` confirma el enfoque. Esta es la decisión de diseño más valiosa del proyecto.

4. **La validación de stock debe informar sin bloquear todo el flujo.** El manejo de productos agotados en el carrito (etiquetas "Agotado"/"Sin stock suficiente", botón de pago deshabilitado solo cuando corresponde, posibilidad de eliminar la línea) evidencia que una buena UX de error mantiene al usuario en control en lugar de dejarlo atascado.

5. **El tipado fuerte de extremo a extremo detecta errores antes de ejecutar.** Pydantic en el backend y TypeScript en los clientes permitieron que `tsc -b` y la suite de `pytest` sirvieran de red de seguridad. La lección: **aplicar el mismo rigor en todas partes** — hoy el frontend no usa `strict` (H-06) y no tiene pruebas (H-05).

6. **Documentar la arquitectura del subdominio más complejo paga.** `ARQUITECTURA-VARIANTES.md` explica el modelo de variantes/atributos, que de otro modo sería difícil de entender solo con el código. La contrapartida: la documentación de alcance funcional (`RehniMarket-HU.md`) quedó desincronizada en dos puntos (H-14, H-15), lo que muestra que **la documentación de comportamiento envejece más rápido que la de arquitectura** y necesita revisión periódica contra el código.

7. **La reutilización de componentes y de un cliente HTTP único simplifica el mantenimiento.** Las primitivas de `src/shared/components/ui/` y el `api` único (sin instancias de axios dispersas) redujeron la duplicación en una base de ~166 componentes.

8. **La contenerización desde el inicio hace reproducible el entorno**, pero mantener **una sola** configuración (desarrollo) deja el despliegue de producción como deuda (H-17).

---

## 13. Plan de mejora continua

Prioridad: **Alta** (impacto en seguridad/fiabilidad o bloqueante para producción) · **Media** (mejora relevante de calidad) · **Baja** (pulido / deuda menor).

> **Contexto:** RehniMarket lo desarrolla **una sola persona**. El campo "Responsable" es,
> en todos los casos, **el desarrollador del proyecto**. El campo "Horizonte" indica cuándo
> se prevé abordar cada acción (esta entrega / corto / medio plazo).
>
> **Actualización 2026-08-31 (entrega SENA):** varias acciones se ejecutaron durante la
> preparación de la entrega. El estado y la evidencia se reflejan abajo; la evidencia
> concreta está en `evidencias/` y en `docs/AUDITORIA_FINAL_REHNIMARKET.md`.

### 13.1 Acciones correctivas

| ID | Acción | Resuelve | Prioridad | Horizonte | Estado (2026-08-31) |
|---|---|---|---|---|---|
| AC-01 | Restringir CORS a los orígenes reales del frontend (usar `URL_FRONTEND`). | H-01 / R-01 | Alta | Esta entrega | **HECHO** — `CorsMiddleware.py` construye la lista desde `URL_FRONTEND` + orígenes locales; `allow_credentials` solo con lista concreta. |
| AC-02 | Activar `RateLimitMiddleware` y respaldarlo en almacén compartido si hay réplicas. | H-02 | Alta | Corto plazo | **HECHO (activación)** — se activa con `RATE_LIMIT_ENABLED=true` (`Config.py`, `main.py`, `.env.example`); **`docker-compose.prod.yml` lo fuerza a `true`**. Por defecto `false` en desarrollo. Falta solo el **almacén compartido** para varias réplicas. |
| AC-03 | `SECRET_KEY` largo y aleatorio por entorno; `.env.example` sin valor real. | H-04 / R-01 | Alta | Esta entrega | **HECHO** — `.env.example` con placeholder explícito e instrucción `openssl rand -hex 32`. (Generar el valor real es acción del despliegue.) |
| AC-04 | `build_media_url()` a partir de `config.URL_BACKEND` en vez de la IP fija. | H-16 | Alta | Esta entrega | **HECHO** — `NasService.py`: `MEDIA_BASE_URL = config.URL_BACKEND or <fallback>`. |
| AC-05 | Actualizar `README.md` y `CHANGELOG.md` del backend (nombre "RehniMarket", versión real). | H-08 / R-07 | Media | Esta entrega | **HECHO** — ambos reescritos; nota histórica sobre "Lubix". |
| AC-06 | Alinear `.env.example` con las variables que lee `app/Config.py`; documentar/eliminar `IP`. | H-09 / R-07 | Media | Esta entrega | **HECHO** — `.env.example` incluye `USER_NAME_ADMIN`; `IP` documentada como no leída en el Manual Técnico §22. |
| AC-07 | Alinear `docs/RehniMarket-HU.md` (HU-004, HU-025) con el código, o registrar la desviación. | H-14, H-15 / R-07 | Media | Corto plazo | **PARCIAL (documentado)** — la desviación está registrada en `PLAN_PRUEBAS_ACEPTACION` §16.2 y en el Manual de Usuario §16.5/§20; `Historia de usuario.md` (raíz) se reencuadró como no autoritativo. Falta editar el texto de HU-004/HU-025 en `RehniMarket-HU.md`. |
| AC-08 | Activar `"strict": true` en `tsconfig.app.json` del frontend y resolver errores. | H-06 | Media | Medio plazo | PENDIENTE — riesgo de cambios amplios; se aborda con más tiempo. |
| AC-09 | Dependencias no usadas: `sentry-sdk` (inicializar o quitar), `react-device-detect` (quitar). | H-13 | Baja | Medio plazo | PENDIENTE. |
| AC-10 | Renombrar `SchemaDashboard/ShemaCompany.py` → `SchemaCompany.py`; normalizar tildes en mensajes. | 9.3 | Baja | Medio plazo | PENDIENTE — el renombrado toca muchos imports; se hace con pruebas de regresión. |
| **AC-11** *(nuevo)* | Actualizar dependencias con CVE conocido (`pip-audit` / `pnpm audit`). | S-17 | Alta | Esta entrega | **HECHO** — Backend: `click`, `pip`, `pyasn1`, `pydantic-settings` actualizados (8→1 vuln.); `ecdsa` sin parche pero **no explotable** (HS256). Frontend: `react-router-dom` 7.18.1→7.18.3 (7→6 vuln.; resto de build/lint). Móvil: transitivas de Expo, documentadas. Evidencia: `evidencias/security/`. |

### 13.2 Acciones preventivas

| ID | Acción | Resuelve | Prioridad | Horizonte | Estado (2026-08-31) |
|---|---|---|---|---|---|
| AP-01 | CI (GitHub Actions) que ejecute `pytest` + `tsc -b` + `eslint` + `expo lint` en cada push. | H-10 / R-02 | Alta | Corto plazo | PENDIENTE. |
| AP-02 | Pruebas automatizadas de frontend (Vitest) y móvil (`jest-expo` ya configurado). | H-05 / R-02 | Alta | Medio plazo | PENDIENTE. |
| AP-03 | Medir cobertura con `pytest --cov` y fijar umbral tras la primera medición. | PEND-07 | Media | Esta entrega | **PARCIAL** — cobertura medida: **TOTAL 62 %** (`app/`, 7516 sentencias, `evidencias/tests/pytest-cov.txt`). Falta fijar el umbral en `pyproject.toml`. |
| AP-04 | Auditoría de dependencias en cada entrega/CI: `pip-audit`, `pnpm audit`; guardar reporte. | S-17 / R-06 | Media | Esta entrega | **PARCIAL** — `pip-audit` y `pnpm audit` ejecutados y guardados en `evidencias/security/`. Falta integrarlo en CI. |
| AP-05 | `ruff` (+ opcional `mypy`) para el backend, en CI. | H-07 | Media | Medio plazo | PENDIENTE. |
| AP-06 | Convención de commits (Conventional Commits). | H-11 | Baja | Corto plazo | PENDIENTE — recogido en `BITACORA_PSP` §7 (PSP-3). |
| AP-07 | Generar `ErrorCode` de frontend/móvil desde una única fuente. | R-03 | Media | Medio plazo | PENDIENTE. |
| AP-08 | `healthcheck` en `docker-compose.yml`. | 7.4 | Media | Esta entrega | **HECHO** — healthchecks para `postgres` (`pg_isready`), `minio` (`/minio/health/live`) y `backend` (`/health/database`). |
| AP-09 | `logging` estructurado + monitor de errores (aprovechar `sentry-sdk`). | H-12 / R-05 | Media | Medio plazo | PENDIENTE. |

### 13.3 Mejoras futuras

| ID | Acción | Beneficio | Prioridad | Horizonte | Estado (2026-08-31) |
|---|---|---|---|---|---|
| MF-01 | `docker-compose.prod.yml` endurecido + reverse proxy con TLS. | Portabilidad / Seguridad / Disponibilidad | Alta | Corto plazo | **HECHO (parcial)** — `docker-compose.prod.yml` + `RehniMarket-frontend/Dockerfile.prod` (Nginx) + `nginx.conf` + `.env.prod.example` creados, **construidos y probados en un proyecto Compose aislado** (`evidencias/deployment/10_prod_compose_smoke.txt`): sin `--reload`, frontend compilado, sin bind mounts, BD/MinIO sin puertos, backend en loopback, `depends_on` por healthcheck, MinIO fijado por digest. **Falta:** el reverse proxy TLS (depende del dominio) y el despliegue real. |
| MF-02 | Implementar y automatizar el respaldo de PostgreSQL + MinIO y su prueba de restauración. | R-04 / PEND-04 | Alta | Esta entrega | **PARCIAL** — `scripts/backup_rehnimarket.sh` y `scripts/restore_rehnimarket.sh` creados y **ejecutados una vez** con prueba de restauración en entorno aislado (`evidencias/backup/`). Falta: `cron`/`systemd` y copia externa cifrada automatizadas. |
| MF-03 | Campaña de carga sobre catálogo y checkout; línea base + SLO. | PEND-01 | Media | Corto plazo | **PARCIAL** — (a) línea base básica ejecutada: `scripts/perf_test.sh`, `evidencias/performance/resultado.txt` (900 solicitudes, 0 errores). (b) **Plantilla k6 lista** (`scripts/load_test.k6.js`) — **NO ejecutada** (sin k6 instalado; sin resultados k6; sin SLO acordado). |
| MF-04 | Auditoría de accesibilidad (Lighthouse / axe) del frontend + plan WCAG. | PEND-02 | Media | Medio plazo | PENDIENTE. |
| MF-05 | *Code-splitting* del *bundle* del frontend (~729 kB). | Rendimiento | Media | Medio plazo | PENDIENTE. |
| MF-06 | EAS Build para APK/AAB firmados de la app móvil. | PEND-05 | Media | Medio plazo | PENDIENTE. |
| MF-07 | Matriz de trazabilidad HU ↔ endpoint ↔ prueba, mantenida. | Adecuación funcional / Pruebas | Baja | Corto plazo | **PARCIAL** — existe en `PLAN_PRUEBAS_ACEPTACION` §16 y en `RehniMarket-Requisitos.docx` §6; falta la columna de prueba automatizada por HU. |
| MF-08 | Artefactos de PSP (registro de defectos por fase, estimación vs. real). | Criterio 7 SENA | Baja | Esta entrega | **HECHO** — `docs/BITACORA_PSP_REHNIMARKET.md` (retrospectiva, con aviso de honestidad). |

---

## 14. Matriz de calidad

| Área | Estado | Evidencia | Mejora requerida |
|---|:--:|---|---|
| **Funcionalidad** | 🟡 PARCIAL | 24 routers, 29 HU, reglas de negocio centralizadas; 2 desviaciones documentación↔código (H-14, H-15). | Alinear documentación funcional; matriz de trazabilidad HU↔prueba (MF-07). |
| **Seguridad** | 🟡 PARCIAL → mejorada | Autenticación/autorización sólidas (P-03, P-11); **H-01/H-04/H-16 corregidos**, H-02 activable, `docker-compose.prod.yml` endurecido, deps con CVE actualizadas (8→1). Residual: reverse proxy TLS (S-11) y MinIO de mínimo privilegio. | MF-01 (proxy TLS), S-12. |
| **Rendimiento** | 🟡 PARCIAL | Línea base **ejecutada** (`perf_test.sh`: 900 solicitudes, 0 errores, catálogo p95 66 ms). Plantilla k6 lista, **no ejecutada**. Sin SLO acordado. | MF-03 (ejecutar k6 + SLO), MF-05 (*code-splitting*). |
| **Usabilidad** | 🟡 PARCIAL | Sistema de diseño, estados de UI, mensajes en español; sin evaluación con usuarios. | Evaluación de usabilidad; auditoría WCAG (MF-04). |
| **Mantenibilidad** | 🟡 PARCIAL | Arquitectura por capas, tipado, migraciones lineales, documentación de arquitectura (P-01, P-06, P-12); sin CI, sin linter Python, `strict` off en web, `README` obsoleto. | AP-01, AP-05, AC-05, AC-08. |
| **Portabilidad** | 🟡 PARCIAL | Contenerización + *lockfiles* + config por entorno (P-07); solo Compose de desarrollo; IP fija en `build_media_url`; móvil sin empaquetado. | MF-01, AC-04, MF-06. |
| **Fiabilidad** | 🟡 PARCIAL | Checkout atómico probado (P-02); sin `healthcheck`, *logging* mínimo, sin monitor de errores. | AP-08, AP-09, MF-02. |
| **Compatibilidad** | ✅ IMPLEMENTADO | Contrato de API único para web y móvil; integraciones SMTP/MinIO/WhatsApp; `/docs` automático. | Fuente única de códigos de error (AP-07). |
| **Pruebas** | 🟡 PARCIAL | 113 pruebas de servicio en backend (1 archivo ejecutado: OK); **0** en frontend/móvil; sin cobertura medida; sin CI. | AP-01, AP-02, AP-03. |
| **Documentación** | 🟡 PARCIAL | Buenos documentos de arquitectura, despliegue, manual de usuario y HU; `README` backend obsoleto; HU con 2 desviaciones. | AC-05, AC-07. |

---

## 15. Conclusiones

### 15.1 Fortalezas

- **El núcleo transaccional es correcto y está probado.** El checkout resuelve la reserva de stock y el cobro de RehniCoin de forma atómica y segura ante concurrencia, con una prueba automatizada que lo confirma (ejecutada durante este análisis: 21 pruebas del módulo de comercio en verde).
- **La arquitectura es limpia y consistente.** Separación por capas en el backend, organización por *features* en el frontend, tipado fuerte de extremo a extremo, migraciones versionadas en cadena lineal y configuración externalizada.
- **La seguridad de la lógica de negocio es sólida.** Autenticación JWT con *refresh*, autorización por rol con revalidación en cada petición, hash `bcrypt`, y la autoridad de negocio siempre en el servidor.
- **El proyecto está contenerizado y es reproducible**, con dependencias fijadas y verificaciones estáticas (TypeScript, ESLint) que pasan sin errores en el frontend.
- **Existe cultura de documentación y de registro de deuda técnica** (documentos de arquitectura, `AUDITORIA.md`, comentarios `PENDIENTE` en el código, historias de usuario detalladas).

### 15.2 Debilidades

- **La capa de transporte/infraestructura del Compose de desarrollo sigue por debajo de la lógica**, pero varios puntos se corrigieron en esta entrega (CORS restringido, `SECRET_KEY` con placeholder, rate limiting activable, `docker-compose.prod.yml` endurecido). Queda: el **reverse proxy con TLS** para una publicación real y un usuario de **MinIO de mínimo privilegio**.
- **La red de pruebas es parcial:** solo el backend tiene pruebas automatizadas; el frontend y el móvil no tienen ninguna; no hay medición de cobertura ni CI.
- **No existe medición formal de rendimiento** ni de accesibilidad.
- **La documentación de comportamiento y de configuración presenta desviaciones** respecto del código (`README` "Lubix", 2 HU desactualizadas, `.env.example` desalineado).
- **La observabilidad en ejecución es mínima** (*logging* escaso, sin monitor de errores).

### 15.3 Riesgos

El principal riesgo es **desplegar la configuración de desarrollo tal cual en un entorno expuesto**. El segundo es **introducir regresiones en frontend/móvil sin barrera automática**. Ambos son mitigables con las acciones AC-01 a AC-04, MF-01 y AP-01/AP-02.

### 15.4 Estado general de calidad

RehniMarket es un proyecto **funcionalmente amplio y con un diseño técnico sólido en su núcleo**, cuyo estado de calidad general es **PARCIAL / EN PROGRESO**: las bases (arquitectura, seguridad de la lógica, transaccionalidad, contenerización, pruebas del backend) están bien establecidas, y las brechas se concentran en **endurecimiento de infraestructura, ampliación de la cobertura de pruebas a los clientes, medición de atributos no funcionales y actualización de la documentación**.

**No se afirma que el software sea seguro al 100% ni libre de errores.** El análisis fue estático y no incluyó pruebas de penetración, escaneo dinámico ni ejecución completa de la suite; los hallazgos reflejan lo observable en el código a la fecha.

### 15.5 Mejoras pendientes prioritarias

1. Endurecer seguridad de transporte/infraestructura (AC-01, AC-02, AC-03, MF-01).
2. Establecer CI que ejecute todas las verificaciones existentes (AP-01).
3. Añadir pruebas automatizadas a frontend y móvil (AP-02).
4. Corregir `build_media_url` y actualizar la documentación desviada (AC-04, AC-05, AC-07).
5. Implementar el plan de respaldo de base de datos (MF-02).

---

## 16. Relación con criterios de evaluación SENA

### Criterio 7 — Marcos de calidad y PSP

| Aspecto | Detalle |
|---|---|
| **Qué evidencia existe** | Este informe aplica **ISO/IEC 25010** (sección 6), la familia **ISO/IEC 25000** como marco de proceso de evaluación (secciones 4 y 5), y **CMMI** como referencia conceptual para situar la madurez de las prácticas (gestión de configuración con Git + `uv.lock`/`pnpm-lock.yaml`; aseguramiento de calidad con `pytest` + verificaciones estáticas; documentación de proceso en `app/docs/AUDITORIA.md`). El `CHANGELOG.md` del backend evidencia una práctica de registro de cambios por versión. |
| **Qué se puede demostrar** | La evaluación de calidad de producto siguiendo un modelo normativo reconocido, con evidencia trazable a archivos concretos; la existencia de prácticas de gestión de configuración y aseguramiento de calidad a nivel de equipo. |
| **Qué está pendiente** | **PSP:** no hay artefactos de Proceso Personal de Software en el repositorio — no existe registro de defectos por fase, ni estimación de tamaño/tiempo, ni seguimiento de esfuerzo individual. Estado: **PENDIENTE — NO VERIFICADO**. Acción propuesta: MF-08 / PEND-08. Tampoco se realiza una valoración formal de nivel CMMI (ni se debe: el marco se usa solo como referencia). |

### Criterio 8 — Requisitos no funcionales

| Aspecto | Detalle |
|---|---|
| **Qué evidencia existe** | La sección 7 evalúa 10 requisitos no funcionales (usabilidad, rendimiento, seguridad, disponibilidad, mantenibilidad, escalabilidad, compatibilidad, portabilidad, accesibilidad, responsive), cada uno con requisito esperado, evidencia del repositorio, estado y observaciones. La sección 6 los agrupa según ISO/IEC 25010. El `docs/RehniMarket-Requisitos.docx` contiene los requisitos del proyecto (no verificable en este análisis por ser binario). |
| **Qué se puede demostrar** | Seguridad (lógica), compatibilidad, mantenibilidad estructural, portabilidad de la plataforma de servidor y diseño responsivo, con evidencia. |
| **Qué está pendiente** | **Rendimiento:** línea base ejecutada (`evidencias/performance/`); falta la campaña con **k6** (plantilla lista) y los **SLO** acordados. **Accesibilidad:** sin auditoría formal (WCAG/axe) — **no realizada**. **Escalabilidad:** posible por diseño, no probada. Cobertura backend: **62 %** medida. |

### Criterio 9 — Registro e informe de evaluación de calidad

| Aspecto | Detalle |
|---|---|
| **Qué evidencia existe** | Este documento **es** el informe de evaluación de calidad. Incluye: registro de hallazgos estructurado (sección 11: 13 positivos, 18 negativos, 7 riesgos, 8 pendientes), evaluación ISO/IEC 25010 (sección 6), evaluación de seguridad con severidades (sección 8), matriz de calidad (sección 14) y estado final (sección 17). Cada hallazgo cita archivo/ruta/función. Se distingue explícitamente IMPLEMENTADO / VERIFICADO / PARCIAL / NO VERIFICADO / PENDIENTE. |
| **Qué se puede demostrar** | Un proceso de evaluación reproducible: metodología declarada (sección 4), comandos realmente ejecutados con sus salidas (sección 4.1), y trazabilidad hallazgo → evidencia. |
| **Qué está pendiente** | La ejecución completa de la suite de pruebas y la medición de cobertura para elevar hallazgos de "NO VERIFICADO" a "VERIFICADO". Repetir esta evaluación de forma periódica (no hay evidencia de una evaluación previa formal). |

### Criterio 10 — Plan de mejora continua

| Aspecto | Detalle |
|---|---|
| **Qué evidencia existe** | La sección 13 define un plan con 27 acciones clasificadas en **correctivas** (10), **preventivas** (9) y **mejoras futuras** (8), cada una con: ID, acción concreta, problema que resuelve (trazado a un hallazgo), prioridad (Alta/Media/Baja), responsable y estado. La sección 15.5 prioriza las 5 acciones críticas. Los hallazgos (sección 11) alimentan directamente el plan. |
| **Qué se puede demostrar** | Un ciclo de mejora basado en evidencia: hallazgo → riesgo → acción priorizada → responsable. Varias acciones aprovechan capacidades ya presentes en el proyecto (`jest-expo` configurado, `pip-audit` y `sentry-sdk` en dependencias, `pytest-cov` disponible). |
| **Qué está pendiente** | La **ejecución** del plan: al cierre de este informe todas las acciones están en estado PENDIENTE. Falta también asignar responsables nominales y fechas objetivo, y definir un mecanismo de seguimiento (p. ej. *issues* del repositorio). |

---

## 17. Estado final de calidad

| Criterio | Estado |
|---|:--:|
| **Calidad funcional** | 🟡 PARCIAL — cobertura funcional amplia e implementada; 2 desviaciones documentación↔código; sin trazabilidad HU↔prueba. |
| **Calidad técnica** | 🟡 PARCIAL — arquitectura sólida y tipado fuerte; sin CI, sin linter Python, `strict` off en frontend. |
| **Seguridad** | 🟡 PARCIAL — autenticación/autorización sólidas (✅); CORS/`SECRET_KEY`/`build_media_url`/deps CVE **corregidos** y `docker-compose.prod.yml` endurecido (2026-08-31); pendiente el reverse proxy TLS (1 hallazgo Medio) y MinIO de mínimo privilegio. |
| **Usabilidad** | 🟡 PARCIAL — sistema de diseño y estados de UI implementados; sin evaluación formal con usuarios. |
| **Mantenibilidad** | 🟡 PARCIAL — estructura y documentación de arquitectura buenas; tooling de calidad y disciplina de *commits* deficientes. |
| **Portabilidad** | 🟡 PARCIAL — contenerizada y reproducible; `docker-compose.prod.yml` endurecido **construido y probado** (falta despliegue real); móvil sin empaquetado. |
| **Documentación** | 🟢 → mejorada — despliegue, **manual técnico**, manual de usuario, migración, pruebas, calidad, **bitácora PSP**, consolidado, auditoría final; `README`/`CHANGELOG` del backend **corregidos**. |
| **Pruebas** | 🟡 PARCIAL — **113/113** backend ejecutadas y en verde (2 corridas completas 2026-08-31); cobertura **62 %** medida; muestra de aceptación **28/28**; 0 pruebas automatizadas en frontend/móvil; sin CI. |

**Leyenda:** ✅ IMPLEMENTADO / VERIFICADO · 🟡 PARCIAL / PENDIENTE · ❌ NO IMPLEMENTADO.

> Ninguna área se califica como ❌ NO IMPLEMENTADO. Tras las correcciones del 2026-08-31,
> el trabajo restante que **requiere una persona o un servidor** es: pruebas de aceptación
> con usuario final + capacitación + acta firmada (criterio 6), despliegue real con reverse
> proxy TLS (criterio 3), y campaña de carga k6 + SLO + auditoría de accesibilidad (criterio 8).
> El resto (CI, pruebas de cliente, umbral de cobertura, MinIO de mínimo privilegio) está en
> el plan de mejora continua de la sección 13 con horizonte asignado.

---

*Fin del Informe de Aseguramiento y Calidad del Software — RehniMarket.*
