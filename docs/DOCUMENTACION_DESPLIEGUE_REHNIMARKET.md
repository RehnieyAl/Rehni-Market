# Documentación de Despliegue e Implantación — RehniMarket

> Documento técnico de preparación de la plataforma, infraestructura, despliegue e
> implantación del proyecto **RehniMarket**.
>
> **Alcance de este documento:** se elaboró analizando el código y los archivos de
> configuración realmente presentes en el repositorio. Todo dato que **no** pudo
> comprobarse en el proyecto se marca explícitamente como `PENDIENTE`.
>
> **Fecha de elaboración:** 2026-08-30
> **Rama analizada:** `feature/owner`
> **Último commit del repositorio raíz:** `917a647 ver 2.4`

---

> **NOTA DE NORMALIZACIÓN DE LA CONFIGURACIÓN DOCKER (posterior a este documento).**
> Este documento se elaboró cuando la configuración endurecida se distribuía como
> `docker-compose.prod.yml` + `RehniMarket-frontend/Dockerfile.prod` + `.env.prod` +
> `.env.prod.example`, junto a un `docker-compose.yml` de **desarrollo**. Después se
> **normalizaron los nombres**:
>
> | Antes | Ahora |
> |---|---|
> | `docker-compose.prod.yml` (endurecido) | `docker-compose.yml` (**configuración por defecto**) |
> | `docker-compose.yml` (desarrollo) | `docker-compose.dev.yml` |
> | `RehniMarket-frontend/Dockerfile.prod` | `RehniMarket-frontend/Dockerfile` |
> | `RehniMarket-frontend/Dockerfile` (dev) | `RehniMarket-frontend/Dockerfile.dev` |
> | `RehniMarket-backend/.env.prod` | `RehniMarket-backend/.env` |
> | `RehniMarket-backend/.env` (dev) | `RehniMarket-backend/.env.dev` |
> | `RehniMarket-backend/.env.prod.example` | `RehniMarket-backend/.env.public.example` |
> | imágenes `rehni-market-backend:prod` / `rehni-market-frontend:prod` | `rehni-market-backend` / `rehni-market-frontend` |
> | contenedores `rehni-backend-prod` / `rehni-frontend-prod` | `rehni-backend` / `rehni-frontend` |
> | volumen `minio_prod_data` | `minio_data` |
>
> Se levanta con `docker compose up -d` (sin `-f`). El texto de este documento
> conserva los nombres antiguos por corresponder al estado descrito en su fecha de
> elaboración y por su relación con la evidencia
> `evidencias/deployment/10_prod_compose_smoke.txt` (nombre histórico conservado).
> Donde el documento diga `docker-compose.prod.yml` / `Dockerfile.prod` / `*-prod`,
> léase el nombre normalizado equivalente de la tabla anterior.

---

## Índice

1. [Información general del proyecto](#1-información-general-del-proyecto)
2. [Arquitectura tecnológica](#2-arquitectura-tecnológica)
3. [Requisitos de hardware](#3-requisitos-de-hardware)
4. [Requisitos de software](#4-requisitos-de-software)
5. [Estructura del proyecto](#5-estructura-del-proyecto)
6. [Variables de entorno](#6-variables-de-entorno)
7. [Preparación del entorno](#7-preparación-del-entorno)
8. [Configuración de PostgreSQL](#8-configuración-de-postgresql)
9. [Copias de seguridad de PostgreSQL](#9-copias-de-seguridad-de-postgresql)
10. [Docker y despliegue](#10-docker-y-despliegue)
11. [Seguridad](#11-seguridad)
12. [Verificación de la infraestructura](#12-verificación-de-la-infraestructura)
13. [Procedimiento de instalación desde cero](#13-procedimiento-de-instalación-desde-cero)
14. [Problemas conocidos](#14-problemas-conocidos)
15. [Estado actual de implantación](#15-estado-actual-de-implantación)
16. [Relación con criterios de evaluación SENA](#16-relación-con-criterios-de-evaluación-sena)
17. [Conclusiones](#17-conclusiones)
- [Anexo A — Resumen de hallazgos, pendientes y evidencia](#anexo-a--resumen-de-hallazgos-pendientes-y-evidencia)

---

## 1. Información general del proyecto

| Campo | Valor |
|---|---|
| **Nombre del proyecto** | RehniMarket |
| **Repositorio raíz** | `https://github.com/RehnieyAl/Rehni-Market.git` (según `git remote -v`) |
| **Tipo de aplicación** | Plataforma web de comercio electrónico (marketplace) tipo multi‑vendedor, con backend API REST, frontend web SPA y aplicación móvil |
| **Arquitectura general** | Cliente–servidor de 3 capas, orquestada con contenedores Docker: <br>• API backend (FastAPI) <br>• Frontend web (React + Vite) <br>• App móvil (Expo / React Native) <br>• Base de datos PostgreSQL <br>• Almacenamiento de objetos MinIO |

### Descripción

RehniMarket es un **marketplace** en el que existen tres roles funcionales de
usuario final —`user` (comprador), `company` (empresa vendedora)— más dos roles
administrativos —`admin` y `owner`— (definidos en
`RehniMarket-backend/app/utils/seed.py` y `app/middleware/RolePermissions.py`).

Funcionalidades comprobables en el código (routers en
`RehniMarket-backend/app/routers/`, 24 routers registrados en `app/main.py`):

- Autenticación con JWT (access + refresh token), verificación de correo,
  recuperación de contraseña.
- Catálogo público de productos con búsqueda difusa (PostgreSQL `pg_trgm` +
  `unaccent`), secciones de "Ofertas" y "Novedades", anuncios/publicidad del home.
- Dashboard empresarial: gestión de productos, variantes de producto,
  atributos/especificaciones, descuentos, órdenes, cuentas bancarias y payouts.
- Dashboard de administración: estadísticas, gestión de empresas (incluye
  suspensión), gestión de usuarios, catálogos y atributos, reportes, payouts,
  wallet/RehniCoins.
- Comercio: carrito, checkout, órdenes, favoritos, direcciones, reseñas,
  reportes, wallet (RehniCoins), transportadoras y seguimiento de envío.
- Envío de correos transaccionales por SMTP (Gmail).
- Almacenamiento de imágenes de producto/variante/logo/banner en MinIO,
  servidas a través de un proxy del backend (`GET /media/proxy`).

### Objetivo

Disponer de una plataforma de comercio electrónico funcional, contenerizada y
reproducible, que permita a empresas publicar productos con variantes y a
compradores realizar pedidos, con un panel de administración para la operación
del marketplace (comisión del 5 % definida en `app/core/PayoutConfig.py`, IVA
Colombia 19 % en `app/core/TaxConfig.py`).

### Componentes del sistema

| Componente | Carpeta | Rol |
|---|---|---|
| Backend API | `RehniMarket-backend/` | API REST (FastAPI), lógica de negocio, ORM, migraciones, envío de correos, integración MinIO |
| Frontend web | `RehniMarket-frontend/` | Aplicación web SPA (React 19 + Vite) que consume la API |
| App móvil | `RehniMarket-mobile/` | Aplicación móvil (Expo + Expo Router + React Native) que consume la misma API |
| Base de datos | Servicio `postgres` en `docker-compose.yml` | PostgreSQL 17 (imagen `postgres:17-alpine`) |
| Almacenamiento de archivos | Servicio `minio` en `docker-compose.yml` | MinIO (imagen `minio/minio:latest`), bucket `uploads` |
| Orquestación | `docker-compose.yml` (raíz) | Levanta `minio`, `postgres`, `backend` y `frontend` |

---

## 2. Arquitectura tecnológica

> Las versiones indicadas provienen de archivos reales del repositorio
> (`pyproject.toml`, `uv.lock`, `package.json`, `Dockerfile`, `docker-compose.yml`,
> `.python-version`). Donde una versión no está fijada en el proyecto se indica.

### Backend

- **Lenguaje:** Python. `RehniMarket-backend/.python-version` = `3.13`;
  `pyproject.toml` → `requires-python = ">=3.13"`; imagen Docker
  `python:3.13-slim` (`RehniMarket-backend/Dockerfile`).
- **Framework:** FastAPI `0.135.1` (`pyproject.toml`).
- **Servidor ASGI:** Uvicorn `0.41.0`. Comando en `docker-compose.yml`:
  `uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`.
- **ORM:** SQLAlchemy `2.0.48` (`app/database/Connection.py`).
- **Migraciones:** Alembic `1.18.4` (`alembic/`, `alembic.ini`).
- **Driver PostgreSQL:** `psycopg2-binary` `2.9.11`.
- **Validación:** Pydantic `2.12.5` / `pydantic-settings` `2.13.1`.
- **JWT:** `python-jose` `3.5.0` (`app/services/authentication/JWTService.py`).
- **Hash de contraseñas:** `passlib` `1.7.4` con esquema **bcrypt**
  (`app/utils/Security.py`); también están instaladas `bcrypt==3.2.2`,
  `argon2-cffi==25.1.0`.
- **Cliente de objetos:** `minio` (SDK) `7.2.20` (`app/services/NasService.py`).
- **Correo:** biblioteca estándar `smtplib` sobre `smtp.gmail.com:587` con STARTTLS
  (`app/services/email/EmailService.py`).
- **Gestor de dependencias:** **uv** (Astral). Bloqueo reproducible en `uv.lock`.
  En el Dockerfile: `uv sync --frozen --no-dev`.
- **Auditoría de dependencias (dev):** `pip-audit` (grupo `dev` de `pyproject.toml`).
- **Pruebas (dev):** `pytest` + `pytest-cov` (`tests/`, 7 archivos de test,
  113 funciones `test_`). Ejecutada el 2026-08-31: ver `evidencias/tests/pytest.txt`.

### Frontend web

- **Runtime de build:** Node.js. `RehniMarket-frontend/Dockerfile` usa
  `node:22-alpine`.
- **Gestor de paquetes:** **pnpm**. Dockerfile: `corepack prepare pnpm@11.15.0`.
  Lockfile: `pnpm-lock.yaml`. `pnpm-workspace.yaml` presente.
- **Framework:** React `^19.2.7` + React DOM `^19.2.7` (`package.json`).
- **Bundler / dev server:** Vite `^8.1.0` (`vite.config.ts`), plugin
  `@vitejs/plugin-react` `^6.0.2`.
- **Enrutado:** `react-router-dom` `^7.18.1`.
- **HTTP:** `axios` `^1.18.1` (`src/api/Client.ts`).
- **Estilos:** TailwindCSS `^4.3.2` con `@tailwindcss/vite`.
- **Iconos / fuentes:** `lucide-react`, `@fontsource-variable/inter`.
- **Lenguaje:** TypeScript `~6.0.2`.
- **Script de arranque (contenedor):** `pnpm install && pnpm dev --host 0.0.0.0 --port 5173`.
- **Build de producción:** script `build` = `tsc -b && vite build` (existe una
  carpeta `dist/` con salida previa). **No existe** un `Dockerfile` de producción
  con servidor estático (Nginx u otro) para el frontend — ver
  [Problemas conocidos](#14-problemas-conocidos).

### Aplicación móvil

- **Plataforma:** Expo `^54.0.1` (instalado: `54.0.37`), Expo Router `~6.0.0`,
  React Native `0.81.5`, React `19.1.0` (`RehniMarket-mobile/package.json`).
- **Gestor de paquetes:** pnpm (`pnpm-lock.yaml`, `pnpm-workspace.yaml`).
- **Almacenamiento seguro de sesión:** `expo-secure-store` `^15.0.8`
  (`src/api/session.ts`, `src/api/client.ts`).
- **HTTP:** `axios` `^1.19.0` (`src/api/client.ts`).
- **Configuración de app:** `app.json` (`name` = `RehniMarket`, `slug` =
  `RehniMarket`, plugins `expo-secure-store`, `expo-font`).
- **Arranque en desarrollo (según `RehniMarket-mobile/README.md`):**
  `pnpm exec expo start --lan --port 8085` y escaneo del QR con Expo Go (Android).
- **Empaquetado nativo (APK / IPA / stores):** `PENDIENTE`. No hay configuración
  de EAS (`eas.json`), ni carpetas `android/` / `ios/` (están en `.gitignore`),
  ni credenciales de firma en el repositorio.

### Base de datos

- **Motor:** PostgreSQL 17 — imagen `postgres:17-alpine` (`docker-compose.yml`,
  servicio `postgres`).
- **Puerto publicado en el host:** `5434` → `5432` del contenedor.
- **Persistencia:** volumen Docker `postgres_rehni_data` montado en
  `/var/lib/postgresql/data`.
- **Extensiones requeridas:** `pg_trgm` y `unaccent`, más la función
  `rehni_search_norm(text)` y un índice GIN, creadas por la migración Alembic
  `a1b2c3d4e5f6_product_search_fuzzy_trgm.py`.

### Almacenamiento de archivos

- **Motor:** MinIO — imagen `minio/minio:latest` (`docker-compose.yml`, servicio
  `minio`), comando `server /data`.
- **Puerto publicado en el host:** `9000` → `9000`.
- **Persistencia:** volumen Docker `minio_rehni_data` montado en `/data`.
- **Bucket:** `uploads` (constante en `app/services/NasService.py`), creado en el
  arranque del backend (`ensure_bucket()` dentro del `lifespan` de FastAPI).
- **Acceso:** cliente MinIO con `secure=False` (HTTP) usando `MINIO_ROOT_USER` /
  `MINIO_ROOT_PASSWORD`.
- **Entrega de imágenes al cliente:** no se usan URLs prefirmadas para el front;
  las imágenes se sirven vía `GET /media/proxy?path=...` del backend
  (`app/routers/mediaRouter.py`).
- **Consola web de MinIO:** `PENDIENTE`. El servicio solo publica el puerto
  `9000` (API S3). El puerto de consola no está mapeado en `docker-compose.yml`.

### Autenticación

- **Esquema:** JWT firmado con HS256 (`ALGORITHM=HS256`), clave simétrica
  `SECRET_KEY` (`app/services/authentication/JWTService.py`).
- **Access token:** expira en `ACCESS_TOKEN_EXPIRE_MINUTES` minutos (valor de
  ejemplo en `.env.example`: `30`).
- **Refresh token:** expira en `REFRESH_TOKEN_DAYS` días (valor de ejemplo: `15`);
  se persiste en la tabla asociada al modelo `ModelRefreshToken`.
- **Middleware:** `app/middleware/AuthMiddleware.py` valida el token en cada
  request no público, revalida que el usuario esté activo (`Users.isActive`) y
  que la empresa no esté suspendida (`Company.CompanyStatus`), y aplica una lista
  blanca de rutas por rol (`app/middleware/RolePermissions.py`).
- **Rutas públicas:** `app/middleware/PublicRoutes.py`.

### Contenedores

- **Orquestador:** Docker Compose. Archivo único: `docker-compose.yml` en la raíz
  (clave `services:` sin campo `version`, sintaxis Compose v2).
- **Servicios definidos:** `minio`, `postgres`, `backend`, `frontend`.
- **La app móvil NO está contenerizada** (no aparece en `docker-compose.yml`).
- **Imágenes propias:** `backend` (build desde `RehniMarket-backend/Dockerfile`) y
  `frontend` (build desde `RehniMarket-frontend/Dockerfile`).
- **Imágenes de terceros:** `postgres:17-alpine`, `minio/minio:latest`,
  `node:22-alpine`, `python:3.13-slim`, `ghcr.io/astral-sh/uv:latest`.

### Comunicación entre componentes

```
[App móvil Expo] ──HTTP(axios)──┐
                                │
[Frontend web React] ──HTTP(axios)──►  [Backend FastAPI :8000 / host :8001]
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
        [PostgreSQL :5432 / host :5434]  [MinIO :9000]     [SMTP smtp.gmail.com:587]
        (SQLAlchemy + Alembic)           (SDK minio, bucket "uploads")
```

- **Frontend → Backend:** `import.meta.env.VITE_API_URL` (`src/api/Client.ts`).
- **Móvil → Backend:** `process.env.EXPO_PUBLIC_API_URL` (`src/config/env.ts`).
- **Backend → PostgreSQL:** cadena `URL_DATABASE`
  (`postgresql://usuario:clave@postgres:5432/basedatos`), motor SQLAlchemy en
  `app/database/Connection.py`.
- **Backend → MinIO:** endpoint interno `MINIO_URL` (por defecto `minio:9000`).
- **Backend → SMTP:** `smtp.gmail.com:587` con `GMAIL_USERNAME` /
  `GMAIL_APP_PASSWORD`.
- **CORS del backend:** desde 2026-08-31, `allow_origins` se construye a partir de `URL_FRONTEND` + orígenes locales (`app/middleware/CorsMiddleware.py`); cae a `["*"]` solo si `URL_FRONTEND` no está definido.

---

## 3. Requisitos de hardware

> **Aviso:** el repositorio **no define una especificación oficial de hardware**
> (no hay límites de recursos en `docker-compose.yml` ni manifiestos de despliegue).
> Se distinguen aquí **dos cosas**:
>
> - **"Requisitos mínimos oficialmente establecidos": NO EXISTEN.** Determinarlos con
>   rigor exige una campaña de pruebas de carga que el proyecto no tiene.
> - **"Medido en el equipo de validación" y "Recomendado para este entorno":** SÍ
>   existen — son mediciones reales tomadas el 2026-08-31 con el stack levantado
>   (ver `evidencias/hardware/entorno_medido.txt`).

### 3.0 Medido en el equipo de validación (2026-08-31)

Equipo real donde el stack se levantó, se ejecutó la suite de pruebas y se validó el
backup/restauración:

| Recurso | Valor medido |
|---|---|
| CPU | 12 hilos (x86-64) |
| RAM total | 7,0 GiB |
| Disco | NVMe 128 GB (≈79 GB libres) |
| SO / kernel | CachyOS Linux, kernel 7.1.4 |
| Docker Engine / Compose | 29.6.2 / 5.3.1 |
| Imágenes Docker del proyecto | backend 707 MB · frontend 276 MB · `postgres:17-alpine` 424 MB · `minio/minio:latest` 240 MB · `python:3.13-slim` 176 MB |
| `docker system df` (imágenes, total) | ~10,4 GB |
| **Consumo de RAM de los 4 contenedores en reposo** (`docker stats`) | backend ≈154 MiB · postgres ≈66 MiB · minio ≈117 MiB · frontend ≈276 MiB → **≈613 MiB en total** |
| Consumo de RAM de la BD bajo la suite `pytest` | postgres ≈90 MiB (pico), backend en modo test ≈125 MiB |

**Datos de negocio en la validación:** BD `rehnimarket` ≈10 MB, 37 tablas; bucket MinIO
`uploads` ≈8,8 MiB, 166 objetos.

### 3.1 Recomendado para ESTE entorno (desarrollo / demostración)

Derivado de la medición de §3.0 (no es un "mínimo oficial"):

| Componente | Recomendado para este entorno | Justificación (medición real) |
|---|---|---|
| CPU | 2 núcleos suficientes; 4+ cómodo | Los 4 contenedores en reposo apenas usan CPU; el pico es al construir imágenes y al correr `pytest` (crea/borra el esquema por prueba). |
| RAM | **4 GB** funcional; **8 GB** cómodo con editor + navegador | Los contenedores usan ≈0,6 GB; el resto es para el SO, el IDE, el navegador y los `node_modules`/watchers de Vite. |
| Almacenamiento | **15 GB** libres; 25 GB+ cómodo | ≈10,4 GB de imágenes Docker + volúmenes (<1 GB hoy, crece con las imágenes subidas a MinIO) + `node_modules`. |
| Red | Conexión a Internet | Descarga de imágenes y dependencias; `GET /health/internet` y SMTP saliente (587). |
| Sistema móvil de prueba | Android con **Expo Go** en la misma LAN | `RehniMarket-mobile/README.md`. |

### 3.2 Entorno de servidor / producción — SIN especificación oficial

> El proyecto **no tiene** requisitos mínimos oficiales de producción y **no se ha
> desplegado en producción**. Lo siguiente son **estimaciones de partida** a validar
> con pruebas de carga (`k6`/`locust`) antes de comprometerlas en un acuerdo de nivel
> de servicio. La prueba de rendimiento básica ya ejecutada (`evidencias/performance/`)
> es una línea base del catálogo, no un dimensionamiento de producción.

| Componente | Estimación de partida (NO oficial) | Cómo confirmarlo |
|---|---|---|
| CPU | 2 vCPU | `docker stats` bajo carga representativa (`k6` sobre catálogo + checkout). |
| RAM | 2–4 GB (los contenedores en reposo usan ≈0,6 GB; PostgreSQL y el pool crecen con la concurrencia) | `docker stats` + `pg_stat_activity` bajo carga. |
| Almacenamiento | SSD; partir de 20 GB y dimensionar el crecimiento del volumen `minio_rehni_data` = (tamaño medio de imagen) × (nº de variantes × nº de imágenes por variante). | Medir el tamaño medio real de las imágenes subidas. |
| Sistema operativo | Linux LTS de servidor (Ubuntu Server LTS / Debian stable) con Docker Engine | — |
| Red / puertos | Solo `443` al exterior (reverse proxy con TLS → frontend y backend). **NO** publicar `5434` (PostgreSQL) ni `9000` (MinIO). | Ver §11 y el `docker-compose.prod.yml` propuesto. |
| Backups | Espacio dedicado **fuera del host**, cifrado | Ver [sección 9](#9-copias-de-seguridad-de-postgresql) y `scripts/backup_rehnimarket.sh`. |

**Cómo obtener requisitos oficiales de producción (procedimiento):**

1. `docker compose up -d` + `RUN_SEED=true` y poblar productos representativos.
2. Prueba de carga con `k6`/`locust` sobre `/public/products` y `/checkout` con perfiles
   de concurrencia crecientes.
3. Medir con `docker stats`, `docker compose top`, `SELECT * FROM pg_stat_activity`.
4. Dimensionar CPU/RAM/disco a partir de las mediciones y del crecimiento previsto de MinIO.

### 3.3 Entorno de desarrollo — referencia previa (estimación)

| Componente | Requisito mínimo | Recomendado | Justificación |
|---|---|---|---|
| CPU | 2 núcleos (estimación) | 4 núcleos o más (estimación) | Ejecutan simultáneamente 4 contenedores (`postgres`, `minio`, `backend` con `--reload`, `frontend` con Vite dev server) más el editor. Valor oficial: `PENDIENTE`. |
| RAM | 4 GB (estimación) | 8–16 GB (estimación) | `node_modules` del frontend/móvil, watchers de Vite/uvicorn y PostgreSQL en memoria. Valor oficial: `PENDIENTE`. |
| Almacenamiento | 10 GB libres (estimación) | 20 GB+ SSD (estimación) | Imágenes Docker (`python:3.13-slim`, `node:22-alpine`, `postgres:17-alpine`, `minio`), volúmenes de datos, `node_modules`, `.venv`, `uv.lock` (~279 KB) y cachés. Valor oficial: `PENDIENTE`. |
| Red | Conexión a Internet | Conexión a Internet estable | Descarga de imágenes Docker y dependencias; el backend consulta `https://www.google.com` en `GET /health/internet` y envía correos por SMTP saliente (puerto 587). |
| Sistema móvil de prueba | Dispositivo Android con **Expo Go** o emulador | Dispositivo físico Android en la misma LAN | `README.md` de la app móvil indica `expo start --lan` + escaneo de QR con Expo Go. |

### 3.2 Entorno de servidor / producción

| Componente | Requisito mínimo | Recomendado | Justificación |
|---|---|---|---|
| CPU | `PENDIENTE` (estimación: 2 vCPU) | `PENDIENTE` (estimación: 4 vCPU) | No hay datos de concurrencia esperada ni pruebas de carga en el repositorio. Verificar con `docker stats` bajo carga representativa. |
| RAM | `PENDIENTE` (estimación: 4 GB) | `PENDIENTE` (estimación: 8 GB) | PostgreSQL + MinIO + backend. Sin `mem_limit` definido en Compose. Verificar con `docker stats` y `pg_stat_activity`. |
| Almacenamiento | `PENDIENTE` | `PENDIENTE` — disco SSD con crecimiento previsto para el volumen `minio_rehni_data` (imágenes de producto) y `postgres_rehni_data` | El almacenamiento de MinIO crece con cada imagen subida. Estimar tamaño medio de imagen × nº de productos/variantes esperados. |
| Sistema operativo | Linux con Docker Engine | Linux LTS de servidor (p. ej. Ubuntu Server LTS o Debian stable) con Docker Engine | El proyecto se ejecuta íntegramente en contenedores Linux. |
| Red / puertos | Puertos `8001`, `5173`, `9000`, `5434` accesibles según necesidad | Reverse proxy con TLS delante del backend y del frontend | Hoy los servicios se publican en HTTP plano; no hay TLS en el proyecto. |
| Backups | Espacio dedicado y **fuera del host** para volcados de PostgreSQL | Almacenamiento externo/remoto cifrado | Ver [sección 9](#9-copias-de-seguridad-de-postgresql). |

**Cómo verificar los requisitos reales (procedimiento recomendado):**

1. Desplegar el stack completo con `docker compose up -d`.
2. Cargar datos representativos (activar `RUN_SEED=true` y/o poblar productos).
3. Ejecutar una prueba de carga contra la API (herramienta a elección: `k6`,
   `locust`, `ab`, etc. — **no incluida en el proyecto**).
4. Medir consumo con `docker stats`, `docker compose top`, y en PostgreSQL con
   `SELECT * FROM pg_stat_activity;` y `pg_stat_database`.
5. Dimensionar CPU/RAM/disco a partir de esas mediciones y del crecimiento
   previsto del volumen de MinIO.

---

## 4. Requisitos de software

> Solo se listan versiones que pueden comprobarse en archivos del proyecto. Cuando
> una versión no está fijada, se indica "no fijada en el proyecto".

| Software | Versión (según el proyecto) | Propósito | Obligatorio |
|---|---|---|---|
| Docker Engine | No fijada en el proyecto | Ejecutar los contenedores del stack | Sí (flujo principal de despliegue) |
| Docker Compose | Sintaxis Compose v2 (archivo sin `version:`) | Orquestar `minio`, `postgres`, `backend`, `frontend` | Sí |
| PostgreSQL | **17** (`postgres:17-alpine` en `docker-compose.yml`) | Base de datos relacional | Sí |
| MinIO | `latest` (`minio/minio:latest`) — versión exacta no fijada | Almacenamiento de objetos (imágenes) | Sí |
| Python | **3.13** (`.python-version`, `pyproject.toml`, `python:3.13-slim`) | Runtime del backend | Sí (para el backend) |
| uv (Astral) | No fijada (`ghcr.io/astral-sh/uv:latest` en el Dockerfile) | Gestor de dependencias y ejecutor del backend | Sí (el backend se construye y ejecuta con `uv`) |
| FastAPI | **0.135.1** (`pyproject.toml`) | Framework de la API | Sí |
| Uvicorn | **0.41.0** (`pyproject.toml`) | Servidor ASGI | Sí |
| SQLAlchemy | **2.0.48** (`pyproject.toml`) | ORM | Sí |
| Alembic | **1.18.4** (`pyproject.toml`) | Migraciones de BD | Sí |
| psycopg2-binary | **2.9.11** (`pyproject.toml`) | Driver PostgreSQL | Sí |
| python-jose | **3.5.0** (`pyproject.toml`) | Firma/verificación de JWT | Sí |
| passlib | **1.7.4** (`pyproject.toml`) | Hash de contraseñas (bcrypt) | Sí |
| minio (SDK Python) | **7.2.20** (`pyproject.toml`) | Cliente de MinIO | Sí |
| Pydantic | **2.12.5** (`pyproject.toml`) | Validación de datos | Sí |
| Jinja2 | **3.1.6** (`pyproject.toml`) | Plantillas (correos HTML) | Sí |
| requests | **2.33.1** (`pyproject.toml`) | Chequeo de conectividad (`/health/internet`) | Sí (dependencia declarada) |
| pytest / pytest-cov | grupo `dev` (`pyproject.toml`) | Pruebas automatizadas | No (solo desarrollo/CI) |
| pip-audit | grupo `dev` (`pyproject.toml`) | Auditoría de CVEs | No (solo desarrollo/CI) |
| Node.js | **22** (`node:22-alpine` en `RehniMarket-frontend/Dockerfile`) | Build y dev server del frontend | Sí (para el frontend) |
| pnpm | **11.15.0** (frontend, `corepack prepare` en el Dockerfile) | Gestor de paquetes del frontend | Sí |
| React / React DOM | **^19.2.7** (`RehniMarket-frontend/package.json`) | UI del frontend | Sí |
| Vite | **^8.1.0** (`RehniMarket-frontend/package.json`) | Bundler / dev server | Sí |
| TypeScript | **~6.0.2** (frontend) / **^5.3.3** (móvil) | Tipado estático | Sí (build) |
| TailwindCSS | **^4.3.2** (`RehniMarket-frontend/package.json`) | Estilos | Sí (build del frontend) |
| Expo | **^54.0.1** (instalado `54.0.37`, `RehniMarket-mobile/package.json`) | Plataforma de la app móvil | Sí (para la app móvil) |
| React Native | **0.81.5** (`RehniMarket-mobile/package.json`) | Runtime móvil | Sí (para la app móvil) |
| Expo Router | **~6.0.0** (`RehniMarket-mobile/package.json`) | Enrutado de la app móvil | Sí (para la app móvil) |
| Expo Go | Requerido por `RehniMarket-mobile/README.md` | Ejecutar la app en Android sin build nativo | Sí (flujo de prueba móvil documentado) |
| Git | No fijada en el proyecto | Control de versiones y clonado | Sí |
| Cuenta de Gmail con "contraseña de aplicación" | — | Envío de correos por SMTP (`smtp.gmail.com:587`) | Sí (funcionalidad de correo) |

### Sistema operativo

- Los contenedores son **Linux** (imágenes `*-alpine` y `*-slim`).
- El repositorio **no especifica** una distribución concreta para el host de
  producción → `PENDIENTE`.
- Máquina de desarrollo utilizada al elaborar este documento (dato de contexto, no
  un requisito): CachyOS Linux, kernel 7.1.4; Docker 29.6.2; Docker Compose 5.3.1
  (plugin); Node v26.4.0; pnpm 11.3.0; Python 3.14.6; Git 2.55.0; uv 0.11.29.
  Nota: la versión de Node y Python del **host** no coincide con la fijada en los
  contenedores; por eso el flujo soportado es **vía Docker**.

---

## 5. Estructura del proyecto

> Árbol resumido a los elementos relevantes para despliegue e implantación
> (se omiten `node_modules/`, `.venv/`, `__pycache__/`, `dist/`, `.git/`).

```text
Rehni-Market/
├── docker-compose.yml                 # Orquestación: minio, postgres, backend, frontend
├── .gitignore
├── Historia de usuario.md
├── docs/                              # Documentación de requisitos y pruebas (SENA)
│   ├── RehniMarket-HU.md              # Historias de usuario (Markdown)
│   ├── RehniMarket-Requisitos.docx
│   ├── Historia de usuario - lubix-update-2.2.docx
│   ├── Guía de Pruebas de Integración en Software.docx
│   ├── Plantilla_Pruebas_Integracion.xlsx
│   └── Pruebas_Integracion_RehniMarket.xlsx
│
├── RehniMarket-backend/               # API REST (FastAPI)
│   ├── Dockerfile                     # Imagen del backend (python:3.13-slim + uv)
│   ├── .dockerignore
│   ├── .env.example                   # Plantilla de variables de entorno (SIN secretos)
│   ├── .env                           # Variables reales (NO versionado — .gitignore)
│   ├── .python-version                # 3.13
│   ├── pyproject.toml                 # Dependencias (uv / PEP 621)
│   ├── uv.lock                        # Bloqueo reproducible de dependencias
│   ├── alembic.ini                    # Config de migraciones
│   ├── CHANGELOG.md
│   ├── README.md                      # Guía de despliegue con Docker (histórica, nombre "Lubix")
│   ├── main.py                        # Script trivial (NO es el entrypoint de la API)
│   ├── alembic/
│   │   ├── env.py                     # Toma la URL de la BD de app.Config
│   │   └── versions/                  # 10 migraciones (cadena 29fe206320ce -> a1b2c3d4e5f6)
│   ├── app/
│   │   ├── main.py                    # Entrypoint FastAPI (app = FastAPI(lifespan=...))
│   │   ├── Config.py                  # Carga de variables de entorno (python-dotenv)
│   │   ├── core/                      # ErrorCodes, Exceptions, TaxConfig (IVA 19%), PayoutConfig (comisión 5%)
│   │   ├── database/Connection.py     # Motor SQLAlchemy + SessionLocal + Base
│   │   ├── middleware/                # Auth, CORS (orígenes desde URL_FRONTEND), RateLimit (activable con RATE_LIMIT_ENABLED), RolePermissions, PublicRoutes
│   │   ├── models/                    # 28 módulos de modelo ORM (~36 tablas: Users, Company, Product, Variant, Order, Wallet, ...)
│   │   ├── repository/                # Acceso a datos
│   │   ├── routers/                   # 24 routers REST (registrados en app/main.py)
│   │   ├── schemas/                   # Esquemas Pydantic (auth, commerce, dashboard, public)
│   │   ├── services/                  # Lógica de negocio (auth, commerce, dashboard, email, variants, pricing)
│   │   │   ├── NasService.py          # Cliente MinIO + ensure_bucket() + build_media_url()
│   │   │   └── email/EmailService.py  # SMTP Gmail (smtp.gmail.com:587, STARTTLS)
│   │   └── utils/                     # Security (bcrypt), seed.py, CheckNetwork, TestDatabase, Response
│   └── tests/                         # pytest (conftest crea BD "rehnimarket_test")
│
├── RehniMarket-frontend/              # Web SPA (React 19 + Vite)
│   ├── Dockerfile                     # node:22-alpine + pnpm (dev server, NO producción)
│   ├── .env.example                   # VITE_API_URL, VITE_REHNIMARKET_WHATSAPP
│   ├── .env                           # Valores reales (NO versionado)
│   ├── package.json / pnpm-lock.yaml / pnpm-workspace.yaml
│   ├── vite.config.ts                 # Plugins React + Tailwind, alias "@" → src
│   ├── index.html
│   ├── tsconfig*.json
│   ├── dist/                          # Salida de build previa (no versionada como fuente)
│   └── src/
│       ├── api/                       # Client.ts (axios, baseURL = VITE_API_URL), interceptores de auth
│       ├── routers/AppRouter.tsx
│       ├── features/                  # admin, company, cart, orders, public, user, wallet, ...
│       ├── pages/ · hooks/ · shared/
│
└── RehniMarket-mobile/                # App móvil (Expo + Expo Router + React Native)
    ├── app.json                       # Config Expo (name/slug "RehniMarket", plugins)
    ├── .env.example                   # EXPO_PUBLIC_API_URL, EXPO_PUBLIC_REHNIMARKET_WHATSAPP
    ├── .env                           # Valores reales (NO versionado)
    ├── package.json / pnpm-lock.yaml / pnpm-workspace.yaml
    ├── babel.config.js                # module-resolver, alias "@" → src
    ├── tsconfig.json
    ├── App.tsx / index.ts
    ├── assets/                         # Íconos y splash
    ├── references/                     # Imagen de referencia de diseño
    └── src/
        ├── api/                        # client.ts (axios, baseURL = EXPO_PUBLIC_API_URL), session (SecureStore)
        ├── app/                        # Rutas (Expo Router)
        ├── config/env.ts
        ├── components/ · hooks/ · theme/ · types/ · utils/
```

### Responsabilidad de cada componente

| Bloque | Responsabilidad |
|---|---|
| `docker-compose.yml` | Único punto de orquestación. Define red por defecto de Compose, volúmenes nombrados y el orden de arranque (`backend` depende de `postgres` y `minio`; `frontend` depende de `backend`). |
| `RehniMarket-backend/app/` | Toda la lógica de servidor: API REST, autenticación, reglas de negocio (precios, IVA, comisiones, variantes, órdenes, wallet), acceso a datos (ORM), migraciones, correo e integración con MinIO. |
| `RehniMarket-backend/alembic/` | Evolución del esquema de la base de datos. Se aplica automáticamente en el arranque del contenedor `backend` (`uv run alembic upgrade head`). |
| `RehniMarket-backend/app/utils/seed.py` | Datos iniciales: roles (`user`, `company`, `admin`, `owner`), catálogos, atributos, transportadoras, y las cuentas `admin`/`owner` por defecto. Se ejecuta solo si `RUN_SEED=true`. |
| `RehniMarket-frontend/src/` | Interfaz web que consume la API. No contiene lógica de negocio sensible; la autorización real la impone el backend. |
| `RehniMarket-mobile/src/` | Interfaz móvil equivalente a la web, con el mismo contrato de API y manejo de sesión mediante almacenamiento seguro del dispositivo. |
| `docs/` | Documentación de requisitos e integración para la evaluación (historias de usuario, plantillas y evidencias de pruebas). |

---

## 6. Variables de entorno

> Fuentes analizadas: `RehniMarket-backend/.env.example`, `RehniMarket-backend/.env`
> (solo nombres de variables; **los valores reales no se reproducen**),
> `RehniMarket-frontend/.env.example`, `RehniMarket-mobile/.env.example`,
> `docker-compose.yml`, y el código (`app/Config.py`, `src/api/Client.ts`,
> `src/config/env.ts`).
>
> **Ningún valor secreto real se incluye en este documento.** Donde el proyecto
> tiene un secreto, aquí figura un marcador tipo `<PASSWORD>`.

### 6.1 Backend — `RehniMarket-backend/.env`

Este mismo archivo es consumido por los servicios `postgres`, `minio` y `backend`
(los tres tienen `env_file: ./RehniMarket-backend/.env` en `docker-compose.yml`).

| Variable | Para qué sirve | Obligatoria | Ejemplo seguro |
|---|---|---|---|
| `URL_DATABASE` | Cadena de conexión SQLAlchemy del backend a PostgreSQL. Usa el **nombre de servicio** `postgres` como host dentro de la red de Compose. | Sí | `postgresql://rehni_app:<PASSWORD>@postgres:5432/rehnimarket` |
| `POSTGRES_USER` | Usuario que crea la imagen `postgres` al inicializar el volumen. | Sí | `rehni_app` |
| `POSTGRES_PASSWORD` | Contraseña de ese usuario. | Sí | `<POSTGRES_PASSWORD>` |
| `POSTGRES_DB` | Nombre de la base de datos que crea la imagen `postgres`. | Sí | `rehnimarket` |
| `MINIO_ROOT_USER` | Usuario raíz de MinIO (lo lee tanto el contenedor `minio` como el SDK del backend, campo `access_key`). | Sí | `<MINIO_ACCESS_KEY>` |
| `MINIO_ROOT_PASSWORD` | Contraseña raíz de MinIO (`secret_key` del SDK). | Sí | `<MINIO_SECRET_KEY>` |
| `MINIO_URL` | Endpoint **interno** de MinIO (contenedor → contenedor). | Sí | `minio:9000` |
| `URL_BACKEND` | URL del backend **visible desde el navegador**; se usaba para construir URLs de imágenes. Debe coincidir con `VITE_API_URL`. Ver [Problemas conocidos](#14-problemas-conocidos). | Sí (declarada) | `http://localhost:8001` |
| `URL_FRONTEND` | Origen real del frontend; se usa en los enlaces de los correos. | Sí | `http://localhost:5173` |
| `SECRET_KEY` | Clave simétrica para firmar los JWT (HS256). | Sí | `<JWT_SECRET>` |
| `ALGORITHM` | Algoritmo de firma del JWT. | Sí | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Minutos de validez del access token (se convierte a `int`). | Sí | `30` |
| `REFRESH_TOKEN_DAYS` | Días de validez del refresh token (se convierte a `int`). | Sí | `15` |
| `GMAIL_USERNAME` | Cuenta de Gmail remitente de los correos. | Sí (para correo) | `notificaciones@ejemplo.com` |
| `GMAIL_APP_PASSWORD` | "Contraseña de aplicación" de Gmail para SMTP. | Sí (para correo) | `<GMAIL_APP_PASSWORD>` |
| `IP` | Presente en `.env` pero **no leída** por `app/Config.py`. Uso real: `PENDIENTE` (no se encontró referencia en el código). | No | `<IP>` |
| `USER_NAME_ADMIN` | Nombre de la cuenta admin por defecto (seed). Nota: `.env.example` la llama `ADMIN_DEFAULT`/`USER_NAME_OWNER`; `app/Config.py` lee `USER_NAME_ADMIN`. | Solo si `RUN_SEED=true` | `Administrador RehniMarket` |
| `ADMIN_DEFAULT` | Correo de la cuenta admin por defecto (seed). | Solo si `RUN_SEED=true` | `admin@ejemplo.com` |
| `PASSWORD_DEFAULT` | Contraseña de la cuenta admin por defecto (seed). | Solo si `RUN_SEED=true` | `<ADMIN_PASSWORD>` |
| `USER_NAME_OWNER` | Nombre de la cuenta owner por defecto (seed). | Solo si `RUN_SEED=true` | `Owner RehniMarket` |
| `OWNER_DEFAULT` | Correo de la cuenta owner por defecto (seed). | Solo si `RUN_SEED=true` | `owner@ejemplo.com` |
| `OWNER_PASSWORD_DEFAULT` | Contraseña de la cuenta owner por defecto (seed). | Solo si `RUN_SEED=true` | `<OWNER_PASSWORD>` |
| `RUN_SEED` | `true` ejecuta el seed en el arranque; `false` lo desactiva. Se compara en minúsculas. | Sí | `false` |

> **Nota sobre desalineación `.env` vs `.env.example`:** `.env.example` documenta
> las variables de seed como `ADMIN_DEFAULT`, `PASSWORD_DEFAULT`, `USER_NAME_OWNER`,
> `OWNER_DEFAULT`, `OWNER_PASSWORD_DEFAULT` y **no** incluye `IP` ni `URL_BACKEND`
> con el mismo formato que el `.env` real. `app/Config.py` lee además
> `USER_NAME_ADMIN`. Al preparar un entorno nuevo, tomar como referencia las
> variables que realmente lee `app/Config.py` (listadas arriba) y el `.env`
> existente, no solo `.env.example`.

### 6.2 Frontend web — `RehniMarket-frontend/.env`

| Variable | Para qué sirve | Obligatoria | Ejemplo seguro |
|---|---|---|---|
| `VITE_API_URL` | URL base del backend para axios (`src/api/Client.ts`, `src/api/setupAuthInterceptor.ts`). | Sí | `http://localhost:8001` |
| `VITE_REHNIMARKET_WHATSAPP` | Número de WhatsApp (solo dígitos, con código de país) para solicitudes de recarga de RehniCoins (`src/features/wallet/utils/rechargeWhatsapp.ts`). Información pública, no secreta. | No (la pantalla avisa si falta) | `573001234567` |

### 6.3 App móvil — `RehniMarket-mobile/.env`

| Variable | Para qué sirve | Obligatoria | Ejemplo seguro |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | URL base del backend para axios (`src/config/env.ts`, `src/api/client.ts`). Expo solo expone al bundle las variables con prefijo `EXPO_PUBLIC_`. | Sí | `http://192.168.1.50:8001` |
| `EXPO_PUBLIC_REHNIMARKET_WHATSAPP` | Número de WhatsApp para recarga de RehniCoins (equivalente al de la web). | No | `573001234567` |

> En pruebas con Expo Go sobre un dispositivo físico, `EXPO_PUBLIC_API_URL` **no
> puede ser `localhost`**: debe ser la IP del equipo que corre el backend, accesible
> desde el teléfono en la misma red (es lo que hace el `.env` actual del proyecto).

### 6.4 Reglas de manejo de secretos (observadas en el repositorio)

- Los tres `.env` reales están en `.gitignore` (`RehniMarket-backend/.gitignore`,
  `RehniMarket-frontend/.gitignore` línea `.env`, `RehniMarket-mobile/.gitignore`
  bloque `# env`). **No deben versionarse.**
- Solo se versionan los `.env.example` (plantillas sin valores sensibles).
- `RehniMarket-backend/.dockerignore` excluye `.env` de la imagen; en Compose el
  archivo se inyecta en tiempo de ejecución vía `env_file`.

---

## 7. Preparación del entorno

> Flujo soportado por el proyecto: **todo el stack de servidor vía Docker Compose**.
> La app móvil se prepara aparte con Node + pnpm + Expo.

### 7.1 Instalación de dependencias del sistema (host)

Instalar en el host (versiones exactas según el gestor de paquetes del SO — el
proyecto no fija versiones de estas herramientas):

- **Git**
- **Docker Engine** + **plugin Docker Compose v2** (`docker compose ...`)
- Para la app móvil, además: **Node.js** y **pnpm** (`corepack enable`), y en el
  dispositivo Android la app **Expo Go**.

Verificación:

```bash
git --version
docker --version
docker compose version
```

### 7.2 Clonado del proyecto

```bash
git clone https://github.com/RehnieyAl/Rehni-Market.git
cd Rehni-Market
```

### 7.3 Configuración de variables de entorno

**Backend** (lo consumen `postgres`, `minio` y `backend`):

```bash
cp RehniMarket-backend/.env.example RehniMarket-backend/.env
# Editar RehniMarket-backend/.env y definir, como mínimo:
#   URL_DATABASE, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
#   MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, MINIO_URL
#   SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_DAYS
#   URL_FRONTEND, URL_BACKEND
#   GMAIL_USERNAME, GMAIL_APP_PASSWORD
#   RUN_SEED=false
# IMPORTANTE: el host de URL_DATABASE debe ser "postgres" y su usuario/clave/BD
# deben coincidir con POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB.
```

**Frontend web:**

```bash
cp RehniMarket-frontend/.env.example RehniMarket-frontend/.env
# Definir VITE_API_URL (p. ej. http://localhost:8001)
```

**App móvil:**

```bash
cp RehniMarket-mobile/.env.example RehniMarket-mobile/.env
# Definir EXPO_PUBLIC_API_URL con la IP del backend accesible desde el teléfono
```

### 7.4 Preparación de PostgreSQL

No requiere instalación manual: el servicio `postgres` de `docker-compose.yml`
usa `postgres:17-alpine` y crea el usuario/BD a partir de `POSTGRES_USER`,
`POSTGRES_PASSWORD` y `POSTGRES_DB` la primera vez que se inicializa el volumen
`postgres_rehni_data`.

> Si se cambian esas credenciales **después** de la primera inicialización, hay que
> borrar el volumen para que surtan efecto (ver [sección 10](#10-docker-y-despliegue)).

### 7.5 Preparación de Docker

```bash
# Desde la raíz del repositorio
docker compose build
```

### 7.6 Preparación de MinIO

No requiere instalación manual: el servicio `minio` usa `minio/minio:latest` con
`command: server /data` y el volumen `minio_rehni_data`. El **bucket `uploads`** lo
crea el backend automáticamente en su arranque (`ensure_bucket()` en el `lifespan`
de `app/main.py`). Si MinIO no está disponible al arrancar, el backend registra un
warning y continúa (no aborta).

### 7.7 Migraciones de base de datos

Se ejecutan **automáticamente** en el arranque del contenedor `backend`; el
`command` del servicio es:

```
sh -c "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
```

Ejecución manual equivalente (si se necesita):

```bash
docker compose exec backend uv run alembic upgrade head
```

### 7.8 Datos iniciales (seed) — opcional

Según `RehniMarket-backend/README.md` y `app/utils/seed.py`:

1. Definir en `RehniMarket-backend/.env` las cuentas por defecto
   (`ADMIN_DEFAULT`/`USER_NAME_ADMIN`/`PASSWORD_DEFAULT` y, opcionalmente,
   `USER_NAME_OWNER`/`OWNER_DEFAULT`/`OWNER_PASSWORD_DEFAULT`).
2. Poner `RUN_SEED=true`.
3. Levantar el backend: `docker compose up -d backend` (el seed corre en el
   arranque).
4. Volver a poner `RUN_SEED=false` y reiniciar: `docker compose restart backend`.

`run_seed()` crea: roles, catálogos, especificaciones, atributos de variante,
transportadoras y las cuentas `admin`/`owner`. (La carga de empresas/productos de
ejemplo, `seed_companies_and_products`, está **comentada** en el código.)

### 7.9 Instalación de dependencias del frontend web

Con Docker, `pnpm install` corre dentro del contenedor `frontend` en cada
arranque (`command: sh -c "pnpm install && pnpm dev ..."`), con `node_modules` en
el volumen `frontend_node_modules`.

Sin Docker (opcional, requiere Node 22 + pnpm en el host):

```bash
cd RehniMarket-frontend
pnpm install
pnpm dev --host 0.0.0.0 --port 5173
```

### 7.10 Preparación del proyecto móvil

```bash
cd RehniMarket-mobile
pnpm install
pnpm exec expo start --lan --port 8085
# Escanear el QR con Expo Go (Android) — según RehniMarket-mobile/README.md
```

---

## 8. Configuración de PostgreSQL

| Parámetro | Valor (según el proyecto) | Fuente |
|---|---|---|
| Motor | PostgreSQL 17 | `docker-compose.yml` → `image: postgres:17-alpine` |
| Nombre del contenedor | `rehni-postgres` | `docker-compose.yml` |
| Host (desde el backend) | `postgres` (nombre de servicio en la red de Compose) | `.env.example` → `URL_DATABASE` |
| Host (desde el equipo) | `localhost` (u la IP del host) | mapeo de puertos |
| Puerto interno | `5432` | `docker-compose.yml` |
| Puerto publicado en el host | `5434` | `docker-compose.yml` → `"5434:5432"` |
| Base de datos | Valor de `POSTGRES_DB` | `.env` |
| Usuario | Valor de `POSTGRES_USER` | `.env` |
| Contraseña | Valor de `POSTGRES_PASSWORD` (no se reproduce) | `.env` |
| Volumen de datos | `postgres_rehni_data` → `/var/lib/postgresql/data` | `docker-compose.yml` |
| Reinicio | `restart: always` | `docker-compose.yml` |

### Conexión desde el backend

- `app/Config.py` lee `URL_DATABASE`.
- `app/database/Connection.py` crea el `engine` con
  `create_engine(config.URL_DATABASE, pool_pre_ping=True, echo=False)` y
  `SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)`.
- Dependencia de sesión por request: `get_db()` (yield + close).
- Chequeo de salud: `GET /health/database` ejecuta `SELECT 1`
  (`app/utils/TestDatabase.py`).

### ORM y migraciones

- **ORM:** SQLAlchemy 2.0.48 con `DeclarativeBase` (`Base` en `Connection.py`).
  ~36 tablas ORM en `app/models/` (28 módulos, registrados vía `import app.models` en `app/main.py`).
- **Migraciones:** Alembic. `alembic/env.py` importa `Base.metadata` y **todos**
  los modelos, y fija `sqlalchemy.url` desde `app.Config` (no desde `alembic.ini`).
- **Cadena de migraciones:** raíz `29fe206320ce` → ... → `a1b2c3d4e5f6`
  (10 archivos en `alembic/versions/`). La migración `a1b2c3d4e5f6` crea las
  extensiones `pg_trgm` y `unaccent`, la función `rehni_search_norm(text)` y un
  índice GIN para la búsqueda difusa de productos.
- **Aplicación:** `uv run alembic upgrade head` (automático en el arranque del
  contenedor `backend`).

### Base de datos de pruebas

`tests/conftest.py` crea automáticamente una base `rehnimarket_test` en el mismo
servidor PostgreSQL (derivada de `URL_DATABASE`), crea el esquema con
`Base.metadata.create_all` (no con Alembic) y replica las extensiones
`pg_trgm`/`unaccent` y la función `rehni_search_norm`.

---

## 9. Copias de seguridad de PostgreSQL

### 9.1 Disponibilidad de herramientas (verificado)

| Herramienta | ¿Disponible? | Detalle |
|---|---|---|
| `pg_dump` / `pg_restore` / `psql` **en el host** | **No** (en la máquina analizada) | `which pg_dump` y `which psql` → *not found*. El proyecto **no** instala PostgreSQL en el host. |
| `pg_dump` / `pg_restore` / `psql` **dentro del contenedor `postgres`** | **Sí** | La imagen oficial `postgres:17-alpine` incluye los binarios cliente de PostgreSQL 17. Por tanto los backups se ejecutan **a través del contenedor**. |
| Estrategia de backup definida en el repositorio | **No** — `PENDIENTE` | No hay scripts de backup, ni cron, ni servicio dedicado, ni documentación de retención. Esta sección es la **base propuesta**, no un procedimiento ya implantado. |

### 9.2 Backup lógico con `pg_dump` (a través del contenedor)

> Sustituir `<POSTGRES_USER>` y `<POSTGRES_DB>` por los valores del `.env`.
> No incluir la contraseña en la línea de comandos; la imagen la toma de su
> entorno o se solicita interactivamente.

**Volcado en formato `custom` (recomendado, comprimido y restaurable con
`pg_restore`):**

```bash
docker compose exec -T postgres \
  pg_dump -U <POSTGRES_USER> -d <POSTGRES_DB> -F c \
  > backups/rehnimarket_$(date +%Y%m%d_%H%M%S).dump
```

**Volcado en SQL plano (legible, restaurable con `psql`):**

```bash
docker compose exec -T postgres \
  pg_dump -U <POSTGRES_USER> -d <POSTGRES_DB> \
  > backups/rehnimarket_$(date +%Y%m%d_%H%M%S).sql
```

### 9.3 Restauración

**Desde formato `custom` (`.dump`):**

```bash
# La base de datos destino debe existir y estar vacía (o usar --clean --if-exists)
cat backups/rehnimarket_20260830_120000.dump | \
  docker compose exec -T postgres \
  pg_restore -U <POSTGRES_USER> -d <POSTGRES_DB> --clean --if-exists
```

**Desde SQL plano (`.sql`):**

```bash
cat backups/rehnimarket_20260830_120000.sql | \
  docker compose exec -T postgres \
  psql -U <POSTGRES_USER> -d <POSTGRES_DB>
```

> Tras restaurar, verificar que las extensiones `pg_trgm` y `unaccent` y la función
> `rehni_search_norm` existen (las incluye el volcado si estaban en la BD; si no,
> reaplicar `alembic upgrade head`).

### 9.4 Backup del almacenamiento MinIO (complementario)

La base de datos guarda **rutas** de imágenes (`uploads/...`), no los binarios.
Para un respaldo completo hay que copiar también el volumen `minio_rehni_data`
(o el contenido del bucket `uploads`). Procedimiento concreto: `PENDIENTE`
(el proyecto no lo define).

### 9.5 Recomendaciones

- **Frecuencia:** `PENDIENTE` de definir formalmente. Recomendación de partida:
  diaria para la BD, con retención de al menos 7 volcados; revisar según volumen de
  operación.
- **Ubicación:** carpeta `backups/` **fuera del control de versiones** y,
  preferiblemente, replicada a un almacenamiento externo/remoto. Nunca dejar el
  único respaldo en el mismo host que la base de datos.
- **Seguridad:**
  - Cifrar los volcados en reposo si contienen datos personales.
  - Restringir permisos del directorio de backups (solo el usuario de operación).
  - No pasar contraseñas por argumentos de línea de comandos (quedan en el
    historial y en `ps`); usar el entorno del contenedor o `~/.pgpass`.
  - Probar periódicamente una **restauración real** en un entorno aislado (un
    backup no verificado no es un backup).

---

## 10. Docker y despliegue

Archivo analizado: **`docker-compose.yml`** (raíz del repositorio). Es el único
archivo de orquestación; los `Dockerfile` están en `RehniMarket-backend/` y
`RehniMarket-frontend/`.

### 10.1 Servicios

| Servicio | Imagen / build | Contenedor | Puertos (host:contenedor) | Volúmenes | Depende de | Comando |
|---|---|---|---|---|---|---|
| `minio` | `minio/minio:latest` | `rehni-minio` | `9000:9000` | `minio_rehni_data:/data` | — | `server /data` |
| `postgres` | `postgres:17-alpine` | `rehni-postgres` | `5434:5432` | `postgres_rehni_data:/var/lib/postgresql/data` | — | (por defecto de la imagen) |
| `backend` | build `./RehniMarket-backend/Dockerfile` | `rehni-backend` | `8001:8000` | `./RehniMarket-backend:/app` (bind mount) | `postgres`, `minio` | `sh -c "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"` |
| `frontend` | build `./RehniMarket-frontend/Dockerfile` | `rehni-frontend` | `5173:5173` | `./RehniMarket-frontend:/app`, `frontend_node_modules:/app/node_modules` | `backend` | `sh -c "pnpm install && pnpm dev --host 0.0.0.0 --port 5173"` |

Detalles adicionales:

- **`env_file`:** `minio`, `postgres` y `backend` comparten
  `./RehniMarket-backend/.env`. `frontend` **no** recibe `env_file`; su
  `VITE_API_URL` se toma del `.env` del propio directorio del frontend (bind mount).
- **`restart: always`** en `minio`, `postgres` y `backend`. El `frontend` no lo
  tiene (además usa `stdin_open: true` y `tty: true`).
- **DNS del backend:** `dns: [8.8.8.8, 1.1.1.1]` (para la resolución de
  `smtp.gmail.com` y del chequeo de Internet).
- **Redes:** no se declara ninguna red explícita → todos los servicios quedan en
  la **red por defecto** que crea Compose para el proyecto, y se resuelven entre
  sí por nombre de servicio (`postgres`, `minio`, `backend`).
- **Volúmenes nombrados:** `postgres_rehni_data`, `minio_rehni_data`,
  `frontend_node_modules` (sección `volumes:` del compose).

### 10.2 Dockerfile del backend (`RehniMarket-backend/Dockerfile`)

```
FROM python:3.13-slim
WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY . .
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

> El `CMD` del Dockerfile expone en 8000 sin `--reload` ni migraciones; en Compose
> el `command` del servicio **sobrescribe** ese `CMD` para añadir
> `alembic upgrade head` y `--reload`. El bind mount `./RehniMarket-backend:/app`
> monta el código del host encima de la imagen (flujo de desarrollo).

### 10.3 Dockerfile del frontend (`RehniMarket-frontend/Dockerfile`)

```
FROM node:22-alpine
WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@11.15.0 --activate
EXPOSE 5173
CMD ["sh", "-c", "pnpm install && pnpm dev --host 0.0.0.0 --port 5173"]
```

> Es una imagen de **desarrollo**: arranca el dev server de Vite, no compila ni
> sirve estáticos optimizados. No hay Dockerfile de producción para el frontend
> (ver [Problemas conocidos](#14-problemas-conocidos)).

### 10.4 Comandos de operación

```bash
# Construir imágenes
docker compose build

# Levantar todo en segundo plano
docker compose up -d

# Levantar un servicio concreto
docker compose up -d backend

# Ver estado de los contenedores
docker compose ps

# Ver logs (todos / uno / en vivo)
docker compose logs
docker compose logs -f backend
docker compose logs -f postgres

# Reiniciar un servicio (p. ej. tras cambiar RUN_SEED)
docker compose restart backend

# Ejecutar un comando dentro de un contenedor
docker compose exec backend uv run alembic upgrade head
docker compose exec backend uv run pytest
docker compose exec postgres psql -U <POSTGRES_USER> -d <POSTGRES_DB>

# Detener sin borrar datos
docker compose stop

# Detener y eliminar contenedores y red (conserva los volúmenes)
docker compose down

# Detener y ELIMINAR TAMBIÉN los volúmenes (¡borra la BD y las imágenes de MinIO!)
docker compose down -v
```

### 10.5 Persistencia de datos

- **PostgreSQL:** volumen `postgres_rehni_data`. Sobrevive a `docker compose down`
  (sin `-v`). Se pierde con `docker compose down -v`.
- **MinIO:** volumen `minio_rehni_data`. Mismo comportamiento.
- **`node_modules` del frontend:** volumen `frontend_node_modules` (rendimiento;
  no son datos de negocio).
- El código del backend y del frontend se monta por **bind mount** desde el host,
  por lo que los cambios en el repositorio se reflejan en caliente (`--reload` /
  HMR de Vite).

### 10.6 Endpoints y URLs tras el despliegue (config por defecto)

| Recurso | URL |
|---|---|
| API backend | `http://localhost:8001` |
| Documentación interactiva de la API (Swagger UI de FastAPI) | `http://localhost:8001/docs` |
| Frontend web | `http://localhost:5173` |
| API S3 de MinIO | `http://localhost:9000` |
| PostgreSQL | `localhost:5434` |
| Salud de BD / Internet | `GET http://localhost:8001/health/database` · `GET http://localhost:8001/health/internet` |

### 10.7 Configuración de PRODUCCIÓN — `docker-compose.prod.yml` (PREPARADA, NO DESPLEGADA)

> **DEMO LOCAL vs. PRODUCCIÓN.** Lo entregado y evidenciado es una **demostración
> local** con `docker-compose.yml` (desarrollo). Además se entrega una **plantilla
> endurecida** lista para un servidor real: `docker-compose.prod.yml`. **El proyecto
> NO se ha desplegado en producción** (no hay servidor, dominio ni certificado TLS).

Archivos entregados:

| Archivo | Qué es |
|---|---|
| `docker-compose.prod.yml` | Compose endurecido (ver diferencias abajo). |
| `RehniMarket-frontend/Dockerfile.prod` | Build multi‑etapa: `pnpm build` (Vite) → estáticos servidos por **Nginx 1.27**. |
| `RehniMarket-frontend/nginx.conf` | *SPA fallback* a `index.html`, gzip, caché de assets, cabeceras de seguridad. |
| `RehniMarket-frontend/.dockerignore` | Excluye `node_modules`/`dist`/`.env` del contexto de build. |
| `RehniMarket-backend/.env.prod.example` | Plantilla de variables de producción (sin valores reales). |

Diferencias respecto al compose de desarrollo:

| Aspecto | Desarrollo (`docker-compose.yml`) | Producción (`docker-compose.prod.yml`) |
|---|---|---|
| Backend | `uvicorn --reload`, bind mount `./RehniMarket-backend:/app` | `uvicorn` **sin** `--reload`, **sin** bind mount (usa la imagen `rehni-market-backend:prod`) |
| Rate limiting | `RATE_LIMIT_ENABLED=false` | `RATE_LIMIT_ENABLED=true` (forzado en el compose) |
| Frontend | dev server de Vite (`pnpm dev`) | **SPA compilado** servido por Nginx |
| Puerto de PostgreSQL | `5434:5432` publicado | **sin publicar** (solo red interna) |
| Puerto de MinIO | `9000:9000` publicado | **sin publicar** (solo red interna) |
| Puerto del backend | `8001:8000` (todas las interfaces) | `127.0.0.1:${BACKEND_PORT}:8000` (**solo loopback**) |
| Puerto del frontend | `5173:5173` | `${FRONTEND_PORT:-8080}:80` |
| Orden de arranque | `depends_on` simple | `depends_on` con `condition: service_healthy` |
| `restart` | `always` | `unless-stopped` |
| Imagen de MinIO | `minio/minio:latest` | **fijada por digest** (`@sha256:14cea493…`) |
| `env_file` | `./RehniMarket-backend/.env` | `./RehniMarket-backend/.env.prod` |

**Lo que la plantilla NO incluye (y sigue siendo necesario para una publicación real):**

- Un **reverse proxy con TLS** (Caddy / Traefik / Nginx) delante que termine HTTPS y
  enrute `https://tu-dominio` → `frontend:80` y `https://api.tu-dominio` →
  `127.0.0.1:${BACKEND_PORT}`. Su configuración depende del dominio y del certificado.
- Servidor, dominio y DNS.
- Un usuario/política de **MinIO de mínimo privilegio** (hoy se usa el root).
- Automatización de backups (ver [sección 9](#9-copias-de-seguridad-de-postgresql)).

**Verificación realizada (2026-08-31):** la plantilla se **construyó y se levantó en un
proyecto Compose aislado** (`docker compose -p rehni-prod-test -f docker-compose.prod.yml
up -d`, puertos alternos 18000/18080). Resultado — evidencia en
`evidencias/deployment/10_prod_compose_smoke.txt`:

- Los 4 servicios arrancaron respetando los `healthcheck` (`postgres` y `minio` *healthy*
  → `backend` *healthy* → `frontend`).
- `GET /health/database` → OK; `/openapi.json` → 200.
- SPA servido por Nginx: `/` → 200, `/offers` (ruta de cliente) → 200 (*fallback*),
  cabeceras `X-Frame-Options` / `X-Content-Type-Options` / `Referrer-Policy` presentes.
- `postgres` y `minio` **sin puertos en el host**; `backend` solo en `127.0.0.1`;
  backend **sin** `--reload` y **sin** bind mount.
- El stack de prueba se **desmontó con `down -v`**. **No es un despliegue de producción.**

Uso:

```bash
cp RehniMarket-backend/.env.prod.example RehniMarket-backend/.env.prod   # y rellenar
docker compose -f docker-compose.prod.yml build \
    --build-arg VITE_API_URL=https://api.tu-dominio \
    --build-arg VITE_REHNIMARKET_WHATSAPP=573001234567
docker compose -f docker-compose.prod.yml up -d
# + configurar el reverse proxy TLS del host
```

---

## 11. Seguridad

### 11.1 Implementado (verificado en el código)

| Medida | Detalle | Evidencia |
|---|---|---|
| **JWT (access + refresh)** | Firma HS256 con `SECRET_KEY`. Access token con expiración corta, refresh token con expiración en días. Se distingue `type: "access"` / `type: "refresh"` y se rechaza el refresh usado como access. | `app/services/authentication/JWTService.py`, `app/middleware/AuthMiddleware.py` |
| **Refresh token persistido** | Modelo dedicado para gestión/revocación de sesión. | `app/models/ModelRefreshToken.py`, `app/services/authentication/RefreshTokenService.py` |
| **Roles y permisos** | 5 roles (`user`, `company`, `admin`, `owner`). `admin` y `owner` con bypass total; `owner` con capacidades exclusivas protegidas a nivel de servicio. Lista blanca de prefijos de ruta por rol en el middleware. | `app/middleware/RolePermissions.py`, `app/middleware/AuthMiddleware.py` |
| **Revalidación de estado en cada request** | Aunque el JWT siga válido, el middleware verifica `Users.isActive` (cuenta bloqueada → 403) y `Company.CompanyStatus` (empresa suspendida → 403, con `reason` si existe). | `app/middleware/AuthMiddleware.py` |
| **Hash de contraseñas** | `passlib` con esquema **bcrypt**; truncado seguro a 72 bytes. Contraseñas nunca almacenadas en claro. | `app/utils/Security.py` |
| **Verificación de correo / recuperación de contraseña** | Códigos con expiración de 5 minutos y cooldown de reenvío de 60 s; un único código activo por usuario. | `app/services/email/CodeService.py`, `app/models/ModelCode.py` |
| **Rutas públicas explícitas** | Solo las rutas listadas (o con prefijos concretos: detalle de producto, perfil de empresa, catálogos) se sirven sin token; el resto exige `Authorization: Bearer`. | `app/middleware/PublicRoutes.py`, `app/middleware/AuthMiddleware.py` |
| **Secretos fuera del control de versiones** | Los `.env` reales están en `.gitignore`; solo se versionan los `.env.example`. `.dockerignore` excluye `.env` de la imagen del backend. | `RehniMarket-backend/.gitignore`, `.dockerignore`, `RehniMarket-frontend/.gitignore`, `RehniMarket-mobile/.gitignore` |
| **Almacenamiento seguro de sesión en móvil** | Tokens en `expo-secure-store` (almacén cifrado del dispositivo), no en almacenamiento plano. | `RehniMarket-mobile/src/api/session.ts`, `src/api/client.ts` |
| **Validación de entrada** | Esquemas Pydantic en todos los endpoints; manejador global de `ValidationError` con código `VALIDATION_ERROR` y HTTP 422. | `app/main.py`, `app/schemas/` |
| **Migraciones reproducibles** | Esquema versionado con Alembic; dependencias del backend bloqueadas con `uv.lock` (`uv sync --frozen`). | `alembic/`, `uv.lock`, `Dockerfile` |
| **Auditoría de dependencias (proceso disponible)** | `pip-audit` incluido como dependencia de desarrollo. | `pyproject.toml` (grupo `dev`) |
| **Aislamiento por contenedores** | Cada servicio en su contenedor; BD y MinIO solo alcanzables por nombre de servicio dentro de la red de Compose (aunque además publican puertos en el host). | `docker-compose.yml` |

### 11.2 Recomendado / pendiente

| Tema | Situación actual | Recomendación |
|---|---|---|
| **CORS** | **HECHO (2026-08-31)** — `allow_origins` se construye desde `URL_FRONTEND` + orígenes locales; `allow_credentials` coherente. | — (definir siempre `URL_FRONTEND`). |
| **Rate limiting** | **AJUSTADO (2026-08-31)** — activable con `RATE_LIMIT_ENABLED=true`; `docker-compose.prod.yml` lo fuerza a `true`. Sigue siendo en memoria del proceso. | Para varias réplicas, respaldarlo en un almacén compartido. |
| **TLS / HTTPS** | Todos los servicios se publican en HTTP plano; MinIO se usa con `secure=False`. | Colocar un reverse proxy con TLS delante del backend y del frontend; servir MinIO tras TLS. |
| **`SECRET_KEY`** | **HECHO (2026-08-31)** — `.env.example` y `.env.prod.example` con placeholder e instrucción `openssl rand -hex 32`. | Generar el valor real por entorno; rotarlo ante sospecha de fuga. |
| **Credenciales de MinIO** | Se usa el usuario **root** de MinIO también como credencial de la aplicación. | Crear un usuario/política de MinIO con permisos mínimos solo sobre el bucket `uploads`. |
| **Puertos publicados en producción** | `postgres` (5434) y `minio` (9000) quedan expuestos en el host. | No publicar PostgreSQL ni MinIO al exterior; dejarlos solo en la red interna de Compose. |
| **`build_media_url`** | **HECHO (2026-08-31)** — `MEDIA_BASE_URL = config.URL_BACKEND or <fallback>`. | Definir siempre `URL_BACKEND`. |
| **Modo desarrollo en el Compose por defecto** | `docker-compose.yml`: `uvicorn --reload`, dev server de Vite, bind mounts, `postgres`/`minio` con puertos abiertos. | **HECHO:** `docker-compose.prod.yml` (§10.7) sin `--reload`, frontend compilado tras Nginx, sin bind mounts, sin puertos de BD/MinIO, **construido y probado**. Falta el despliegue real con reverse proxy TLS. |
| **Backups** | Sin estrategia implementada (ver [sección 9](#9-copias-de-seguridad-de-postgresql)). | Implementar y automatizar volcados verificados. |
| **Cuenta Gmail para SMTP** | Requiere "contraseña de aplicación" en `.env`. | Considerar un proveedor de correo transaccional con credenciales acotadas y trazabilidad. |

---

## 12. Verificación de la infraestructura

> Checklist para confirmar que una plataforma está lista para ejecutar RehniMarket.
> Los ítems marcados `[ ]` deben comprobarse **en el entorno concreto** de despliegue;
> este documento no puede marcarlos por adelantado.

### 12.1 Host y herramientas

- [ ] Sistema operativo Linux con Docker Engine (verificar: `docker --version`)
- [ ] Plugin Docker Compose v2 disponible (verificar: `docker compose version`)
- [ ] Git instalado (verificar: `git --version`)
- [ ] (Solo móvil) Node.js y pnpm instalados (verificar: `node --version`, `pnpm --version`)
- [ ] (Solo móvil) Expo Go instalado en un dispositivo Android en la misma red
- [ ] Recursos de CPU/RAM/disco dimensionados — **valores oficiales `PENDIENTE`** (ver [sección 3](#3-requisitos-de-hardware))

### 12.2 Configuración

- [ ] `RehniMarket-backend/.env` creado y con todas las variables que lee `app/Config.py`
- [ ] `URL_DATABASE` usa host `postgres` y credenciales que coinciden con `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`
- [ ] `RehniMarket-frontend/.env` con `VITE_API_URL` apuntando al backend
- [ ] `RehniMarket-mobile/.env` con `EXPO_PUBLIC_API_URL` accesible desde el dispositivo
- [ ] `SECRET_KEY` con un valor propio y robusto (no el de ejemplo)
- [ ] `RUN_SEED` en el valor deseado (`false` salvo primera carga)

### 12.3 Servicios en ejecución

- [ ] `docker compose build` finaliza sin errores
- [ ] `docker compose up -d` levanta `minio`, `postgres`, `backend`, `frontend`
- [ ] `docker compose ps` muestra los 4 contenedores en estado *Up*
- [ ] PostgreSQL accesible: `GET http://localhost:8001/health/database` → `{"Base de datos": "OK"}`
- [ ] Migraciones aplicadas: en los logs del backend aparece `alembic upgrade head` sin error (o `docker compose exec backend uv run alembic current`)
- [ ] Backend responde: `http://localhost:8001/docs` carga la documentación
- [ ] Frontend responde: `http://localhost:5173` carga la aplicación
- [ ] MinIO responde en `http://localhost:9000` y el bucket `uploads` existe (los logs del backend no muestran el warning de "no se pudo verificar/crear el bucket")
- [ ] (Si aplica correo) `GET http://localhost:8001/health/internet` → conexión exitosa y una prueba de envío de correo llega al destinatario
- [ ] App móvil: `pnpm exec expo start` genera el QR y la app carga contra `EXPO_PUBLIC_API_URL`

### 12.4 Respaldo

- [ ] Prueba de `pg_dump` a través del contenedor `postgres` genera un archivo válido
- [ ] Prueba de restauración de ese volcado en una base desechable finaliza sin error
- [ ] Definida la ubicación (fuera del host) y la frecuencia de los backups — **`PENDIENTE` de formalizar**

---

## 13. Procedimiento de instalación desde cero

> Escenario: máquina Linux limpia, con acceso a Internet, destinada a **desarrollo /
> demostración** (que es el flujo que el `docker-compose.yml` soporta hoy).

### Paso 1 — Herramientas base

Instalar con el gestor de paquetes del SO: **Git**, **Docker Engine** y el
**plugin Docker Compose v2**. Añadir el usuario al grupo `docker` si corresponde.
Comprobar:

```bash
git --version
docker --version
docker compose version
```

### Paso 2 — Obtener el código

```bash
git clone https://github.com/RehnieyAl/Rehni-Market.git
cd Rehni-Market
```

### Paso 3 — Variables de entorno del backend

```bash
cp RehniMarket-backend/.env.example RehniMarket-backend/.env
```

Editar `RehniMarket-backend/.env` y definir (sin comillas si el `.env` real no las
usa; seguir el formato del `.env.example`):

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `URL_DATABASE=postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@postgres:5432/<POSTGRES_DB>`
- `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_URL=minio:9000`
- `SECRET_KEY` (valor propio y largo), `ALGORITHM=HS256`,
  `ACCESS_TOKEN_EXPIRE_MINUTES=30`, `REFRESH_TOKEN_DAYS=15`
- `URL_FRONTEND=http://localhost:5173`, `URL_BACKEND=http://localhost:8001`
- `GMAIL_USERNAME`, `GMAIL_APP_PASSWORD` (si se usará el correo)
- `RUN_SEED=false`

### Paso 4 — Variables de entorno del frontend

```bash
cp RehniMarket-frontend/.env.example RehniMarket-frontend/.env
# Editar: VITE_API_URL=http://localhost:8001
```

### Paso 5 — Construir y levantar el stack

```bash
docker compose build
docker compose up -d
docker compose ps          # los 4 contenedores deben estar "Up"
```

### Paso 6 — Verificar backend y base de datos

```bash
docker compose logs -f backend      # buscar "alembic upgrade head" OK y uvicorn escuchando
curl http://localhost:8001/health/database
# Esperado: {"Base de datos":"OK"}
```

Abrir `http://localhost:8001/docs` en el navegador.

### Paso 7 — Carga inicial de datos (seed)

1. Editar `RehniMarket-backend/.env`: definir `ADMIN_DEFAULT` / `USER_NAME_ADMIN` /
   `PASSWORD_DEFAULT` (y opcionalmente las variables `OWNER_*` /
   `USER_NAME_OWNER`), y poner `RUN_SEED=true`.
2. `docker compose restart backend`
3. Confirmar en los logs que el seed se ejecutó.
4. Volver a poner `RUN_SEED=false` y `docker compose restart backend`.

### Paso 8 — Verificar el frontend web

Abrir `http://localhost:5173`. Iniciar sesión con la cuenta `admin` u `owner`
creada por el seed.

### Paso 9 — (Opcional) App móvil

```bash
cd RehniMarket-mobile
cp .env.example .env
# Editar: EXPO_PUBLIC_API_URL=http://<IP-DEL-HOST>:8001
pnpm install
pnpm exec expo start --lan --port 8085
```

Escanear el QR con **Expo Go** en un Android de la misma red.

### Paso 10 — Primer backup de prueba

```bash
mkdir -p backups
docker compose exec -T postgres \
  pg_dump -U <POSTGRES_USER> -d <POSTGRES_DB> -F c \
  > backups/rehnimarket_inicial.dump
```

---

## 14. Problemas conocidos

> Solo se listan hallazgos comprobables en el código/archivos actuales.

| # | Problema | Evidencia | Efecto | Solución / mitigación |
|---|---|---|---|---|
| 1 | **RESUELTO (2026-08-31).** `build_media_url()` usa `config.URL_BACKEND` (`MEDIA_BASE_URL = config.URL_BACKEND or <fallback>`). | `RehniMarket-backend/app/services/NasService.py`. | — | Definir siempre `URL_BACKEND` en el `.env`. |
| 2 | Desalineación entre `RehniMarket-backend/.env` y `.env.example` (nombres de variables de seed distintos; `.env` incluye `IP` y `URL_BACKEND`, `app/Config.py` lee `USER_NAME_ADMIN`). | `.env`, `.env.example`, `app/Config.py`. | Copiar `.env.example` tal cual puede dejar el seed sin configurar o variables sin efecto. | Tomar como referencia las variables que lee `app/Config.py` (ver [sección 6.1](#61-backend--rehnimarket-backendenv)); alinear `.env.example`. |
| 3 | Variable `IP` presente en `.env` pero **sin uso** en el código. | `grep` de `IP` en `app/` no arroja lectura vía `os.getenv`. | Confusión sobre qué configurar. | Documentar su propósito o eliminarla. Marcado `PENDIENTE`. |
| 4 | **RESUELTO (2026-08-31).** El `docker-compose.yml` sigue siendo de desarrollo, pero ahora existe `RehniMarket-frontend/Dockerfile.prod` (build multi‑etapa → Nginx) y `docker-compose.prod.yml` endurecido, **construidos y probados** (ver §10.7 y `evidencias/deployment/10_prod_compose_smoke.txt`). Falta el despliegue real en un servidor con TLS. | §10.7 | — | — |
| 5 | **RESUELTO (2026-08-31).** Rate limiting activable con `RATE_LIMIT_ENABLED=true` (`Config.py`, `main.py`); `docker-compose.prod.yml` lo fuerza. | `app/main.py`, `app/Config.py`. | — | Para varias réplicas: almacén compartido. |
| 6 | **RESUELTO (2026-08-31).** CORS restringido a `URL_FRONTEND` + orígenes locales. | `app/middleware/CorsMiddleware.py`. | — | Definir siempre `URL_FRONTEND`. |
| 7 | `RehniMarket-backend/README.md` y `pyproject.toml` (`name = "better-backend"`) conservan el nombre histórico **"Lubix"** y una versión antigua (`1.1.2`), no alineados con "RehniMarket 2.4". | `README.md`, `pyproject.toml`, `main.py`, `CHANGELOG.md`. | Documentación interna confusa. | Actualizar nombre/versión y la guía. (Solo documental; no afecta la ejecución.) |
| 8 | El `docker-compose.yml` (desarrollo) usa `minio/minio:latest`. | `docker-compose.yml`. | Builds no reproducibles del almacenamiento en desarrollo. | **`docker-compose.prod.yml` ya fija MinIO por digest** (`@sha256:14cea493…`). Aplicar lo mismo al de desarrollo si se desea. |
| 9 | Empaquetado nativo de la app móvil sin definir (sin `eas.json`, sin `android/`/`ios/`). | `RehniMarket-mobile/` (no hay esos archivos; `.gitignore` excluye `/android`, `/ios`). | No hay un procedimiento reproducible para generar APK/IPA. | Definir configuración de build (EAS u otra). Marcado `PENDIENTE`. |
| 10 | Repositorios `.git` anidados en `RehniMarket-backend/`, `RehniMarket-frontend/` y `RehniMarket-mobile/` sin `.gitmodules`. | `.git` presente en cada subcarpeta; el repo raíz no declara submódulos. | Posible confusión de control de versiones (el repo raíz igualmente rastrea los archivos). | Aclarar la estrategia (monorepo vs. submódulos). Marcado `PENDIENTE`. |

---

## 15. Estado actual de implantación

> Estados: **COMPLETADO** (funciona y está verificable en el proyecto) · **PARCIAL**
> (implementado pero incompleto o en modo desarrollo) · **PENDIENTE** (no existe) ·
> **NO VERIFICADO** (existe en el proyecto pero no se pudo comprobar su
> funcionamiento en este análisis, que fue estático).

| Elemento | Estado | Evidencia |
|---|---|---|
| Backend (API) | NO VERIFICADO (código completo y coherente; no se ejecutó) | `RehniMarket-backend/app/` (24 routers, ~36 tablas ORM, 10 migraciones), `Dockerfile`, `pyproject.toml`, `uv.lock` |
| Frontend web | PARCIAL → mejorado: código completo; `Dockerfile` (dev) + **`Dockerfile.prod` (Nginx, build de producción contenerizado, probado)** | `RehniMarket-frontend/src/`, `package.json`, `Dockerfile`, `Dockerfile.prod`, `nginx.conf` |
| App móvil | PARCIAL (código y navegación presentes; sin empaquetado nativo ni EAS) | `RehniMarket-mobile/src/`, `app.json`, `package.json`, `README.md` |
| PostgreSQL | COMPLETADO (a nivel de configuración) | `docker-compose.yml` (servicio `postgres:17-alpine`, volumen, puertos), `alembic/`, `app/database/Connection.py` |
| MinIO | COMPLETADO (a nivel de configuración) | `docker-compose.yml` (servicio `minio`, volumen, comando), `app/services/NasService.py` (`ensure_bucket`) |
| Docker / orquestación | PARCIAL → mejorado: `docker-compose.yml` (dev, con healthchecks) + **`docker-compose.prod.yml` endurecido, construido y probado en aislado** (§10.7). Falta el despliegue real con TLS. | `docker-compose.yml`, `docker-compose.prod.yml` |
| Variables de entorno | PARCIAL (`.env.example` para los 3 componentes; desalineación `.env` vs `.env.example` en el backend) | `.env.example` (x3), `app/Config.py`, `src/api/Client.ts`, `src/config/env.ts` |
| Migraciones de BD | COMPLETADO (cadena Alembic completa; aplicación automática en el arranque) | `alembic/versions/` (10 archivos), `command` del servicio `backend` |
| Datos iniciales (seed) | COMPLETADO (roles, catálogos, atributos, transportadoras, cuentas admin/owner) — la carga de empresas/productos de ejemplo está comentada | `app/utils/seed.py` (`run_seed`) |
| Autenticación y permisos | COMPLETADO (a nivel de código: JWT, refresh, roles, middleware, revalidación de estado) | `app/middleware/AuthMiddleware.py`, `RolePermissions.py`, `app/services/authentication/` |
| Seguridad de secretos / config | PARCIAL → mejorado (2026-08-31): `.env` fuera de git y de la imagen; **CORS restringido**, **rate limiting activable**, **`SECRET_KEY` con placeholder**, **`build_media_url` sin IP fija**, deps con CVE actualizadas (8→1). Residual: reverse proxy TLS y MinIO de mínimo privilegio. | `CorsMiddleware.py`, `Config.py`, `main.py`, `NasService.py`, `.env.example`, `.env.prod.example` |
| Backup / restauración | PARCIAL → **EJECUTADO Y VALIDADO** (2026-08-31): `scripts/backup_rehnimarket.sh` + `scripts/restore_rehnimarket.sh`; un ciclo completo verificado (`evidencias/backup/`). Falta: automatización (`cron`/`systemd`) y copia externa cifrada. | `scripts/backup_rehnimarket.sh`, `scripts/restore_rehnimarket.sh`, `evidencias/backup/` |
| TLS / HTTPS | PENDIENTE — `docker-compose.prod.yml` deja el sistema listo para un reverse proxy TLS (no incluido; depende del dominio). MinIO `secure=False` en red interna. | `docker-compose.prod.yml`, `DOCUMENTACION_DESPLIEGUE` §10.7 |
| Pruebas automatizadas | NO VERIFICADO (suite `pytest` de 113 tests, EJECUTADA el 2026-08-31) | `RehniMarket-backend/tests/` (7 archivos), `evidencias/tests/pytest.txt`, `pyproject.toml` (grupo `dev`) |
| Documentación de despliegue | COMPLETADO — este documento + Manual Técnico + `RehniMarket-backend/README.md` y `CHANGELOG.md` **corregidos** (2026-08-31). | `docs/`, `RehniMarket-backend/README.md`, `CHANGELOG.md` |

---

## 16. Relación con criterios de evaluación SENA

> Para cada criterio se indica la **evidencia presente en el proyecto** y lo que
> queda **pendiente**.

### Criterio 1 — Preparación de la plataforma e infraestructura

*"Prepara la plataforma tecnológica y verifica el cumplimiento de las
características mínimas de hardware y software requeridas para la ejecución de la
solución."*

| Evidencia en el proyecto | Pendiente |
|---|---|
| `docker-compose.yml` define toda la plataforma (BD, almacenamiento, backend, frontend) y sus versiones de imagen. | Especificación **oficial** de hardware mínimo/recomendado (`PENDIENTE`, ver [sección 3](#3-requisitos-de-hardware)). |
| `Dockerfile` (backend y frontend), `pyproject.toml`, `uv.lock`, `package.json`, `pnpm-lock.yaml`, `.python-version` fijan el stack de software y muchas versiones exactas ([sección 4](#4-requisitos-de-software)). | Fijar versiones de Docker Engine/Compose, MinIO y de las herramientas del host. |
| Endpoints de verificación: `GET /health/database`, `GET /health/internet`. | Prueba de carga y medición de consumo (`docker stats`) para dimensionar producción. |
| Checklist de verificación de infraestructura ([sección 12](#12-verificación-de-la-infraestructura)). | Ejecutar la checklist en el entorno real y adjuntar capturas/salidas como evidencia. |
| Este documento (secciones 2–7, 10, 12, 13). | — |

### Criterio 2 — Plan de migración y respaldos

| Evidencia en el proyecto | Pendiente |
|---|---|
| Esquema de BD versionado con **Alembic** (10 migraciones, cadena íntegra) y aplicación automática (`alembic upgrade head` en el arranque). | — |
| `tests/conftest.py` documenta cómo se reconstruye el esquema y las extensiones. | — |
| **`scripts/backup_rehnimarket.sh` + `scripts/restore_rehnimarket.sh`** (PostgreSQL `pg_dump -F c` + MinIO `mc mirror` + SHA-256 + manifiesto + rotación). Ejecutados y validados el 2026-08-31 (`evidencias/backup/`). | Automatización (`cron`/`systemd`) y **copia externa cifrada** — `PENDIENTE` (requiere el servidor de operación). |
| Prueba de restauración en entorno aislado **EJECUTADA**: 37 tablas, conteos = origen, 166 objetos MinIO, `rehni_search_norm` OK, `alembic_version` = `a1b2c3d4e5f6` (`evidencias/backup/restore.txt`). | Repetir la prueba de restauración de forma periódica en el servidor real. |

### Criterio 3 — Despliegue y publicación

| Evidencia en el proyecto | Pendiente |
|---|---|
| Despliegue local reproducible (`docker compose up -d`, 4 servicios *healthy*) + **`docker-compose.prod.yml` endurecido, construido y probado en aislado** (§10.7, `evidencias/deployment/10_prod_compose_smoke.txt`): frontend compilado tras Nginx, backend sin `--reload`, sin bind mounts, BD/MinIO sin puertos, backend en loopback. | **Reverse proxy con TLS** + servidor + dominio → **el despliegue real requiere una persona/servidor** (no se afirma publicación en producción). |
| `RehniMarket-backend/README.md` **corregido** (2026-08-31): stack real, 10 migraciones, 24 routers, 113 tests, nota histórica sobre "Lubix". | — |
| Documentación de API publicada automáticamente por FastAPI en `/docs`. | — |
| App móvil ejecutable con Expo Go (`RehniMarket-mobile/README.md`). | **Publicación** de la app: build nativo/EAS, firma, distribución (store o APK). `PENDIENTE`. |
| Procedimiento de instalación desde cero ([sección 13](#13-procedimiento-de-instalación-desde-cero)) + **evidencia real** del stack levantado (`evidencias/deployment/`). | Capturas de navegador (frontend + Swagger + app móvil en Expo Go). |

### Criterio 4 — Usuarios y permisos

| Evidencia en el proyecto | Pendiente |
|---|---|
| 5 roles definidos (`user`, `company`, `admin`, `owner`) y creados por el seed (`seed_roles`, `seed_admin`, `seed_owner`). | — |
| Matriz de permisos por rol (lista blanca de rutas) en `app/middleware/RolePermissions.py`; `owner` con capacidades exclusivas. | Documento de matriz de permisos orientado a negocio (qué puede hacer cada rol en la UI). |
| Middleware que exige token, valida rol y **revalida** cuenta activa / empresa no suspendida en cada request. | — |
| Cuentas iniciales `admin`/`owner` parametrizadas por `.env` (no hardcodeadas). | Procedimiento de entrega/rotación de esas credenciales iniciales en producción. |
| Hash de contraseñas con bcrypt; verificación de correo; recuperación de contraseña. | — |

### Criterio 5 — Documentación técnica y manuales

| Evidencia en el proyecto | Pendiente |
|---|---|
| Este documento (`DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md`). | — |
| `RehniMarket-backend/README.md`, `RehniMarket-backend/CHANGELOG.md`, `RehniMarket-frontend/README.md`, `RehniMarket-mobile/README.md`, `RehniMarket-mobile/AGENTS.md`. | Unificar y actualizar (nombres/versiones desalineados). |
| `docs/`: `RehniMarket-HU.md` (historias de usuario), `RehniMarket-Requisitos.docx`, `Guía de Pruebas de Integración en Software.docx`, `Plantilla_Pruebas_Integracion.xlsx`, `Pruebas_Integracion_RehniMarket.xlsx`. | Manual de usuario final y manual de administrador/operación (`PENDIENTE` — no se encontraron en el repositorio). |
| Comentarios descriptivos abundantes en el código (middleware, seed, servicios). | Diagrama de arquitectura y modelo de datos formales (`PENDIENTE`). |

---

## 17. Conclusiones

**Estado real de preparación de RehniMarket para su despliegue:**

1. **La plataforma está completamente definida como infraestructura de código.**
   El `docker-compose.yml` describe los cuatro servicios (PostgreSQL 17, MinIO,
   backend FastAPI, frontend React), con persistencia por volúmenes y arranque
   ordenado. El backend fija sus dependencias de forma reproducible (`uv.lock`,
   `uv sync --frozen`) y aplica las migraciones de base de datos automáticamente.

2. **El despliegue en un entorno de desarrollo/demostración es reproducible** con
   `docker compose build && docker compose up -d`, más el `.env` del backend y el
   `.env` del frontend. El procedimiento paso a paso está en la
   [sección 13](#13-procedimiento-de-instalación-desde-cero).

3. **La línea de producción está PREPARADA pero no desplegada.** El Compose por
   defecto sigue siendo de desarrollo. A 2026-08-31 se entrega además
   `docker-compose.prod.yml` + `Dockerfile.prod` del frontend (Nginx) +
   `.env.prod.example`, **construidos y probados en un proyecto aislado** (§10.7):
   sin `--reload`, frontend compilado, sin bind mounts, sin exponer BD/MinIO,
   backend solo en loopback, rate limiting activado, `depends_on` por healthcheck.
   **Lo que falta y necesita una persona/servidor:** el reverse proxy con TLS, el
   dominio, y el despliegue en un servidor real. CORS ya se restringe a
   `URL_FRONTEND`; `SECRET_KEY` se genera por entorno; `build_media_url` ya usa
   `URL_BACKEND`.

4. **Los requisitos de hardware no están documentados oficialmente** (`PENDIENTE`).
   Este documento aporta estimaciones basadas en la pila y un procedimiento de
   verificación (prueba de carga + `docker stats`), pero las cifras deben validarse
   en el entorno real.

5. **El plan de respaldos es una base, no una implantación.** Las herramientas
   (`pg_dump`, `pg_restore`, `psql`) están disponibles dentro del contenedor
   `postgres:17-alpine` —no en el host analizado—, y este documento propone los
   comandos y scripts (`scripts/backup_rehnimarket.sh`, `scripts/restore_rehnimarket.sh`).
   A 2026-08-31 se ejecutó **un backup real y una prueba de restauración verificada**
   (`evidencias/backup/`). Falta la **automatización** (`cron`/`systemd`) y la **copia
   externa cifrada**.

6. **Usuarios y permisos están resueltos a nivel de aplicación**: cinco roles,
   matriz de rutas por rol, revalidación de estado en cada request, cuentas
   iniciales parametrizadas y hash de contraseñas con bcrypt.

7. **La app móvil es funcional para pruebas con Expo Go**, pero su empaquetado y
   publicación nativa (`APK`/store, EAS) están `PENDIENTE`.

**En síntesis:** RehniMarket está **listo para desplegarse y demostrarse en un
entorno controlado** siguiendo este documento (demo local), y **también** se entrega la
plantilla de producción `docker-compose.prod.yml` construida y probada (§10.7). Los
trabajos que aún requieren un servidor/persona: **despliegue real con reverse proxy TLS
+ dominio**, **automatización** del backup ya funcional, **empaquetado móvil** y
**dimensionamiento oficial de hardware** (necesita campaña de carga). Todo está
identificado y acotado en las secciones 3, 9, 10.7, 11, 14 y 16.

---

## Anexo A — Resumen de hallazgos, pendientes y evidencia

### A.1 Información encontrada (comprobada en el proyecto)

| Tema | Fuente principal |
|---|---|
| Orquestación: 4 servicios, puertos, volúmenes, comandos, dependencias | `docker-compose.yml` |
| Imagen y build del backend (Python 3.13, uv, uvicorn) | `RehniMarket-backend/Dockerfile`, `.python-version`, `pyproject.toml`, `uv.lock` |
| Imagen y build del frontend (Node 22, pnpm 11.15.0, Vite dev) | `RehniMarket-frontend/Dockerfile`, `package.json`, `pnpm-lock.yaml`, `vite.config.ts` |
| Stack móvil (Expo 54, React Native 0.81.5, Expo Router 6, SecureStore) | `RehniMarket-mobile/package.json`, `app.json`, `README.md`, `src/config/env.ts`, `src/api/client.ts` |
| Variables de entorno (backend/frontend/móvil) y su uso | `.env.example` (x3), `.env` (solo nombres), `app/Config.py`, `src/api/Client.ts`, `src/config/env.ts` |
| Base de datos: PostgreSQL 17, conexión, ORM SQLAlchemy 2.0.48 | `docker-compose.yml`, `app/database/Connection.py`, `app/utils/TestDatabase.py` |
| Migraciones: Alembic 1.18.4, 10 versiones, extensiones `pg_trgm`/`unaccent` | `alembic.ini`, `alembic/env.py`, `alembic/versions/*` |
| Almacenamiento: MinIO, bucket `uploads`, `ensure_bucket`, proxy `/media/proxy` | `app/services/NasService.py`, `app/routers/mediaRouter.py`, `app/main.py` |
| Autenticación: JWT HS256, access/refresh, middleware, roles | `app/services/authentication/JWTService.py`, `app/middleware/AuthMiddleware.py`, `app/middleware/RolePermissions.py`, `app/middleware/PublicRoutes.py` |
| Seguridad de contraseñas: bcrypt vía passlib | `app/utils/Security.py` |
| Correo: SMTP Gmail 587 STARTTLS | `app/services/email/EmailService.py` |
| Seed: roles, catálogos, atributos, transportadoras, admin/owner | `app/utils/seed.py` (`run_seed`) |
| Reglas de negocio con valores: IVA 19 %, comisión 5 % | `app/core/TaxConfig.py`, `app/core/PayoutConfig.py` |
| CORS restringido a `URL_FRONTEND` (2026-08-31); rate limiting activable con `RATE_LIMIT_ENABLED` | `app/middleware/CorsMiddleware.py`, `app/main.py`, `app/Config.py` |
| Pruebas: pytest, 7 archivos (113 tests), BD `rehnimarket_test` | `RehniMarket-backend/tests/`, `tests/conftest.py`, `pyproject.toml` |
| Historias de usuario y evidencias de pruebas de integración | `docs/RehniMarket-HU.md`, `docs/*.docx`, `docs/*.xlsx`, `Historia de usuario.md` |
| Herramientas del host (contexto) | salida de `docker --version`, `node --version`, `pnpm --version`, `python3 --version`, `git --version`, `uv --version` |
| Ausencia de `pg_dump`/`psql` en el host | `which pg_dump`, `which psql` → *not found* |

### A.2 Información que quedó como PENDIENTE

| Pendiente | Motivo | Cómo obtenerlo |
|---|---|---|
| Requisitos **oficiales de PRODUCCIÓN** (CPU/RAM/disco) | El entorno de desarrollo/validación ya está medido (§3.0/§3.1); faltan los de producción | Ejecutar `scripts/load_test.k6.js` con k6 + `docker stats` bajo carga; dimensionar |
| Distribución/versión del **SO de producción** y versiones de Docker Engine/Compose objetivo | El proyecto no lo especifica | Decisión de operación; documentar la elegida |
| Versión exacta de **MinIO** en el compose de **desarrollo** | `docker-compose.yml` usa `minio/minio:latest` | `docker-compose.prod.yml` ya fija MinIO por digest; aplicar lo mismo al de dev si se desea |
| **Automatización** del backup (`cron`/`systemd`) + **copia externa cifrada** | Los scripts existen y se ejecutó una prueba de restauración; falta agendarlos y sacarlos del servidor | Agendar `scripts/backup_rehnimarket.sh`; cifrar con GPG y enviar a un almacenamiento externo (requiere el servidor de operación) |
| Repetir la **prueba de restauración** de forma periódica | Se hizo una sola vez (`evidencias/backup/`) | Ejecutar `scripts/restore_rehnimarket.sh` mensualmente en el servidor real y registrar la evidencia |
| Configuración de **producción** | `docker-compose.prod.yml` + `Dockerfile.prod` + `nginx.conf` + `.env.prod.example` **creados y probados en aislado** (§10.7). Falta el **reverse proxy con TLS** (depende del dominio) y el despliegue real. | Configurar Caddy/Traefik/Nginx con certificado y desplegar en un servidor |
| **Empaquetado y publicación** de la app móvil (APK/IPA, EAS, firma) | Sin `eas.json`, sin `android/`/`ios/` | Definir flujo de build nativo |
| **Consola web de MinIO** | Puerto de consola no mapeado en Compose | Mapear el puerto de consola si se necesita administración visual |
| Propósito de la variable `IP` del `.env` | No se usa en el código | Consultar al equipo de desarrollo |
| Estrategia de repos `.git` anidados (monorepo vs. submódulos) | Sin `.gitmodules` pero con `.git` en cada subcarpeta | Consultar al equipo de desarrollo |
| ~~Manuales de usuario final y técnico~~ | **HECHO** — `docs/MANUAL_USUARIO_REHNIMARKET.md`, `docs/MANUAL_TECNICO_REHNIMARKET.md` | — |
| Diagrama entidad-relación **gráfico** | El textual está en `MANUAL_TECNICO` §11 (arquitectura + ER + relaciones); falta uno gráfico | Generar con `eralchemy`/`sqlalchemy-schemadisplay` a partir de `app/models/` |
| ~~Resultado de la suite de pruebas y del despliegue~~ | **HECHO (2026-08-31)** — 113/113 pytest, stack levantado y verificado, backup+restauración, aceptación 28/28. `evidencias/` | — |

### A.3 Archivos del proyecto usados como evidencia

**Raíz:**
`docker-compose.yml`, `.gitignore`, `Historia de usuario.md`,
`docs/RehniMarket-HU.md`, `docs/` (listado).

**Backend (`RehniMarket-backend/`):**
`Dockerfile`, `.dockerignore`, `.gitignore`, `.env.example`, `.env` (solo nombres
de variables), `.python-version`, `pyproject.toml`, `uv.lock` (metadatos),
`alembic.ini`, `README.md`, `CHANGELOG.md`, `main.py`,
`alembic/env.py`, `alembic/versions/` (nombres y `down_revision` de las 12
migraciones; contenido de `a1b2c3d4e5f6_product_search_fuzzy_trgm.py`),
`app/main.py`, `app/Config.py`, `app/database/Connection.py`,
`app/middleware/AuthMiddleware.py`, `app/middleware/CorsMiddleware.py`,
`app/middleware/RateLimitMiddleware.py`, `app/middleware/RolePermissions.py`,
`app/services/NasService.py`, `app/services/authentication/JWTService.py`,
`app/services/email/EmailService.py`, `app/routers/HealthRouter.py`,
`app/routers/mediaRouter.py`, `app/utils/Security.py`, `app/utils/seed.py`,
`app/utils/CheckNetwork.py`, `app/utils/TestDatabase.py`,
`app/core/TaxConfig.py`, `app/core/PayoutConfig.py`,
`tests/conftest.py`, `tests/` (listado de archivos).

**Frontend (`RehniMarket-frontend/`):**
`Dockerfile`, `.gitignore`, `.env.example`, `.env` (solo nombres),
`package.json`, `vite.config.ts`, `README.md`, `src/api/Client.ts`,
`src/api/setupAuthInterceptor.ts` (referencia), estructura de `src/`.

**Móvil (`RehniMarket-mobile/`):**
`app.json`, `.env.example`, `.env` (solo nombres), `package.json`,
`babel.config.js`, `tsconfig.json`, `AGENTS.md`, `CLAUDE.md`, `README.md`,
`src/config/env.ts`, `src/api/client.ts`, estructura de `src/`.

---

*Fin del documento.*
