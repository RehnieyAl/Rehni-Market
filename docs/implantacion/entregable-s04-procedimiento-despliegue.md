# Entregable S04 — Procedimiento de Despliegue (Plan de Instalación v1)

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | 1 persona: Yeinher Jose Algarin Cardozo, aprendiz ADSO, ficha 3171618 |
| Versión del plan | v1 |
| Versión del software cubierta | 1.0.1 (actualización desde 1.0.0) |
| Fecha | 2026-11-18 |

---

## 5.1 Proceso de liberación

| Paso | Comando o acción | Resultado esperado |
|---|---|---|
| Pruebas en verde | CI del repositorio ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml): jobs `backend`, `frontend` y `auditoria`) sobre `main` | Todos los checks pasan. Runs de `main` en verde: [44023670196](https://github.com/RehnieyAl/Rehni-Market/actions/runs/44023670196) (05:22 UTC del 17/11, tras v1.0.1) y [44103349861](https://github.com/RehnieyAl/Rehni-Market/actions/runs/44103349861) |
| Notas de versión | Entrada `[X.Y.Z] - fecha` en [`CHANGELOG.md`](../../CHANGELOG.md) con su apartado «Al actualizar» | Entrada visible en `main` |
| Etiqueta | `git tag -a vX.Y.Z -m "RehniMarket X.Y.Z"` + `git push origin vX.Y.Z` | Etiqueta visible en GitHub |
| Release | `gh release create vX.Y.Z --generate-notes` | Release publicado con la lista de PR |
| Imagen | En la VM: `git checkout vX.Y.Z` y `docker compose build backend` / `frontend` | `docker image ls` lista `rehni-market-backend` y `rehni-market-frontend`. La imagen no lleva la versión en la etiqueta: la versión desplegada es la etiqueta de Git del checkout (`git describe --tags`). Publicar imágenes versionadas en GHCR es la brecha de la [semana 7](entregable-s07-pipeline-y-monitoreo.md) |
| Release | `gh release create vX.Y.Z --generate-notes`. Aplicado: [v1.0.0](https://github.com/RehnieyAl/Rehni-Market/releases/tag/v1.0.0) (commit `4cd918e`, 17/11/2026 01:24 UTC) y [v1.0.1](https://github.com/RehnieyAl/Rehni-Market/releases/tag/v1.0.1) (commit `45ea99d`, 17/11/2026 05:19 UTC) | Release publicado con la lista de PR |

Esquema de versiones y criterio SemVer del proyecto: `MAJOR.MINOR.PATCH`. MAJOR: cambio incompatible de la API o migración no compatible hacia atrás; MINOR: funcionalidad nueva compatible; PATCH: corrección sin cambio de contrato ni de esquema (v1.0.1 = PATCH: parche de seguridad de dependencias, [PR #58](https://github.com/RehnieyAl/Rehni-Market/pull/58), sin migraciones).

Enlace al `CHANGELOG.md`: [`CHANGELOG.md`](../../CHANGELOG.md)

## 5.2 Despliegue en servidor Linux

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

### Variables de entorno

| Variable | Propósito | Ejemplo (ficticio) |
|---|---|---|
| `SITE_ADDRESS` / `API_ADDRESS` | Dominios que sirve Caddy. Obligatorios en producción: sin ellos se usan los de desarrollo, `localhost` / `api.localhost` (`docker-compose.yml`). Con un dominio público Caddy pide los certificados a Let's Encrypt (sin correo ACME) | `<dominio>` / `api.<dominio>` |
| `HTTP_PORT` / `HTTPS_PORT` | Puertos de Caddy en el host, iguales dentro del contenedor (`docker-compose.yml`). En producción 80 y 443: Let's Encrypt los necesita | `80` / `443` |
| `CADDY_LOCAL_CERTS` | `local_certs` fuerza la CA local de Caddy (solo la prueba local de la [semana 3](entregable-s03-hosting-y-dominio.md), §4.5). **En producción, vacía** | (vacía) |
| `POSTGRES_BIND` / `POSTGRES_PORT` | Interfaz y puerto donde se publica PostgreSQL (`docker-compose.yml`; por defecto `127.0.0.1` / `5433`). **Nunca `0.0.0.0`**: en el servidor se administra con `docker compose exec postgres psql …` o por túnel SSH (sección PostgreSQL de `.env.example`) | `127.0.0.1` / `5433` |
| `BACKEND_BIND` / `BACKEND_PORT` | Interfaz y puerto del host donde se publica la API (`docker-compose.yml`; por defecto `127.0.0.1` / `8000`) | `127.0.0.1` / `8000` |
| `VITE_API_URL` | URL de la API dentro del build del frontend (pública) | `https://api.<dominio>` |
| `VITE_REHNIMARKET_WHATSAPP` | Número de contacto mostrado en el frontend (público) | `+57**********` |
| `DOCS_ENABLED` | Swagger en `/docs` | `false` |
| `CORS_EXTRA_ORIGINS` | Orígenes permitidos por CORS, separados por comas | `https://<dominio>` |
| `BACKEND_CPUS` / `POSTGRES_CPUS` | Límite de CPU de los contenedores `backend` y `postgres` (por defecto `4` y `3`). Docker no crea un contenedor cuyo límite supere los núcleos del servidor: en una VM de 2 vCPU (p. ej. Azure `Standard_B2s`) usar `2` y `1.5` | `2` / `1.5` |
| `UVICORN_WORKERS` | Procesos de Uvicorn del backend (`docker-compose.yml`, por defecto `3`; `--workers` en `:197`). `app/Config.py` lo valida entre 1 y 16 | `3` |
| `FORWARDED_ALLOW_IPS` | Proxy del que Uvicorn acepta `X-Forwarded-For` para ver la IP real del cliente, con la que cuenta el rate limit: **solo Caddy**, con IP fija `172.30.0.10` (`docker-compose.yml`, servicio `frontend` y red `edge` `172.30.0.0/24`; `--forwarded-allow-ips` en el `command` del backend). Un rango como `172.16.0.0/12` incluiría la pasarela de Docker (`172.30.0.1`), por la que entra todo lo que llega al `:8000` desde el propio servidor: cualquier proceso del servidor podría falsear su IP (comprobado el 04/11/2026, sección 4.5) | `172.30.0.10` |
| `PGBOUNCER_MAX_CLIENT_CONN` | Clientes que acepta PgBouncer (`docker-compose.yml`) y que el backend usa para validar su presupuesto (`:196`). Por defecto `1200` en compose (`200` en `app/Config.py`, fuera de compose). Debe ser ≥ (`DB_POOL_SIZE` + `DB_MAX_OVERFLOW`) × `UVICORN_WORKERS` = 150 con los valores por defecto, o el backend no arranca (`app/Config.py`) | `1200` |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciales de PostgreSQL (también las lee PgBouncer). La contraseña se genera en el servidor (ver «Secretos») | `rehni_app` / `<generada>` / `rehnimarket` |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | Credenciales de MinIO (también las lee el backend). La contraseña se genera en el servidor (ver «Secretos») | `rehni_minio` / `<generada>` |
| `URL_DATABASE` | Conexión directa a PostgreSQL (la usa Alembic); la contraseña es `POSTGRES_PASSWORD` | `postgresql://rehni_app:<generada>@postgres:5432/rehnimarket` |
| `URL_DATABASE_POOLED` | Conexión de la app en tiempo de ejecución a través de PgBouncer (`app/core/dbconexion.py`). Si no se define, usa `URL_DATABASE` (`app/Config.py`) y se salta PgBouncer. Misma contraseña que `URL_DATABASE` En producción apunta a `pgbouncer:6432`: comprobado con `SELECT 1` por `URL_DATABASE_POOLED` ([verificación de redes del 17/11](../evidencias/verificacion-redes-produccion-2026-11-17.txt)) | `postgresql://rehni_app:<generada>@pgbouncer:6432/rehnimarket` |
| `SECRET_KEY` / `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_DAYS` | Firma (HS256, fijo en el código desde v1.0.1) y vigencia de los JWT. `SECRET_KEY` se genera en el servidor (ver «Secretos») | `<generada>` / `HS256` / `30` / `15` (`.env.example`) |
| `GMAIL_USERNAME` / `GMAIL_APP_PASSWORD` | Cuenta que envía los correos transaccionales. La contraseña de aplicación la emite Google; crear una propia para producción | `<cuenta>` / `<de Google>` |
| `URL_FRONTEND` / `URL_BACKEND` | URL públicas para enlaces de correo e imágenes | `https://<dominio>` / `https://api.<dominio>` |
| `MINIO_URL` | Dirección de MinIO dentro de la red de Docker | `minio:9000` |
| `RATE_LIMIT_ENABLED` | Activa el límite de peticiones por IP (`app/main.py`; por defecto `false`, `app/Config.py`). **En producción, `true`** (`deploy/env.prod.example`) | `true` |
| `REQUEST_LIMIT` / `TIME_WINDOW` | Peticiones por IP permitidas dentro de una ventana de `TIME_WINDOW` segundos; al superarlas responde `429` (`app/Config.py`, por defecto `100` / `60`; `app/middleware/RateLimitMiddleware.py`). El contador es en memoria y por proceso: con `UVICORN_WORKERS=3`, una IP puede llegar a 3 × `REQUEST_LIMIT` | `100` / `60` |
| `USER_NAME_ADMIN` / `ADMIN_DEFAULT` / `PASSWORD_DEFAULT` y `USER_NAME_OWNER` / `OWNER_DEFAULT` / `OWNER_PASSWORD_DEFAULT` | Cuentas iniciales de administrador y owner. Solo se usan con `RUN_SEED=true` (`app/main.py`); en producción quedan vacías, sin marcador, para que el seed no cree una cuenta con una contraseña conocida (`app/utils/seed.py`). | `""` |
| `RUN_SEED` | Carga de datos de ejemplo al arrancar | `false` |

### Instalación inicial

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | Entrar a la VM | `ssh rehni-prod` | Sesión del usuario administrador, sin contraseña (llave) |
| 2 | Actualizar el sistema y la zona horaria | `sudo apt update && sudo apt upgrade -y && sudo timedatectl set-timezone America/Bogota` | Sin errores |
| 3 | Instalar Docker Engine y Compose | Repositorio `apt` oficial de Docker y `sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin` | `sudo docker run hello-world` muestra el mensaje de prueba |
| 4 | Docker sin `sudo` | `sudo usermod -aG docker $USER` y volver a entrar | `docker run hello-world` sin `sudo`; `docker compose version` ≥ 2.24 |
| 5 | Swap para compilar | `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' \| sudo tee -a /etc/fstab` | `free -h` muestra 2,0 Gi de swap |
| 6 | Clonar en la versión | `git clone https://github.com/RehnieyAl/Rehni-Market.git ~/Rehni-Market && cd ~/Rehni-Market && git checkout v1.0.1` | `git describe --tags` = `v1.0.1` |
| 7 | Verificar requisitos | `PORTS="80 443" bash scripts/verificar-requisitos.sh` | Tabla de requisitos y código de salida ([semana 1](entregable-s01-ficha-tecnica.md), §1.7) |
| 8 | Crear la configuración | `cp deploy/env.prod.example .env && chmod 600 .env` y reemplazar cada `CAMBIAR_*` (o `scp` del `.env` preparado) | `ls -l .env` = `-rw-------`; `grep -nE '^[A-Z_]+=.*CAMBIAR' .env` no muestra nada; `git status` no lo muestra |
| 9 | Compilar las imágenes de una en una | `docker compose build backend && docker compose build frontend` | Dos imágenes sin error; juntas se quedan sin memoria en 2 vCPU / 4 GiB |
| 10 | Levantar | `docker compose up -d --wait` | Termina sin errores; el backend aplica `alembic upgrade head` |
| 11 | Comprobar la salud | `docker compose ps` | Cinco servicios `healthy`; solo `rehni-frontend` en `0.0.0.0` |
| 12 | Comprobar HTTPS | `curl -fsS https://apirehnimarket.duckdns.org/health/database` y `curl -s -o /dev/null -w "%{http_code}\n" https://rehnimarket.duckdns.org/` | `{"Base de datos":"OK"}` y `200` |
| 13 | Datos base y owner | Consulta de [`deploy/README.md`](../../deploy/README.md) §7 y [`deploy/OWNER.md`](../../deploy/OWNER.md) §3 con [`deploy/sql/crear-owner.sql`](../../deploy/sql/crear-owner.sql) | `4\|120\|4`, `INSERT 0 1`, el login responde `role: owner` |
| 14 | Prueba de humo | Comando «b» (abajo, en Evidencia) | `RESULTADO: 7 pasan, 0 fallan` |
| 15 | Primer respaldo | `bash scripts/respaldar.sh` | `=== FIN backup <TS> — OK ===` |

### Actualización

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
| 2 | Variables que la versión anterior necesita | Comparar `deploy/env.prod.example` de las dos etiquetas. De `v1.0.1` a `v1.0.0`: en producción `ALGORITHM` está comentada desde el 18/11/2026; descomentarla con `sed -i 's/^# ALGORITHM=/ALGORITHM=/' .env` (o agregar `ALGORITHM=HS256` si no está) | `v1.0.0` lee `ALGORITHM` (`git show v1.0.0:RehniMarket-backend/app/Config.py`); sin ella el login falla. `v1.0.1` la ignora |
| 3 | Volver al código anterior | `git checkout <anterior>` | `git describe --tags` = versión anterior |
| 4 | Compilar, levantar y verificar | Pasos 5 y 6 de la actualización | Cinco `healthy`, humo sin fallos; el esquema queda en la revisión nueva, que la anterior tolera |
| 5 | Restaurar el respaldo previo | `bash scripts/restore_rehnimarket.sh <TS> --verify-only` y, si da `OK`, `bash scripts/restore_rehnimarket.sh <TS>` ([semana 2](entregable-s02-planes.md), §3.4) | `OK: restore completo.` |
| 6 | Volver al código anterior | Pasos 3 y 4 | `docker compose exec backend uv run alembic current` igual al del respaldo |

Clasificación de migraciones (¿permiten rollback sin restaurar?):

| Migración | Cambio | ¿Compatible hacia atrás? |
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

### Evidencia

```
# VM de Azure, v1.0.0 instalada · 2026-11-17 01:02:08 UTC (docs/evidencias/owner-unico-produccion-2026-11-17.txt)
pgbouncer_pool  Up About a minute (healthy)
rehni-backend  Up 56 seconds (healthy)
rehni-frontend  Up 39 seconds (healthy)
rehni-minio  Up About a minute (healthy)
rehni-postgres  Up About a minute (healthy)
alembic current: d7e3f1a9c5b2 (head)
roles | catalogo | transportadoras = 4 | 120 | 4

# Prueba de humo contra producción (comando «b»)
[PENDIENTE: salida de docs/evidencias/smoke-produccion-<fecha>.txt]

# Rollback cronometrado 0c19dff (v1.0.1-7) → v1.0.0 → 0c19dff · 2026-11-18 (docs/evidencias/rollback-v1.0.1-v1.0.0-2026-11-18.txt)
# migraciones entre v1.0.0 y 0c19dff: ninguna · respaldo previo 2026-11-18_19-48 OK
--- v1.0.0 · compilación: 12 s · up: 14 s · total 26 s · 19:48:50 UTC
    versión: v1.0.0 · salud: 200 · alembic: d7e3f1a9c5b2 (head) · JWT inválido en /auth/me: 401 · sitio: 200
--- 0c19dff · compilación: 4 s · up: 14 s · total 18 s · 19:49:09 UTC
    versión: v1.0.1-7-g0c19dff · salud: 200 · alembic: d7e3f1a9c5b2 (head) · JWT inválido en /auth/me: 401 · sitio: 200
## ALGORITHM comentada en el .env (v1.0.1 no la lee); recrear con el .env nuevo: 35 s · salud: 200 · JWT inválido: 401
## verificar-redes: 42 pasan, 0 fallan · 5 servicios healthy

# Reproducibilidad (equipo de desarrollo, no es el servidor): clon limpio del 16/11/2026, commit 6b054d0,
# cinco servicios healthy en 2 min 4 s y humo 7 pasan, 0 fallan (docs/pruebas/evidencias/2026-11-16_gate-docker.txt)
```

## 5.3 Despliegue en la nube

| Componente | Proveedor y plan | Región | Configuración |
|---|---|---|---|
| App (los cinco servicios de `docker-compose.yml`) | Microsoft Azure IaaS, suscripción Azure for Students: VM Ubuntu Server 24.04 LTS x64 `Standard_B2ls_v2` (2 vCPU, 4 GiB), disco del SO Premium SSD P4 de 30 GB ([`azure-vm-metadatos-2026-11-18.txt`](../evidencias/azure-vm-metadatos-2026-11-18.txt)), IP pública estática ([`deploy/checklist-azure.md`](../../deploy/checklist-azure.md) §1). No se usó Render ni Neon porque todo corre con un solo `docker-compose.yml`. [PENDIENTE: validar con el instructor] | Chile Central (`chilecentral`, servicio de metadatos de Azure, 18/11/2026) | `docker-compose.yml` + `.env` de [`deploy/env.prod.example`](../../deploy/env.prod.example) en `~/Rehni-Market` (600) |
| Base de datos | PostgreSQL 17 en contenedor en la misma VM | La misma | `URL_DATABASE` y `URL_DATABASE_POOLED` en el `.env` de la VM, nunca en el repositorio |

URL pública: <https://rehnimarket.duckdns.org> (web) y <https://apirehnimarket.duckdns.org> (API)

Procedimiento (pasos numerados):

1. Crear la llave SSH en el equipo del administrador: `ssh-keygen -t ed25519 -C "rehnimarket-azure" -f ~/.ssh/rehni_azure`.
2. En el portal de Azure, crear la VM Ubuntu Server 24.04 LTS x64 con autenticación solo por llave, disco SSD estándar de 64 GiB e IP pública estándar estática.
3. En el NSG de la VM, abrir 80/TCP, 443/TCP y 443/UDP desde cualquier origen y 22/TCP solo desde la IP del administrador; no abrir 5432, 5433, 6432, 8000, 9000 ni 9001.
4. Configurar `Host rehni-prod` en `~/.ssh/config` y comprobar `ssh rehni-prod`.
5. En DuckDNS, apuntar `rehnimarket` y `apirehnimarket` a la IP pública y esperar a que `dig +short` devuelva esa IP en los dos nombres (Let's Encrypt limita los intentos fallidos).
6. Seguir la instalación inicial de §5.2 (pasos 2 a 15).

Método de rollback en el PaaS: no aplica PaaS; en la VM, `git checkout <etiqueta-anterior>` y recompilar, con restauración del respaldo si la migración no es compatible (§5.2, «Rollback»).

Límites del plan gratuito que afectan al cliente (con fuente y fecha): Azure for Students: «$100 credit» y servicios «up to free amounts», sin tarjeta de crédito (<https://azure.microsoft.com/en-us/free/students>, consultada el 18/11/2026). [PENDIENTE: vigencia de la suscripción y saldo restante del crédito (portal de Azure → Education → Información general)]

### Evidencia

```
# Comprobación pública sin credenciales · 2026-11-18 18:24:16 UTC (docs/evidencias/hosting-produccion-2026-11-18.txt)
http://rehnimarket.duckdns.org/          308 -> https://rehnimarket.duckdns.org/
https://rehnimarket.duckdns.org/                        200 (HTTP/2)
https://apirehnimarket.duckdns.org/health/database      {"Base de datos":"OK"} 200
issuer=C=US, O=Let's Encrypt, CN=YE2   notAfter=Feb 15 00:03:01 2027 GMT

# Prueba de humo contra la URL pública (comando «b»)
[PENDIENTE: salida de docs/evidencias/smoke-produccion-<fecha>.txt]
```

## 5.4 Estimación de costos

| Concepto | Alternativa 1 | Alternativa 2 |
|---|---|---|
| Total mensual | Azure IaaS (lo desplegado), Chile Central: VM `Standard_B2ls_v2` 0,0582 USD/h × 730 h = 42,49 USD + disco Premium SSD P4 (30 GB) 6,74 USD + IP pública estándar estática 0,005 USD/h × 730 h = 3,65 USD = **52,87 USD**, sin tráfico de salida | Render: servicio web «Standard» (1 CPU, 2 GB) 25 USD + Postgres de 1 GB de RAM 19 USD + almacenamiento de la base 0,30 USD/GB = **44,30 USD** con 1 GB. [PENDIENTE: almacenamiento de objetos para reemplazar a MinIO, que Render no ofrece como servicio gestionado] |
| Total anual | 634,47 USD (52,87 × 12) | 531,60 USD (44,30 × 12), sin el almacenamiento de objetos |
| Horas de administración al mes | [PENDIENTE: horas reales registradas por el responsable] | [PENDIENTE: horas reales] |
| Fuente y fecha | API oficial de precios de Azure, <https://prices.azure.com/api/retail/prices> (región `chilecentral`; filtros `Standard_B2ls_v2`, `P4 LRS`, `Standard IPv4 Static Public IP`), consultada el 18/11/2026 ([`azure-vm-metadatos-2026-11-18.txt`](../evidencias/azure-vm-metadatos-2026-11-18.txt)). Suscripción: Azure for Students | <https://render.com/pricing>, consultada el 18/11/2026 |

Recomendación al cliente: Alternativa 1 (Azure IaaS), la que está desplegada: corre el mismo `docker-compose.yml` que se prueba en local. Con el crédito de 100 USD de Azure for Students cubre ~1,9 meses (100 / 52,87). Después de la entrega, la VM se detiene y desasigna cuando no se use (portal → VM → Detener), para que deje de cobrar el cómputo; el disco y la IP estática siguen cobrando mientras existan.
