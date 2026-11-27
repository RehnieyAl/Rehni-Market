# RehniMarket — Backend

API REST del marketplace **RehniMarket**. Concentra toda la lógica de negocio:
catálogo público, autenticación y autorización, carrito y checkout con pago en
**RehniCoin**, pedidos y envíos, reseñas, reportes, billetera, y los paneles de
**Empresa** y **Administrador / Owner**.

> **Nota histórica:** este backend nació con el nombre interno *"Lubix"*. El
> proyecto actual es **RehniMarket**; cualquier referencia previa a *Lubix* en el
> historial de commits o en documentos antiguos corresponde a esa etapa inicial.

---

## Stack (versiones reales del repositorio)

| Componente | Versión | Fuente |
|---|---|---|
| Python | **3.13** | `.python-version`, `pyproject.toml` (`requires-python = ">=3.13"`), imagen `python:3.13-slim` |
| FastAPI | **0.135.1** | `pyproject.toml` |
| Uvicorn | **0.41.0** | `pyproject.toml` |
| SQLAlchemy | **2.0.48** | `pyproject.toml` |
| Alembic | **1.18.4** | `pyproject.toml` |
| psycopg2-binary | **2.9.11** | `pyproject.toml` |
| Pydantic | **2.12.5** / pydantic-settings 2.13.1 | `pyproject.toml` |
| PyJWT | **2.15.1** (JWT HS256, algoritmo fijo en el código) | `pyproject.toml` |
| passlib | **1.7.4** (bcrypt) | `pyproject.toml` |
| minio (SDK) | **7.2.20** | `pyproject.toml` |
| Jinja2 | **3.1.6** (plantillas de correo) | `pyproject.toml` |
| PostgreSQL | **17** (`postgres:17-alpine`) | `docker-compose.yml` |
| MinIO | `minio/minio:latest` | `docker-compose.yml` |
| Gestor de dependencias | **uv** (Astral) — `uv.lock`, `uv sync --frozen` | `Dockerfile` |
| Pruebas (grupo `dev`) | `pytest` + `pytest-cov` | `pyproject.toml` |
| Auditoría de CVE (grupo `dev`) | `pip-audit` | `pyproject.toml`, `app/docs/AUDITORIA.md` |

## Estructura real (`RehniMarket-backend/`)

```text
app/
├── main.py                 # Entrypoint FastAPI (lifespan: ensure_bucket; seeds solo con RUN_SEED=true). 25 routers.
├── Config.py               # Carga de variables de entorno (python-dotenv)
├── core/                   # ErrorCodes (102 códigos), Exceptions (api_error), TaxConfig (IVA 19%), PayoutConfig (comisión 5%),
│                           # AuthDependencies (JWT + require_role por endpoint), dbconexion (engine, sesiones, Base)
├── middleware/             # CorsMiddleware (orígenes desde URL_FRONTEND), PublicBaseUrlMiddleware,
│                           # RateLimitMiddleware (activable con RATE_LIMIT_ENABLED)
├── models/                 # 28 módulos de modelo ORM (~36 tablas: Users, Company, Product, Variant, Order, Wallet, ...)
├── repository/             # Acceso a datos
├── routers/                # 25 routers REST (incluye seguimiento de empresas: /company-follows)
├── schemas/                # Esquemas Pydantic (auth, commerce, dashboard, public)
├── services/               # Lógica de negocio (auth, commerce, dashboard, email, variants, pricing, PayoutService)
│   ├── NasService.py       # Cliente MinIO + ensure_bucket() + build_media_url()
│   └── email/EmailService.py  # SMTP Gmail (smtp.gmail.com:587, STARTTLS)
└── utils/                  # Security (bcrypt), FileValidator, seed.py + seed_*.py, CheckNetwork, TestDatabase
alembic/versions/           # 19 migraciones en cadena lineal: 29fe206320ce -> ... -> c6e8a0b2d4f7 (head)
tests/                      # 33 archivos de pruebas (pytest + PostgreSQL real "rehnimarket_test")
```

## Migraciones (Alembic)

19 revisiones, cadena lineal, sin ramas:

```
29fe206320ce  (base)
  -> d72ef7fa597e   upgrade_table_product
  -> 048871b47f63   add_catalog_attributes
  -> a90540bebea    variant_combinations_and_discounts
  -> b6f8fd31fbe    backfill_legacy_to_attributes
  -> cb6d38ee0bd    order_item_attributes_snapshot
  -> d4e5f6a7b8c9   advertisement_drop_text_fields
  -> e7a1c9d24b30   shipping_carriers_and_order_shipping
  -> f2b7c4e91a05   product_applies_tax
  -> a1b2c3d4e5f6   product_search_fuzzy_trgm   (pg_trgm, unaccent, rehni_search_norm, índice GIN)
  -> c3d5e7f9a1b2   wallet_refund_idempotency_index
  -> e1f2a3b4c5d6   company_certificate_rejection_reason
  -> f7a2b9c1d3e4   return_requests
  -> a7c4e1f9b2d8   company_certificate_needs_update
  -> b8d1c4f7a2e9   wallet_recharge_correction
  -> c3e5a7f9d1b2   fk_indexes_hot_paths
  -> d7e3f1a9c5b2   single_owner
  -> b5d7f9a1c3e6   company_followers
  -> c6e8a0b2d4f7   shipping_carriers_created_at_not_null   (HEAD)
```

`alembic/env.py` toma la URL de `app.Config` (no de `alembic.ini`) y excluye de la comparación
el índice de expresión `ix_products_name_search_trgm` (solo existe en su migración), así
`alembic check` no reporta diferencias; el CI lo ejecuta tras `upgrade head`. Se aplica
automáticamente en el arranque del contenedor `backend`
(`uv run alembic upgrade head`).

---

## Despliegue con Docker (flujo soportado)

El stack completo se orquesta desde el **`docker-compose.yml` de la raíz del
repositorio** (servicios `minio`, `postgres`, `backend`, `frontend`). No se
ejecuta este backend de forma aislada.

> **Compose único (`../docker-compose.yml`)** para desarrollo, pruebas y producción:
> `uvicorn` sin `--reload`, frontend compilado servido por Caddy
> (`RehniMarket-frontend/Dockerfile`, `../caddy/Caddyfile`), `minio` sin puertos
> publicados, `postgres` solo en `127.0.0.1:5433`, backend en `${BACKEND_BIND}:8000`,
> MinIO fijado por digest. Caddy es el reverse proxy con HTTPS automático
> (`api.<dominio>` → backend, `<dominio>` → frontend; CA local con `localhost`,
> Let's Encrypt con dominio real). Entre entornos solo cambia el `.env` de la raíz
> (plantillas `../.env.example` para desarrollo y `../deploy/env.prod.example` para el servidor).
> **El proyecto NO se ha desplegado en producción** (falta servidor y
> dominio público).
>
> **Desarrollo:** `docker compose watch` copia `app/` y `alembic/` al contenedor y lo
> reinicia al guardar (sin `--reload`: no se combina con `--workers`). Para recarga
> inmediata, `uv run uvicorn app.main:app --reload` fuera de Docker (README raíz,
> «Desarrollo local»).

### 1. Clonar

```bash
git clone https://github.com/RehnieyAl/Rehni-Market.git
cd Rehni-Market
```

### 2. Variables de entorno

Toda la configuración (backend, PostgreSQL, PgBouncer, MinIO, Caddy y frontend) está en un
solo `.env` en la raíz del repo:

```bash
cp .env.example .env && chmod 600 .env
```

Los valores de `.env.example` sirven tal cual en desarrollo. En producción el `.env` sale de
`deploy/env.prod.example` (mismas variables) reemplazando cada `CAMBIAR_*`. Fuera de Docker (`uv run`, pytest),
`app/Config.py` lee ese mismo `.env` de la raíz; ahí `URL_DATABASE` debe apuntar a
`127.0.0.1:5433` en lugar de `postgres:5432`.

Reglas que hay que respetar al editarlo:

- `URL_DATABASE` y `URL_DATABASE_POOLED` llevan el mismo usuario, contraseña y base que
  `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB` (`@postgres:5432` y `@pgbouncer:6432`).
- `SECRET_KEY`: valor propio, largo y aleatorio en producción, **no** el de desarrollo.
- `URL_BACKEND` es la URL de la API **visible desde el navegador**; coincide con `VITE_API_URL`.

### 3. Construir y levantar

```bash
docker compose build
docker compose up -d
docker compose ps            # los 5 contenedores deben quedar "healthy"
```

Las migraciones se aplican solas en el arranque del backend. Comando del servicio
(`docker-compose.yml` por defecto):

```
sh -c "uv run --no-sync alembic upgrade head && exec uv run --no-sync uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers $UVICORN_WORKERS ..."
```

`--no-sync` usa el entorno que instaló el Dockerfile (`uv sync --frozen --no-dev`): el arranque
no descarga nada de PyPI ni instala el grupo `dev`. Un cambio en `pyproject.toml` o `uv.lock`
exige reconstruir la imagen (`docker compose up -d --build backend`).

El backend se publica en `${BACKEND_BIND:-127.0.0.1}:${BACKEND_PORT:-8000}` y, a
través de Caddy, en `https://api.localhost`.

### 4. Verificar

```bash
# API directa (sin Caddy)
curl http://127.0.0.1:8000/health/database        # {"Base de datos":"OK"}
curl http://127.0.0.1:8000/health/internet
xdg-open http://127.0.0.1:8000/docs               # Swagger UI (DOCS_ENABLED=true)

# A través de Caddy (HTTPS con la CA local; ver ../caddy/readme.md)
curl https://api.localhost/health/database
```

### 5. Datos iniciales (seed) — manuales

Ningún seed corre solo (`RUN_SEED=false` por defecto). Cada conjunto de datos es un seed
independiente e idempotente en `app/utils/seed_*.py`, y `app/utils/seed.py` los ejecuta en orden de
dependencias solo cuando se eligen:

```bash
docker compose exec backend uv run --no-sync python -m app.utils.seed --list
docker compose exec backend uv run --no-sync python -m app.utils.seed colores
docker compose exec backend uv run --no-sync python -m app.utils.seed categorias especificaciones
docker compose exec backend uv run --no-sync python -m app.utils.seed base   # roles, categorías, especificaciones, atributos, transportadoras
docker compose exec backend uv run --no-sync python -m app.utils.seed demo   # owner del .env, empresas y productos demo
```

Si falta una dependencia que no se eligió (p. ej. `atributos` sin categorías), no se ejecuta nada.
El seed `owner` nunca crea un segundo owner. `RUN_SEED=true` siembra `base` y `demo` al arrancar
(solo desarrollo). En una base nueva de producción: `bash scripts/datos-base.sh`.

**Imágenes de las demos.** `demo` no descarga fotos: genera un marcador PNG de 480 × 480 (fondo
claro con un círculo del color de la variante) y solo lo sube a MinIO si el objeto `seed/...` no
existe. Las bases sembradas antes del 2026-11-25 conservan el marcador anterior (un lienzo entero
del color, que en la tienda se ve como una foto vacía). Para regenerarlos es una operación de datos
aparte y manual: borrar del bucket `uploads` solo los objetos con prefijo `seed/` y volver a correr
`python -m app.utils.seed demo`; no toca imágenes subidas por empresas ni filas de la base.

---

## Pruebas

```bash
# dentro del contenedor (recomendado)
docker exec rehni-backend sh -c 'cd /app && uv run --group dev pytest -q'
```

`tests/conftest.py` crea automáticamente una base **`rehnimarket_test`** en el
mismo PostgreSQL, arma el esquema con `Base.metadata.create_all` (no con Alembic)
y replica las extensiones `pg_trgm` / `unaccent` y la función `rehni_search_norm`.
Las pruebas ejercitan la capa de servicio contra esa base real usando el
`TestClient` de FastAPI.

**Cobertura de las 7 áreas** (`tests/`): catálogo público + carrito + checkout
(incl. descuento atómico de stock y concurrencia), atributos de catálogo,
variantes, búsqueda difusa, ofertas y novedades, anuncios del Home, y resolución
de precios.

## Auditoría de dependencias

```bash
docker exec rehni-backend sh -c 'cd /app && uv run --group dev pip-audit'
```

Ver `app/docs/AUDITORIA.md` para el procedimiento completo.

---

## Documentación del proyecto

| Documento | Contenido |
|---|---|
| `app/docs/ARQUITECTURA-VARIANTES.md` | Modelo de variantes/atributos por categoría |
| `app/docs/AUDITORIA.md` | Procedimiento de auditoría de CVE con `pip-audit` |
| `CHANGELOG.md` | Historial de cambios |
