# Plan de Migración de Datos — RehniMarket

> **Módulo A — Despliegue e Implantación de Software.** Competencia **220501097**.
> **Criterio 2:** *"Plan de Migración y Respaldos de Datos: Diseña e implementa el plan de migración de datos y los esquemas de copias de seguridad (backup) para mitigar riesgos en la puesta en producción."*
>
> **Documento:** Plan de Migración y Respaldos de Datos (PostgreSQL + MinIO).
> **Fecha de elaboración:** 2026-08-30 · **Versión:** 2.0 (documento finalizado).
>
> **Base del documento:** inspección directa del repositorio `RehniMarket` y de su entorno en ejecución. Se consultaron `docker-compose.yml`, `Dockerfile`, `RehniMarket-backend/.env.example`, el código de `app/services/NasService.py` / `app/routers/mediaRouter.py` / `app/database/Connection.py`, los modelos de `app/models/`, las migraciones de `alembic/`, y los contenedores en ejecución `rehni-backend`, `rehni-postgres` y `rehni-minio`.
>
> **Convención de estado (usada en todo el documento):**
> - **[IMPLEMENTADO]** — existe hoy en el proyecto y fue verificado directamente.
> - **[PROPUESTO]** — procedimiento recomendado que **aún no está implementado ni automatizado**.
>
> **Regla de honestidad — actualización 2026-08-31:**
> - **[IMPLEMENTADO Y EJECUTADO]** Existen `scripts/backup_rehnimarket.sh` y
>   `scripts/restore_rehnimarket.sh`. Se ejecutó **un backup real** (PostgreSQL + MinIO,
>   con SHA-256) y **una prueba de restauración real** en un entorno aislado, con
>   validación de conteos, extensiones, `rehni_search_norm`, revisión de Alembic y nº
>   de objetos. Evidencia: `evidencias/backup/` (`backup.txt`, `checksums.txt`,
>   `contenido_dump.txt`, `restore.txt`, `manifest.txt`) y [§12.3](#123-tabla-de-evidencia-de-la-prueba-de-restauración).
> - **[PROPUESTO — aún no implementado]** La **automatización** (`cron`/`systemd`), la
>   **copia externa cifrada** y la **rotación programada en un servidor real** siguen
>   siendo propuestas ([§15](#15-automatización-de-backups)). El script incluye la
>   lógica de rotación, pero no está agendado.
> - Ningún backup se declara "en producción": la ejecución fue en el equipo de
>   desarrollo/validación.
>
> **Regla de seguridad:** este documento **no contiene** contraseñas, *access keys*, *secret keys* ni tokens reales. Los valores sensibles se representan con marcadores (`<POSTGRES_PASSWORD>`, `<MINIO_ROOT_USER>`, …) o se leen en tiempo de ejecución desde el entorno del propio contenedor.

---

> **Nota de normalización Docker (posterior a este documento):** donde el texto diga `docker-compose.prod.yml` / `Dockerfile.prod` / `.env.prod` / `.env.prod.example` / imágenes `*:prod` / contenedores `*-prod` / volumen `minio_prod_data`, léase la configuración **por defecto** ya normalizada: `docker-compose.yml`, `RehniMarket-frontend/Dockerfile`, `RehniMarket-backend/.env`, `.env.public.example`, `rehni-market-backend` / `rehni-market-frontend`, `rehni-backend` / `rehni-frontend`, `minio_data`. El modo desarrollo pasa a `docker-compose.dev.yml` / `Dockerfile.dev` / `.env.dev`. Se levanta con `docker compose up -d` (sin `-f`). La evidencia `evidencias/deployment/10_prod_compose_smoke.txt` conserva el nombre antiguo. Tabla completa en `docs/DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md`.

## Tabla de contenido

1. [Introducción](#1-introducción)
2. [Arquitectura de datos de RehniMarket](#2-arquitectura-de-datos-de-rehnimarket)
3. [Inventario de información a migrar](#3-inventario-de-información-a-migrar)
4. [Requisitos previos para la migración](#4-requisitos-previos-para-la-migración)
5. [Estrategia de migración PostgreSQL](#5-estrategia-de-migración-postgresql)
6. [Estrategia de migración MinIO](#6-estrategia-de-migración-minio)
7. [Estrategia de backup](#7-estrategia-de-backup)
8. [Convención de nombres de backups](#8-convención-de-nombres-de-backups)
9. [Procedimiento de restauración](#9-procedimiento-de-restauración)
10. [Plan de contingencia y rollback](#10-plan-de-contingencia-y-rollback)
11. [Validación posterior a la migración](#11-validación-posterior-a-la-migración)
12. [Pruebas de restauración](#12-pruebas-de-restauración)
13. [Riesgos de migración](#13-riesgos-de-migración)
14. [RPO y RTO](#14-rpo-y-rto)
15. [Automatización de backups](#15-automatización-de-backups)
16. [Evidencias](#16-evidencias)
17. [Conclusión](#17-conclusión)

---

## 1. Introducción

### 1.1 Objetivo del plan

Definir un procedimiento **reproducible, verificable y seguro** para:

1. **Migrar** RehniMarket (base de datos PostgreSQL + objetos de MinIO + configuración) a otro servidor o ambiente **sin pérdida de datos** ni de la **integridad referencial** entre los registros de la base de datos y los archivos almacenados.
2. **Respaldar** de forma periódica los **dos** sistemas que contienen información crítica: **PostgreSQL** (datos relacionales) y **MinIO** (archivos e imágenes).
3. **Restaurar** el sistema completo a partir de esos respaldos ante una pérdida parcial o total, y **demostrar con una prueba controlada** que los respaldos funcionan.
4. Establecer objetivos de recuperación (**RPO / RTO**), controles de verificación, plan de contingencia/rollback y medidas de protección de las copias.

### 1.2 Alcance

**Incluye:**

| Elemento | Detalle |
|---|---|
| Base de datos **PostgreSQL** | Servicio `postgres` (contenedor `rehni-postgres`), base `rehnimarket`. |
| Almacenamiento de objetos **MinIO** | Servicio `minio` (contenedor `rehni-minio`), *bucket* `uploads`. |
| **Volúmenes Docker de datos** | `rehni-market_postgres_rehni_data`, `rehni-market_minio_rehni_data`. |
| **Migraciones de esquema** | Alembic (`RehniMarket-backend/alembic/`). |
| **Configuración** | `docker-compose.yml`, `RehniMarket-backend/.env` (valores **no** incluidos), `.env.example`. |
| Procedimiento de **migración** a servidor nuevo, **backup**, **restauración**, **contingencia/rollback**, **prueba de restauración**, **RPO/RTO** y **propuesta de automatización**. |

**No incluye:**

- El **código fuente** (backend, frontend, móvil): su respaldo es el repositorio Git.
- El volumen `rehni-market_frontend_node_modules` (dependencias reinstalables, sin datos).
- El contenedor `dns_tunel` (cloudflared): túnel de red, no almacena datos de la aplicación.
- Correos SMTP (no se almacenan en el proyecto).
- Copias de la máquina anfitriona a nivel de sistema operativo.

### 1.3 Componentes involucrados

| Componente | Rol en la migración |
|---|---|
| **Backend FastAPI** (`rehni-backend`) | Cliente de PostgreSQL y de MinIO. No almacena estado propio (salvo el `.env`). Ejecuta `alembic upgrade head` al arrancar. |
| **PostgreSQL 17** (`rehni-postgres`) | Fuente de la verdad de todos los datos relacionales. |
| **MinIO** (`rehni-minio`) | Almacena los binarios (imágenes de productos, logos, banners, anuncios, categorías, fotos de perfil, PDF de certificados y evidencias de reportes). |
| **Docker / Docker Compose** | Orquesta los 4 servicios y define los volúmenes de datos. |
| **Alembic** | Versiona el esquema de la base de datos (10 revisiones, aplicación automática). |
| **Frontend web / App móvil** | No almacenan datos del servidor; solo consumen la API. |

### 1.4 Importancia de respaldar datos relacionales Y archivos

En RehniMarket **PostgreSQL guarda la *referencia* y MinIO guarda el *binario*.** Una tabla como `product_images` almacena una cadena de texto (`uploads/companies/<NIT>/products/<uuid>.jpg`); el archivo real vive en el *bucket* `uploads` de MinIO. Por lo tanto:

- **Un backup solo de PostgreSQL NO es suficiente.** Al restaurar únicamente la base de datos, el catálogo, los logos, los anuncios y las fotos de perfil quedarían **apuntando a objetos que no existen** → imágenes rotas (`GET /media/proxy` responde 404).
- **PostgreSQL y MinIO deben respaldarse de forma coordinada** (misma ventana, mismo identificador de fecha/hora) para que la referencia y el objeto correspondan al mismo instante.

**En este plan PostgreSQL y MinIO tienen el mismo nivel de importancia.**

---

## 2. Arquitectura de datos de RehniMarket

### 2.1 Aplicación / backend  **[IMPLEMENTADO]**

- API REST **FastAPI** (Python 3.13), servida por Uvicorn dentro del contenedor `rehni-backend`, expuesta en el host en `http://localhost:8001` (contenedor: `:8000`).
- Conexión a PostgreSQL: `app/database/Connection.py` → `create_engine(config.URL_DATABASE, pool_pre_ping=True, echo=False)`; la URL viene de `URL_DATABASE` en el `.env`.
- Conexión a MinIO: `app/services/NasService.py` → `Minio(MINIO_URL, access_key=MINIO_ROOT_USER, secret_key=MINIO_ROOT_PASSWORD, secure=False)`.
- Entrega de archivos al cliente: **no** hay URLs prefirmadas ni acceso directo del cliente a MinIO. Todo pasa por el endpoint `GET /media/proxy?path=<uploads/clave>` del backend (`app/routers/mediaRouter.py`), que hace `client.get_object("uploads", <clave sin el prefijo "uploads/">)`.
- Salud: `GET /health/database` ejecuta `SELECT 1`; `GET /health/internet` prueba conectividad saliente.

### 2.2 PostgreSQL  **[IMPLEMENTADO — verificado]**

| Parámetro | Valor real | Fuente |
|---|---|---|
| Motor | PostgreSQL **17** (imagen `postgres:17-alpine`) | `docker-compose.yml` |
| Contenedor | `rehni-postgres` | `docker-compose.yml` (`container_name`) |
| Base de datos | `rehnimarket` | `env` del contenedor (`POSTGRES_DB`) |
| Usuario | `rehnieyal` | `env` del contenedor (`POSTGRES_USER`) |
| Contraseña | `<POSTGRES_PASSWORD>` (en `RehniMarket-backend/.env`; **no se incluye**) | `.env` |
| Puerto | Host **`5434`** → contenedor **`5432`** | `docker-compose.yml` (`"5434:5432"`) |
| Directorio de datos | `/var/lib/postgresql/data` | imagen oficial |
| Volumen | `postgres_rehni_data` → nombre real **`rehni-market_postgres_rehni_data`** | `docker-compose.yml` + `docker volume ls` |
| Cadena de conexión | `URL_DATABASE = postgresql://<user>:<password>@postgres:5432/<db>` (host = nombre de servicio `postgres`) | `.env.example`, `app/database/Connection.py` |
| Extensiones | `plpgsql` (por defecto), **`pg_trgm`**, **`unaccent`** | `SELECT extname FROM pg_extension` |
| Objetos de esquema adicionales | Función `rehni_search_norm(text)` (IMMUTABLE) + índice GIN `ix_products_name_search_trgm` sobre `products` | migración `a1b2c3d4e5f6_product_search_fuzzy_trgm.py` |
| Tamaño de la BD | ~**10 MB**, **37 tablas** (incluye `alembic_version`) | `SELECT pg_size_pretty(pg_database_size('rehnimarket'))` |
| Herramientas cliente en el contenedor | `pg_dump` 17.10, `pg_restore` 17.10, `psql` 17.10, `pg_isready`, `createdb` | `docker exec rehni-postgres pg_dump --version` |
| `restart` / `healthcheck` | `restart: always` / **sin `healthcheck`** | `docker-compose.yml` |

### 2.3 MinIO  **[IMPLEMENTADO — verificado]**

| Parámetro | Valor real | Fuente |
|---|---|---|
| Motor | MinIO (imagen `minio/minio:latest`) | `docker-compose.yml` |
| Contenedor | `rehni-minio` | `docker-compose.yml` |
| Comando de arranque | `server /data` | `docker-compose.yml` |
| Endpoint interno (backend → MinIO) | `minio:9000` (variable `MINIO_URL`) | `.env.example`, `app/services/NasService.py` |
| Puerto | Host **`9000`** → contenedor **`9000`** (API S3) | `docker-compose.yml` (`"9000:9000"`) |
| Consola web | **No expuesta** (el comando no define `--console-address`; no hay puerto de consola mapeado) | `docker-compose.yml` |
| TLS | **Deshabilitado** (`secure=False` en el cliente del backend) | `app/services/NasService.py` |
| Credenciales | `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` (en `.env`; **no se incluyen**). El backend usa **esas mismas credenciales root** como credenciales de aplicación. | `.env`, `app/services/NasService.py` |
| Directorio de datos | `/data` | `docker-compose.yml` |
| Volumen | `minio_rehni_data` → nombre real **`rehni-market_minio_rehni_data`** | `docker-compose.yml` + `docker volume ls` |
| **Bucket** | **`uploads`** (único; nombre fijo en el código: `bucket = "uploads"`) | `app/services/NasService.py` |
| Creación del *bucket* | Automática al arrancar el backend: `ensure_bucket()` en el `lifespan` de FastAPI (si MinIO no responde, registra *warning* y continúa) | `app/main.py`, `app/services/NasService.py` |
| Cliente **`mc`** (MinIO Client) | **Incluido en la imagen** en `/usr/bin/mc` (versión `RELEASE.2025-08-13T08-35-41Z` en el entorno analizado) | `docker exec rehni-minio mc --version` |
| Contenido del *bucket* (al momento del análisis) | ~**165 objetos**, ~**8.7 MiB** | `docker exec rehni-minio mc ls --recursive local/uploads \| wc -l` + `mc du` |
| Versionado de objetos | **No configurado** | `mc version info local/uploads` |
| `restart` / `healthcheck` | `restart: always` / **sin `healthcheck`** | `docker-compose.yml` |

### 2.4 Relación entre los datos de PostgreSQL y los objetos de MinIO  **[IMPLEMENTADO — verificado con datos reales]**

Columnas de PostgreSQL que almacenan la **ruta** de un objeto de MinIO:

| Tabla · columna | Formato almacenado (verificado) | Objeto en MinIO |
|---|---|---|
| `product_images.url` | `uploads/companies/<NIT>/products/<uuid>.<ext>` | imagen de producto |
| `product_variant_images.url` | `uploads/companies/<NIT>/variants/<uuid>.<ext>` | imagen de variante |
| `advertisements.image_url`, `advertisements.mobile_image_url` | `uploads/advertisements/{desktop\|mobile}/<uuid>.<ext>` | banners del Home |
| `company.CompanyLogo`, `company.CompanyBanner` | `uploads/companies/<NIT>/{logo\|banner}/<uuid>.<ext>` | logo / banner de empresa |
| `company.CompanyCertificate` | `uploads/companies/<NIT>/certificates/<uuid>.pdf` | certificado (PDF) |
| `catalog.image_url` | `uploads/catalogs/<uuid>.<ext>` | imagen de categoría |
| `report_evidences.url` | `uploads/reports/<report_id>/evidences/<uuid>.<ext>` | evidencia de reporte |
| `users.profileImagen` | `users/<user_id>/profile/<uuid>.<ext>` — **sin el prefijo `uploads/`** (el código lo añade con `build_media_url(f"uploads/{...}")` en `MeService.py` y `ReviewService.py`) | foto de perfil |

**Consecuencia para la migración:** el `pg_dump` **contiene las rutas pero NO los binarios**. Por eso los capítulos 5 (PostgreSQL) y 6 (MinIO) son **igual de obligatorios**, y deben ejecutarse **emparejados** (mismo identificador de fecha/hora, ver [capítulo 8](#8-convención-de-nombres-de-backups)).

### 2.5 Docker / Docker Compose  **[IMPLEMENTADO]**

- Archivo único: `docker-compose.yml` en la raíz del repositorio. Nombre de proyecto de Compose: **`rehni-market`** (derivado del directorio `Rehni-Market`) → prefijo de volúmenes/red `rehni-market_`.
- Servicios: `minio`, `postgres`, `backend`, `frontend`. Los tres primeros con `restart: always`.
- `env_file` común: `./RehniMarket-backend/.env` para `minio`, `postgres` y `backend`.
- Volúmenes nombrados: `postgres_rehni_data`, `minio_rehni_data`, `frontend_node_modules`.
- El servicio `backend` ejecuta al arrancar: `sh -c "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"`.
- **Solo existe una configuración, orientada a desarrollo** (`--reload`, *bind mounts* del código, puertos de BD y MinIO publicados en el host).
- En el entorno hay dos volúmenes **huérfanos** de una configuración anterior (`rehnimarket-backend_postgres_data`, `rehnimarket-backend_minio_data`) que el `docker-compose.yml` actual **no** usa.

### 2.6 Alembic  **[IMPLEMENTADO — verificado]**

- **Alembic 1.18.4** (`RehniMarket-backend/alembic/`, `alembic.ini`).
- `alembic/env.py` toma la URL de `app.Config` (no de `alembic.ini`) e importa `Base.metadata` con todos los modelos.
- **10 revisiones en cadena lineal** (sin ramas):

  `29fe206320ce` (base, `down_revision = None`) → `d72ef7fa597e` → `048871b47f63` → `a90540bebea` → `b6f8fd31fbe` → `cb6d38ee0bd` → `d4e5f6a7b8c9` → `e7a1c9d24b30` → `f2b7c4e91a05` → **`a1b2c3d4e5f6`** (*head*)

- Revisión aplicada actualmente: **`a1b2c3d4e5f6`** (`SELECT version_num FROM alembic_version`) → la base está **al día**.
- Aplicación automática: `alembic upgrade head` se ejecuta **antes** de arrancar Uvicorn.
- La migración `a1b2c3d4e5f6` crea `pg_trgm`, `unaccent`, la función `rehni_search_norm` y el índice GIN. Un `pg_dump` completo las incluye.

### 2.7 Esquema textual de la arquitectura

```
                        ┌─────────────────────────────────────────────┐
   Navegador / App móvil│  Frontend React (host :5173)                │
        │               │  App móvil Expo (EXPO_PUBLIC_API_URL)        │
        │  HTTPS/HTTP    └─────────────────────────────────────────────┘
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Backend FastAPI  ── contenedor rehni-backend ── host :8001 / :8000   │
│    · alembic upgrade head (al arrancar)                               │
│    · GET /media/proxy?path=uploads/<clave>  ──►  MinIO                 │
└───────────┬───────────────────────────────────────────┬──────────────┘
            │ URL_DATABASE                                │ MINIO_URL = minio:9000
            │ postgresql://…@postgres:5432/rehnimarket    │ (secure=False)
            ▼                                             ▼
┌───────────────────────────────┐         ┌───────────────────────────────┐
│  PostgreSQL 17                │         │  MinIO                        │
│  contenedor rehni-postgres    │         │  contenedor rehni-minio       │
│  DB: rehnimarket  user: rehnieyal│      │  bucket: uploads              │
│  host :5434 → :5432            │         │  host :9000 → :9000           │
│  volumen:                      │         │  volumen:                     │
│   rehni-market_postgres_rehni_data       │   rehni-market_minio_rehni_data│
│   → /var/lib/postgresql/data   │         │   → /data                     │
│  ext: pg_trgm, unaccent        │         │  mc en /usr/bin/mc            │
└───────────────────────────────┘         └───────────────────────────────┘
      ▲  pg_dump / pg_restore                     ▲  mc mirror  /  tar del volumen
      │  (dentro del contenedor)                  │  (dentro del contenedor / docker run)
   ═══╪══════════════════════════════════════════ ╪═══════════════════════
      └──►  backups/postgres/  ◄────────────────► backups/minio/  ──►  copia EXTERNA (cifrada)
                       (emparejados por identificador de fecha/hora)
```

---

## 3. Inventario de información a migrar

### 3.1 A — PostgreSQL (base `rehnimarket`, esquema `public`)

37 tablas. Se agrupan por dominio y se indica el modelo ORM real (`RehniMarket-backend/app/models/`). Los conteos son **ilustrativos del momento del análisis** (datos de prueba) y **no son un requisito**: cambian con el uso.

| Dominio | Tablas | Modelo(s) ORM | Conteo (ejemplo) |
|---|---|---|---|
| **Roles y usuarios** | `roles`, `users`, `refreshToken`, `event_codes`, `admin_activities` | `ModelRole`, `ModelUser`, `ModelRefreshToken`, `ModelCode`, `ModelAdminActivity` | roles 4 · users 11 |
| **Empresas** | `company`, `company_bank_accounts`, `company_payouts` | `ModelCompany`, `ModelCompanyBankAccount`, `ModelCompanyPayout` | company 6 |
| **Catálogo** | `catalog`, `catalog_attributes`, `catalog_attribute_options`, `color_variants`, `specification_templates` | `ModelCatalog`, `ModelCatalogAttribute`, `ModelColor`, `ModelSpecification` | catalog 102 |
| **Productos** | `products`, `product_images`, `product_attribute_values`, `product_specifications` | `ModelProduct`, `ModelAttributeValue`, `ModelSpecification` | products 33 · product_images 67 |
| **Variantes** | `product_variants`, `product_variant_images`, `variant_options`, `variant_attribute_values`, `variant_specifications` | `ModelVariant`, `ModelVariantImage`, `ModelVariantOption`, `ModelVariantSpecification` | product_variants 112 · product_variant_images 88 |
| **Carrito** | `carts`, `cart_items` | `ModelCart` | carts 1 |
| **Órdenes / pedidos** | `orders`, `order_items` | `ModelOrder` | orders 22 · order_items 30 |
| **Wallet (RehniCoin)** | `wallets`, `wallet_transactions`, `rehnicoin_movements` | `ModelWallet`, `ModelRehniCoinMovement` | wallets 4 · wallet_transactions 26 |
| **Direcciones** | `addresses` | `ModelAddress` | addresses 3 |
| **Favoritos** | `favorites` | `ModelFavorite` | favorites 10 |
| **Reseñas** | `reviews` | `ModelReview` | reviews 2 |
| **Reportes** | `reports`, `report_evidences` | `ModelReport` | reports 0 |
| **Anuncios** | `advertisements` | `ModelAdvertisement` | advertisements — |
| **Transportadoras / envío** | `shipping_carriers` | `ModelShippingCarrier` | shipping_carriers 4 |
| **Control de migraciones** | `alembic_version` | (Alembic) | 1 fila = `a1b2c3d4e5f6` |

**Además del contenido de las tablas, el `pg_dump` migra:** todas las **secuencias** (contadores de IDs), **índices** (incluido el GIN de búsqueda), **restricciones** (PK, FK, UNIQUE, CHECK), **tipos ENUM** (`orderstatusenum`, `companycertificateenum`, …), las **extensiones** `pg_trgm` y `unaccent`, y la **función** `rehni_search_norm`.

> **No se detectó** ninguna base de datos adicional en producción. `rehnimarket_test` la crea automáticamente `tests/conftest.py` para las pruebas y **no** forma parte de la migración.

### 3.2 B — MinIO (*bucket* `uploads`)

**Un solo *bucket*: `uploads`** (verificado con `mc ls local/`). Prefijos de objeto y su tabla asociada:

| Prefijo dentro de `uploads/` | Tipo de archivo | Referenciado en PostgreSQL |
|---|---|---|
| `companies/<NIT>/products/<uuid>.{jpg,webp,png}` | Imágenes de producto | `product_images.url` |
| `companies/<NIT>/variants/<uuid>.{jpg,webp,png}` | Imágenes de variante | `product_variant_images.url` |
| `companies/<NIT>/logo/<uuid>.<ext>` | Logo de empresa | `company.CompanyLogo` |
| `companies/<NIT>/banner/<uuid>.<ext>` | Banner de empresa | `company.CompanyBanner` |
| `companies/<NIT>/certificates/<uuid>.pdf` | Certificado de la empresa (PDF) | `company.CompanyCertificate` |
| `advertisements/desktop/<uuid>.<ext>`, `advertisements/mobile/<uuid>.<ext>` | Imágenes de anuncios del Home | `advertisements.image_url`, `advertisements.mobile_image_url` |
| `catalogs/<uuid>.{webp,jpg}` | Imagen de categoría | `catalog.image_url` |
| `users/<user_id>/profile/<uuid>.<ext>` | Foto de perfil de usuario | `users.profileImagen` |
| `reports/<report_id>/evidences/<uuid>.<ext>` | Imágenes de evidencia de reportes | `report_evidences.url` |
| `seed/products/…`, `seed/variants/…` | Imágenes de ejemplo (**solo** si se ejecutó el *seed* con productos; hoy esa parte está **comentada** en `app/utils/seed.py`) | `product_images.url` / `product_variant_images.url` |

**No se detectan** otros *buckets*, ni tipos de archivo distintos a imágenes y PDF, ni almacenamiento de vídeos u otros documentos.

### 3.3 C — Configuración

| Archivo | ¿En Git? | Contiene secretos | Cómo migrarlo |
|---|---|---|---|
| `docker-compose.yml` | Sí | No | Viaja con el repo. |
| `RehniMarket-backend/.env` | **No** (`.gitignore`) | **Sí** | Recrear en el destino desde `.env.example` + copia **cifrada** de los valores. |
| `RehniMarket-backend/.env.example` | Sí | No | Viaja con el repo. |
| `RehniMarket-frontend/.env` | **No** | `VITE_API_URL`, `VITE_REHNIMARKET_WHATSAPP` (no secretos, pero se trata igual) | Recrear con la URL pública del destino. |
| `RehniMarket-mobile/.env` | **No** | `EXPO_PUBLIC_API_URL` | Recrear con la URL del backend accesible desde el dispositivo. |

---

## 4. Requisitos previos para la migración

### 4.1 Hardware (servidor destino)

> El repositorio **no define** requisitos de hardware. Los valores siguientes son **[PROPUESTO]** dimensionados para el volumen actual (~10 MB BD + ~9 MB objetos + imágenes Docker). Ajustar según el crecimiento previsto del *bucket* `uploads`.

| Recurso | Mínimo propuesto | Recomendado propuesto |
|---|---|---|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disco | 20 GB libres (imágenes Docker + volúmenes + espacio para backups locales) | 40 GB SSD + almacenamiento separado para las copias externas |
| Red | Salida a Internet (descarga de imágenes; SMTP 587) | + Reverse proxy con TLS |

### 4.2 Software requerido

| Software | Dónde | Estado |
|---|---|---|
| Linux con **Docker Engine** | Servidor destino | Requerido |
| **Docker Compose v2** (`docker compose …`) | Servidor destino | Requerido |
| **Git** | Servidor destino | Requerido (clonar el repo) |
| `scp` / `rsync` / `ssh` | Origen y destino | Requerido (transferencia segura) — verificados en el entorno del análisis |
| `gpg` (GnuPG) | Origen y destino | Recomendado (cifrado de copias externas) — verificado en el entorno del análisis |
| `pg_dump` / `pg_restore` / `psql` | **Dentro del contenedor `rehni-postgres`** (`postgres:17-alpine`) | **Disponible** — no requieren instalación en el anfitrión |
| `mc` (MinIO Client) | **Dentro del contenedor `rehni-minio`** (`/usr/bin/mc`) | **Disponible** — no requiere instalación en el anfitrión |
| `tar`, `gzip`, `sha256sum` | Anfitrión (o reutilizando `postgres:17-alpine`) | Requerido |

### 4.3 Variables de entorno y credenciales

- Copia **segura y cifrada** del `RehniMarket-backend/.env` actual (o de los valores individuales), custodiada por el responsable del proyecto.
- Definir para el destino: `URL_BACKEND` y `URL_FRONTEND` públicas, y una `SECRET_KEY` **nueva** (larga y aleatoria).
- Decidir si `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` y `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` se conservan o se cambian (ver notas en §5.4 y §6).

### 4.4 Espacio, permisos y conectividad

- Espacio en el destino ≥ (tamaño de imágenes Docker) + (tamaño de los volúmenes de datos) + (tamaño de un juego de backups) × 2 de margen.
- El usuario que ejecuta la migración debe pertenecer al grupo `docker` (o usar `sudo`).
- Directorio de trabajo con permisos restrictivos: `mkdir -p backups/{postgres,minio,config} && chmod 700 backups`.
- Conectividad **origen ↔ destino** por SSH para la transferencia.

### 4.5 Verificaciones previas (en el origen)

| # | Verificación | Comando | Esperado |
|---|---|---|---|
| P-1 | Contenedores arriba | `docker compose ps` | `rehni-postgres`, `rehni-minio` (y backend/frontend) en *Up* |
| P-2 | PostgreSQL acepta conexiones | `docker exec rehni-postgres pg_isready -U rehnieyal` | `accepting connections` |
| P-3 | Revisión de esquema al día | `docker exec rehni-backend uv run alembic current` | `a1b2c3d4e5f6 (head)` |
| P-4 | MinIO responde y el *bucket* existe | `docker exec rehni-minio sh -c 'mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null && mc ls local/'` | `uploads/` |
| P-5 | Tamaño de datos | `docker exec rehni-postgres psql -U rehnieyal -d rehnimarket -tAc "SELECT pg_size_pretty(pg_database_size('rehnimarket'));"` + `mc du local/uploads` | valores base para dimensionar |
| P-6 | Conteos base (para comparar tras la migración) | ver §11.1 | anotar los números |
| P-7 | `docker-compose.yml` y `.env` respaldados | inspección | copia cifrada del `.env` guardada |

---

## 5. Estrategia de migración PostgreSQL

### 5.1 Herramienta y justificación

Se usa **`pg_dump`** (backup lógico) y **`pg_restore`** (restauración), incluidos en la distribución de PostgreSQL. Están **dentro del contenedor `rehni-postgres`** (versión 17.10), por lo que **no requieren instalación en el anfitrión**; se invocan con `docker exec`.

| Herramienta | Por qué |
|---|---|
| `pg_dump -F c` (formato *custom*) | Backup **lógico** (SQL portable), comprimido, restaurable **selectivamente** con `pg_restore` (por tabla, por esquema), y portable entre servidores y entre versiones de PostgreSQL (17 → 17 o superior). Es la opción recomendada. |
| `pg_dump` (SQL plano) + `gzip` | Alternativa **legible** (se puede inspeccionar el `.sql`). Se restaura con `psql`. Útil para revisión o para migrar a un motor ligeramente distinto. |
| Copia física del volumen | **No recomendada** para migrar: depende del formato interno de PostgreSQL y de la plataforma. Solo se contempla como respaldo secundario (§7). |

**No se usa** ninguna herramienta ajena a PostgreSQL.

### 5.2 Procedimiento paso a paso

Todos los comandos se ejecutan **desde la raíz del proyecto**. La contraseña **no se escribe**: `PGPASSWORD` se lee dentro del contenedor desde su propio entorno.

**Paso 1 — Preparar y congelar el origen**

```bash
mkdir -p backups/postgres && chmod 700 backups
docker compose stop backend frontend   # evita escrituras durante el respaldo
TS=$(date +%Y-%m-%d_%H-%M)              # identificador común PG + MinIO
```

**Paso 2 — Crear el backup (formato custom, recomendado)**

```bash
OUT="backups/postgres/rehni_market_postgres_${TS}.dump"

docker exec rehni-postgres sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c -Z 6' \
  > "$OUT"

sha256sum "$OUT" | tee "${OUT}.sha256"
ls -lh "$OUT"
```

Alternativa SQL plano:

```bash
OUT="backups/postgres/rehni_market_postgres_${TS}.sql.gz"
docker exec rehni-postgres sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges' \
  | gzip -6 > "$OUT"
sha256sum "$OUT" | tee "${OUT}.sha256"
```

**Paso 3 — Validar el backup ANTES de transferirlo**

```bash
sha256sum -c backups/postgres/rehni_market_postgres_${TS}.dump.sha256
docker exec -i rehni-postgres pg_restore -l < backups/postgres/rehni_market_postgres_${TS}.dump | head -40
# La lista (TOC) debe incluir tablas como users, products, orders, wallets, product_images...
```

**Paso 4 — Transferir al destino por canal seguro**

```bash
rsync -avz -e ssh backups/postgres/rehni_market_postgres_${TS}.dump* \
  <usuario>@<host-destino>:/ruta/Rehni-Market/backups/postgres/
```

**Paso 5 — Preparar la base de datos destino**

En el servidor destino, con el repo clonado y el `.env` recreado (§5.4):

```bash
docker compose up -d postgres
docker exec rehni-postgres pg_isready -U "$POSTGRES_USER"   # esperar "accepting connections"
# La imagen crea la base <POSTGRES_DB> vacía la primera vez.
```

**Paso 6 — Restaurar**

```bash
docker exec -i rehni-postgres sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
     --clean --if-exists --no-owner --no-privileges -v' \
  < backups/postgres/rehni_market_postgres_${TS}.dump
```

- `--clean --if-exists`: elimina objetos previos antes de recrearlos (útil si la base ya tiene esquema).
- `--no-owner --no-privileges`: evita fallos si el rol del *dump* difiere del rol destino.
- Sobre una base **recién creada y vacía**, se pueden omitir `--clean --if-exists`.

**Desde SQL plano:**

```bash
gunzip -c backups/postgres/rehni_market_postgres_${TS}.sql.gz | \
docker exec -i rehni-postgres sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1'
```

**Paso 7 — Migraciones Alembic**

- Con un `pg_restore` de *dump* completo, la tabla `alembic_version` se restaura → el esquema ya queda en la revisión `a1b2c3d4e5f6`. **No hace falta ninguna acción extra.**
- Al levantar el backend, su `command` ejecuta `alembic upgrade head`: si el código destino trae **migraciones nuevas**, se aplican automáticamente. **Regla:** hacer el `pg_dump` **antes** de aplicar migraciones nuevas.

```bash
docker compose up -d backend
docker exec rehni-backend uv run alembic current    # esperado: a1b2c3d4e5f6 (head)
```

### 5.3 Validaciones de PostgreSQL tras restaurar

| # | Qué se valida | Comando | Esperado |
|---|---|---|---|
| DB-1 | Tablas creadas | `docker exec rehni-postgres psql -U rehnieyal -d rehnimarket -c "\dt"` | 37 tablas |
| DB-2 | Registros presentes | `... -c "SELECT count(*) FROM users;"` (y products, orders, wallets, …) | coinciden con los conteos base (P-6 / §11.1) |
| DB-3 | Relaciones / FKs | `... -c "SELECT count(*) FROM order_items oi JOIN orders o ON o.id=oi.order_id;"` | = `count(order_items)` (sin huérfanos) |
| DB-4 | Integridad de secuencias | `... -c "SELECT max(id) FROM ...; SELECT last_value FROM ..._id_seq;"` | la secuencia ≥ el máximo id (evita colisiones al insertar) |
| DB-5 | Extensiones | `... -c "SELECT extname FROM pg_extension ORDER BY extname;"` | incluye `pg_trgm`, `unaccent` |
| DB-6 | Función de búsqueda | `... -c "SELECT rehni_search_norm('Audífonos');"` | `audifonos` |
| DB-7 | Revisión Alembic | `docker exec rehni-backend uv run alembic current` | `a1b2c3d4e5f6 (head)` |
| DB-8 | Backend conecta | `curl -s http://localhost:8001/health/database` | `{"Base de datos":"OK"}` |

### 5.4 Notas de configuración para PostgreSQL

- Si se **conservan** el nombre de base, usuario y contraseña, la migración es directa.
- Si se **cambian**: la imagen oficial solo aplica `POSTGRES_*` **la primera vez** (volumen vacío). `URL_DATABASE` debe quedar coherente. La restauración `pg_restore -d <DB>` debe apuntar al nuevo nombre.
- `SECRET_KEY` **nueva** en el destino: invalida las sesiones activas (los usuarios vuelven a iniciar sesión), lo cual es correcto en una migración.

---

## 6. Estrategia de migración MinIO

**Obligatoria.** MinIO contiene **todas las imágenes** y los **PDF de certificados** y **evidencias de reportes**. Migrar solo PostgreSQL deja el sistema con imágenes rotas.

### 6.1 Qué se almacena en MinIO y cómo identificar los *buckets* reales

- **Un único *bucket*: `uploads`.** Verificable con:

  ```bash
  docker exec rehni-minio sh -c \
    'mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null && mc ls local/'
  # salida esperada:  [fecha]  0B  uploads/
  ```

- El nombre está **fijo en el código** (`app/services/NasService.py`: `bucket = "uploads"`), por lo que **no depende de configuración externa** y no puede haber más de uno.
- Prefijos y tipos de archivo: ver [§3.2](#32-b--minio-bucket-uploads).

### 6.2 Herramienta y justificación

Se usa **`mc` (MinIO Client)**, incluido en la imagen `minio/minio` (`/usr/bin/mc`). Permite copiar el contenido lógico del *bucket* preservando **la ruta completa de cada objeto** (que es justo lo que PostgreSQL referencia).

| Método | Uso | Recomendación |
|---|---|---|
| **`mc mirror`** (objeto por objeto) | Copia/sincroniza `uploads` a un directorio o a otro MinIO, **en caliente**, preservando rutas. Verificable objeto a objeto (`mc ls`, `mc du`, `mc diff`). | **Método principal** para RehniMarket (dataset pequeño, portable, verificable). |
| **`tar` del volumen `rehni-market_minio_rehni_data`** (copia física) | Copia `/data` completo (objetos + metadatos internos `.minio.sys`), **en frío** (MinIO detenido). | **Respaldo secundario** mensual; también sirve para restaurar "bit a bit". Menos portable entre versiones de MinIO. |

**Diferencia clave:** `mc mirror` copia **lo que la aplicación necesita** (los objetos con su ruta); el `tar` del volumen copia además el estado interno de MinIO. Para migrar entre servidores, **`mc mirror` es preferible** porque el resultado es independiente de la versión de MinIO del destino.

### 6.3 Procedimiento paso a paso (`mc mirror`)

**Paso 1 — Backup de los objetos en el origen** (usa el `mc` del contenedor; escribe a un temporal y lo extrae):

```bash
mkdir -p backups/minio
TS=$(date +%Y-%m-%d_%H-%M)              # el MISMO TS que el backup de PostgreSQL
DEST="backups/minio/rehni_market_minio_${TS}"

docker exec rehni-minio sh -c '
  mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null &&
  rm -rf /tmp/uploads_bk && mkdir -p /tmp/uploads_bk &&
  mc mirror --quiet local/uploads /tmp/uploads_bk
'
mkdir -p "$DEST"
docker cp rehni-minio:/tmp/uploads_bk/. "$DEST"
docker exec rehni-minio rm -rf /tmp/uploads_bk

# Empaquetar + verificar:
tar -C "$DEST" -czf "${DEST}.tar.gz" .
sha256sum "${DEST}.tar.gz" | tee "${DEST}.tar.gz.sha256"
find "$DEST" -type f | wc -l          # nº de objetos respaldados
```

**Comandos `mc` de referencia** (ejecutados dentro de `rehni-minio` para no exponer credenciales en el historial del anfitrión):

| Acción | Comando |
|---|---|
| Configurar alias | `mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"` |
| Listar *buckets* | `mc ls local/` |
| Listar objetos | `mc ls --recursive local/uploads` |
| Copiar / sincronizar | `mc mirror --quiet local/uploads <destino>` |
| Verificar contenido | `mc du local/uploads` · `mc stat local/uploads/<clave>` |
| Comparar dos ubicaciones | `mc diff <origen> <destino>` |

**Paso 2 — Transferir al destino** (mismo canal seguro que PostgreSQL):

```bash
rsync -avz -e ssh backups/minio/rehni_market_minio_${TS}* \
  <usuario>@<host-destino>:/ruta/Rehni-Market/backups/minio/
```

**Paso 3 — Preparar MinIO en el destino:**

```bash
docker compose up -d minio
docker exec rehni-minio sh -c '
  mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null &&
  mc mb --ignore-existing local/uploads
'
# (o simplemente levantar el backend, que crea el bucket "uploads" al arrancar)
```

**Paso 4 — Restaurar los objetos** (preservando rutas):

```bash
# Si se transfirió el .tar.gz, descomprimir primero:
mkdir -p backups/minio/rehni_market_minio_${TS}
tar -C backups/minio/rehni_market_minio_${TS} -xzf backups/minio/rehni_market_minio_${TS}.tar.gz

docker cp backups/minio/rehni_market_minio_${TS} rehni-minio:/tmp/uploads_rs
docker exec rehni-minio sh -c '
  mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null &&
  mc mirror --overwrite --quiet /tmp/uploads_rs local/uploads
'
docker exec rehni-minio rm -rf /tmp/uploads_rs
```

**Paso 5 — Verificar integridad y configuración:**

```bash
# Conteo y tamaño = origen:
docker exec rehni-minio sh -c '
  mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null &&
  mc ls --recursive local/uploads | wc -l &&
  mc du local/uploads
'
# El backend puede leer un objeto conocido:
curl -s -o /dev/null -w "%{http_code}\n" \
  "http://localhost:8001/media/proxy?path=uploads/<clave-conocida>"   # esperado: 200
```

### 6.4 Migración de objetos directamente entre dos instancias MinIO (sin archivo intermedio)

Si el origen y el destino están conectados en red, `mc` puede copiar de un MinIO a otro sin pasar por disco:

```bash
docker exec rehni-minio sh -c '
  mc alias set src  http://<host-origen>:9000  "$SRC_USER"  "$SRC_PASS"  >/dev/null &&
  mc alias set dst  http://<host-destino>:9000 "$DST_USER"  "$DST_PASS"  >/dev/null &&
  mc mirror --overwrite src/uploads dst/uploads
'
```

> Preferir el flujo con archivo intermedio (§6.3) cuando: no hay conectividad directa, se quiere conservar el backup, o el destino aún no existe. Las credenciales de cada instancia deben pasarse por variables de entorno, **nunca** literales en la línea de comandos.

### 6.5 Preservación de nombres/rutas y verificación de permisos

- `mc mirror` **conserva la ruta completa** de cada objeto (`companies/<NIT>/products/<uuid>.jpg` se restaura idéntico). Esto es imprescindible porque PostgreSQL guarda esa ruta.
- **Permisos:** el *bucket* `uploads` no tiene una política de acceso pública configurada; el acceso es siempre autenticado y mediado por el backend (`/media/proxy`). Tras restaurar, **no** hay que aplicar ninguna política adicional. Verificar con `mc anonymous get local/uploads` (debe indicar que no hay acceso anónimo, igual que en el origen).
- **Versionado:** el origen **no** tiene versionado de objetos; el destino tampoco debe activarlo salvo decisión explícita.

---

## 7. Estrategia de backup

**[PROPUESTO — no implementado a la fecha]**

### 7.1 A — Backup PostgreSQL

| Aspecto | Definición |
|---|---|
| **Tipo** | Backup **lógico completo** de la base `rehnimarket` con `pg_dump`. |
| **Formato recomendado** | `-F c` (*custom*, comprimido). Alternativa semanal: SQL plano `.sql.gz`. |
| **Qué respalda** | Esquema completo (tablas, índices, secuencias, restricciones, ENUMs), **todos los datos**, extensiones `pg_trgm`/`unaccent`, función `rehni_search_norm`, tabla `alembic_version`. |
| **Qué NO respalda** | Roles/contraseñas del clúster (`pg_dumpall --roles-only` — no necesario: un solo rol `rehnieyal` recreado por la imagen), `postgresql.conf`/`pg_hba.conf`, otras bases, y **los archivos de MinIO**. |
| **Nombre de archivo** | `rehni_market_postgres_YYYY-MM-DD_HH-MM.dump` (+ `.sha256`) — ver [§8](#8-convención-de-nombres-de-backups). |
| **Ubicación** | 1) local: `backups/postgres/`; 2) **copia externa cifrada** fuera del servidor. |
| **Frecuencia recomendada** | **Diaria** (custom) + **semanal** (SQL plano). |
| **Retención** | 7 diarias + 4 semanales + 3 mensuales. |
| **Verificación** | `sha256sum -c` + `pg_restore -l` en cada backup; **prueba de restauración mensual** ([§12](#12-pruebas-de-restauración)). |

Comando (recomendado):

```bash
TS=$(date +%Y-%m-%d_%H-%M)
OUT="backups/postgres/rehni_market_postgres_${TS}.dump"
docker exec rehni-postgres sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c -Z 6' > "$OUT"
sha256sum "$OUT" | tee "${OUT}.sha256"
```

### 7.2 B — Backup MinIO

| Aspecto | Definición |
|---|---|
| **Tipo** | Copia lógica de los objetos del *bucket* `uploads` con `mc mirror` (principal) + `tar` del volumen en frío (secundario mensual). |
| **Qué respalda** | Todos los objetos con su ruta completa (imágenes + PDF). El `tar` del volumen respalda además los metadatos internos de MinIO. |
| **Nombre** | Directorio `rehni_market_minio_YYYY-MM-DD_HH-MM/` + `rehni_market_minio_YYYY-MM-DD_HH-MM.tar.gz` (+ `.sha256`); `tar` del volumen: `rehni_market_minio_volume_YYYY-MM-DD_HH-MM.tar.gz`. |
| **Ubicación** | 1) local: `backups/minio/`; 2) **copia externa cifrada**. |
| **Frecuencia** | **Diaria** (`mc mirror`, tras el backup de PostgreSQL) + **mensual** (`tar` del volumen en frío). |
| **Retención** | 7 diarias + 4 semanales; `tar` del volumen: 3 meses. |
| **Verificación** | Conteo de objetos (`find | wc -l` vs. `mc ls --recursive | wc -l`) + `sha256sum -c` + prueba de restauración mensual. |

Comando (recomendado, en caliente): ver [§6.3, Paso 1](#63-procedimiento-paso-a-paso-mc-mirror).

`tar` del volumen (en frío):

```bash
TS=$(date +%Y-%m-%d_%H-%M)
docker compose stop minio
docker run --rm \
  -v rehni-market_minio_rehni_data:/data:ro \
  -v "$PWD/backups/minio:/backup" \
  postgres:17-alpine \
  tar czf "/backup/rehni_market_minio_volume_${TS}.tar.gz" -C /data .
docker compose start minio
sha256sum "backups/minio/rehni_market_minio_volume_${TS}.tar.gz" \
  | tee "backups/minio/rehni_market_minio_volume_${TS}.tar.gz.sha256"
```

### 7.3 C — Backup conjunto: por qué PostgreSQL y MinIO deben respaldarse coordinadamente

- PostgreSQL guarda la **ruta** (`product_images.url = 'uploads/companies/…/x.jpg'`); MinIO guarda el **binario** (`companies/…/x.jpg`). Si se respalda PostgreSQL a las 02:00 y MinIO a las 05:00, y entre medias una empresa subió un producto nuevo, el par de backups quedará **inconsistente**: la BD tendrá una fila `product_images` cuya imagen no está en el backup de MinIO (o viceversa).
- **Regla operativa:**
  1. Detener el backend (`docker compose stop backend`) para que no haya escrituras.
  2. Generar un identificador **`TS` único** (`date +%Y-%m-%d_%H-%M`).
  3. Backup de **PostgreSQL** con ese `TS`.
  4. Backup de **MinIO** con el **mismo `TS`**, inmediatamente después.
  5. Reanudar el backend (`docker compose start backend`).
  6. En una restauración, usar **siempre el par con el mismo `TS`**.
- Tras cualquier restauración, ejecutar la **comprobación de referencias PG↔MinIO** ([§12.2](#122-comprobación-de-referencias-pg--minio)).

### 7.4 Backup de la configuración

| Archivo | Método | Nota |
|---|---|---|
| `docker-compose.yml`, `.env.example` | Ya en Git; copia adicional a `backups/config/`. | Sin secretos. |
| `RehniMarket-backend/.env` (+ frontend/mobile) | Copia **cifrada** (`gpg --symmetric --cipher-algo AES256`) a `backups/config/`. | **Contiene secretos** — nunca en claro, nunca en Git. |

### 7.5 Tabla resumen de la estrategia

| Recurso | Método | Frecuencia | Retención | Ubicación | Verificación |
|---|---|---|---|---|---|
| **PostgreSQL** (custom) | `pg_dump -F c` vía `docker exec` | Diaria | 7 diarias + 4 semanales + 3 mensuales | Local `backups/postgres/` + **copia externa cifrada** | `sha256sum -c` + `pg_restore -l` + prueba de restauración mensual |
| **PostgreSQL** (SQL plano) | `pg_dump --no-owner \| gzip` | Semanal | 4 semanas | Igual | Igual |
| **MinIO** (objetos) | `mc mirror` + `tar.gz` | Diaria (tras PostgreSQL) | 7 diarias + 4 semanales | Igual | Conteo de objetos + `sha256sum -c` + prueba de restauración mensual |
| **MinIO** (volumen) | `tar` del volumen en frío | Mensual | 3 meses | Copia externa | `sha256sum -c` + montaje de prueba |
| **Configuración** | Copia cifrada de los `.env` | Ante cada cambio | Últimas 5 versiones | Copia externa cifrada | Descifrado de prueba |

---

## 8. Convención de nombres de backups

**[PROPUESTO]**

Formato de fecha/hora: **`YYYY-MM-DD_HH-MM`** (se recomienda **UTC** para evitar ambigüedad de zona horaria).

```
backups/
├── postgres/
│   ├── rehni_market_postgres_2026-08-30_14-05.dump
│   ├── rehni_market_postgres_2026-08-30_14-05.dump.sha256
│   ├── rehni_market_postgres_2026-08-30_14-05.sql.gz          (backup semanal SQL plano)
│   └── rehni_market_postgres_2026-08-30_14-05.sql.gz.sha256
├── minio/
│   ├── rehni_market_minio_2026-08-30_14-05/                   (árbol de objetos — mc mirror)
│   ├── rehni_market_minio_2026-08-30_14-05.tar.gz
│   ├── rehni_market_minio_2026-08-30_14-05.tar.gz.sha256
│   ├── rehni_market_minio_volume_2026-08-30_14-05.tar.gz      (tar del volumen — mensual)
│   └── rehni_market_minio_volume_2026-08-30_14-05.tar.gz.sha256
└── config/
    ├── docker-compose_2026-08-30_14-05.yml
    └── env-backend_2026-08-30_14-05.gpg                       (cifrado)
```

Reglas:

- El **par PostgreSQL + MinIO de la misma ejecución comparte el mismo `YYYY-MM-DD_HH-MM`**.
- Nombres en minúsculas, con guion bajo como separador; sin espacios.
- **No** incluir en el nombre: datos personales, nombres de clientes, IPs, ni ningún secreto.
- Cada archivo de backup lleva su `.sha256` al lado.
- Las copias cifradas añaden la extensión `.gpg`.

---

## 9. Procedimiento de restauración

**[PROPUESTO]**

### 9.1 Orden general

```
1.  Detener los servicios que escriben datos:   docker compose stop backend frontend
2.  Restaurar PostgreSQL   (§9.2)
3.  Verificar estructura y datos de PostgreSQL   (§5.3: DB-1 … DB-7)
4.  Restaurar MinIO   (§9.3)
5.  Verificar objetos de MinIO   (conteo + tamaño = origen)
6.  Levantar servicios:   docker compose up -d backend frontend
7.  Ejecutar pruebas   (§11 checklist + §12 pruebas)
8.  Validar el funcionamiento de la aplicación (login, catálogo con imágenes, carrito, checkout)
9.  Registrar el resultado (fecha/hora de recuperación, TS usado, incidencias)
```

> **Usar siempre el par PostgreSQL + MinIO con el mismo identificador `YYYY-MM-DD_HH-MM`.**

### 9.2 Restauración PostgreSQL

**Sobre la base existente (formato custom):**

```bash
docker exec -i rehni-postgres sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
     --clean --if-exists --no-owner --no-privileges -v' \
  < backups/postgres/rehni_market_postgres_<TS>.dump
```

**Sobre una base nueva (para pruebas / rollback):**

```bash
docker exec rehni-postgres sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" createdb -U "$POSTGRES_USER" rehnimarket_restore'
docker exec -i rehni-postgres sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore -U "$POSTGRES_USER" -d rehnimarket_restore --no-owner -v' \
  < backups/postgres/rehni_market_postgres_<TS>.dump
```

**Desde SQL plano:**

```bash
gunzip -c backups/postgres/rehni_market_postgres_<TS>.sql.gz | \
docker exec -i rehni-postgres sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1'
```

### 9.3 Restauración MinIO

**Desde `mc mirror` (recomendado):**

```bash
# Si el backup es .tar.gz, descomprimir primero:
mkdir -p backups/minio/rehni_market_minio_<TS>
tar -C backups/minio/rehni_market_minio_<TS> -xzf backups/minio/rehni_market_minio_<TS>.tar.gz

docker cp backups/minio/rehni_market_minio_<TS> rehni-minio:/tmp/uploads_rs
docker exec rehni-minio sh -c '
  mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null &&
  mc mb --ignore-existing local/uploads &&
  mc mirror --overwrite --quiet /tmp/uploads_rs local/uploads
'
docker exec rehni-minio rm -rf /tmp/uploads_rs
```

- Para una restauración **idéntica** (que elimine objetos sobrantes en el destino) añadir `--remove` a `mc mirror`. Usar con cuidado.

**Desde `tar` del volumen (en frío):**

```bash
docker compose stop minio
docker run --rm \
  -v rehni-market_minio_rehni_data:/data \
  -v "$PWD/backups/minio:/backup:ro" \
  postgres:17-alpine \
  sh -c 'find /data -mindepth 1 -delete; tar xzf /backup/rehni_market_minio_volume_<TS>.tar.gz -C /data'
docker compose start minio
```

### 9.4 Qué hacer si la restauración falla

| Síntoma | Causa probable | Acción |
|---|---|---|
| `pg_restore: error: could not execute query` (FKs, ENUMs) | Base no vacía sin `--clean`; o versión de PostgreSQL destino inferior | Recrear la base vacía y restaurar sin `--clean`; o usar un destino con PostgreSQL ≥ 17 |
| `sha256sum -c` falla | Backup corrupto o truncado en la transferencia | **No restaurar.** Usar el backup **anterior** (de ahí la retención de 7). Repetir la transferencia. |
| `pg_restore` termina pero faltan filas | *Dump* incompleto (se respaldó con escrituras en curso) | Repetir el backup con el backend detenido; usar un backup previo válido |
| `mc mirror` falla a mitad | Espacio insuficiente en el destino / MinIO no responde | Liberar espacio; verificar `mc ls local/`; reintentar (`mc mirror` es idempotente, retoma) |
| Imágenes rotas tras restaurar todo | PostgreSQL y MinIO de `TS` distintos, o `build_media_url` con IP antigua | Restaurar el par con el mismo `TS`; corregir `build_media_url` / `URL_BACKEND` (ver [§13](#13-riesgos-de-migración) R-9) |
| El backend no arranca | `.env` mal recreado, `URL_DATABASE` incoherente | Revisar `.env` contra `.env.example` y §5.4 |

Si tras dos intentos la restauración de un backup no es válida → **escalar al plan de contingencia** ([§10](#10-plan-de-contingencia-y-rollback)) y usar un punto de restauración anterior.

---

## 10. Plan de contingencia y rollback

**[PROPUESTO]**

### 10.1 Principio: no destruir el origen hasta validar el destino

- Durante una **migración**, el servidor **origen se mantiene intacto y en solo lectura** (backend detenido, datos sin tocar) hasta que el destino pase **todas** las validaciones de [§11](#11-validación-posterior-a-la-migración).
- El **backup original nunca se sobrescribe ni se borra** durante la migración. Se conserva al menos hasta 7 días después de confirmar el destino.

### 10.2 Qué sucede si la migración falla

| Momento del fallo | Estado | Acción de rollback |
|---|---|---|
| Antes de tocar el destino (backup / transferencia falla) | Origen intacto | Reintentar; el servicio en el origen no se ha interrumpido. Solo reactivar el backend del origen (`docker compose start backend frontend`). |
| Durante la restauración en el destino | Origen intacto; destino a medias | Descartar el destino (`docker compose -p <proyecto> down -v` en el destino) y **volver a apuntar el tráfico/DNS al origen**. Reactivar el backend del origen. Investigar y reintentar. |
| Tras "levantar" el destino pero con validaciones fallidas | Origen intacto; destino levantado pero incorrecto | Igual que arriba: DNS al origen, reactivar backend del origen, `down -v` en el destino. |
| Tras cortar el origen y descubrir un fallo (peor caso) | Origen ya detenido | El origen **no se ha borrado** (solo detenido): `docker compose start` en el origen y DNS de vuelta. Los datos del origen siguen en su volumen. |

### 10.3 Rollback de una restauración en el mismo servidor

Antes de restaurar sobre la base de producción, **hacer un `pg_dump` "de seguridad" del estado actual** (aunque se sospeche corrupto) y un `mc mirror` del MinIO actual:

```bash
SAFE=$(date +%Y-%m-%d_%H-%M)_pre-restore
docker exec rehni-postgres sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c -Z 6' \
  > "backups/postgres/rehni_market_postgres_${SAFE}.dump"
```

Si la restauración deja el sistema peor, se puede volver a ese punto `_pre-restore`.

### 10.4 Cómo conservar el backup original y evitar pérdida de información

- Copias en **al menos 2 ubicaciones** (regla 3-2-1): disco local del servidor + almacenamiento externo.
- Permisos `600` en los archivos, `700` en el directorio; sin acceso compartido.
- Los backups usados en una migración se **marcan como "en uso"** (p. ej. copiándolos a `backups/_migracion_<TS>/`) y **no entran en la rotación** hasta cerrar la migración.

### 10.5 Cuándo abortar la migración

Abortar y volver al origen si:

- El backup de PostgreSQL o de MinIO **no pasa** la validación (`sha256sum -c`, `pg_restore -l`, conteo de objetos) y **no hay** un backup previo válido disponible.
- La ventana de mantenimiento acordada se agota antes de completar las validaciones de [§11](#11-validación-posterior-a-la-migración).
- Las validaciones **DB-2/DB-3** (conteos y relaciones) difieren del origen y no se identifica la causa.
- La comprobación de referencias PG↔MinIO ([§12.2](#122-comprobación-de-referencias-pg--minio)) reporta objetos faltantes que no se pueden recuperar.

---

## 11. Validación posterior a la migración

**[PROPUESTO — checklist verificable]**

### 11.1 Conteos base (anotar en el ORIGEN antes de migrar, comparar en el DESTINO)

```bash
docker exec rehni-postgres psql -U rehnieyal -d rehnimarket -tAc "
SELECT 'roles='||(SELECT count(*) FROM roles)
  ||' users='||(SELECT count(*) FROM users)
  ||' company='||(SELECT count(*) FROM company)
  ||' catalog='||(SELECT count(*) FROM catalog)
  ||' products='||(SELECT count(*) FROM products)
  ||' product_variants='||(SELECT count(*) FROM product_variants)
  ||' product_images='||(SELECT count(*) FROM product_images)
  ||' product_variant_images='||(SELECT count(*) FROM product_variant_images)
  ||' orders='||(SELECT count(*) FROM orders)
  ||' order_items='||(SELECT count(*) FROM order_items)
  ||' wallets='||(SELECT count(*) FROM wallets)
  ||' wallet_transactions='||(SELECT count(*) FROM wallet_transactions)
  ||' addresses='||(SELECT count(*) FROM addresses)
  ||' favorites='||(SELECT count(*) FROM favorites)
  ||' reviews='||(SELECT count(*) FROM reviews)
  ||' shipping_carriers='||(SELECT count(*) FROM shipping_carriers);"
docker exec rehni-minio sh -c 'mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null && mc ls --recursive local/uploads | wc -l && mc du local/uploads'
```

*(Ejemplo de valores en el entorno del análisis: `roles=4 users=11 company=6 catalog=102 products=33 product_variants=112 product_images=67 product_variant_images=88 orders=22 order_items=30 wallets=4 wallet_transactions=26 addresses=3 favorites=10 reviews=2 shipping_carriers=4`; MinIO ≈ 165 objetos, 8.7 MiB. Estos números **cambian con el uso** y solo sirven de referencia del método.)*

### 11.2 Checklist — PostgreSQL

- [ ] Base de datos accesible (`pg_isready` → `accepting connections`).
- [ ] `GET /health/database` → `{"Base de datos":"OK"}`.
- [ ] Las **37 tablas** existen (`\dt`).
- [ ] Registros presentes: los conteos de §11.1 **coinciden** con el origen.
- [ ] Relaciones funcionando: `order_items` ⋈ `orders`, `product_images` ⋈ `products`, `wallet_transactions` ⋈ `wallets` sin huérfanos.
- [ ] Secuencias por delante del máximo id (insertar un registro de prueba y borrarlo).
- [ ] Extensiones `pg_trgm` y `unaccent` presentes; `rehni_search_norm('Audífonos')` = `audifonos`.
- [ ] `alembic current` = `a1b2c3d4e5f6 (head)`.
- [ ] **Usuarios** funcionando (login de una cuenta conocida).
- [ ] **Roles y permisos**: un comprador no accede a `/admin/dashboard` (403); un admin sí.
- [ ] **Productos** funcionando (catálogo público devuelve productos con precio y stock).
- [ ] **Carrito** funcionando (`POST /cart/add` con un producto con stock).
- [ ] **Órdenes** funcionando (listado de pedidos de una cuenta; detalle con *snapshot*).
- [ ] **Wallet / RehniCoin** funcionando (saldo y movimientos consistentes).
- [ ] **Direcciones, favoritos, reseñas** funcionando.

### 11.3 Checklist — MinIO

- [ ] *Bucket* `uploads` disponible (`mc ls local/`).
- [ ] Nº de objetos y tamaño = origen (§11.1).
- [ ] Imágenes visibles: abrir 5 productos del catálogo y ver su imagen; abrir el perfil de una empresa (logo/banner); abrir un anuncio del Home.
- [ ] El **backend puede acceder a MinIO** (los logs no muestran el *warning* de "no se pudo verificar/crear el bucket").
- [ ] URLs/rutas funcionan: `GET /media/proxy?path=uploads/<clave-conocida>` → **200**.
- [ ] Permisos correctos: `mc anonymous get local/uploads` = sin acceso anónimo (igual que el origen).
- [ ] Comprobación de referencias PG↔MinIO ([§12.2](#122-comprobación-de-referencias-pg--minio)) → **0 objetos faltantes**.

### 11.4 Checklist — Aplicación

- [ ] `docker compose ps` → 4 contenedores en *Up*.
- [ ] Backend inicia correctamente (logs sin errores; `alembic upgrade head` OK).
- [ ] Frontend funciona (carga en el navegador contra el nuevo `VITE_API_URL`).
- [ ] **Login** funciona (web y móvil).
- [ ] **Catálogo** funciona (Home, categorías, búsqueda, ofertas, novedades).
- [ ] **Productos muestran imágenes** (no hay marcadores rotos).
- [ ] **Carrito** funciona (agregar, actualizar cantidad, eliminar, validación de stock por variante).
- [ ] **Checkout** funciona (dirección, resumen con IVA, pago con RehniCoin, se crea el pedido, se descuenta stock y saldo).
- [ ] **No existen errores críticos** (sin 5xx no controlados, sin pantallas en blanco).
- [ ] Suite de pruebas del backend pasa: `docker exec rehni-backend sh -c 'cd /app && uv run --group dev pytest -q'`.

---

## 12. Pruebas de restauración

**[PROPUESTO]** — *"decir que se hizo un backup" no es suficiente*: hay que **crear**, **restaurar**, **validar** y **registrar el resultado**. Se recomienda ejecutar esta prueba **mensualmente** y **siempre** tras un cambio de esquema o de infraestructura, en un **ambiente aislado** (`docker compose -p rehni-restore …`), **sin tocar producción**.

### 12.1 Procedimiento

| Paso | Acción | Referencia | Resultado esperado |
|---|---|---|---|
| 1 | Crear backup de PostgreSQL | §7.1 | Archivo `.dump` + `.sha256` |
| 2 | Crear backup de MinIO | §7.2 | Directorio + `.tar.gz` + `.sha256` |
| 3 | Validar ambos backups | `sha256sum -c` · `pg_restore -l` · `find | wc -l` | Hashes OK; TOC legible; conteo = *bucket* vivo |
| 4 | Levantar ambiente limpio | `docker compose -p rehni-restore up -d postgres minio` | Contenedores `rehni-restore-*` en *Up* |
| 5 | Restaurar PostgreSQL en el ambiente limpio | §9.2 (apuntando al proyecto `rehni-restore`) | `pg_restore` sin error |
| 6 | Restaurar MinIO en el ambiente limpio | §9.3 | `mc mirror` sin error |
| 7 | Levantar backend + frontend | `docker compose -p rehni-restore up -d backend frontend` | `alembic current` = `a1b2c3d4e5f6` |
| 8 | Verificar datos | §11.1 comparado con el origen | Conteos coinciden |
| 9 | Verificar imágenes y archivos | Abrir 5 productos + 1 anuncio + 1 perfil de empresa | Todas las imágenes cargan |
| 10 | Comprobar referencias PG↔MinIO | §12.2 | 0 objetos faltantes |
| 11 | Login + flujo de compra | Manual | Sesión OK; pedido creado; stock/saldo descontados |
| 12 | Suite `pytest` | `docker exec rehni-restore-backend … pytest -q` | Todas pasan |
| 13 | Registrar el resultado (tabla §12.3) y **destruir el ambiente** | `docker compose -p rehni-restore down -v` | Sin residuos |

### 12.2 Comprobación de referencias PG ↔ MinIO

Extraer de PostgreSQL todas las rutas de objeto referenciadas y comprobar que cada una existe en MinIO.

**Paso 1 — Exportar las referencias:**

```bash
docker exec rehni-postgres psql -U rehnieyal -d rehnimarket -At -c "
  SELECT url                       FROM product_images
  UNION ALL SELECT url             FROM product_variant_images
  UNION ALL SELECT image_url       FROM advertisements       WHERE image_url IS NOT NULL
  UNION ALL SELECT mobile_image_url FROM advertisements      WHERE mobile_image_url IS NOT NULL
  UNION ALL SELECT image_url       FROM catalog              WHERE image_url IS NOT NULL
  UNION ALL SELECT url             FROM report_evidences
  UNION ALL SELECT \"CompanyLogo\"       FROM company        WHERE \"CompanyLogo\" IS NOT NULL
  UNION ALL SELECT \"CompanyBanner\"     FROM company        WHERE \"CompanyBanner\" IS NOT NULL
  UNION ALL SELECT \"CompanyCertificate\" FROM company       WHERE \"CompanyCertificate\" IS NOT NULL
  UNION ALL SELECT 'uploads/' || \"profileImagen\" FROM users WHERE \"profileImagen\" IS NOT NULL;
" > /tmp/pg_refs.txt
wc -l /tmp/pg_refs.txt
```

> Nota: la mayoría de las columnas guardan la ruta con el prefijo `uploads/`; **`users.profileImagen` va sin prefijo**, por eso se le antepone en la consulta. Verificar los nombres reales de columna con `\d company` y `\d catalog` si el esquema cambió.

**Paso 2 — Comprobar cada objeto en MinIO:**

```bash
missing=0
while read -r ref; do
  key="${ref#uploads/}"
  docker exec rehni-minio sh -c \
    "mc alias set local http://localhost:9000 \"\$MINIO_ROOT_USER\" \"\$MINIO_ROOT_PASSWORD\" >/dev/null && mc stat \"local/uploads/$key\" >/dev/null 2>&1" \
    || { echo "FALTA EN MINIO: $ref"; missing=$((missing+1)); }
done < /tmp/pg_refs.txt
echo "Objetos faltantes: $missing"     # esperado: 0
```

**Paso 3 (opcional) — Objetos huérfanos** (en MinIO sin referencia en PostgreSQL): no son un error de integridad, pero se pueden depurar. Comparar la lista de `mc ls --recursive local/uploads` contra `/tmp/pg_refs.txt`.

### 12.3 Tabla de evidencia de la prueba de restauración

**Ejecutada el 2026-08-31** con `scripts/backup_rehnimarket.sh --no-stop` +
`scripts/restore_rehnimarket.sh 2026-08-31_16-59`. Salida completa:
`evidencias/backup/backup.txt`, `evidencias/backup/restore.txt`,
`evidencias/backup/checksums.txt`, `evidencias/backup/contenido_dump.txt`.

Identificador del backup (`TS`): **`2026-08-31_16-59`**. Entorno aislado: contenedores
`rehni-restore-pg` + `rehni-restore-minio` (destruidos al terminar).

| Prueba | Resultado esperado | Resultado obtenido (2026-08-31) | Estado |
|---|---|---|---|
| Backup PostgreSQL creado y validado (`sha256sum -c`, `pg_restore -l`) | Archivo válido; TOC con las tablas esperadas | `.dump` de 220 KB; `sha256sum -c` → "La suma coincide"; `pg_restore -l` → **37 tablas** con datos en el TOC | ✅ APROBADO |
| Backup MinIO creado y validado (conteo de objetos, `sha256sum -c`) | Nº objetos = *bucket* vivo; hash correcto | `tar.gz` de 8,9 MB; **166 objetos**; `sha256sum -c` → "La suma coincide" | ✅ APROBADO |
| Ambiente de prueba levantado | Contenedores aislados *Up* | `rehni-restore-pg` (`postgres:17-alpine`) + `rehni-restore-minio` (`minio/minio:latest`) levantados en red propia | ✅ APROBADO |
| Restauración de PostgreSQL sin errores | `pg_restore` OK; `alembic_version` = `a1b2c3d4e5f6` | `pg_restore` completó (todas las FK creadas); `SELECT version_num FROM alembic_version` → **`a1b2c3d4e5f6`** | ✅ APROBADO |
| Restauración de MinIO sin errores | `mc mirror` OK | `mc mirror` transfirió 8,76 MiB; sin errores | ✅ APROBADO |
| Conteos de filas = origen | Coincidencia exacta | roles 4=4 · users 11=11 · company 6=6 · products 33=33 · product_variants 112=112 · orders 22=22 · order_items 30=30 · wallets 4=4 · wallet_transactions 26=26 | ✅ APROBADO |
| Conteo de objetos MinIO = origen | Coincidencia exacta | **166 = 166** | ✅ APROBADO |
| Extensiones + función de búsqueda | `pg_trgm`, `unaccent`; `rehni_search_norm('Audífonos')` = `audifonos` | `pg_trgm`, `plpgsql`, `unaccent` presentes; `rehni_search_norm('Audífonos')` → **`audifonos`** | ✅ APROBADO |
| Nº de tablas restauradas | 37 | **37** | ✅ APROBADO |
| Ambiente de prueba destruido | Sin residuos | `docker rm -f` de ambos contenedores + `docker network rm` → "entorno de restauración destruido" | ✅ APROBADO |
| Imágenes del catálogo cargan (`/media/proxy` → 200) en la app restaurada | 5/5 | **PENDIENTE** — requiere levantar un backend apuntando al entorno restaurado; los objetos están íntegros (166=166) pero no se montó la app completa sobre el entorno aislado. |
| Login + flujo de compra en el ambiente restaurado | Sesión OK; pedido creado | **PENDIENTE** — mismo motivo; el flujo de compra sobre datos reales está cubierto por `scripts/acceptance_smoke.sh` sobre el entorno principal (`evidencias/acceptance/`). |
| Suite `pytest` en el ambiente restaurado | Todas pasan | **N/A** — `pytest` usa su propia BD `rehnimarket_test`; la suite (113/113) se ejecutó sobre el entorno principal (`evidencias/tests/pytest.txt`). |

**Resultado global de la prueba de restauración: APROBADA.** Los datos y los objetos se
restauran íntegros y coincidiendo con el origen. Los 3 ítems marcados PENDIENTE requieren
montar la aplicación completa sobre el entorno aislado (paso adicional, no crítico para
demostrar que el backup es restaurable).

---

## 13. Riesgos de migración

**[PROPUESTO — evaluación cualitativa]**

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R-1 | **Pérdida de datos** durante la migración | Media | Alto | Origen intacto y en solo lectura hasta validar el destino (§10.1); backend detenido durante el backup; par PG+MinIO con el mismo `TS`. |
| R-2 | **Corrupción del backup** (transferencia truncada, disco defectuoso) | Media | Alto | `sha256sum` en origen y verificación en destino; `pg_restore -l`; retención de 7 backups para poder retroceder. |
| R-3 | **Falta de espacio** en origen o destino | Media | Medio | Verificación previa P-5/§4.4; compresión (`-Z 6`, `gzip`); limpiar backups fuera de retención antes de empezar. |
| R-4 | **Incompatibilidad de versiones** de PostgreSQL | Baja | Alto | `pg_dump` lógico (portable 17 → ≥ 17); usar `postgres:17-alpine` (misma imagen) en el destino; no usar copia física del volumen. |
| R-5 | **Incompatibilidad de versiones** de MinIO (copia física del volumen) | Baja | Medio | Método principal = `mc mirror` (lógico, independiente de versión). El `tar` del volumen solo como secundario. |
| R-6 | **Pérdida de objetos de MinIO** (se respalda solo PostgreSQL) | Media | Alto | Este plan trata MinIO con el mismo nivel que PostgreSQL; checklist §11.3; comprobación de referencias §12.2. |
| R-7 | **Credenciales incorrectas** en el destino (`.env` mal recreado) | Media | Medio | Recrear el `.env` desde `.env.example` + copia cifrada; verificación DB-8 / §11.4; probar `pg_isready` y `mc ls` antes de restaurar. |
| R-8 | **Errores de permisos** (Docker, volúmenes, archivos de backup) | Media | Medio | Usuario en grupo `docker`; `chmod 600/700` en `backups/`; ejecutar `mc`/`pg_dump` dentro de los contenedores (evita problemas de UID). |
| R-9 | **URLs de imágenes rotas tras migrar** (`build_media_url` con IP fija `192.168.40.25:8001`) | **Alta** | Alto | Corregir `build_media_url()` para usar `URL_BACKEND` **antes** de migrar (cambio de código, fuera de este plan) o, como *workaround*, ajustar esa constante con la nueva URL. Verificación §11.3 / §11.4. |
| R-10 | **Interrupción del servicio** más larga de lo previsto | Media | Medio | Ventana de mantenimiento comunicada; ensayar la migración en un ambiente de prueba primero (§12); RTO definido (§14). |
| R-11 | **Backup incompleto** (se respaldó con escrituras en curso) | Media | Alto | `docker compose stop backend` antes de respaldar; validar conteos (§11.1) contra el origen; `pg_restore -l`. |
| R-12 | **Desincronización PG↔MinIO** (backups de fechas distintas) | Media | Alto | Un solo `TS` para el par; restaurar siempre el par emparejado; §12.2. |
| R-13 | **`SECRET_KEY` reutilizada o de ejemplo** | Media | Medio | Generar `SECRET_KEY` nueva y aleatoria en el destino (§5.4). |
| R-14 | **Exposición de datos personales** en los backups | Media | Alto | Cifrado GPG de las copias externas; permisos restrictivos; no subir a Git; añadir patrones a `.gitignore` (§15.4). |

---

## 14. RPO y RTO

**[PROPUESTO — objetivos definidos para el proyecto, NO métricas medidas.]** RehniMarket **no tiene mediciones reales** de indisponibilidad ni de tiempo de recuperación. Los valores siguientes son **objetivos** razonables para un proyecto académico con datos pequeños y baja tasa de cambio; deben revalidarse cuando exista operación real.

| Indicador | Definición | Valor **objetivo/propuesto** | Justificación |
|---|---|---|---|
| **RPO** (Recovery Point Objective) | Máxima pérdida de datos aceptable (en tiempo) | **24 horas** | Backup **diario** de PostgreSQL y de MinIO. En el peor caso se pierde el trabajo del día en curso. Reducirlo a horas exigiría *WAL archiving* / réplica de PostgreSQL y sincronización continua de MinIO (fuera del alcance actual). |
| **RTO** (Recovery Time Objective) — servidor nuevo | Máximo tiempo aceptable para restaurar el servicio | **4 horas** | Provisionar servidor + Docker (~1 h) + restaurar PostgreSQL (~minutos, 10 MB) + restaurar MinIO (~minutos, ~9 MB) + levantar y validar (~1 h) + margen. |
| **RTO** — mismo servidor (solo pérdida de datos) | — | **≤ 1 hora** | Solo pasos 2–8 de §9.1. |

- **Valores medidos reales:** el ciclo backup + restauración del 2026-08-31 sobre el
  volumen actual (~10 MB BD + 8,9 MB objetos) tardó **< 1 minuto** el backup y
  **≈ 30 segundos** la restauración de datos en el entorno aislado (`evidencias/backup/`).
  Estos tiempos NO incluyen provisionar un servidor nuevo ni el transporte de la copia.
- **Condición para cumplir estos objetivos:** que los backups **existan, sean recientes,
  estén fuera del servidor principal y hayan pasado la prueba de restauración de §12**.
  A 2026-08-31: existe **un** backup y **ha pasado** la prueba de restauración; falta la
  **automatización** (agendar `scripts/backup_rehnimarket.sh`) y la **copia externa
  cifrada** para cumplir el RPO de 24 h de forma sostenida.

---

## 15. Automatización de backups

**[PARCIAL] Los scripts `scripts/backup_rehnimarket.sh` y `scripts/restore_rehnimarket.sh` YA EXISTEN y se ejecutaron una vez (§12.3). Lo que sigue PROPUESTO es AGENDARLOS (`cron`/`systemd`) y la copia externa cifrada — eso aún no está implementado.**

El proyecto **ya tiene los scripts** (`scripts/backup_rehnimarket.sh`, `scripts/restore_rehnimarket.sh`), pero **no tiene su automatización** (sin `cron`, sin `systemd timer`, sin servicio en `docker-compose.yml`). El paso pendiente es invocar el script existente por **`cron`** (o un *timer* de `systemd`) en el servidor que ejecuta los contenedores.

### 15.1 Esquema de la automatización

```
cron (02:00 diario)
   └─► scripts/backup_rehnimarket.sh
          1. TS=$(date -u +%Y-%m-%d_%H-%M)
          2. docker compose stop backend            # consistencia PG↔MinIO
          3. pg_dump -F c            → backups/postgres/rehni_market_postgres_${TS}.dump
          4. mc mirror local/uploads → backups/minio/rehni_market_minio_${TS}/  (+ .tar.gz)
          5. docker compose start backend
          6. sha256sum de cada artefacto
          7. pg_restore -l  (validación rápida del dump)
          8. cifrar (gpg) y copiar a la ubicación externa (rsync/rclone/scp)
          9. rotación: borrar backups > retención (7 diarias / 4 semanales / 3 mensuales)
         10. registrar en un log; si algún paso falla → notificar (correo/webhook) y salir != 0
```

### 15.2 Script de backup — YA CREADO en `scripts/backup_rehnimarket.sh`

> El script real del repositorio implementa: identificador `TS` común PG↔MinIO, `pg_dump -F c -Z 6`,
> validación con `pg_restore -l`, `mc mirror` del bucket, SHA-256 de cada artefacto, manifiesto
> y rotación (`KEEP_DAILY`). Lo que sigue es una versión de referencia con el añadido de
> **cifrado GPG + envío externo** (esa parte aún NO está en el script del repo):

```bash
#!/usr/bin/env bash
# scripts/backup_rehnimarket.sh   —   PROPUESTA, no implementado
set -Eeuo pipefail

PROJECT_DIR="/ruta/Rehni-Market"
BACKUP_DIR="${PROJECT_DIR}/backups"
EXTERNAL="usuario@host-externo:/respaldos/rehnimarket"   # o rclone remote
KEEP_DAILY=7
LOG="${BACKUP_DIR}/backup.log"

cd "$PROJECT_DIR"
TS="$(date -u +%Y-%m-%d_%H-%M)"
mkdir -p "${BACKUP_DIR}"/{postgres,minio}
exec >> "$LOG" 2>&1
echo "=== [$TS] inicio backup ==="

# 1) Congelar escrituras para un par PG↔MinIO consistente
docker compose stop backend

# 2) PostgreSQL (formato custom)
PG_OUT="${BACKUP_DIR}/postgres/rehni_market_postgres_${TS}.dump"
docker exec rehni-postgres sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c -Z 6' > "$PG_OUT"
sha256sum "$PG_OUT" > "${PG_OUT}.sha256"
docker exec -i rehni-postgres pg_restore -l < "$PG_OUT" > /dev/null   # validación rápida

# 3) MinIO (objetos)
MN_DIR="${BACKUP_DIR}/minio/rehni_market_minio_${TS}"
docker exec rehni-minio sh -c '
  mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null &&
  rm -rf /tmp/uploads_bk && mkdir -p /tmp/uploads_bk &&
  mc mirror --quiet local/uploads /tmp/uploads_bk'
mkdir -p "$MN_DIR"
docker cp rehni-minio:/tmp/uploads_bk/. "$MN_DIR"
docker exec rehni-minio rm -rf /tmp/uploads_bk
tar -C "$MN_DIR" -czf "${MN_DIR}.tar.gz" .
sha256sum "${MN_DIR}.tar.gz" > "${MN_DIR}.tar.gz.sha256"

# 4) Reanudar el servicio
docker compose start backend

# 5) Cifrar y enviar fuera del servidor (la passphrase se lee de un archivo con permisos 600,
#    NUNCA embebida en el script)
gpg --batch --yes --symmetric --cipher-algo AES256 \
    --passphrase-file /etc/rehnimarket/backup.pass \
    -o "${PG_OUT}.gpg" "$PG_OUT"
gpg --batch --yes --symmetric --cipher-algo AES256 \
    --passphrase-file /etc/rehnimarket/backup.pass \
    -o "${MN_DIR}.tar.gz.gpg" "${MN_DIR}.tar.gz"
rsync -avz "${PG_OUT}.gpg" "${MN_DIR}.tar.gz.gpg" "$EXTERNAL/"

# 6) Rotación (mantener solo las últimas KEEP_DAILY de cada tipo)
ls -1t "${BACKUP_DIR}"/postgres/rehni_market_postgres_*.dump | tail -n +$((KEEP_DAILY+1)) | xargs -r rm -f
ls -1dt "${BACKUP_DIR}"/minio/rehni_market_minio_*/          | tail -n +$((KEEP_DAILY+1)) | xargs -r rm -rf

echo "=== [$TS] backup OK ==="
```

Notas de seguridad del script:

- La **contraseña de cifrado NO se escribe en el script**: se lee de `/etc/rehnimarket/backup.pass` (`chmod 600`, propietario root u operador).
- Las credenciales de PostgreSQL y MinIO **no aparecen**: se leen dentro de cada contenedor.
- `set -Eeuo pipefail` + `exec >> LOG` para que un fallo aborte y quede registrado.

### 15.3 Programación con `cron` o `systemd` (referencia)

`crontab -e` del usuario operador:

```cron
# Backup diario de RehniMarket a las 02:00 UTC
0 2 * * *  /ruta/Rehni-Market/scripts/backup_rehnimarket.sh
```

O con `systemd` (`/etc/systemd/system/rehnimarket-backup.{service,timer}`):

```ini
# rehnimarket-backup.service
[Service]
Type=oneshot
ExecStart=/ruta/Rehni-Market/scripts/backup_rehnimarket.sh
User=operador

# rehnimarket-backup.timer
[Timer]
OnCalendar=*-*-* 02:00:00 UTC
Persistent=true
[Install]
WantedBy=timers.target
```

### 15.4 Rotación / eliminación de backups antiguos y verificación de errores

- **Rotación:** conservar 7 diarias + 4 semanales (p. ej. el backup del domingo) + 3 mensuales (el del día 1). Borrar el resto (ejemplo en el script §15.2).
- **Verificación de errores:** el script debe salir con código ≠ 0 ante cualquier fallo y **notificar** (correo/webhook). Un `cron` con `MAILTO=` o un *wrapper* con `curl` a un webhook basta.
- **Prueba de restauración mensual** ([§12](#12-pruebas-de-restauración)): la automatización **no** sustituye la prueba manual de restauración; un backup no verificado no cuenta.
- **Exclusión de Git / Docker** (acción recomendada, **este documento no la aplica**):
  - Añadir al `.gitignore`: `backups/`, `*.dump`, `*.sql`, `*.sql.gz`, `*.tar.gz`, `*.gpg`, `*.sha256`.
  - Añadir `backups/` al `RehniMarket-backend/.dockerignore` (el `Dockerfile` hace `COPY . .`).

---

## 16. Evidencias

**Evidencia YA generada el 2026-08-31** (`evidencias/`):

| Evidencia | Archivo real |
|---|---|
| Servicios en ejecución (`docker compose ps`, 4 *Up*) | `evidencias/deployment/01_docker_compose_ps.txt`, `02_compose_up.txt` |
| PostgreSQL funcionando (`/health/database` OK) | `evidencias/deployment/03_health_endpoints.txt` |
| `alembic current` = `a1b2c3d4e5f6 (head)` | `evidencias/deployment/08_alembic_current.txt` |
| Ejecución de `pg_dump` + `mc mirror` | `evidencias/backup/backup.txt` |
| Backup PostgreSQL + MinIO generados y verificados (SHA-256) | `evidencias/backup/checksums.txt`, `evidencias/backup/manifest.txt` |
| `pg_restore -l` (TOC del dump: 37 tablas) | `evidencias/backup/contenido_dump.txt` |
| Restauración en entorno aislado + validación (conteos, extensiones, Alembic, 166 objetos) | `evidencias/backup/restore.txt` |
| Tabla de prueba de restauración diligenciada | [§12.3](#123-tabla-de-evidencia-de-la-prueba-de-restauración) de este documento |
| Suite `pytest` del backend (113/113) | `evidencias/tests/pytest.txt` |
| Swagger `/docs` + `/openapi.json` (200) | `evidencias/deployment/03_health_endpoints.txt` |

---

Lista original de capturas para la sustentación (algunas ya cubiertas arriba; las
capturas de pantalla del navegador/consola siguen pendientes de tomar):

| # | Evidencia | Cómo obtenerla | Archivo sugerido |
|---|---|---|---|
| E-1 | Servicios en ejecución | `docker compose ps` | `evidencias/01_docker_compose_ps.png` |
| E-2 | PostgreSQL funcionando | `docker exec rehni-postgres pg_isready -U rehnieyal` + `GET /health/database` | `evidencias/02_postgres_ok.png` |
| E-3 | Ejecución de `pg_dump` | Terminal ejecutando el comando de §7.1 | `evidencias/03_pg_dump.png` |
| E-4 | Archivo de backup PostgreSQL generado | `ls -lh backups/postgres/` + `sha256sum -c` | `evidencias/04_backup_pg.png` |
| E-5 | Validación del backup | `pg_restore -l` mostrando el TOC | `evidencias/05_pg_restore_l.png` |
| E-6 | Consola / listado de MinIO | `docker exec rehni-minio mc ls --recursive local/uploads \| head` + `mc du local/uploads` | `evidencias/06_minio_ls.png` |
| E-7 | *Bucket(s)* de MinIO | `docker exec rehni-minio mc ls local/` (muestra `uploads/`) | `evidencias/07_minio_bucket.png` |
| E-8 | Objetos de MinIO por prefijo | `mc ls local/uploads/companies/` etc. | `evidencias/08_minio_objetos.png` |
| E-9 | Ejecución del backup de MinIO (`mc mirror`) | Terminal ejecutando §7.2 + `find backups/minio/... \| wc -l` | `evidencias/09_minio_backup.png` |
| E-10 | Restauración de PostgreSQL | Terminal ejecutando `pg_restore` (§9.2) sin errores | `evidencias/10_restore_pg.png` |
| E-11 | Restauración de MinIO | Terminal ejecutando `mc mirror` (§9.3) + verificación de conteo | `evidencias/11_restore_minio.png` |
| E-12 | Migración/verificación Alembic | `docker exec rehni-backend uv run alembic current` = `a1b2c3d4e5f6 (head)` | `evidencias/12_alembic_current.png` |
| E-13 | Conteos base vs. restaurados | Salida de §11.1 en origen y en destino, lado a lado | `evidencias/13_conteos.png` |
| E-14 | Comprobación de referencias PG↔MinIO | Salida de §12.2 → "Objetos faltantes: 0" | `evidencias/14_referencias.png` |
| E-15 | Aplicación funcionando tras restaurar | Catálogo con imágenes, detalle de producto, carrito, checkout | `evidencias/15_app_ok.png` |
| E-16 | Swagger de la API | `http://localhost:8001/docs` | `evidencias/16_swagger.png` |
| E-17 | Suite de pruebas del backend | `docker exec rehni-backend … pytest -q` (resumen final) | `evidencias/17_pytest.txt` |
| E-18 | Tabla de prueba de restauración diligenciada | §12.3 completada y fechada | `evidencias/18_tabla_restauracion.pdf` |
| E-19 | (Si se implementa) log de la automatización | `backups/backup.log` con una ejecución exitosa | `evidencias/19_backup_log.png` |

> Para la **consola web de MinIO**: hoy **no está expuesta** en `docker-compose.yml`. Como evidencia equivalente se usa la salida de `mc` (E-6, E-7, E-8). Si se desea la consola gráfica, habría que publicar su puerto (cambio de configuración, fuera del alcance de este plan).

---

## 17. Conclusión

RehniMarket presenta una **arquitectura de datos clara y bien delimitada**: PostgreSQL 17 como fuente de la verdad relacional y MinIO (*bucket* `uploads`) como almacén de binarios, con una relación explícita (la base guarda rutas, MinIO guarda los archivos, servidos por `/media/proxy`). Las migraciones de esquema están **versionadas y controladas** con Alembic (10 revisiones, aplicación automática, base al día en `a1b2c3d4e5f6`). Las herramientas necesarias para respaldar y migrar —`pg_dump`/`pg_restore` y `mc`— **ya están disponibles dentro de los contenedores**, sin necesidad de instalar nada en el anfitrión.

**Actualización 2026-08-31:** el proyecto **ya tiene los scripts de backup/restauración y se ejecutó un ciclo completo verificado** (§12.3, `evidencias/backup/`). Lo que sigue PENDIENTE es la **automatización** (agendado + copia externa cifrada). Este plan cubre ambas cosas:

- Define un **procedimiento de migración reproducible** (capítulos 4–6) que preserva datos, archivos e **integridad referencial PG↔MinIO**, con validaciones concretas (capítulo 11) y comprobación de objetos faltantes (12.2).
- Define una **estrategia de backup coordinada** para PostgreSQL y MinIO (capítulo 7), con formato, nomenclatura (capítulo 8), frecuencia, retención y copia externa cifrada.
- Establece un **procedimiento de restauración** (capítulo 9), un **plan de contingencia y rollback** que no destruye el origen hasta validar el destino (capítulo 10), una **prueba de restauración** verificable (capítulo 12), un **registro de riesgos** con mitigaciones (capítulo 13), objetivos de **RPO (24 h) / RTO (4 h)** (capítulo 14) y una **guía de automatización** con `cron`/`systemd` y rotación (capítulo 15).

**Cómo reduce el riesgo en la puesta en producción:** al ejecutar este plan, una pérdida de la base de datos, del volumen de MinIO, del servidor completo o una migración fallida dejan de significar la pérdida del negocio: existe un procedimiento **probado** (ver §12.3) para volver a un estado consistente en un tiempo acotado, con los datos y las imágenes coincidiendo.

**Estado a 2026-08-31:**
- **HECHO:** los scripts `scripts/backup_rehnimarket.sh` y `scripts/restore_rehnimarket.sh` existen, se ejecutó **un** backup real y **una** prueba de restauración verificada (`evidencias/backup/`).
- **PENDIENTE (requiere el servidor de producción):** agendar el script (`cron`/`systemd`), **guardar las copias fuera del servidor** (cifradas con GPG) y **repetir la prueba de restauración de forma periódica** dejando su evidencia. Estos tres pasos no se pueden completar sin un entorno de operación real y son decisión de despliegue.

---

### Anexo — Diferencias detectadas entre la implementación real y la documentación previa / configuración a corregir

| # | Hallazgo | Impacto en la migración | Recomendación |
|---|---|---|---|
| A-1 | `build_media_url()` (`app/services/NasService.py`) devuelve URLs con **IP fija** `192.168.40.25:8001`, ignorando `URL_BACKEND` | **Alto:** tras migrar, las imágenes apuntarían a la IP antigua (R-9) | Construir la URL desde `config.URL_BACKEND` (cambio de código, fuera de este plan) |
| A-2 | `users.profileImagen` se guarda **sin** el prefijo `uploads/`; el resto de columnas de imagen **sí** lo llevan | La comprobación de referencias (§12.2) debe tratar ese caso aparte (ya contemplado) | Normalizar el formato de ruta (cambio de código + migración de datos) |
| A-3 | `.gitignore` y `.dockerignore` **no** excluyen `backups/`, `*.dump`, `*.tar.gz`, `*.gpg` | Riesgo de versionar datos personales / meter backups en la imagen | Añadir los patrones (§15.4) |
| A-4 | Sin `healthcheck` para `postgres` y `minio` en `docker-compose.yml` | Docker no detecta un servicio degradado antes/después de restaurar | Añadir `healthcheck` (`pg_isready`; petición HTTP a MinIO) |
| A-5 | MinIO sin TLS (`secure=False`) y con **credenciales root** como credenciales de aplicación | Menor seguridad para el tráfico y los backups | Servir MinIO tras TLS; crear un usuario/política de MinIO limitado al *bucket* `uploads` |
| A-6 | `SECRET_KEY` de ejemplo trivial en `.env.example` (`super_clave_secreta`) | JWT firmados con clave conocida si se copia sin cambiar | Generar `SECRET_KEY` aleatoria por entorno (paso ya incluido en §5.4) |
| A-7 | Solo existe un `docker-compose.yml` orientado a **desarrollo** (`--reload`, *bind mounts*, puertos de BD/MinIO expuestos) | Migrar "tal cual" lleva configuración de desarrollo a producción | Definir un `docker-compose.prod.yml` endurecido (ver `docs/INFORME_CALIDAD_REHNIMARKET.md` §13) |
| A-8 | Volúmenes huérfanos `rehnimarket-backend_postgres_data` / `rehnimarket-backend_minio_data` de una configuración anterior | Confusión sobre cuál volumen respaldar | Confirmar que los volúmenes activos son `rehni-market_*` (hecho en §2) y eliminar los huérfanos cuando se verifique que no tienen datos útiles |

---

*Fin del Plan de Migración de Datos — RehniMarket.*
