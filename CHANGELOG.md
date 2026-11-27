# Changelog

Cambios importantes de RehniMarket (backend, frontend web e infraestructura de
despliegue). Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y versionado [SemVer](https://semver.org/lang/es/) (criterio en la sección 5.1 del plan de
implantación). El detalle histórico del backend sigue en
[`RehniMarket-backend/CHANGELOG.md`](RehniMarket-backend/CHANGELOG.md).

---

## [Unreleased]

### Added

- Seguir tiendas: botón "Seguir tienda"/"Siguiendo" y contador real de seguidores en el perfil público
  (solo compradores; el visitante va al login). Endpoints y migración en el CHANGELOG del backend.
- Ofertas con búsqueda, filtro por categoría, orden (mayor descuento, recientes, precio) y 8/12/24 por
  página, sobre `/public/products` con `discount` e `in_stock` (sin endpoints nuevos).
- Catálogo de bancos administrable (pestaña "Bancos" dentro de Catálogo en el panel de administración):
  registro con logo y vista previa, edición y activación. Las empresas eligen el banco del catálogo al
  registrar sus cuentas. Detalle en el CHANGELOG del backend.
- Reclamaciones de devolución de punta a punta: el comprador sigue sus reclamaciones en "Mis
  devoluciones" y pide una revisión (una vez) de un rechazo; la empresa aprueba o rechaza con asunto,
  explicación y confirmación explícita; el administrador/owner lista, toma el caso, contacta a la
  empresa por correo, registra llamadas y decide. Historial por reclamación (`return_request_events`) y
  correos con registro transaccional (`return_notifications`, reintento sin duplicados). Contacto
  empresarial (correo y teléfono) en "Mi tienda". Migración `e9a1b3c5d7f2`.
- Contacto institucional (correo y teléfono) de Rehni Market en PostgreSQL (`platform_settings`), editable
  solo por el owner en el nuevo apartado "Configuración de la página web"; lo publicado aparece en el pie
  de la web y de los correos. Migración `f1c3e5a7b9d2`.
- Reenvío del código de recuperación de contraseña y componente común "¿No recibiste el código?" para
  verificación de comprador, de empresa y recuperación (contador del backend, 429 con `Retry-After`).
- Paneles de administración/propietario y comprador según `RehniMarket-frontend/design/dashboard-administrador-propietario/`
  y el lenguaje del panel de empresa: cabeceras con icono, métricas con icono y tono, filtros en píldoras,
  secciones con descripción y pie de paginación. El comprador tiene un inicio nuevo (cuenta, métricas reales,
  accesos rápidos, pedidos recientes) y pedidos, devoluciones, favoritos, RehniCoin y direcciones rediseñados.
- RehniCoin del comprador: "Solicitar recarga por WhatsApp" con el teléfono público institucional
  (`/public/platform-contact`), solo en formato internacional y con un mensaje fijo sin datos de la cuenta.
  Reemplaza el modal anterior que usaba `VITE_REHNIMARKET_WHATSAPP` y enviaba nombre y correo en la URL.

### Fixed

- Seguridad de los códigos: la recuperación de contraseña ya no revela si una cuenta existe; códigos con
  `secrets`; máximo 5 intentos por código; cooldown de 60 s y topes por correo, cuenta e IP; reenvíos
  simultáneos generan un solo código y el correo sale solo después del commit.
- Correos: diseño oscuro tonal común, una columna fluida (sin desborde de 320 a 1440 px), sin fotografías de
  productos, parte `text/plain`, `Date` y `Message-ID` propios. Diagnóstico en
  `docs/runbooks/entregabilidad-correo.md`.
- Devoluciones: un solo reembolso en RehniCoin por reclamación aunque lleguen aprobaciones simultáneas
  de empresa y administración (fila bloqueada + `wallet_transactions.return_request_id` con índice
  único); se reembolsa el IVA cobrado en el pedido (`order_items.tax_amount`) y no el del producto
  actual; una solicitud duplicada simultánea responde 409 en lugar de 500.
- Liquidaciones: los reembolsos de devoluciones se descuentan de las ventas (y de la comisión) en la
  liquidación siguiente, una sola vez y sin modificar las liquidaciones ya generadas (H-08, #37).

### Changed

- Configuración de Docker: el backend arranca con `uv run --no-sync` y sin el volumen `backend_venv`
  (antes instalaba el grupo `dev` y descargaba de PyPI en cada arranque); PgBouncer y uv fijados por
  versión; el build del frontend exige el lockfile; se quitan del `environment` del backend
  `DOCS_ENABLED` y `CORS_EXTRA_ORIGINS`, que ya llegan por `env_file` con el mismo valor por defecto.
- Rediseño según `RehniMarket-frontend/design/`: perfil público de empresa, detalle de producto
  (galería con `scrollend`, "Guardar" en favoritos, relacionados deslizables en móvil), Explorar
  categorías y Ofertas. Tarjeta de producto con un solo enlace al detalle (sin botones dentro del `<a>`).
- Inicio del panel de empresa según `design/Panel Empresa RehniMarket en modo oscuro.png`: cabecera
  compacta con el banner de fondo, métricas reales, acciones rápidas ("Crear producto" abre el alta con
  `?tab=products&new=1`), pedidos y productos recientes. Sin gráfico de ventas: no hay endpoint con la
  serie diaria. Navegación lateral con la sección activa en rojo; `StatCard` oscura para todos los paneles.
- Perfil público según `design/perfil de empresa.png`: banner en franja compacta, tarjetas de producto
  oscuras y compactas (sin el nombre de la tienda, carrito como icono) y tarjeta lateral con calificación.
  Las fotos de producto ya no llevan placa blanca. Piezas compartidas: `CompanyAvatar`,
  `CompanyVerificationBadge`, `CompanyBanner` (franja o fondo) y `DashboardSection`.
- "Mi tienda" pasa a ser un modal (desde "Editar perfil" y "Configurar mi tienda") con tres secciones:
  imagen, información y certificado de la empresa. Sale del menú lateral y se elimina la sección
  "Información del representante" (sus datos se gestionan solo en Configuración de cuenta). Avisa antes
  de cerrar con cambios sin guardar.
- Plantillas nuevas de banner (1600 × 420 y 1080 × 540 para móvil) y logo (600 × 600) de empresa.
- `AlertProvider` con `showAlert` estable: se corrigieron los 11 avisos `react-hooks/exhaustive-deps`
  y `lint:ci` pasa a `--max-warnings 0`.

- Dependabot restaurado (`.github/dependabot.yml`): semanal para uv, npm (web y móvil), github-actions y,
  como novedad, las imágenes de los `Dockerfile` y de `docker-compose.yml`. Menores y parches agrupados,
  mayores en PR aparte, máximo 5 PR abiertos por ecosistema, sin auto-merge. Se ignoran los saltos de
  versión de Python (fijada igual en Dockerfile, CI y `pyproject.toml`) y las versiones mayores de
  PostgreSQL (requieren migrar el volumen de datos).
- CI: job `mobile` en `ci.yml` (typecheck, `expo lint` y jest), para que los PR de la app móvil, incluidos
  los de Dependabot, también se prueben. El escaneo de SonarCloud se omite en los PR de Dependabot, que
  no reciben `SONAR_TOKEN`; sus pruebas siguen corriendo.

- Panel de empresa según `RehniMarket-frontend/design/dashboard-empresa/`: Productos, Pedidos,
  Devoluciones (con "Limpiar filtros"), Finanzas (resumen con liquidaciones recientes y cuentas
  bancarias, tabla de liquidaciones desplazable por teclado) y Configuración de cuenta (Perfil, Cuenta y
  Seguridad; el selector de foto es accesible por teclado). Cabecera, filtros y paginador compartidos en
  `shared/components/dashboard/`. Las cuentas bancarias muestran logo, `•••• últimos 4` y cuenta
  principal/secundaria; al editar no se expone el número completo.

### Fixed

- `ReportModal` liberaba solo las vistas previas del primer render: las URL `blob:` de las evidencias
  agregadas después quedaban sin liberar.
- Navbar de escritorio sin `aria-current="page"` en el enlace de la sección actual.

### Removed

- Frontend: `CategoriesBenefits.tsx` y `CategoriesHero.tsx` (sin uso / franja decorativa reemplazada),
  `example-banner.jpg` y `example-logo.webp` (copias de las plantillas anteriores), la copia local de
  los nombres de meses en `GeneratePayoutModal` (usa `payouts/utils/period.ts`) y las dependencias sin
  uso `react-device-detect` y `@types/react-router-dom`.


## [1.0.1] - 2026-11-16

Parche de seguridad: auditoría de dependencias (#45). Informe completo en
`docs/calidad/auditoria-dependencias-2026-11-16.md`.

### Seguridad

- **python-jose → PyJWT 2.15.1**: python-jose tenía una vulnerabilidad crítica sin versión corregida
  (GHSA-3qf3-8w2g-rqmx). El algoritmo queda fijo en `HS256` en el código (se elimina la variable
  `ALGORITHM` del `.env`) y los tokens emitidos con python-jose siguen siendo válidos: desplegar no
  cierra sesiones. Salen también `ecdsa`, `rsa`, `pyasn1` y `six`.
- Backend: `certifi` 2026.10.18 (crítica) y `dnspython` 2.9.2; en desarrollo, `filelock` 4.2.1.
- Frontend: `vite` 8.1.6, `vitest` 4.1.12 y `overrides` con la versión mínima corregida de `postcss`,
  `nanoid`, `source-map-js`, `follow-redirects`, `brace-expansion`, `undici`, `browserslist` y `zod`.
  `@tailwindcss/vite` y `tailwindcss` pasan a `devDependencies` y se quita `brace-expansion`, que no
  se usaba. Resultado: 0 avisos en el backend y en el frontend de producción.
- Excepción documentada: `minimatch` (desarrollo, moderada; el arreglo exige una versión mayor), con
  fecha de revisión en `.github/auditoria-excepciones.txt`.

### Corregido

- `POST /auth/refresh` respondía 500 con un refresh token vencido o sin `sub`; ahora responde 401.
- Un token sin `exp` o `sub`, o con un `sub` que no es UUID, se rechaza con 401.

### Prevención

- Job `auditoria` en el CI: `pip-audit` sobre `uv.lock` y `pnpm audit --prod --audit-level=high`.
- `.github/dependabot.yml`: actualizaciones semanales agrupadas de uv, npm (frontend y móvil) y
  github-actions.

### Al actualizar

- La variable `ALGORITHM` del `.env` ya no se lee; se puede borrar.
- `docker compose up -d --build --wait`: el backend instala PyJWT al arrancar (`uv run` sincroniza
  el entorno con `uv.lock`).

## [1.0.0] - 2026-11-16

Primera versión liberada del conjunto y primera en producción: Azure (VM Ubuntu 24.04 con
Docker Compose), en <https://rehnimarket.duckdns.org> y <https://apirehnimarket.duckdns.org>.
Es la que cubre el plan de implantación (`docs/plan-implantacion.md`).

### Cierre de la versión

- **CI con pruebas** en cada push y PR (`.github/workflows/ci.yml`: ruff, migraciones, pytest
  con umbral de cobertura y pruebas del frontend), además de SonarCloud.
- **Segmentación de redes**: `edge` (Caddy y backend) y `data` (backend, PgBouncer, PostgreSQL
  y MinIO); solo Caddy publica puertos hacia Internet (`scripts/verificar-redes.sh`).
- **Caddy con reintentos** hacia el backend (`lb_try_duration`) y health check a
  `/health/database`: un reinicio del backend ya no da 502 (#48).
- **`.env` único** con dos plantillas, `.env.example` (desarrollo) y `deploy/env.prod.example`
  (producción); Caddy solo recibe sus 5 variables.
- **Datos base siempre creados**: roles, catálogo y transportadoras se crean al arrancar aunque
  `RUN_SEED=false`; `RUN_SEED` queda para los datos de demostración (#53).
- **Un único owner** (#54): `users.is_owner` calculada por trigger, índice único parcial
  `uq_users_single_owner` y trigger que protege el rol owner; la API responde 403 a cualquier
  intento de asignar, quitar, editar o bloquear el rol owner, y el panel no lo ofrece. El owner
  se crea desde PostgreSQL con `deploy/sql/crear-owner.sql` según `deploy/OWNER.md`.
- **Despliegue en Azure** documentado en `deploy/README.md` y `deploy/checklist-azure.md`.

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
- **Esquema de base de datos**: 17 migraciones de Alembic, `head` `d7e3f1a9c5b2`
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
  - Caddy endurecido: snippet `(seguridad)` en los dos sitios (`nosniff`,
    `Referrer-Policy`, sin encabezado `Server`), HSTS de un año sin `includeSubDomains`
    solo en el frontend y `request_body max_size 26MiB` en la API (5 evidencias de 5 MB
    de `ReportService.py:24-25` + margen).
  - El backend solo acepta `X-Forwarded-For` de Caddy: IP fija `172.30.0.10` en la red
    `172.30.0.0/24` y `FORWARDED_ALLOW_IPS=172.30.0.10` (antes `172.16.0.0/12`, que
    incluía la pasarela de Docker y permitía falsear la IP desde el propio servidor).
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
5. Si el `.env` define `FORWARDED_ALLOW_IPS=172.16.0.0/12`, cambiarlo a `172.30.0.10`. La
   red del proyecto cambia de subred: `docker compose down` (sin `-v`) y
   `docker compose up -d --wait` la recrean; los volúmenes no se tocan.
6. El Postgres de pruebas pasa al proyecto principal:
   `docker compose --profile test up -d --wait postgres-test` (mismo puerto `55433`).

### Corregido

- `scripts/restore_rehnimarket.sh --verify-only`: la espera del PostgreSQL desechable se
  hace por TCP (`pg_isready -h 127.0.0.1`). Antes fallaba con «PostgreSQL desechable no
  arranco» cuando el servidor temporal de `initdb` se reiniciaba.
