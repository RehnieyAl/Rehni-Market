# Changelog

Cambios importantes de RehniMarket (backend, frontend web e infraestructura de
despliegue). Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y versionado [SemVer](https://semver.org/lang/es/) (criterio en la sección 5.1 del plan de
implantación). El detalle histórico del backend sigue en
[`RehniMarket-backend/CHANGELOG.md`](RehniMarket-backend/CHANGELOG.md).

---

## [1.0.0] - <!-- PENDIENTE: fecha de la etiqueta v1.0.0 (la crea el responsable) -->

Primera versión liberada del conjunto. Es la que cubre el plan de implantación
(`docs/plan de implantacion - Rehnimarket/`).

### Incluye

- **Comercio** (README, «Funcionalidades»): catálogo público con búsqueda, filtros y
  orden; secciones de Ofertas y Novedades; productos con variantes; favoritos y carrito;
  checkout con RehniCoin e IVA; seguimiento de pedidos y transportadoras; cancelación con
  reembolso automático e idempotente; devoluciones por ítem; reseñas.
- **Gestión y finanzas**: paneles de empresa y de administración, billetera RehniCoin,
  recargas gestionadas por administración, liquidaciones a empresas, anuncios del Home,
  reportes de contenido y registro de empresas con validación de NIT y certificado.
- **Seguridad**: JWT con refresh tokens, verificación de correo por código, recuperación
  de contraseña, permisos por rol validados contra la BD, rate limiting y CORS
  configurables.
- **Esquema de base de datos**: 16 migraciones de Alembic, `head` `c3e5a7f9d1b2`
  (clasificación en la sección 5.2 del plan).

### Componentes (versiones verificadas el 04/11/2026)

| Componente | Versión |
|---|---|
| PostgreSQL (`postgres:17-alpine`) | 17.10 |
| PgBouncer (`edoburu/pgbouncer:latest`) | 1.26.0 |
| MinIO (`cgr.dev/chainguard/minio`, fijado por digest) | RELEASE.2026-10-23T20-06-51Z |
| Caddy (`caddy:2.11-alpine`) | v2.11.7 |
| Python / FastAPI / Uvicorn | 3.13.14 / 0.135.1 / 0.41.0 |
| React / Vite / TypeScript / Tailwind CSS | 19.2.7 / 8.1.0 / 6.0.3 / 4.3.2 |

### Infraestructura de despliegue

- **Un único `docker-compose.yml` y un único `caddy/Caddyfile`** para desarrollo, pruebas y
  producción; entre entornos solo cambia el `.env` de la raíz (`.env.example` y
  `deploy/env.prod.example`, explicado en `deploy/README.md`).
  - HTTPS automático en Caddy: CA local con `localhost` / `api.localhost` (valores por
    defecto), Let's Encrypt con un dominio público; HTTP redirige a HTTPS. Puertos
    `HTTP_PORT` / `HTTPS_PORT` (80/443) y volúmenes `caddy_data` y `caddy_config`.
    `CADDY_LOCAL_CERTS=local_certs` fuerza la CA local (prueba de la semana 3).
  - Desarrollo con `docker compose watch` (`develop.watch`): el backend se sincroniza y
    reinicia, el frontend se reconstruye.
  - PostgreSQL publicado solo en `127.0.0.1:${POSTGRES_PORT:-5433}`, también en producción.
  - Postgres de pytest como servicio `postgres-test` con `profiles: ["test"]`.
  - MinIO con la imagen de Chainguard (`minio/minio` ya no se puede descargar).
  - Se eliminan `docker-compose.dev.yml`, `docker-compose.override.yml`,
    `docker-compose.test.yml`, `docker-compose.tls-local.yml`, `caddy/Caddyfile.tls-internal`,
    `deploy/Caddyfile`, `deploy/compose.prod.yaml` y `RehniMarket-frontend/Dockerfile.dev`.
- `scripts/respaldar.sh`: envoltorio de `backup_rehnimarket.sh` con el nombre del plan.
- `scripts/smoke-test.sh`: prueba de humo solo por HTTP contra `BASE_URL` (VM, servidor
  o nube): salud, catálogo, ruta protegida, login fallido con `example.com` y login más
  `/auth/me` con una cuenta de prueba (`SMOKE_EMAIL` y `SMOKE_PASSWORD` por el entorno).
  No usa `docker exec`, no registra usuarios y no envía correos.
- `scripts/verificar-requisitos.sh`: umbrales por defecto para Ubuntu Server 24.04 LTS y
  los puertos 80, 443 y 8000.
- `RehniMarket-frontend/package.json`: `packageManager: pnpm@11.15.0`, la misma versión que
  el CI y el Dockerfile.

### Al actualizar

Desde una instalación con los compose anteriores (`docker-compose.override.yml`,
`deploy/compose.prod.yaml`, Caddy solo HTTP en `:8080`):

1. **`.env` de la raíz**: quitar `FRONTEND_PORT`, `FRONTEND_HTTPS_PORT`, `ACME_EMAIL` y
   `CADDY_TLS`. En local: `VITE_API_URL=https://api.localhost` y
   `CORS_EXTRA_ORIGINS=https://localhost`. En el servidor: partir de
   `deploy/env.prod.example`.
2. **Volumen de MinIO creado por `minio/minio`** (archivos de `root`): la imagen de
   Chainguard corre como `65532` y no arranca (`file access denied`). Una vez:
   `docker compose stop minio` y
   `docker run --rm -v rehni-market_minio_data:/data alpine chown -R 65532:65532 /data`.
3. `docker compose up -d --build --wait` (sin `-f`).
4. En local, confiar en la raíz de Caddy para que el navegador no avise
   (`caddy/readme.md`, 6.7.1). Las líneas `rehnimarket` de `/etc/hosts` ya no hacen falta.
5. El Postgres de pruebas pasa al proyecto principal:
   `docker compose --profile test up -d --wait postgres-test` (mismo puerto `55433`).

### Corregido

- `scripts/restore_rehnimarket.sh --verify-only`: la espera del PostgreSQL desechable se
  hace por TCP (`pg_isready -h 127.0.0.1`). Antes fallaba con «PostgreSQL desechable no
  arranco» cuando el servidor temporal de `initdb` se reiniciaba.
