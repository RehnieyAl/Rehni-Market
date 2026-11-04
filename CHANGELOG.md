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
| MinIO (fijado por digest) | RELEASE.2025-09-07T16-13-09Z |
| Caddy (`caddy:2.11-alpine`) | v2.11.7 |
| Python / FastAPI / Uvicorn | 3.13.14 / 0.135.1 / 0.41.0 |
| React / Vite / TypeScript / Tailwind CSS | 19.2.7 / 8.1.0 / 6.0.3 / 4.3.2 |

### Infraestructura de despliegue

- `deploy/`: `compose.prod.yaml` (override de producción), `Caddyfile` (HTTPS automático
  con Let's Encrypt) y `env.prod.example`.
- `caddy/Caddyfile.tls-internal` + `docker-compose.tls-local.yml`: prueba local de HTTPS
  con la CA interna de Caddy. La configuración por defecto (`caddy/Caddyfile`) sigue
  siendo solo HTTP.
- `scripts/respaldar.sh`: envoltorio de `backup_rehnimarket.sh` con el nombre del plan.
- `scripts/smoke-test.sh`: prueba de humo solo por HTTP contra `BASE_URL` (VM, servidor
  o nube): salud, catálogo, ruta protegida, login fallido con `example.com` y login más
  `/auth/me` con una cuenta de prueba (`SMOKE_EMAIL` y `SMOKE_PASSWORD` por el entorno).
  No usa `docker exec`, no registra usuarios y no envía correos.
- `scripts/verificar-requisitos.sh`: umbrales por defecto para Ubuntu Server 24.04 LTS y
  los puertos 8080 y 8000.

### Corregido

- `scripts/restore_rehnimarket.sh --verify-only`: la espera del PostgreSQL desechable se
  hace por TCP (`pg_isready -h 127.0.0.1`). Antes fallaba con «PostgreSQL desechable no
  arranco» cuando el servidor temporal de `initdb` se reiniciaba.
