| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | Yeinher Algarin |
| Versión del plan | v1 (v0 de la semana 2 + procedimiento de la semana 4) |
| Versión del software cubierta | 1.0.0 (`CHANGELOG.md`; etiqueta `v1.0.0` <!-- PENDIENTE: la crea el responsable --> ) |
| Fecha | 04/11/2026 |

---

## 5. Plan de instalación y despliegue — Semanas 2 y 4 (CE-1, CE-5)

### 5.0 Plan de instalación v0 (semana 2)

| # | Sección | Contenido |
|---|---|---|
| 1 | Alcance | Instalar los cinco servicios de `docker-compose.yml` (`frontend` con Caddy, `backend`, `pgbouncer`, `postgres`, `minio`) en un servidor Ubuntu Server 24.04 LTS con Docker Compose. La app móvil (`RehniMarket-mobile/`) no forma parte de `docker-compose.yml` y queda fuera de este plan |
| 2 | Ambientes | Un único `docker-compose.yml` y un único `caddy/Caddyfile` en todos los ambientes; solo cambia el `.env` de la raíz. **Desarrollo:** CachyOS, `docker compose up -d` o `docker compose watch`, HTTPS en `https://localhost` y `https://api.localhost` (CA local de Caddy) y API directa en `:8000`. **Pruebas:** `docker compose --profile test up -d --wait postgres-test`. **Producción:** Ubuntu Server 24.04 LTS, `docker compose up -d` con el `.env` de `deploy/env.prod.example`, HTTPS con Let's Encrypt en `:443`. **Nube:** <!-- PENDIENTE: proveedor y plan (sección 5.3) --> |
| 3 | Roles | Responsable técnico (Yeinher Algarin): ejecuta la instalación, decide el rollback (sección 2.6). Cliente: aprueba el resultado y el reporte de rechazos de la migración (sección 2.6). <!-- PENDIENTE: otros roles (administrador del servidor, contacto del cliente) si los hay --> |
| 4 | Prerrequisitos | Ver sección 1 (ficha técnica): matriz 1.5 y `scripts/verificar-requisitos.sh` con código de salida `0` |
| 5 | Preparación | Ubuntu Server 24.04 LTS con Docker Engine y el plugin Compose instalados según la guía oficial (paso 2 de la instalación inicial), usuario de despliegue en el grupo `docker`, DNS apuntando al servidor (sección 4.3) y puertos 80/443/22 abiertos (sección 4.4) |
| 6 | Procedimiento | Ver sección 5.2 (instalación inicial, actualización y rollback) |
| 7 | Migración de datos | Esquema: el backend aplica `alembic upgrade head` al arrancar (`docker-compose.yml:168`). Datos del sistema anterior: sección 2 (`scripts/migracion/migrar.sh`) |
| 8 | Verificación | `docker compose ps` con los cinco servicios `healthy`, `curl` a `/health/database` y `scripts/smoke-test.sh` con `BASE_URL` (sección 5.2) |
| 9 | Rollback | Ver sección 5.2 (rollback) y la clasificación de migraciones |
| 10 | Cronograma | Ver tabla de abajo |

#### Cronograma de la ventana

| Fase | Duración | Acumulado |
|---|---|---|
| Verificar requisitos (`verificar-requisitos.sh`) | <!-- PENDIENTE: medir en el servidor --> | |
| Respaldo previo (`respaldar.sh`) | 1 min 58 s (medido el 04/11/2026 en desarrollo, sección 3.5) | |
| `git pull` + `docker compose up -d --build` (incluye `alembic upgrade head`) | <!-- PENDIENTE: medir en el servidor --> | |
| Verificación (`ps`, `/health/database`, `smoke-test.sh`) | <!-- PENDIENTE: medir en el servidor --> | |
| Migración de datos del sistema anterior (si aplica, sección 2) | Opciones 3-5 de `migrar.sh`: 12,2 s en el ensayo del 04/11/2026 sobre una copia (sección 2.9). Sin contar la apertura y el cierre de la ventana | |

**Punto de no retorno:** el arranque del backend con la nueva imagen, porque ejecuta `alembic upgrade head` (`docker-compose.yml:168`). Si la versión trae una migración **no compatible hacia atrás** (tabla de clasificación de la sección 5.2), volver a la versión anterior exige restaurar el respaldo previo (sección 3.4) y se pierde lo escrito después de él.

### 5.1 Proceso de liberación

| Paso | Comando o acción | Resultado esperado |
|---|---|---|
| Pruebas en verde | CI del repositorio (`.github/workflows/ci.yml`: ruff, `alembic upgrade head` en BD vacía, pytest, lint, typecheck y vitest del frontend) | Todos los checks pasan en `main` |
| Notas de versión | Actualizar `CHANGELOG.md` de la raíz (sección `[1.0.0]`) | Entrada de la versión con fecha |
| Etiqueta | `git tag -a v1.0.0 -m "RehniMarket 1.0.0"` + `git push origin v1.0.0` <!-- PENDIENTE: la crea el responsable --> | Etiqueta visible en GitHub |
| Imágenes | `git checkout v1.0.0` y `docker compose build` | `docker image ls` lista `rehni-market-backend` y `rehni-market-frontend` (nombres de `docker-compose.yml:139` y `:204`) |

Esquema de versiones: SemVer `MAJOR.MINOR.PATCH`. MAJOR: cambio incompatible de la API o una migración no compatible hacia atrás; MINOR: funcionalidad nueva compatible; PATCH: corrección sin cambios de contrato.

Las imágenes no llevan la versión en la etiqueta (`docker-compose.yml` usa `image: rehni-market-backend` sin `:tag`): la versión desplegada se identifica por la etiqueta de Git del checkout. <!-- PENDIENTE: decidir si se etiquetan las imágenes con la versión (p. ej. publicar en GHCR en la semana 7) -->

Enlace al `CHANGELOG.md`: [`CHANGELOG.md`](../../CHANGELOG.md) (raíz). El detalle del backend sigue en `RehniMarket-backend/CHANGELOG.md`.

### 5.2 Despliegue en servidor Linux

#### Estructura

```
/opt/rehnimarket/                 ← clon del repositorio (git clone)
├── docker-compose.yml            ← el mismo que en desarrollo (compose único)
├── caddy/Caddyfile               ← el mismo que en desarrollo; HTTPS con Let's Encrypt por el .env
├── deploy/
│   ├── env.prod.example          ← plantilla del .env de producción
│   └── README.md
├── .env                          ← de deploy/env.prod.example (chmod 600, fuera de Git)
├── .env.postgres                 ← de .env.postgres.example (chmod 600)
├── .env.minio                    ← de .env.minio.example (chmod 600)
├── RehniMarket-backend/.env      ← de RehniMarket-backend/.env.public.example (chmod 600)
├── backups/                      ← respaldos (copia 1, sección 3.3; excluido de Git)
└── scripts/                      ← verificar-requisitos, respaldar, smoke-test, restore…
```

Los volúmenes de datos (`postgres_data`, `minio_data`, `caddy_data`, `caddy_config`, `backend_venv`) los gestiona Docker (`docker-compose.yml:294-299`), no viven en `/opt`. Los cuatro `.env` están excluidos de Git (`.gitignore:10-11`, `RehniMarket-backend/.gitignore:5-7`).

**Por qué no hay `deploy/compose.prod.yaml` ni `deploy/Caddyfile`.** La rúbrica de la semana 4 nombra como instrumento del Producto la «carpeta `deploy/`» (`bc-implantacion/bootcamp/week-04-despliegue_local_y_nube/rubrica-evaluacion.md:64-65`), y el proyecto de la semana pide una «Carpeta `deploy/` con `compose.prod.yaml`, configuración del proxy, `env.prod.example`» (`3-proyecto/README.md:13-14`). RehniMarket cubre lo mismo con **un solo compose y un solo Caddyfile** para todos los ambientes: lo que cambia entre el equipo de desarrollo y el servidor (dominios, puertos, emisor de los certificados, interfaz de la API, CORS) son variables del `.env`, y su plantilla de producción es `deploy/env.prod.example`. Así no hay dos configuraciones que mantener en paralelo (antes el bloque del frontend estaba copiado en `caddy/Caddyfile` y `deploy/Caddyfile`), y lo que se prueba en local es exactamente lo que corre en el servidor. La «configuración del proxy» es `caddy/Caddyfile` y `deploy/README.md` explica el diseño. <!-- PENDIENTE: confirmar con el instructor que el compose único cumple el entregable deploy/ (PENDIENTES-s1-s4.md) -->

**Imagen de MinIO y permisos del volumen.** `minio/minio` ya no se puede descargar de Docker Hub; el compose usa la imagen de Chainguard fijada por digest (`docker-compose.yml:19`), que corre como el usuario `65532` (nonroot). Un volumen `minio_data` nuevo funciona sin más (la imagen crea `/data` con permisos `777`). Un volumen creado antes por `minio/minio` (archivos de `root`) falla al arrancar con `unable to rename (/data/.minio.sys/tmp -> …) file access denied` y `FATAL Unable to initialize backend: Unable to write to the backend` (comprobado el 04/11/2026 en desarrollo). Se corrige **una vez** cambiando el dueño de los datos, sin ejecutar MinIO como root:

```bash
docker compose stop minio
docker run --rm -v rehni-market_minio_data:/data alpine chown -R 65532:65532 /data
docker compose up -d --wait minio
```

En desarrollo se aplicó el 04/11/2026 a `rehni-market_minio_data` (31,7 MB, 8808 entradas) y MinIO arrancó con los datos existentes; las imágenes se siguen sirviendo por `/media/proxy` (200 `image/webp`). Se descartó `user: "0"` porque haría correr MinIO como root.

#### Variables de entorno

Solo nombres y ejemplos ficticios; los valores reales se crean en el servidor. Plantillas: `.env.example` (`.env` de desarrollo) y, para producción, `deploy/env.prod.example` (`.env`), `.env.postgres.example`, `.env.minio.example` y `RehniMarket-backend/.env.public.example` (`RehniMarket-backend/.env`). `RehniMarket-backend/.env.example` es la plantilla de desarrollo local (`RATE_LIMIT_ENABLED=false`, URL de `localhost`).

**Secretos:** en las plantillas de producción cada secreto lleva el marcador `CAMBIAR_generar_con_openssl_rand_hex_32` y se genera con `openssl rand -hex 32`, un valor distinto por secreto y por entorno (nunca los de desarrollo). La excepción es `GMAIL_APP_PASSWORD`, que la emite Google (contraseña de aplicación, marcador `CAMBIAR_contrasena_de_aplicacion_de_Google`). El backend arranca aunque quede un marcador, así que hay que revisarlos antes del paso 6: `grep -nE 'CAMBIA|<dominio>|<correo|tu-dominio' .env .env.postgres .env.minio RehniMarket-backend/.env | grep -v ':#'` no debe mostrar nada (cubre también los marcadores `CAMBIA_USUARIO`, `CAMBIA_BD` y `CAMBIA_MINIO_USER` y los dominios de ejemplo).

| Archivo | Variable | Propósito | Ejemplo (ficticio) |
|---|---|---|---|
| `.env` | `SITE_ADDRESS` / `API_ADDRESS` | Dominios que sirve Caddy. Obligatorios en producción: sin ellos se usan los de desarrollo, `localhost` / `api.localhost` (`docker-compose.yml:215-216`). Con un dominio público Caddy pide los certificados a Let's Encrypt (sin correo ACME) | `<dominio>` / `api.<dominio>` |
| `.env` | `HTTP_PORT` / `HTTPS_PORT` | Puertos de Caddy en el host, iguales dentro del contenedor (`docker-compose.yml:232-234`). En producción 80 y 443: Let's Encrypt los necesita | `80` / `443` |
| `.env` | `CADDY_LOCAL_CERTS` | `local_certs` fuerza la CA local de Caddy (solo la prueba de la sección 4.5). **En producción, vacía** | (vacía) |
| `.env` (opcional) | `POSTGRES_PORT` | Puerto de PostgreSQL publicado **solo en `127.0.0.1`** (`docker-compose.yml:50`; por defecto `5433`), para administrarla por túnel SSH | `5433` |
| `.env` | `BACKEND_BIND` / `BACKEND_PORT` | Interfaz y puerto del host donde se publica la API (`docker-compose.yml:170`; por defecto `127.0.0.1` / `8000`) | `127.0.0.1` / `8000` |
| `.env` | `VITE_API_URL` | URL de la API dentro del build del frontend (pública) | `https://api.<dominio>` |
| `.env` | `VITE_REHNIMARKET_WHATSAPP` | Número de contacto mostrado en el frontend (público) | `+57**********` |
| `.env` | `DOCS_ENABLED` | Swagger en `/docs` | `false` |
| `.env` | `CORS_EXTRA_ORIGINS` | Orígenes permitidos por CORS, separados por comas | `https://<dominio>` |
| `.env` (opcional) | `UVICORN_WORKERS` | Procesos de Uvicorn del backend (`docker-compose.yml:158`, por defecto `3`; `--workers` en `:168`). `app/Config.py:65` lo valida entre 1 y 16 | `3` |
| `.env` | `FORWARDED_ALLOW_IPS` | Proxy del que Uvicorn acepta `X-Forwarded-For` para ver la IP real del cliente, con la que cuenta el rate limit: **solo Caddy**, con IP fija `172.30.0.10` (`docker-compose.yml`, servicio `frontend` y red `default` `172.30.0.0/24`; `--forwarded-allow-ips` en el `command` del backend). Un rango como `172.16.0.0/12` incluiría la pasarela de Docker (`172.30.0.1`), por la que entra todo lo que llega al `:8000` desde el propio servidor: cualquier proceso del servidor podría falsear su IP (comprobado el 04/11/2026, sección 4.5) | `172.30.0.10` |
| `.env` (opcional) | `PGBOUNCER_MAX_CLIENT_CONN` | Clientes que acepta PgBouncer (`docker-compose.yml:99`) y que el backend usa para validar su presupuesto (`:167`). Por defecto `1200` en compose (`200` en `app/Config.py:73`, fuera de compose). Debe ser ≥ (`DB_POOL_SIZE` + `DB_MAX_OVERFLOW`) × `UVICORN_WORKERS` = 150 con los valores por defecto, o el backend no arranca (`app/Config.py:82`) | `1200` |
| `.env.postgres` | `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciales de PostgreSQL (también las lee PgBouncer). La contraseña se genera con `openssl rand -hex 32` | `rehni_app` / `CAMBIAR_generar_con_openssl_rand_hex_32` / `rehnimarket` |
| `.env.minio` | `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | Credenciales de MinIO (también las lee el backend). La contraseña se genera con `openssl rand -hex 32` | `rehni_minio` / `CAMBIAR_generar_con_openssl_rand_hex_32` |
| `RehniMarket-backend/.env` | `URL_DATABASE` | Conexión directa a PostgreSQL (la usa Alembic); la contraseña es `POSTGRES_PASSWORD` de `.env.postgres` | `postgresql://rehni_app:CAMBIAR_generar_con_openssl_rand_hex_32@postgres:5432/rehnimarket` |
| `RehniMarket-backend/.env` | `URL_DATABASE_POOLED` | Conexión de la app en tiempo de ejecución a través de PgBouncer (`app/database/Connection.py:16`). Si no se define, usa `URL_DATABASE` (`app/Config.py:28`) y se salta PgBouncer. Misma contraseña que `URL_DATABASE` <!-- PENDIENTE: confirmar el valor en el .env real del servidor (con PgBouncer debe apuntar a pgbouncer:6432) --> | `postgresql://rehni_app:CAMBIAR_generar_con_openssl_rand_hex_32@pgbouncer:6432/rehnimarket` |
| `RehniMarket-backend/.env` | `SECRET_KEY` / `ALGORITHM` / `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_DAYS` | Firma y vigencia de los JWT. `SECRET_KEY` se genera con `openssl rand -hex 32` | `CAMBIAR_generar_con_openssl_rand_hex_32` / `HS256` / `30` / `15` (`RehniMarket-backend/.env.public.example:18-21`) |
| `RehniMarket-backend/.env` | `GMAIL_USERNAME` / `GMAIL_APP_PASSWORD` | Cuenta que envía los correos transaccionales. La contraseña de aplicación la emite Google; crear una propia para producción | `<cuenta>` / `CAMBIAR_contrasena_de_aplicacion_de_Google` |
| `RehniMarket-backend/.env` | `URL_FRONTEND` / `URL_BACKEND` | URL públicas para enlaces de correo e imágenes | `https://<dominio>` / `https://api.<dominio>` |
| `RehniMarket-backend/.env` | `MINIO_URL` | Dirección de MinIO dentro de la red de Docker | `minio:9000` |
| `RehniMarket-backend/.env` | `RATE_LIMIT_ENABLED` | Activa el límite de peticiones por IP (`app/main.py:110`; por defecto `false`, `app/Config.py:47`). **En producción, `true`** (`RehniMarket-backend/.env.public.example:35`) | `true` |
| `RehniMarket-backend/.env` (opcional) | `REQUEST_LIMIT` / `TIME_WINDOW` | Peticiones por IP permitidas dentro de una ventana de `TIME_WINDOW` segundos; al superarlas responde `429` (`app/Config.py:57-58`, por defecto `100` / `60`; `app/middleware/RateLimitMiddleware.py:32,35`). El contador es en memoria y por proceso: con `UVICORN_WORKERS=3`, una IP puede llegar a 3 × `REQUEST_LIMIT` | `100` / `60` |
| `RehniMarket-backend/.env` | `USER_NAME_ADMIN` / `ADMIN_DEFAULT` / `PASSWORD_DEFAULT` y `USER_NAME_OWNER` / `OWNER_DEFAULT` / `OWNER_PASSWORD_DEFAULT` | Cuentas iniciales de administrador y owner. Solo se usan con `RUN_SEED=true` (`app/main.py:52`); en producción quedan vacías, sin marcador, para que el seed no cree una cuenta con una contraseña conocida (`app/utils/seed.py:1655`). Si se usan: `openssl rand -hex 32` | `""` |
| `RehniMarket-backend/.env` | `RUN_SEED` | Carga de datos de ejemplo al arrancar | `false` |

`CADDY_TLS`, `ACME_EMAIL`, `FRONTEND_PORT` y `FRONTEND_HTTPS_PORT` ya no existen: ningún Caddyfile ni compose las lee.


#### Instalación inicial

Comandos de los pasos 2 y 3: guía oficial de Docker, <https://docs.docker.com/engine/install/ubuntu/> (Ubuntu Noble 24.04 LTS aparece entre las versiones admitidas) y <https://docs.docker.com/engine/install/linux-postinstall/>, consultadas el 04/11/2026.

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | Clonar el repositorio en `/opt` | `sudo mkdir -p /opt/rehnimarket && sudo chown "$USER" /opt/rehnimarket && git clone https://github.com/RehnieyAl/Rehni-Market.git /opt/rehnimarket && cd /opt/rehnimarket && git checkout v1.0.0` | Repositorio en `/opt/rehnimarket`, en la etiqueta `v1.0.0` |
| 2 | Instalar Docker Engine y Compose | Repositorio `apt` de Docker según la guía oficial y `sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin` | `sudo docker run hello-world` muestra el mensaje de prueba |
| 3 | Usar Docker sin `sudo` | `sudo groupadd docker` (si no existe), `sudo usermod -aG docker $USER` y volver a iniciar sesión (o `newgrp docker`) | `docker run hello-world` funciona sin `sudo`. La guía advierte que el grupo `docker` da privilegios equivalentes a root |
| 4 | Verificar requisitos | `PORTS="80 443" bash scripts/verificar-requisitos.sh` | Tabla con todo en `CUMPLE` y código de salida `0` |
| 5 | Crear la configuración | `cp deploy/env.prod.example .env`, `cp .env.postgres.example .env.postgres`, `cp .env.minio.example .env.minio`, `cp RehniMarket-backend/.env.public.example RehniMarket-backend/.env`, reemplazar cada `CAMBIAR_*` (secretos con `openssl rand -hex 32`, ver «Variables de entorno») y `chmod 600 .env .env.postgres .env.minio RehniMarket-backend/.env` | Cuatro archivos con permisos `-rw-------`; `git status` no los muestra |
| 6 | Levantar los servicios | `docker compose up -d --build --wait` | Termina sin errores; el backend aplica `alembic upgrade head` al arrancar |
| 7 | Comprobar la salud | `docker compose ps` | Los cinco servicios en `healthy` |
| 8 | Comprobar HTTPS y la API | `curl -fsS https://api.<dominio>/health/database` y `curl -fsS -o /dev/null -w "%{http_code}\n" https://<dominio>/` | Respuesta de la base de datos y `200` |
| 9 | Prueba de humo | `read -rs SMOKE_PASSWORD; export SMOKE_PASSWORD; SMOKE_EMAIL=<correo-cuenta-de-prueba> BASE_URL=https://api.<dominio> FRONTEND_URL=https://<dominio> bash scripts/smoke-test.sh` | `RESULTADO: 7 pasan, 0 fallan` y código de salida `0` |
| 10 | Primer respaldo | `bash scripts/respaldar.sh` | `=== FIN backup <TS> — OK ===` |

#### Actualización

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | Respaldo previo | `bash scripts/respaldar.sh` | `=== FIN backup <TS> — OK ===`; anotar el `TS` |
| 2 | Revisar las migraciones nuevas | `git fetch --tags && git diff --stat <versión-actual> <versión-nueva> -- RehniMarket-backend/alembic/versions` | Lista de migraciones nuevas; clasificarlas con la tabla de abajo |
| 3 | Cambiar de versión | `git checkout <versión-nueva>` | `git describe --tags` muestra la versión nueva |
| 4 | Reconstruir y levantar | `docker compose up -d --build --wait` | Contenedores recreados; el backend aplica las migraciones nuevas |
| 5 | Verificar | `docker compose ps`, `curl -fsS https://api.<dominio>/health/database` y `scripts/smoke-test.sh` como en el paso 9 de la instalación | Cinco servicios `healthy` y prueba de humo sin fallos |

#### Rollback

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | Decidir el tipo de rollback | Revisar la clasificación de las migraciones que trajo la versión | Si todas son compatibles hacia atrás: pasos 2-3. Si alguna no lo es: pasos 4-5 |
| 2 | Volver al código anterior | `git checkout <versión-anterior>` | `git describe --tags` muestra la versión anterior |
| 3 | Reconstruir sin bajar el esquema | `docker compose up -d --build --wait` | Cinco servicios `healthy`. La base queda en la revisión nueva, que la versión anterior tolera |
| 4 | Restaurar el respaldo previo | `bash scripts/restore_rehnimarket.sh <TS> --verify-only` y, si da `OK`, `bash scripts/restore_rehnimarket.sh <TS>` (procedimiento de la sección 3.4) | `OK: restore completo.` |
| 5 | Volver al código anterior | Pasos 2 y 3 | Cinco servicios `healthy` y `docker compose exec backend uv run alembic current` igual al del respaldo |

No se usa `alembic downgrade` como rollback: la migración `d4e5f6a7b8c9` recrea las columnas borradas vacías y `b6f8fd31fbe` borra todas las filas de `variant_options` y `product_attribute_values` al bajar (ver la tabla).

#### Clasificación de migraciones

Cadena completa de `RehniMarket-backend/alembic/versions/` (16 migraciones, de la primera a la `head` `c3e5a7f9d1b2`, que es la revisión de la base medida el 04/11/2026). «Compatible hacia atrás» significa que la versión anterior del backend sigue funcionando con el esquema nuevo, así que el rollback no exige restaurar.

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

#### Prueba de humo (`scripts/smoke-test.sh`)

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

#### Evidencia en el servidor

```
<!-- PENDIENTE: salida de scripts/smoke-test.sh (paso 9) y de `docker compose ps` en el servidor
Ubuntu Server 24.04 (/opt/rehnimarket), con fecha. Requiere crear antes, en ese entorno, una cuenta
de comprador de prueba ya verificada (no usar la de administrador). -->
```

Verificado el 04/11/2026 en el equipo de desarrollo, sin servidor: `caddy adapt` (imagen `caddy:2.11-alpine`) convierte `caddy/Caddyfile` con `SITE_ADDRESS=ejemplo.com` y `API_ADDRESS=api.ejemplo.com` sin políticas TLS propias, es decir, con el emisor automático de Caddy (Let's Encrypt para un dominio público), y con `CADDY_LOCAL_CERTS=local_certs` con el emisor `internal`. El despliegue en el servidor con el compose único no se ha probado: la evidencia de la VM debe repetirse con estos comandos.

### 5.3 Despliegue en la nube

| Componente | Proveedor y plan | Región | Configuración |
|---|---|---|---|
| App (frontend + backend) | <!-- PENDIENTE: proveedor y plan (p. ej. Render free); cuenta del responsable --> | <!-- PENDIENTE --> | <!-- PENDIENTE: Blueprint u opciones del panel --> |
| Base de datos | <!-- PENDIENTE: Neon o Supabase (free tier) --> | <!-- PENDIENTE --> | `URL_DATABASE` en el panel del proveedor, nunca en el repositorio |
| Almacenamiento de imágenes (MinIO) | <!-- PENDIENTE: el backend necesita MinIO o un S3 compatible (`MINIO_URL`); definir dónde corre en la nube --> | <!-- PENDIENTE --> | <!-- PENDIENTE --> |

URL pública: <!-- PENDIENTE: URL del servicio desplegado -->

Procedimiento (pasos numerados): <!-- PENDIENTE: depende del proveedor elegido -->

Método de rollback en el PaaS: <!-- PENDIENTE: depende del proveedor elegido -->

Límites del plan gratuito que afectan al cliente (con fuente y fecha): <!-- PENDIENTE: suspensión por inactividad, horas, almacenamiento y conexiones, con enlace a la página del proveedor y fecha de consulta -->

#### Evidencia

```
<!-- PENDIENTE: salida de `BASE_URL=<url-publica-api> FRONTEND_URL=<url-publica> bash scripts/smoke-test.sh`
contra la nube, con fecha y con una cuenta de prueba verificada en ese entorno. -->
```

### 5.4 Estimación de costos

| Concepto | Alternativa 1: VPS propio (sección 4.1) | Alternativa 2: PaaS + BD gestionada (sección 5.3) |
|---|---|---|
| Total mensual | <!-- PENDIENTE: precio publicado del plan con 2 vCPU / 4 GB / 30 GB SSD o superior (matriz 1.5) --> | <!-- PENDIENTE --> |
| Total anual | <!-- PENDIENTE --> | <!-- PENDIENTE --> |
| Horas de administración al mes | <!-- PENDIENTE --> | <!-- PENDIENTE --> |
| Fuente y fecha | <!-- PENDIENTE: enlaces a las páginas de precios y fecha de consulta --> | <!-- PENDIENTE --> |

Dominio: <!-- PENDIENTE: precio anual del registrador (sección 4.2) -->

Recomendación al cliente: <!-- PENDIENTE: se escribe con los precios reales de las dos alternativas -->
