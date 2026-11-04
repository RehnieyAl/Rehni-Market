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
| 2 | Ambientes | **Desarrollo:** CachyOS, `docker compose up -d` (carga `docker-compose.override.yml`), solo HTTP en `:8080` y API en `:8000`. **Prueba local de HTTPS:** override `docker-compose.tls-local.yml` (sección 4.5). **Producción:** Ubuntu Server 24.04 LTS, `docker-compose.yml` + `deploy/compose.prod.yaml`, HTTPS en `:443`. **Nube:** <!-- PENDIENTE: proveedor y plan (sección 5.3) --> |
| 3 | Roles | Responsable técnico (Yeinher Algarin): ejecuta la instalación, decide el rollback (sección 2.6). Cliente: aprueba el resultado y el reporte de rechazos de la migración (sección 2.6). <!-- PENDIENTE: otros roles (administrador del servidor, contacto del cliente) si los hay --> |
| 4 | Prerrequisitos | Ver sección 1 (ficha técnica): matriz 1.5 y `scripts/verificar-requisitos.sh` con código de salida `0` |
| 5 | Preparación | Ubuntu Server 24.04 LTS con Docker Engine y el plugin Compose instalados según la guía oficial (paso 2 de la instalación inicial), usuario de despliegue en el grupo `docker`, DNS apuntando al servidor (sección 4.3) y puertos 80/443/22 abiertos (sección 4.4) |
| 6 | Procedimiento | Ver sección 5.2 (instalación inicial, actualización y rollback) |
| 7 | Migración de datos | Esquema: el backend aplica `alembic upgrade head` al arrancar (`docker-compose.yml:144`). Datos del sistema anterior: sección 2 (`scripts/migracion/migrar.sh`) |
| 8 | Verificación | `docker compose ps` con los cinco servicios `healthy`, `curl` a `/health/database` y `bash scripts/smoke-test.sh` (sección 5.2) |
| 9 | Rollback | Ver sección 5.2 (rollback) y la clasificación de migraciones |
| 10 | Cronograma | Ver tabla de abajo |

#### Cronograma de la ventana

| Fase | Duración | Acumulado |
|---|---|---|
| Verificar requisitos (`verificar-requisitos.sh`) | <!-- PENDIENTE: medir en el servidor --> | |
| Respaldo previo (`respaldar.sh`) | 1 min 58 s (medido el 04/11/2026 en desarrollo, sección 3.5) | |
| `git pull` + `docker compose ... up -d --build` (incluye `alembic upgrade head`) | <!-- PENDIENTE: medir en el servidor --> | |
| Verificación (`ps`, `/health/database`, `smoke-test.sh`) | <!-- PENDIENTE: medir en el servidor --> | |
| Migración de datos del sistema anterior (si aplica, sección 2) | <!-- PENDIENTE: no hay medición registrada (sección 2.3) --> | |

**Punto de no retorno:** el arranque del backend con la nueva imagen, porque ejecuta `alembic upgrade head` (`docker-compose.yml:144`). Si la versión trae una migración **no compatible hacia atrás** (tabla de clasificación de la sección 5.2), volver a la versión anterior exige restaurar el respaldo previo (sección 3.4) y se pierde lo escrito después de él.

### 5.1 Proceso de liberación

| Paso | Comando o acción | Resultado esperado |
|---|---|---|
| Pruebas en verde | CI del repositorio (`.github/workflows/ci.yml`: ruff, `alembic upgrade head` en BD vacía, pytest, lint, typecheck y vitest del frontend) | Todos los checks pasan en `main` |
| Notas de versión | Actualizar `CHANGELOG.md` de la raíz (sección `[1.0.0]`) | Entrada de la versión con fecha |
| Etiqueta | `git tag -a v1.0.0 -m "RehniMarket 1.0.0"` + `git push origin v1.0.0` <!-- PENDIENTE: la crea el responsable --> | Etiqueta visible en GitHub |
| Imágenes | `git checkout v1.0.0` y `docker compose -f docker-compose.yml -f deploy/compose.prod.yaml build` | `docker image ls` lista `rehni-market-backend` y `rehni-market-frontend` (nombres de `docker-compose.yml:119` y `:166`) |

Esquema de versiones: SemVer `MAJOR.MINOR.PATCH`. MAJOR: cambio incompatible de la API o una migración no compatible hacia atrás; MINOR: funcionalidad nueva compatible; PATCH: corrección sin cambios de contrato.

Las imágenes no llevan la versión en la etiqueta (`docker-compose.yml` usa `image: rehni-market-backend` sin `:tag`): la versión desplegada se identifica por la etiqueta de Git del checkout. <!-- PENDIENTE: decidir si se etiquetan las imágenes con la versión (p. ej. publicar en GHCR en la semana 7) -->

Enlace al `CHANGELOG.md`: [`CHANGELOG.md`](../../CHANGELOG.md) (raíz). El detalle del backend sigue en `RehniMarket-backend/CHANGELOG.md`.

### 5.2 Despliegue en servidor Linux

#### Estructura

```
/opt/rehnimarket/                 ← clon del repositorio (git clone)
├── docker-compose.yml
├── deploy/
│   ├── compose.prod.yaml         ← override de producción
│   ├── Caddyfile                 ← HTTPS automático (Let's Encrypt)
│   └── env.prod.example
├── .env                          ← de deploy/env.prod.example (chmod 600, fuera de Git)
├── .env.postgres                 ← de .env.postgres.example (chmod 600)
├── .env.minio                    ← de .env.minio.example (chmod 600)
├── RehniMarket-backend/.env      ← de RehniMarket-backend/.env.example (chmod 600)
├── backups/                      ← respaldos (copia 1, sección 3.3; excluido de Git)
└── scripts/                      ← verificar-requisitos, respaldar, smoke-test, restore…
```

Los volúmenes de datos (`postgres_data`, `minio_data`, `caddy_data`, `caddy_config`, `backend_venv`) los gestiona Docker (`docker-compose.yml:200-205`), no viven en `/opt`. Los cuatro `.env` están excluidos de Git (`.gitignore:10-11`, `RehniMarket-backend/.gitignore:5-7`).

#### Variables de entorno

Solo nombres y ejemplos ficticios; los valores reales se crean en el servidor.

| Archivo | Variable | Propósito | Ejemplo (ficticio) |
|---|---|---|---|
| `.env` | `SITE_ADDRESS` / `API_ADDRESS` | Dominios que sirve Caddy | `<dominio>` / `api.<dominio>` |
| `.env` | `ACME_EMAIL` | Correo para Let's Encrypt (`deploy/compose.prod.yaml`) | `<correo-del-responsable>` |
| `.env` | `FRONTEND_PORT` | Puerto HTTP publicado por Caddy (`docker-compose.yml:188`) | `80` |
| `.env` | `BACKEND_BIND` / `BACKEND_PORT` | Interfaz y puerto donde se publica la API (`docker-compose.yml:146`) | `127.0.0.1` / `8000` |
| `.env` | `VITE_API_URL` | URL de la API dentro del build del frontend (pública) | `https://api.<dominio>` |
| `.env` | `VITE_REHNIMARKET_WHATSAPP` | Número de contacto mostrado en el frontend (público) | `+57**********` |
| `.env` | `DOCS_ENABLED` | Swagger en `/docs` | `false` |
| `.env` | `CORS_EXTRA_ORIGINS` | Orígenes permitidos por CORS, separados por comas | `https://<dominio>` |
| `.env` | `UVICORN_WORKERS` / `PGBOUNCER_MAX_CLIENT_CONN` | Procesos de la API y clientes que acepta PgBouncer (opcionales, `docker-compose.yml:79,138`) | `3` / `1200` |
| `.env.postgres` | `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciales de PostgreSQL (también las lee PgBouncer) | `rehni_app` / `<secreto>` / `rehnimarket` |
| `.env.minio` | `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | Credenciales de MinIO (también las lee el backend) | `rehni_minio` / `<secreto>` |
| `RehniMarket-backend/.env` | `URL_DATABASE` | Cadena de conexión a PostgreSQL; la contraseña debe coincidir con `.env.postgres` (README, «Configurar variables de entorno») | `postgresql://rehni_app:<secreto>@postgres:5432/rehnimarket` |
| `RehniMarket-backend/.env` | `SECRET_KEY` / `ALGORITHM` / `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_DAYS` | Firma y vigencia de los JWT | `<secreto>` / `HS256` / `30` / `15` (valores de `RehniMarket-backend/.env.example:4-6`) |
| `RehniMarket-backend/.env` | `GMAIL_USERNAME` / `GMAIL_APP_PASSWORD` | Cuenta que envía los correos transaccionales | `<cuenta>` / `<secreto>` |
| `RehniMarket-backend/.env` | `URL_FRONTEND` / `URL_BACKEND` | URL públicas para enlaces de correo e imágenes | `https://<dominio>` / `https://api.<dominio>` |
| `RehniMarket-backend/.env` | `MINIO_URL` | Dirección de MinIO dentro de la red de Docker | `minio:9000` (`.env.example:14`) |
| `RehniMarket-backend/.env` | `RATE_LIMIT_ENABLED` | Activa el límite de peticiones (`false` en `.env.example:16`) | `true` |
| `RehniMarket-backend/.env` | `USER_NAME_ADMIN` / `ADMIN_DEFAULT` / `PASSWORD_DEFAULT` y `USER_NAME_OWNER` / `OWNER_DEFAULT` / `OWNER_PASSWORD_DEFAULT` | Cuentas iniciales de administrador y owner | `<nombre>` / `<correo>` / `<secreto>` |
| `RehniMarket-backend/.env` | `RUN_SEED` | Carga de datos de ejemplo al arrancar | `false` |

Opcional: `URL_DATABASE_POOLED` (`RehniMarket-backend/.env`), la conexión a través de PgBouncer (`pgbouncer:6432`) que usa el backend en tiempo de ejecución (`app/database/Connection.py:16`). Si no se define, usa `URL_DATABASE` (`app/Config.py:28`). El README la menciona, pero no aparece en `RehniMarket-backend/.env.example`. <!-- PENDIENTE: confirmar el valor en el .env real del servidor (con PgBouncer debe apuntar a pgbouncer:6432) -->

#### Instalación inicial

Comandos de los pasos 2 y 3: guía oficial de Docker, <https://docs.docker.com/engine/install/ubuntu/> (Ubuntu Noble 24.04 LTS aparece entre las versiones admitidas) y <https://docs.docker.com/engine/install/linux-postinstall/>, consultadas el 04/11/2026.

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | Clonar el repositorio en `/opt` | `sudo mkdir -p /opt/rehnimarket && sudo chown "$USER" /opt/rehnimarket && git clone https://github.com/RehnieyAl/Rehni-Market.git /opt/rehnimarket && cd /opt/rehnimarket && git checkout v1.0.0` | Repositorio en `/opt/rehnimarket`, en la etiqueta `v1.0.0` |
| 2 | Instalar Docker Engine y Compose | Repositorio `apt` de Docker según la guía oficial y `sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin` | `sudo docker run hello-world` muestra el mensaje de prueba |
| 3 | Usar Docker sin `sudo` | `sudo groupadd docker` (si no existe), `sudo usermod -aG docker $USER` y volver a iniciar sesión (o `newgrp docker`) | `docker run hello-world` funciona sin `sudo`. La guía advierte que el grupo `docker` da privilegios equivalentes a root |
| 4 | Verificar requisitos | `PORTS="80 443" bash scripts/verificar-requisitos.sh` | Tabla con todo en `CUMPLE` y código de salida `0` |
| 5 | Crear la configuración | `cp deploy/env.prod.example .env`, `cp .env.postgres.example .env.postgres`, `cp .env.minio.example .env.minio`, `cp RehniMarket-backend/.env.example RehniMarket-backend/.env`, editar los valores y `chmod 600 .env .env.postgres .env.minio RehniMarket-backend/.env` | Cuatro archivos con permisos `-rw-------`; `git status` no los muestra |
| 6 | Levantar los servicios | `docker compose -f docker-compose.yml -f deploy/compose.prod.yaml up -d --build` | Termina sin errores; el backend aplica `alembic upgrade head` al arrancar |
| 7 | Comprobar la salud | `docker compose -f docker-compose.yml -f deploy/compose.prod.yaml ps` | Los cinco servicios en `healthy` |
| 8 | Comprobar HTTPS y la API | `curl -fsS https://api.<dominio>/health/database` y `curl -fsS -o /dev/null -w "%{http_code}\n" https://<dominio>/` | Respuesta de la base de datos y `200` |
| 9 | Prueba de humo | `bash scripts/smoke-test.sh` | Resumen con `[FALLA]` en 0 |
| 10 | Primer respaldo | `bash scripts/respaldar.sh` | `=== FIN backup <TS> — OK ===` |

#### Actualización

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | Respaldo previo | `bash scripts/respaldar.sh` | `=== FIN backup <TS> — OK ===`; anotar el `TS` |
| 2 | Revisar las migraciones nuevas | `git fetch --tags && git diff --stat <versión-actual> <versión-nueva> -- RehniMarket-backend/alembic/versions` | Lista de migraciones nuevas; clasificarlas con la tabla de abajo |
| 3 | Cambiar de versión | `git checkout <versión-nueva>` | `git describe --tags` muestra la versión nueva |
| 4 | Reconstruir y levantar | `docker compose -f docker-compose.yml -f deploy/compose.prod.yaml up -d --build` | Contenedores recreados; el backend aplica las migraciones nuevas |
| 5 | Verificar | `... ps`, `curl -fsS https://api.<dominio>/health/database` y `bash scripts/smoke-test.sh` | Cinco servicios `healthy` y prueba de humo sin fallos |

#### Rollback

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | Decidir el tipo de rollback | Revisar la clasificación de las migraciones que trajo la versión | Si todas son compatibles hacia atrás: pasos 2-3. Si alguna no lo es: pasos 4-5 |
| 2 | Volver al código anterior | `git checkout <versión-anterior>` | `git describe --tags` muestra la versión anterior |
| 3 | Reconstruir sin bajar el esquema | `docker compose -f docker-compose.yml -f deploy/compose.prod.yaml up -d --build` | Cinco servicios `healthy`. La base queda en la revisión nueva, que la versión anterior tolera |
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

#### Evidencia

```
<!-- PENDIENTE: salida de `bash scripts/smoke-test.sh` y de `docker compose ... ps` en el servidor
Ubuntu Server 24.04 (/opt/rehnimarket), con fecha. No se ejecutó en esta sesión: no hay servidor, y
acceptance_smoke.sh registra un comprador acc.<TS>@gmail.com, lo que dispararía un correo de
verificación real. -->
```

Verificado el 04/11/2026 en el equipo de desarrollo, sin servidor: `docker compose -f docker-compose.yml -f deploy/compose.prod.yaml config` resuelve el montaje de `deploy/Caddyfile` y los puertos `80` y `443`, y `caddy validate` (imagen `caddy:2.11-alpine`) da `Valid configuration` para `deploy/Caddyfile`. El despliegue en sí no se probó.

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
<!-- PENDIENTE: salida de una prueba de humo contra la URL pública, con fecha. scripts/smoke-test.sh
no sirve tal cual en un PaaS: lee el código de verificación con `docker exec` en el contenedor de
PostgreSQL (variable PGC). -->
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
