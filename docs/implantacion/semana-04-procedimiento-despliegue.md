# Entregable S04 — Procedimiento de Despliegue (Plan de Instalación v1)

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | 1 persona (responsable técnico) |
| Versión del plan | v1 |
| Versión del software cubierta | 1.0.1 (actualización desde 1.0.0) |
| Fecha | 2026-11-18 |
| Semana | 4 de 9 — Despliegue local y en la nube (CE-1, CE-5) |
| Guía del bootcamp | `bc-implantacion/bootcamp/week-04-despliegue_local_y_nube/3-proyecto/README.md`, plantilla `3-proyecto/starter/entregable-s04-procedimiento-despliegue.md`, rúbrica `rubrica-evaluacion.md` |
| Sección del plan consolidado | §5 (v1) de [`docs/plan-implantacion.md`](../plan-implantacion.md); reemplaza los pasos de la v0 de la [semana 2](semana-02-migracion-respaldo-instalacion.md) |
| Estado | Parcial: 9 `[PENDIENTE]` (2 se cierran con los comandos «b» y «c» en la VM) |

Decisión de la semana: el **servidor Linux** es la VM Ubuntu 24.04 de Azure, administrada por SSH
(§5.2), y la **nube** es Azure como proveedor IaaS (§5.3). No se usó Render ni Neon (§5.3). El clon
limpio en el equipo de desarrollo se presenta como evidencia de reproducibilidad, no como servidor.
Marcadores: `<ip-de-la-vm>`, `<usuario>`, `<correo>`; nunca valores reales de secretos.

---

## 5.1 Proceso de liberación

| Paso | Comando o acción | Resultado esperado |
|---|---|---|
| Pruebas en verde | CI del repositorio ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml): jobs `backend`, `frontend` y `auditoria`) sobre `main` | Todos los checks pasan. Runs de `main` en verde: [44023670196](https://github.com/RehnieyAl/Rehni-Market/actions/runs/44023670196) (05:22 UTC del 17/11, tras v1.0.1) y [44103349861](https://github.com/RehnieyAl/Rehni-Market/actions/runs/44103349861) |
| Notas de versión | Entrada `[X.Y.Z] - fecha` en [`CHANGELOG.md`](../../CHANGELOG.md) con su apartado «Al actualizar» | Entrada visible en `main` |
| Etiqueta | `git tag -a vX.Y.Z -m "RehniMarket X.Y.Z"` + `git push origin vX.Y.Z` | Etiqueta visible en GitHub |
| Release | `gh release create vX.Y.Z --generate-notes` | Release publicado con la lista de PR |
| Imagen | En la VM: `git checkout vX.Y.Z` y `docker compose build backend` / `frontend` | `docker image ls` lista `rehni-market-backend` y `rehni-market-frontend`. La imagen no lleva la versión en la etiqueta: la versión desplegada es la etiqueta de Git del checkout (`git describe --tags`). Publicar imágenes versionadas en GHCR es la brecha de la [semana 7](semana-07-pipeline-y-monitoreo.md) |

Aplicado de verdad:

| Versión | Commit | Release | Tipo SemVer y por qué |
|---|---|---|---|
| `v1.0.0` | [`4cd918e`](https://github.com/RehnieyAl/Rehni-Market/commit/4cd918e) | [v1.0.0 · Primera versión en producción](https://github.com/RehnieyAl/Rehni-Market/releases/tag/v1.0.0), 2026-11-17 01:24 UTC | Primera versión estable: fija el contrato de la API y el esquema (`head` `d7e3f1a9c5b2`) |
| `v1.0.1` | [`45ea99d`](https://github.com/RehnieyAl/Rehni-Market/commit/45ea99d) | [v1.0.1](https://github.com/RehnieyAl/Rehni-Market/releases/tag/v1.0.1), 2026-11-17 05:19 UTC | PATCH: parche de seguridad (python-jose → PyJWT y dependencias, [PR #58](https://github.com/RehnieyAl/Rehni-Market/pull/58)) sin cambiar contratos ni esquema |

Esquema de versiones y criterio SemVer del proyecto: `MAJOR.MINOR.PATCH`. MAJOR: cambio
incompatible de la API o migración no compatible hacia atrás; MINOR: funcionalidad nueva
compatible; PATCH: corrección sin cambio de contrato ni de esquema.

Enlace al `CHANGELOG.md`: [`CHANGELOG.md`](../../CHANGELOG.md) (raíz). El de 1.0.1 trae «Al
actualizar»: la variable `ALGORITHM` ya no se lee y `docker compose up -d --build --wait` instala
PyJWT.

## 5.2 Despliegue en servidor Linux

Servidor: VM Ubuntu Server 24.04.5 LTS de Azure (2 vCPU, 3,8 GiB, 29 GB; [semana 1](semana-01-ficha-tecnica.md), §1.5),
administrada por SSH con llave (`ssh rehni-azure`). Guía operativa con el mismo contenido en
prosa: [`deploy/README.md`](../../deploy/README.md); lista para marcar:
[`deploy/checklist-azure.md`](../../deploy/checklist-azure.md).

### Estructura

```
/home/rehnimarket/Rehni-Market/   ← ~/Rehni-Market: clon del repositorio, en la etiqueta desplegada
├── docker-compose.yml            ← el mismo que en desarrollo (compose único)
├── caddy/Caddyfile               ← el mismo; HTTPS con Let's Encrypt según el .env
├── deploy/
│   ├── README.md                 ← guía de producción
│   ├── env.prod.example          ← plantilla del .env de producción (sin secretos)
│   ├── checklist-azure.md        ← lista de verificación del despliegue
│   ├── OWNER.md                  ← crear y administrar el único owner
│   └── sql/crear-owner.sql
├── .env                          ← de deploy/env.prod.example; chmod 600; fuera de Git
├── backups/                      ← respaldos (copia 1; fuera de Git)
└── scripts/                      ← verificar-requisitos, respaldar, restore, smoke-test, verificar-redes
```

Los volúmenes (`postgres_data`, `minio_data`, `caddy_data`, `caddy_config`, `backend_venv`) los
gestiona Docker. El clon vive en el directorio del usuario de la VM y no en `/opt`: el usuario de
despliegue es dueño del clon y del `.env` sin `sudo`. Permisos y usuarios: [semana 6](semana-06-seguridad-y-respaldo.md), §7.1.

**Por qué no hay `deploy/compose.prod.yaml` ni `deploy/Caddyfile`.** El proyecto de la semana pide
una carpeta `deploy/` con `compose.prod.yaml`, configuración del proxy y `env.prod.example`. Aquí
hay **un solo compose y un solo Caddyfile** para todos los ambientes; lo que cambia (dominios,
puertos, emisor de certificados, interfaz de la API, CORS) son variables del `.env`, cuya plantilla
de producción es [`deploy/env.prod.example`](../../deploy/env.prod.example). Así no se mantienen dos
configuraciones y lo que se prueba en local es lo que corre en el servidor. [PENDIENTE: validar con el instructor que el compose único cumple el entregable `deploy/`].

### Variables de entorno

Solo nombres y ejemplos ficticios; los valores reales se crean en el servidor. **Un solo `.env`** en la raíz, con dos plantillas de las mismas variables: `.env.example`, con valores de desarrollo listos para usar (un clon limpio arranca con `cp .env.example .env`), y `deploy/env.prod.example`, con los de producción (`rehnimarket.duckdns.org`, `DOCS_ENABLED=false`, `RUN_SEED=false`) y un marcador `CAMBIAR_*` en cada secreto. `minio`, `postgres`, `pgbouncer` y `backend` cargan el `.env` completo (`env_file: ./.env` en `docker-compose.yml`); Caddy recibe solo sus variables (`SITE_ADDRESS`, `API_ADDRESS`, `HTTP_PORT`, `HTTPS_PORT`, `CADDY_LOCAL_CERTS`) para no tener las credenciales. Fuera de Docker (`uv run`, pytest), `app/Config.py` lee el mismo `.env` de la raíz.

**Secretos:** cada contraseña y la firma de los JWT (`POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, `SECRET_KEY`) se generan en el servidor con `openssl rand -base64 24 | tr '+/' '-_'`, un valor distinto por secreto y por entorno (nunca los de desarrollo). `tr` cambia `+` y `/` por caracteres seguros en la URL de conexión: la contraseña de PostgreSQL se repite dentro de `URL_DATABASE` y `URL_DATABASE_POOLED`. La excepción es `GMAIL_APP_PASSWORD`, que la emite Google (contraseña de aplicación). El backend arranca aunque quede un marcador `CAMBIAR_*`, así que antes del paso 6 hay que comprobar que no quedó ninguno: `grep -nE '^[A-Z_]+=.*CAMBIAR' .env` no debe mostrar nada.

| Archivo | Variable | Propósito | Ejemplo (ficticio) |
|---|---|---|---|
| `.env` | `SITE_ADDRESS` / `API_ADDRESS` | Dominios que sirve Caddy. Obligatorios en producción: sin ellos se usan los de desarrollo, `localhost` / `api.localhost` (`docker-compose.yml`). Con un dominio público Caddy pide los certificados a Let's Encrypt (sin correo ACME) | `<dominio>` / `api.<dominio>` |
| `.env` | `HTTP_PORT` / `HTTPS_PORT` | Puertos de Caddy en el host, iguales dentro del contenedor (`docker-compose.yml`). En producción 80 y 443: Let's Encrypt los necesita | `80` / `443` |
| `.env` | `CADDY_LOCAL_CERTS` | `local_certs` fuerza la CA local de Caddy (solo la prueba local de la [semana 3](semana-03-hosting-y-dominio.md), §4.5). **En producción, vacía** | (vacía) |
| `.env` (opcional) | `POSTGRES_BIND` / `POSTGRES_PORT` | Interfaz y puerto donde se publica PostgreSQL (`docker-compose.yml`; por defecto `127.0.0.1` / `5433`). **Nunca `0.0.0.0`**: en el servidor se administra con `docker compose exec postgres psql …` o por túnel SSH (sección PostgreSQL de `.env.example`) | `127.0.0.1` / `5433` |
| `.env` | `BACKEND_BIND` / `BACKEND_PORT` | Interfaz y puerto del host donde se publica la API (`docker-compose.yml`; por defecto `127.0.0.1` / `8000`) | `127.0.0.1` / `8000` |
| `.env` | `VITE_API_URL` | URL de la API dentro del build del frontend (pública) | `https://api.<dominio>` |
| `.env` | `VITE_REHNIMARKET_WHATSAPP` | Número de contacto mostrado en el frontend (público) | `+57**********` |
| `.env` | `DOCS_ENABLED` | Swagger en `/docs` | `false` |
| `.env` | `CORS_EXTRA_ORIGINS` | Orígenes permitidos por CORS, separados por comas | `https://<dominio>` |
| `.env` (opcional) | `BACKEND_CPUS` / `POSTGRES_CPUS` | Límite de CPU de los contenedores `backend` y `postgres` (por defecto `4` y `3`). Docker no crea un contenedor cuyo límite supere los núcleos del servidor: en una VM de 2 vCPU (p. ej. Azure `Standard_B2s`) usar `2` y `1.5` | `2` / `1.5` |
| `.env` (opcional) | `UVICORN_WORKERS` | Procesos de Uvicorn del backend (`docker-compose.yml`, por defecto `3`; `--workers` en `:197`). `app/Config.py` lo valida entre 1 y 16 | `3` |
| `.env` | `FORWARDED_ALLOW_IPS` | Proxy del que Uvicorn acepta `X-Forwarded-For` para ver la IP real del cliente, con la que cuenta el rate limit: **solo Caddy**, con IP fija `172.30.0.10` (`docker-compose.yml`, servicio `frontend` y red `edge` `172.30.0.0/24`; `--forwarded-allow-ips` en el `command` del backend). Un rango como `172.16.0.0/12` incluiría la pasarela de Docker (`172.30.0.1`), por la que entra todo lo que llega al `:8000` desde el propio servidor: cualquier proceso del servidor podría falsear su IP (comprobado el 04/11/2026, sección 4.5) | `172.30.0.10` |
| `.env` (opcional) | `PGBOUNCER_MAX_CLIENT_CONN` | Clientes que acepta PgBouncer (`docker-compose.yml`) y que el backend usa para validar su presupuesto (`:196`). Por defecto `1200` en compose (`200` en `app/Config.py`, fuera de compose). Debe ser ≥ (`DB_POOL_SIZE` + `DB_MAX_OVERFLOW`) × `UVICORN_WORKERS` = 150 con los valores por defecto, o el backend no arranca (`app/Config.py`) | `1200` |
| `.env` | `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciales de PostgreSQL (también las lee PgBouncer). La contraseña se genera en el servidor (ver «Secretos») | `rehni_app` / `<generada>` / `rehnimarket` |
| `.env` | `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | Credenciales de MinIO (también las lee el backend). La contraseña se genera en el servidor (ver «Secretos») | `rehni_minio` / `<generada>` |
| `.env` | `URL_DATABASE` | Conexión directa a PostgreSQL (la usa Alembic); la contraseña es `POSTGRES_PASSWORD` | `postgresql://rehni_app:<generada>@postgres:5432/rehnimarket` |
| `.env` | `URL_DATABASE_POOLED` | Conexión de la app en tiempo de ejecución a través de PgBouncer (`app/database/Connection.py`). Si no se define, usa `URL_DATABASE` (`app/Config.py`) y se salta PgBouncer. Misma contraseña que `URL_DATABASE` En producción apunta a `pgbouncer:6432`: comprobado con `SELECT 1` por `URL_DATABASE_POOLED` ([verificación de redes del 17/11](../evidencias/verificacion-redes-produccion-2026-11-17.txt)) | `postgresql://rehni_app:<generada>@pgbouncer:6432/rehnimarket` |
| `.env` | `SECRET_KEY` / `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_DAYS` | Firma (HS256, fijo en el código desde v1.0.1) y vigencia de los JWT. `SECRET_KEY` se genera en el servidor (ver «Secretos») | `<generada>` / `HS256` / `30` / `15` (`.env.example`) |
| `.env` | `GMAIL_USERNAME` / `GMAIL_APP_PASSWORD` | Cuenta que envía los correos transaccionales. La contraseña de aplicación la emite Google; crear una propia para producción | `<cuenta>` / `<de Google>` |
| `.env` | `URL_FRONTEND` / `URL_BACKEND` | URL públicas para enlaces de correo e imágenes | `https://<dominio>` / `https://api.<dominio>` |
| `.env` | `MINIO_URL` | Dirección de MinIO dentro de la red de Docker | `minio:9000` |
| `.env` | `RATE_LIMIT_ENABLED` | Activa el límite de peticiones por IP (`app/main.py`; por defecto `false`, `app/Config.py`). **En producción, `true`** (`deploy/env.prod.example`) | `true` |
| `.env` (opcional) | `REQUEST_LIMIT` / `TIME_WINDOW` | Peticiones por IP permitidas dentro de una ventana de `TIME_WINDOW` segundos; al superarlas responde `429` (`app/Config.py`, por defecto `100` / `60`; `app/middleware/RateLimitMiddleware.py`). El contador es en memoria y por proceso: con `UVICORN_WORKERS=3`, una IP puede llegar a 3 × `REQUEST_LIMIT` | `100` / `60` |
| `.env` | `USER_NAME_ADMIN` / `ADMIN_DEFAULT` / `PASSWORD_DEFAULT` y `USER_NAME_OWNER` / `OWNER_DEFAULT` / `OWNER_PASSWORD_DEFAULT` | Cuentas iniciales de administrador y owner. Solo se usan con `RUN_SEED=true` (`app/main.py`); en producción quedan vacías, sin marcador, para que el seed no cree una cuenta con una contraseña conocida (`app/utils/seed.py`).  | `""` |
| `.env` | `RUN_SEED` | Carga de datos de ejemplo al arrancar | `false` |

`CADDY_TLS`, `ACME_EMAIL`, `FRONTEND_PORT` y `FRONTEND_HTTPS_PORT` ya no existen: ningún Caddyfile ni compose las lee.

### Instalación inicial

Comandos de Docker según la guía oficial (<https://docs.docker.com/engine/install/ubuntu/> y
<https://docs.docker.com/engine/install/linux-postinstall/>, consultadas el 04/11/2026). La VM y el
DNS se crean antes (§5.3 y [semana 3](semana-03-hosting-y-dominio.md)).

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | Entrar a la VM | `ssh rehni-azure` | Sesión del usuario administrador, sin contraseña (llave) |
| 2 | Actualizar el sistema y la zona horaria | `sudo apt update && sudo apt upgrade -y && sudo timedatectl set-timezone America/Bogota` | Sin errores |
| 3 | Instalar Docker Engine y Compose | Repositorio `apt` oficial de Docker y `sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin` | `sudo docker run hello-world` muestra el mensaje de prueba |
| 4 | Docker sin `sudo` | `sudo usermod -aG docker $USER` y volver a entrar | `docker run hello-world` sin `sudo`; `docker compose version` ≥ 2.24 |
| 5 | Swap para compilar | `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' \| sudo tee -a /etc/fstab` | `free -h` muestra 2,0 Gi de swap |
| 6 | Clonar en la versión | `git clone https://github.com/RehnieyAl/Rehni-Market.git ~/Rehni-Market && cd ~/Rehni-Market && git checkout v1.0.1` | `git describe --tags` = `v1.0.1` |
| 7 | Verificar requisitos | `PORTS="80 443" bash scripts/verificar-requisitos.sh` | Tabla de requisitos y código de salida ([semana 1](semana-01-ficha-tecnica.md), §1.7) |
| 8 | Crear la configuración | `cp deploy/env.prod.example .env && chmod 600 .env` y reemplazar cada `CAMBIAR_*` (o `scp` del `.env` preparado) | `ls -l .env` = `-rw-------`; `grep -nE '^[A-Z_]+=.*CAMBIAR' .env` no muestra nada; `git status` no lo muestra |
| 9 | Compilar las imágenes de una en una | `docker compose build backend && docker compose build frontend` | Dos imágenes sin error; juntas se quedan sin memoria en 2 vCPU / 4 GiB |
| 10 | Levantar | `docker compose up -d --wait` | Termina sin errores; el backend aplica `alembic upgrade head` |
| 11 | Comprobar la salud | `docker compose ps` | Cinco servicios `healthy`; solo `rehni-frontend` en `0.0.0.0` |
| 12 | Comprobar HTTPS | `curl -fsS https://apirehnimarket.duckdns.org/health/database` y `curl -s -o /dev/null -w "%{http_code}\n" https://rehnimarket.duckdns.org/` | `{"Base de datos":"OK"}` y `200` |
| 13 | Datos base y owner | Consulta de [`deploy/README.md`](../../deploy/README.md) §7 y [`deploy/OWNER.md`](../../deploy/OWNER.md) §3 con [`deploy/sql/crear-owner.sql`](../../deploy/sql/crear-owner.sql) | `4\|120\|4`, `INSERT 0 1`, el login responde `role: owner` |
| 14 | Prueba de humo | Comando «b» (abajo, en Evidencia) | `RESULTADO: 7 pasan, 0 fallan` |
| 15 | Primer respaldo | `bash scripts/respaldar.sh` | `=== FIN backup <TS> — OK ===` |

### Actualización

Aplicada en producción de `v1.0.0` a `v1.0.1` el 17/11/2026 ([release v1.0.1](https://github.com/RehnieyAl/Rehni-Market/releases/tag/v1.0.1)).

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | Respaldo previo | `bash scripts/respaldar.sh` | `=== FIN backup <TS> — OK ===`; anotar el `TS` |
| 2 | Revisar las migraciones nuevas | `git fetch --tags && git diff --stat <actual> <nueva> -- RehniMarket-backend/alembic/versions` | Lista vacía o migraciones clasificadas (tabla de abajo). De `v1.0.0` a `v1.0.1`: **vacía** (comprobado el 18/11/2026) |
| 3 | Leer «Al actualizar» del `CHANGELOG.md` | `git show <nueva>:CHANGELOG.md \| sed -n '/Al actualizar/,/^## /p'` | Cambios de `.env` que pide la versión |
| 4 | Cambiar de versión | `git checkout <nueva>` | `git describe --tags` = versión nueva |
| 5 | Compilar y levantar | `docker compose build backend && docker compose build frontend && docker compose up -d --wait` | Contenedores recreados, cinco `healthy` |
| 6 | Verificar | `curl -fsS https://apirehnimarket.duckdns.org/health/database` y `scripts/smoke-test.sh` | 200 y `7 pasan, 0 fallan` |

### Rollback

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | Decidir el tipo | Clasificación de las migraciones que trajo la versión | Todas compatibles (o ninguna): pasos 2-4. Alguna no compatible: pasos 5-6 |
| 2 | Variables que la versión anterior necesita | Comparar `deploy/env.prod.example` de las dos etiquetas. De `v1.0.1` a `v1.0.0`: `grep -q '^ALGORITHM=' .env \|\| echo 'ALGORITHM=HS256' >> .env` | `v1.0.0` lee `ALGORITHM` (`git show v1.0.0:RehniMarket-backend/app/Config.py`); sin ella el login falla. `v1.0.1` la ignora |
| 3 | Volver al código anterior | `git checkout <anterior>` | `git describe --tags` = versión anterior |
| 4 | Compilar, levantar y verificar | Pasos 5 y 6 de la actualización | Cinco `healthy`, humo sin fallos; el esquema queda en la revisión nueva, que la anterior tolera |
| 5 | Restaurar el respaldo previo | `bash scripts/restore_rehnimarket.sh <TS> --verify-only` y, si da `OK`, `bash scripts/restore_rehnimarket.sh <TS>` ([semana 2](semana-02-migracion-respaldo-instalacion.md), §3.4) | `OK: restore completo.` |
| 6 | Volver al código anterior | Pasos 3 y 4 | `docker compose exec backend uv run alembic current` igual al del respaldo |

No se usa `alembic downgrade`: `d4e5f6a7b8c9` recrearía vacías las columnas borradas y
`b6f8fd31fbe` borra todas las filas de `variant_options` y `product_attribute_values` al bajar.

Clasificación de migraciones (¿permiten rollback sin restaurar?). Cadena completa de
[`RehniMarket-backend/alembic/versions/`](../../RehniMarket-backend/alembic/versions/): 17
migraciones; `head` = `d7e3f1a9c5b2` (la de producción,
[`docs/evidencias/owner-unico-produccion-2026-11-17.txt`](../evidencias/owner-unico-produccion-2026-11-17.txt)).
«Compatible hacia atrás» = la versión anterior del backend sigue funcionando con el esquema nuevo.

| Migración | Cambio (según el código de `upgrade()`) | ¿Compatible hacia atrás? |
|---|---|---|
| `29fe206320ce` add tables | Esquema inicial: 30 tablas | No aplica (primera versión) |
| `d72ef7fa597e` upgrade table product | `upgrade()` vacío (`pass`) | Sí |
| `048871b47f63` add catalog attributes | 2 tablas nuevas + 2 índices | Sí |
| `a90540bebea` variant combinations and discounts | 3 tablas nuevas, columnas nuevas `nullable=True` en `products` y `product_variants`, 5 índices | Sí |
| `b6f8fd31fbe` backfill legacy to attributes | Solo datos: copia colores y especificaciones a las tablas de atributos. Su `downgrade()` borra todo `variant_options` y `product_attribute_values` | Sí (el código anterior no lee esas filas); su `downgrade` es destructivo |
| `cb6d38ee0bd` order item attributes snapshot | Columna `order_items.attributes_snapshot` `nullable=True` | Sí |
| `d4e5f6a7b8c9` advertisement drop text fields | `drop_column` de `title`, `description` y `button_text` en `advertisements` | **No**: la versión anterior espera esas columnas; volver exige restaurar el respaldo |
| `e7a1c9d24b30` shipping carriers | Tabla nueva `shipping_carriers` y columnas `nullable=True` en `orders` | Sí |
| `f2b7c4e91a05` product applies tax | Columna `products.applies_tax` `NOT NULL` con `server_default` | Sí (las inserciones antiguas reciben el valor por defecto) |
| `a1b2c3d4e5f6` product search fuzzy trgm | Extensiones `pg_trgm` y `unaccent`, función e índice GIN | Sí |
| `c3d5e7f9a1b2` wallet refund idempotency index | Índice único parcial | Sí, mientras no haya datos que lo violen |
| `e1f2a3b4c5d6` company certificate rejection reason | Columna `company.rejection_reason` `nullable=True` | Sí |
| `f7a2b9c1d3e4` return requests | Tabla nueva `return_requests` + 4 índices | Sí |
| `a7c4e1f9b2d8` company certificate needs update | `ALTER TYPE companycertificateenum ADD VALUE 'NEEDS_UPDATE'` | **Condicional**: si alguna empresa queda en `NEEDS_UPDATE`, la versión anterior no conoce ese valor del enum |
| `b8d1c4f7a2e9` wallet recharge correction | Columna `nullable=True` en `wallet_transactions` + FK + índice | Sí |
| `c3e5a7f9d1b2` fk indexes hot paths | Índice | Sí |
| `d7e3f1a9c5b2` single owner (#54) | Columna `users.is_owner` `NOT NULL` con `server_default false`, calculada por trigger; índice único parcial; trigger que protege el rol `owner` | Sí: la versión anterior no escribe la columna y el trigger la calcula. Llegó en `v1.0.0` |

Entre `v1.0.0` y `v1.0.1` no hay ninguna migración: el rollback entre las dos no exige restaurar.

### Evidencia

#### Prueba de humo ([`scripts/smoke-test.sh`](../../scripts/smoke-test.sh))

Solo usa HTTP contra una URL base, así que sirve igual para la VM, el servidor y la nube. No hace `docker exec`, no registra usuarios y no envía correos. Pasos:
1. `GET /health/database`.
2. `GET /public/products?limit=1`.
3. `GET /cart` sin token, que debe dar 401.
4. Login con un correo inexistente del dominio reservado `example.com`, que debe dar 400.
5. Login con la cuenta de prueba (`SMOKE_EMAIL` y `SMOKE_PASSWORD`).
6. `GET /auth/me` con el token.
7. El frontend, si se define `FRONTEND_URL`.

La cuenta de prueba debe existir **ya verificada** en cada entorno y sus credenciales solo viajan por variables de entorno: nunca se escriben en el repositorio ni se imprimen. Si no está verificada, el backend envía un código por correo (`LoginService.py`); el script lo detecta y lo marca como fallo.

Ejecutada el 04/11/2026 contra el stack local con el compose único (rama `refactor/compose-unico`), a través de Caddy y **con HTTPS**: `https://api.localhost` y `https://localhost`, con la configuración por defecto del `.env` (`localhost` / `api.localhost`, certificados de la CA local de Caddy). `*.localhost` resuelve a `127.0.0.1` sin tocar `/etc/hosts`. `curl` validó los certificados contra la raíz de Caddy, pasada con `CURL_CA_BUNDLE` porque no estaba instalada en el sistema (sin `-k`; con un `CURL_CA_BUNDLE` inválido las peticiones fallan). La cuenta de prueba fue la de administrador del `.env` local, pasada con `SMOKE_EMAIL="$(docker exec rehni-backend printenv ADMIN_DEFAULT)"` y `SMOKE_PASSWORD="$(docker exec rehni-backend printenv PASSWORD_DEFAULT)"`. Comando (código de salida `0`):

```bash
docker compose cp frontend:/data/caddy/pki/authorities/local/root.crt /tmp/caddy-root.crt
CURL_CA_BUNDLE=/tmp/caddy-root.crt BASE_URL=https://api.localhost FRONTEND_URL=https://localhost bash scripts/smoke-test.sh
```

```
# Prueba de humo — RehniMarket
# 2026-11-04 21:51:24 UTC
# BASE_URL=https://api.localhost   FRONTEND_URL=https://localhost   SMOKE_EMAIL=(definido)
------------------------------------------------------------
1. Salud de la API y de la base de datos
  [PASA]  GET /health/database -> 200 (Base de datos: OK)
2. Catálogo público sin sesión
  [PASA]  GET /public/products?limit=1 -> 200 (total=786)
3. Ruta protegida sin token
  [PASA]  GET /cart sin token -> 401
4. Login con credenciales incorrectas (correo inexistente @example.com)
  [PASA]  POST /auth/login-user -> 400 INVALID_CREDENTIALS
5. Login con la cuenta de prueba
  [PASA]  POST /auth/login-user -> 200 con access_token (rol: admin)
6. Perfil con el token
  [PASA]  GET /auth/me -> 200 (correo coincide)
7. Frontend
  [PASA]  GET https://localhost/ -> 200
------------------------------------------------------------
RESULTADO: 7 pasan, 0 fallan
```

La evidencia anterior (04/11/2026 14:40 UTC, contra `http://api.rehnimarket:8080`) era de la configuración solo HTTP que se reemplazó por el compose único.

**Reproducibilidad (no es el servidor).** Clon limpio en el equipo de desarrollo, el 16/11/2026,
commit `6b054d0`: `docker compose up -d --build --wait` en 2 min 4 s, cinco servicios `healthy` y
prueba de humo `7 pasan, 0 fallan` ([`docs/pruebas/evidencias/2026-11-16_gate-docker.txt`](../pruebas/evidencias/2026-11-16_gate-docker.txt)).

**En la VM de Azure.** Estado de producción tras instalar `v1.0.0` (17/11/2026 01:02 UTC): cinco
servicios `healthy`, `alembic current` = `d7e3f1a9c5b2 (head)` y datos base `4|120|4`
([`docs/evidencias/owner-unico-produccion-2026-11-17.txt`](../evidencias/owner-unico-produccion-2026-11-17.txt)).
Redes y aislamiento: 41 verificaciones, 0 fallan
([`docs/evidencias/verificacion-redes-produccion-2026-11-17.txt`](../evidencias/verificacion-redes-produccion-2026-11-17.txt)).

Prueba de humo contra producción (comando «b»: `read -rsp` para la clave, que no se muestra ni se guarda):

```
[PENDIENTE: salida de scripts/smoke-test.sh contra https://apirehnimarket.duckdns.org y https://rehnimarket.duckdns.org (docs/evidencias/smoke-produccion-<fecha>.txt), con fecha y código de salida]
```

Rollback cronometrado `v1.0.1` → `v1.0.0` → `v1.0.1` (comando «c»: respaldo previo, `ALGORITHM`
asegurada, compilación de una imagen a la vez, salud, `alembic current` y humo en cada paso):

```
[PENDIENTE: salida de docs/evidencias/rollback-v1.0.1-v1.0.0-<fecha>.txt: duración de cada cambio de versión, /health, alembic current y resultado del humo]
```

## 5.3 Despliegue en la nube

| Componente | Proveedor y plan | Región | Configuración |
|---|---|---|---|
| App completa (los cinco servicios del compose) | Microsoft Azure, suscripción **Azure for Students**; máquina virtual `Standard_B2s` o superior ([`deploy/checklist-azure.md`](../../deploy/checklist-azure.md) §1), Ubuntu Server 24.04 LTS x64, disco SSD estándar de 64 GiB, IP pública estándar estática | [PENDIENTE: región de la VM (portal de Azure → VM → Información general)] | `docker-compose.yml` + `.env` de [`deploy/env.prod.example`](../../deploy/env.prod.example) en `~/Rehni-Market`; secretos solo en el `.env` de la VM |
| Base de datos | PostgreSQL 17 en contenedor dentro de la misma VM | La misma | `URL_DATABASE` y `URL_DATABASE_POOLED` en el `.env` (600), nunca en el repositorio |
| Imágenes | MinIO en contenedor dentro de la misma VM | La misma | `MINIO_ROOT_PASSWORD` en el `.env` |
| Red | Grupo de seguridad de red (NSG): 22 solo desde la IP del administrador, 80/TCP, 443/TCP y 443/UDP | La misma | [semana 6](semana-06-seguridad-y-respaldo.md), §7.2 |

URL pública: <https://rehnimarket.duckdns.org> (web) y <https://apirehnimarket.duckdns.org> (API;
salud en `/health/database`).

**Por qué Azure IaaS y no Render + Neon.** El bootcamp despliega la app de referencia en un PaaS
(Render) con base gestionada (Neon). RehniMarket usa un solo `docker-compose.yml` con cinco servicios
(Caddy, backend, PgBouncer, PostgreSQL y MinIO) y dos redes. En Render habría que partirlo en un
sitio estático, un servicio web, una base gestionada y un S3 externo para MinIO, con una
configuración distinta de la de desarrollo, sin PgBouncer ni la red `data`, y con un plan gratuito
de 512 MB que se suspende por inactividad. En la VM corre el mismo compose que en local, y la
suscripción de estudiante cubre el costo (§5.4). [PENDIENTE: validar con el instructor que Azure IaaS cubre el despliegue en la nube de la semana 4].

Procedimiento (pasos numerados; detalle en [`deploy/checklist-azure.md`](../../deploy/checklist-azure.md) §1-2):

1. Crear la llave SSH en el equipo del administrador: `ssh-keygen -t ed25519 -C "rehnimarket-azure" -f ~/.ssh/rehni_azure`.
2. En el portal de Azure, crear la VM Ubuntu Server 24.04 LTS x64 con autenticación solo por llave, disco SSD estándar de 64 GiB e IP pública estándar estática.
3. En el NSG de la VM, abrir 80/TCP, 443/TCP y 443/UDP desde cualquier origen y 22/TCP solo desde la IP del administrador; no abrir 5432, 5433, 6432, 8000, 9000 ni 9001.
4. Configurar `Host rehni-azure` en `~/.ssh/config` y comprobar `ssh rehni-azure`.
5. En DuckDNS, apuntar `rehnimarket` y `apirehnimarket` a la IP pública y esperar a que `dig +short` devuelva esa IP en los dos nombres (Let's Encrypt limita los intentos fallidos).
6. Seguir la instalación inicial de §5.2 (pasos 2 a 15).

Método de rollback en la nube: el de §5.2 (volver a la etiqueta anterior con `git checkout` y
recompilar; restaurar el respaldo si la migración no es compatible). El IaaS no ofrece un botón
de «versión anterior» como el PaaS: la versión la fija la etiqueta de Git.

Límites del plan que afectan al cliente (con fuente y fecha): Azure for Students da «$100 credit»
y acceso al catálogo «up to free amounts», sin tarjeta de crédito
(<https://azure.microsoft.com/en-us/free/students>, consultada el 18/11/2026). Al agotarse el
crédito o vencer la suscripción, la VM se detiene y la tienda sale de línea: con el costo de §5.4
el crédito alcanza para unos 2,5 meses de la VM encendida todo el día. [PENDIENTE: vigencia de la suscripción y saldo restante del crédito (portal de Azure → Suscripciones → Créditos)].

### Evidencia

La salida de la prueba de humo contra la URL pública es la misma de §5.2 (la VM es la nube): ver
el comando «b». Comprobación pública sin credenciales del 18/11/2026 (HTTPS, certificados de
Let's Encrypt hasta el 15/02/2027, `/health/database` 200):
[`docs/evidencias/hosting-produccion-2026-11-18.txt`](../evidencias/hosting-produccion-2026-11-18.txt).

## 5.4 Estimación de costos

Precios de pago por uso, en USD, de la API oficial de precios de Azure
(<https://prices.azure.com/api/retail/prices>, la misma fuente de <https://azure.microsoft.com/es-es/pricing/details/virtual-machines/linux/>)
y de <https://render.com/pricing>, consultadas el 18/11/2026. Mes = 730 horas. Región de referencia:
East US, porque la región de la VM está pendiente (§5.3); la misma VM cuesta 0,0499 USD/h en South
Central US y 0,0672 USD/h en Brazil South.

| Concepto | Alternativa 1: Azure IaaS (lo desplegado) | Alternativa 2: Render (PaaS) |
|---|---|---|
| Cómputo | VM `Standard_B2s` (2 vCPU, 4 GiB): 0,0416 USD/h × 730 = 30,37 USD | Servicio web «Standard» (1 CPU, 2 GB): 25 USD/mes. El plan gratuito (512 MB) no alcanza la RAM medida ([semana 1](semana-01-ficha-tecnica.md), §1.4) |
| Disco / almacenamiento | SSD estándar E6 (64 GiB): 4,80 USD/mes | [PENDIENTE: almacenamiento S3 para reemplazar a MinIO] |
| Base de datos | Incluida en la VM | [PENDIENTE: plan de pago de PostgreSQL gestionado (Render Postgres o Neon); el gratuito es de 256 MB de RAM] |
| Red | IP pública estándar estática: 0,005 USD/h × 730 = 3,65 USD | Incluida |
| **Total mensual** | **38,82 USD** (sin tráfico de salida) | ≥ 25 USD (incompleto) |
| **Total anual** | **465,84 USD** | ≥ 300 USD (incompleto) |
| Horas de administración al mes | [PENDIENTE: horas reales que dedica el responsable a parches, respaldos y despliegues] | Menos: sin SO que parchear |
| Fuente y fecha | API de precios de Azure, 18/11/2026 | <https://render.com/pricing>, 18/11/2026 |

El dominio no cuesta (DuckDNS, [semana 3](semana-03-hosting-y-dominio.md), §4.2). Con Azure for
Students, los 100 USD de crédito cubren unos 2,5 meses de la alternativa 1 (100 / 38,82).

Recomendación al cliente: **Alternativa 1, Azure IaaS**, la que ya corre. Mantiene el mismo compose
que se prueba en local, incluye la base y las imágenes en un solo costo y cabe en el crédito de
estudiante durante la entrega. Para una operación sin fecha de fin, el cliente debe pasar la
suscripción a pago por uso (38,82 USD/mes de referencia) o comprar una reserva de la VM.
