<!--
Fuente editable del entregable 01 (Criterio SENA 1). Genera:
docs/01_MODULO_A_DESPLIEGUE/01_Plataforma_e_Infraestructura.docx
Solo informacion verificable en el repositorio, el codigo y las evidencias reales.
-->

# PORTADA

SERVICIO NACIONAL DE APRENDIZAJE — SENA

PROGRAMA: TECNOLOGO EN ANALISIS Y DESARROLLO DE SOFTWARE (ADSO)

TRIMESTRE: SEXTO

---

## PREPARACION DE PLATAFORMA E INFRAESTRUCTURA

PROYECTO REHNIMARKET — PLATAFORMA DE COMERCIO ELECTRONICO TIPO MARKETPLACE

CRITERIO DE EVALUACION SENA: 1 — PREPARACION DE PLATAFORMA E INFRAESTRUCTURA

---

Autor: RehnieyAL (Yeinher Algarin) — desarrollador unico del proyecto

Instructor: ____________________________ (dato no disponible en la documentacion del proyecto)

Ficha / grupo: ____________________________ (dato no disponible)

Ciudad: ____________________________ (dato no disponible)

Anio: 2026

Repositorio: https://github.com/RehnieyAl/Rehni-Market.git

Rama analizada: feature/owner — ultimo commit publicado: 917a647 ("ver 2.4")

Fecha de elaboracion de este documento: 2026-08-31

<!-- PAGEBREAK -->

# TABLA DE CONTENIDO

<!-- TOC -->

<!-- PAGEBREAK -->

# LISTA DE TABLAS

<!-- LISTA-TABLAS -->

<!-- PAGEBREAK -->

# LISTA DE FIGURAS

<!-- LISTA-FIGURAS -->

<!-- PAGEBREAK -->

# NOTA SOBRE LA CONFIGURACION DOCKER

Este documento se elaboro cuando la configuracion endurecida se distribuia como `docker-compose.prod.yml`, `RehniMarket-frontend/Dockerfile.prod`, `RehniMarket-backend/.env.prod` y `.env.prod.example`, junto a un `docker-compose.yml` de desarrollo. Los nombres se normalizaron despues. Donde este documento diga los nombres antiguos, leanse los normalizados:

| Antes | Ahora |
|---|---|
| docker-compose.prod.yml | docker-compose.yml (configuracion por defecto) |
| docker-compose.yml (desarrollo) | docker-compose.dev.yml |
| RehniMarket-frontend/Dockerfile.prod | RehniMarket-frontend/Dockerfile |
| RehniMarket-frontend/Dockerfile (dev) | RehniMarket-frontend/Dockerfile.dev |
| RehniMarket-backend/.env.prod | RehniMarket-backend/.env |
| RehniMarket-backend/.env (dev) | RehniMarket-backend/.env.dev |
| RehniMarket-backend/.env.prod.example | RehniMarket-backend/.env.public.example |
| imagenes rehni-market-backend:prod / rehni-market-frontend:prod | rehni-market-backend / rehni-market-frontend |
| contenedores rehni-backend-prod / rehni-frontend-prod | rehni-backend / rehni-frontend |
| volumen minio_prod_data | minio_data |

Se levanta con `docker compose up -d` (sin `-f`). La evidencia `evidencias/deployment/10_prod_compose_smoke.txt` conserva el nombre antiguo por ser un registro historico de esa prueba.

<!-- PAGEBREAK -->

# 1. INTRODUCCION

Este documento describe la plataforma tecnologica y la infraestructura necesarias para ejecutar el proyecto RehniMarket, una plataforma de comercio electronico de tipo marketplace compuesta por un backend de API REST, un frontend web y una aplicacion movil. Cubre las caracteristicas del entorno de ejecucion, el software requerido con sus versiones reales, la arquitectura empleada, los servicios que componen el sistema, los puertos, las dependencias, las variables de entorno y el procedimiento de verificacion de la infraestructura.

Toda la informacion proviene de archivos reales del repositorio (`docker-compose.yml`, `Dockerfile`, `pyproject.toml`, `uv.lock`, `package.json`, `.python-version`, `.env.example`) y de mediciones efectivamente realizadas el 2026-08-31 sobre el equipo de validacion, cuya evidencia se encuentra en la carpeta `evidencias/` del repositorio. Cuando un dato no esta definido oficialmente en el proyecto, se indica de forma expresa como PENDIENTE o "sin especificacion oficial".

# 2. ALCANCE

El flujo de despliegue soportado por el proyecto es el levantamiento de toda la plataforma de servidor mediante Docker Compose. La aplicacion movil se prepara aparte con Node, pnpm y Expo, y se ejecuta con Expo Go sobre un dispositivo Android en la misma red local.

Este documento NO establece un dimensionamiento oficial de hardware de produccion: el proyecto no lo define y no existe una campana de pruebas de carga que lo sustente. Lo que si se documenta es la medicion real del equipo en el que se ejecuto y valido el sistema.

# 3. ARQUITECTURA UTILIZADA

RehniMarket sigue una arquitectura cliente-servidor de tres capas, contenerizada con Docker Compose. Los clientes (frontend web y aplicacion movil) se comunican por HTTP/JSON con el backend. El backend concentra toda la logica de negocio y se comunica con PostgreSQL para los datos relacionales, con MinIO para los binarios (imagenes, certificados) y con un servidor SMTP de Gmail para el correo transaccional. La autoridad sobre precios, stock, saldos, estados de pedido y permisos reside siempre en el backend.

[[FIGURA]] Esquema de comunicacion entre componentes (representacion textual).

```
  +-------------------+           +--------------------+
  |   Frontend web    |           | Aplicacion movil   |
  |  (React + Vite)   |           |  (Expo / RN)       |
  +---------+---------+           +---------+----------+
            |  HTTP / JSON                 |  HTTP / JSON
            |  (VITE_API_URL)              |  (EXPO_PUBLIC_API_URL)
            +--------------+---------------+
                           v
                +----------------------+
                |   Backend API REST   |
                |   FastAPI (Python)   |
                +---+------+-------+----+
                    |      |       |
        URL_DATABASE|      | SDK   | smtplib (STARTTLS)
                    v      v MinIO v
          +-----------+ +--------+ +------------------+
          | PostgreSQL| | MinIO  | | SMTP Gmail :587  |
          |    17     | | uploads| |                  |
          +-----------+ +--------+ +------------------+

  El navegador nunca contacta directamente con MinIO: las imagenes se sirven
  por el proxy GET /media/proxy?path=... del propio backend.
```

Fuente: elaboracion propia a partir del codigo (`src/api/Client.ts`, `src/config/env.ts`, `app/database/Connection.py`, `app/services/NasService.py`) y de `docker-compose.yml`.

## 3.1 Capas del backend

El backend aplica una arquitectura por capas de forma consistente: enrutado (`app/routers/`, define endpoints y valida la entrada con Pydantic), servicios (`app/services/`, logica de negocio), repositorio (`app/repository/`, acceso a datos con SQLAlchemy), modelos (`app/models/`, entidades ORM) y configuracion transversal (`app/core/`: catalogo de errores, tasa de IVA, porcentaje de comision). El punto de entrada es `app/main.py`, que crea la aplicacion FastAPI y registra 24 routers.

# 4. CARACTERISTICAS DEL ENTORNO DE EJECUCION

## 4.1 Aviso sobre requisitos de hardware

El repositorio no define una especificacion oficial de hardware: no hay limites de recursos en `docker-compose.yml` ni manifiestos de despliegue. Se distinguen tres cosas:

- Requisitos minimos oficiales: NO EXISTEN. Determinarlos con rigor exige una campana de pruebas de carga que el proyecto no tiene (ver el documento 08 y el criterio 8).
- Medido en el equipo de validacion: SI existe, es una medicion real del 2026-08-31 con el stack levantado.
- Recomendado para este entorno: derivado de la medicion anterior, no es un minimo oficial.

## 4.2 Medicion real del equipo de validacion (2026-08-31)

Equipo real donde el stack se levanto, se ejecuto la suite de pruebas y se valido el respaldo y la restauracion. Evidencia: `evidencias/hardware/entorno_medido.txt`.

[[TABLA]] Recursos medidos del equipo de validacion.

| Recurso | Valor medido |
|---|---|
| CPU | 12 hilos (x86-64) |
| RAM total | 7,0 GiB |
| Disco | NVMe 128 GB (aprox. 79 GB libres) |
| Sistema operativo / kernel | CachyOS Linux, kernel 7.1.4 |
| Docker Engine / Docker Compose | 29.6.2 / 5.3.1 |
| Imagenes Docker del proyecto (tamanio) | backend 707 MB; frontend 276 MB; postgres:17-alpine 424 MB; minio/minio:latest 240 MB; python:3.13-slim 176 MB |
| Espacio total de imagenes (docker system df) | aprox. 10,4 GB |
| RAM de los 4 contenedores en reposo (docker stats) | backend aprox. 154 MiB; postgres aprox. 66 MiB; minio aprox. 117 MiB; frontend aprox. 276 MiB; total aprox. 613 MiB |

Datos de negocio en la validacion: base de datos `rehnimarket` aprox. 10 MB, 37 tablas; bucket MinIO `uploads` aprox. 8,8 MiB, 166 objetos.

## 4.3 Recomendado para este entorno (desarrollo / demostracion)

Derivado de la medicion anterior; no es un minimo oficial.

[[TABLA]] Recursos recomendados para el entorno de desarrollo y demostracion.

| Componente | Recomendado | Justificacion (medicion real) |
|---|---|---|
| CPU | 2 nucleos suficientes; 4 o mas comodo | Los 4 contenedores en reposo apenas usan CPU; el pico es al construir imagenes y al correr pytest. |
| RAM | 4 GB funcional; 8 GB comodo con editor y navegador | Los contenedores usan aprox. 0,6 GB; el resto es para el sistema operativo, el IDE, el navegador y los watchers de Vite. |
| Almacenamiento | 15 GB libres; 25 GB o mas comodo | Aprox. 10,4 GB de imagenes Docker mas volumenes (menos de 1 GB hoy, crece con las imagenes subidas a MinIO) mas node_modules. |
| Red | Conexion a Internet | Descarga de imagenes y dependencias; GET /health/internet y SMTP saliente (puerto 587). |
| Dispositivo movil de prueba | Android con Expo Go en la misma red local | Documentado en `RehniMarket-mobile/README.md`. |

## 4.4 Entorno de servidor / produccion — sin especificacion oficial

El proyecto no tiene requisitos minimos oficiales de produccion y no se ha desplegado en produccion. Lo siguiente son estimaciones de partida a validar con pruebas de carga (k6/locust) antes de comprometerlas en un acuerdo de nivel de servicio.

[[TABLA]] Estimacion de partida para un entorno de servidor (NO oficial).

| Componente | Estimacion de partida | Como confirmarlo |
|---|---|---|
| CPU | 2 vCPU | docker stats bajo carga representativa (k6 sobre catalogo y checkout). |
| RAM | 2 a 4 GB | docker stats mas pg_stat_activity bajo carga. |
| Almacenamiento | SSD; partir de 20 GB y dimensionar el crecimiento del volumen de MinIO. | Medir el tamanio medio real de las imagenes subidas. |
| Sistema operativo | Linux LTS de servidor (Ubuntu Server LTS / Debian stable) con Docker Engine. | — |
| Red / puertos | Solo 443 al exterior (reverse proxy con TLS). NO publicar 5434 (PostgreSQL) ni 9000 (MinIO). | Ver el documento 03. |

# 5. SOFTWARE REQUERIDO Y VERSIONES REALES

Solo se listan versiones comprobables en archivos del proyecto. Cuando una version no esta fijada, se indica.

[[TABLA]] Software del entorno y del sistema, con version y proposito.

| Software | Version (segun el proyecto) | Proposito | Obligatorio |
|---|---|---|---|
| Docker Engine | No fijada en el proyecto (validado con 29.6.2) | Ejecutar los contenedores del stack | Si |
| Docker Compose | Sintaxis Compose v2 (archivo sin `version:`; validado con 5.3.1) | Orquestar minio, postgres, backend, frontend | Si |
| PostgreSQL | 17 (`postgres:17-alpine` en `docker-compose.yml`) | Base de datos relacional | Si |
| MinIO | `minio/minio:latest` (version exacta no fijada en dev; fijada por digest en prod) | Almacenamiento de objetos (imagenes, certificados) | Si |
| Python | 3.13 (`.python-version`, `pyproject.toml`, `python:3.13-slim`) | Runtime del backend | Si (backend) |
| uv (Astral) | No fijada (`ghcr.io/astral-sh/uv:latest`) | Gestor de dependencias y ejecutor del backend | Si (backend) |
| FastAPI | 0.135.1 | Framework de la API | Si |
| Uvicorn | 0.41.0 | Servidor ASGI | Si |
| SQLAlchemy | 2.0.48 | ORM | Si |
| Alembic | 1.18.4 | Migraciones de base de datos | Si |
| psycopg2-binary | 2.9.11 | Driver PostgreSQL | Si |
| python-jose | 3.5.0 | Firma y verificacion de JWT (HS256) | Si |
| passlib | 1.7.4 | Hash de contrasenas (bcrypt) | Si |
| minio (SDK Python) | 7.2.20 | Cliente de MinIO | Si |
| Pydantic | 2.12.5 | Validacion de datos | Si |
| Jinja2 | 3.1.6 | Plantillas de correo | Si |
| Node.js | 22 (`node:22-alpine` en `RehniMarket-frontend/Dockerfile`) | Build y dev server del frontend | Si (frontend) |
| pnpm | 11.15.0 (frontend, `corepack prepare`) | Gestor de paquetes del frontend | Si (frontend) |
| React / React DOM | 19.2.7 | UI del frontend web | Si |
| Vite | 8.1.0 | Bundler / dev server del frontend | Si |
| TypeScript | ~6.0.2 (frontend) / ^5.3.3 (movil) | Tipado estatico | Si (build) |
| TailwindCSS | 4.3.2 | Estilos del frontend | Si (build) |
| Expo | ~54.0.1 (instalado 54.0.37) | Plataforma de la app movil | Si (movil) |
| React Native | 0.81.5 | Runtime movil | Si (movil) |
| Expo Router | ~6.0.0 | Enrutado de la app movil | Si (movil) |
| Nginx | 1.27-alpine (`RehniMarket-frontend/Dockerfile.prod`) | Servir el SPA compilado en produccion | Si (produccion) |
| Git | No fijada en el proyecto | Control de versiones y clonado | Si |
| Cuenta de Gmail con "contrasena de aplicacion" | — | Envio de correos por SMTP (`smtp.gmail.com:587`) | Si (funcionalidad de correo) |

Sistema operativo: los contenedores son Linux (imagenes `*-alpine` y `*-slim`). El repositorio no especifica una distribucion concreta para el host de produccion (PENDIENTE). La maquina de desarrollo utilizada es CachyOS Linux, kernel 7.1.4.

# 6. SERVICIOS NECESARIOS PARA EJECUTAR REHNIMARKET

El archivo `docker-compose.yml` de la raiz define cuatro servicios. La aplicacion movil no esta contenerizada y no aparece en `docker-compose.yml`.

[[TABLA]] Servicios de la orquestacion Docker de desarrollo.

| Servicio | Imagen | Rol | Persistencia | Reinicio |
|---|---|---|---|---|
| minio | minio/minio:latest | Almacenamiento de objetos S3 (bucket `uploads`) | Volumen `minio_rehni_data` en `/data` | restart: always |
| postgres | postgres:17-alpine | Base de datos relacional | Volumen `postgres_rehni_data` en `/var/lib/postgresql/data` | restart: always |
| backend | build ./RehniMarket-backend (python:3.13-slim + uv) | API REST FastAPI; aplica migraciones al arrancar | — | restart: always |
| frontend | build ./RehniMarket-frontend (node:22-alpine) | SPA React servida por el dev server de Vite | Volumen `frontend_node_modules` | — |

Orden de arranque: el servicio `backend` depende de `postgres` y `minio`; el servicio `frontend` depende de `backend`. El bucket `uploads` lo crea el backend en su arranque (`ensure_bucket()` en el `lifespan` de FastAPI); si MinIO no responde, el backend registra una advertencia y continua.

El comando del servicio backend es:

```
sh -c "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
```

El comando del servicio frontend es:

```
sh -c "pnpm install && pnpm dev --host 0.0.0.0 --port 5173"
```

# 7. PUERTOS

[[TABLA]] Puertos del stack de desarrollo.

| Servicio | Puerto en el contenedor | Puerto publicado en el host | Uso |
|---|---|---|---|
| backend | 8000 | 8001 | API REST y documentacion (`/docs`, `/openapi.json`) |
| frontend | 5173 | 5173 | Aplicacion web (dev server de Vite) |
| postgres | 5432 | 5434 | Conexion a la base de datos desde el host |
| minio | 9000 | 9000 | API S3 de MinIO (la consola web no se publica) |

Dentro de la red de Compose los servicios se resuelven por nombre: el backend usa `postgres:5432` y `minio:9000`. En produccion, PostgreSQL y MinIO no publican puertos en el host (ver el documento 03).

# 8. DEPENDENCIAS

- Backend: definidas en `pyproject.toml` y bloqueadas de forma reproducible en `uv.lock`. La imagen se construye con `uv sync --frozen --no-dev`. El grupo `dev` incluye `pytest`, `pytest-cov` y `pip-audit`.
- Frontend web: definidas en `package.json` y bloqueadas en `pnpm-lock.yaml`. Existe `pnpm-workspace.yaml`.
- Aplicacion movil: definidas en `RehniMarket-mobile/package.json` y bloqueadas en `pnpm-lock.yaml`.
- Auditoria de dependencias ejecutada el 2026-08-31: `pip-audit` en el backend redujo las vulnerabilidades conocidas de 8 a 1 (la restante, `ecdsa`, sin parche disponible y no explotable porque el proyecto firma los JWT con HS256). Evidencia: `evidencias/security/pip-audit.txt`. El detalle de seguridad esta en los documentos 04, 08 y 09.

# 9. VARIABLES DE ENTORNO

Ningun valor secreto real se incluye en este documento. El backend lee sus variables de un unico archivo `RehniMarket-backend/.env`, consumido tambien por los servicios `postgres` y `minio` (los tres tienen `env_file` en `docker-compose.yml`).

[[TABLA]] Variables de entorno del backend (`RehniMarket-backend/.env`).

| Variable | Para que sirve | Obligatoria | Ejemplo seguro |
|---|---|---|---|
| URL_DATABASE | Cadena de conexion SQLAlchemy a PostgreSQL. Usa el host `postgres` de la red de Compose. | Si | postgresql://usuario:CLAVE@postgres:5432/rehnimarket |
| POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB | Credenciales y nombre de la base que crea la imagen `postgres` al inicializar el volumen. | Si | rehni_app / CLAVE / rehnimarket |
| MINIO_ROOT_USER / MINIO_ROOT_PASSWORD | Credenciales raiz de MinIO (las usa el contenedor y el SDK del backend). | Si | ACCESS_KEY / SECRET_KEY |
| MINIO_URL | Endpoint interno de MinIO (contenedor a contenedor). | Si | minio:9000 |
| URL_BACKEND | URL del backend visible desde el navegador; base de `/media/proxy`. Debe coincidir con VITE_API_URL. | Si | http://localhost:8001 |
| URL_FRONTEND | Origen real del frontend; se usa en CORS y en los enlaces de los correos. | Si | http://localhost:5173 |
| SECRET_KEY | Clave simetrica para firmar los JWT (HS256). Generar con `openssl rand -hex 32`. | Si | (valor propio por entorno) |
| ALGORITHM / ACCESS_TOKEN_EXPIRE_MINUTES / REFRESH_TOKEN_DAYS | Algoritmo y expiraciones de los tokens. | Si | HS256 / 30 / 15 |
| GMAIL_USERNAME / GMAIL_APP_PASSWORD | Cuenta de Gmail y contrasena de aplicacion para SMTP. | Si (correo) | cuenta@gmail.com / (contrasena de aplicacion) |
| RATE_LIMIT_ENABLED | Activa el middleware de limitacion de tasa (por defecto false en desarrollo). | Si | false |
| RUN_SEED | true ejecuta la carga inicial de datos en el arranque; false la desactiva. | Si | false |
| USER_NAME_ADMIN / ADMIN_DEFAULT / PASSWORD_DEFAULT | Cuenta administradora por defecto (solo si RUN_SEED=true). | Solo con seed | — |
| USER_NAME_OWNER / OWNER_DEFAULT / OWNER_PASSWORD_DEFAULT | Cuenta owner por defecto (solo si RUN_SEED=true). | Solo con seed | — |

Nota de desalineacion documentada: el `.env.example` usa nombres de variables de seed distintos a los del `.env` real y este ultimo incluye una variable `IP` que el codigo no lee. Al preparar un entorno nuevo, tomar como referencia las variables que realmente lee `app/Config.py`, listadas arriba.

[[TABLA]] Variables de entorno de los clientes.

| Componente | Variable | Para que sirve |
|---|---|---|
| Frontend web | VITE_API_URL | URL base del backend para axios (`src/api/Client.ts`). |
| Frontend web | VITE_REHNIMARKET_WHATSAPP | Numero de WhatsApp (solo digitos) para solicitudes de recarga de RehniCoin. Informacion publica. |
| Aplicacion movil | EXPO_PUBLIC_API_URL | URL base del backend. No puede ser `localhost` en un dispositivo fisico: debe ser la IP del equipo que corre el backend. |
| Aplicacion movil | EXPO_PUBLIC_REHNIMARKET_WHATSAPP | Numero de WhatsApp para recarga (equivalente al de la web). |

# 10. REQUISITOS DE EJECUCION

Instalar en el host: Git, Docker Engine y el plugin Docker Compose v2. Para la aplicacion movil, ademas: Node.js, pnpm (`corepack enable`) y Expo Go en un Android de la misma red.

Preparacion:

```
git clone https://github.com/RehnieyAl/Rehni-Market.git
cd Rehni-Market
cp RehniMarket-backend/.env.example RehniMarket-backend/.env     # editar valores
cp RehniMarket-frontend/.env.example RehniMarket-frontend/.env   # definir VITE_API_URL
docker compose build
docker compose up -d
docker compose ps
```

Las migraciones de la base de datos se aplican automaticamente en el arranque del contenedor `backend`. La carga inicial de datos es opcional: se activa poniendo `RUN_SEED=true` y reiniciando el backend, y luego se vuelve a `RUN_SEED=false`. El seed crea roles, catalogos, atributos, transportadoras y las cuentas admin/owner por defecto; la carga de empresas y productos de ejemplo esta comentada en el codigo.

# 11. VERIFICACION DE LA INFRAESTRUCTURA

## 11.1 Comandos reales de verificacion

Los siguientes comandos son los efectivamente utilizados para verificar el entorno el 2026-08-31. Su salida se encuentra en `evidencias/deployment/`.

```
# Herramientas del host
git --version
docker --version
docker compose version

# Levantar y comprobar los servicios
docker compose up -d
docker compose ps                       # los 4 contenedores en estado "Up"; postgres/minio/backend "healthy"

# Salud del backend y de la base de datos
curl http://localhost:8001/health/database        # {"Base de datos":"OK"}
curl http://localhost:8001/health/internet        # {"message":"Conexion a Internet exitosa"}

# Documentacion y esquema de la API
curl -o /dev/null -w '%{http_code}' http://localhost:8001/docs           # 200
curl http://localhost:8001/openapi.json                                  # title "RehniMarket API", version 2.4.0, 130 rutas

# Frontend y MinIO
curl -o /dev/null -w '%{http_code}' http://localhost:5173/               # 200
curl -o /dev/null -w '%{http_code}' http://localhost:9000/minio/health/live   # 200

# Revision de migraciones aplicada
docker exec rehni-backend uv run alembic current    # a1b2c3d4e5f6 (head)

# Recursos del entorno
lscpu ; free -h ; df -h / ; docker system df ; docker stats --no-stream
```

## 11.2 Resultado de la verificacion (2026-08-31)

[[TABLA]] Resultado de la verificacion de infraestructura.

| Comprobacion | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|
| docker compose up -d | 4 contenedores levantados | EJECUTADO | evidencias/deployment/01_docker_compose_ps.txt |
| docker compose ps | backend, minio y postgres "healthy"; frontend "Up" | EJECUTADO | evidencias/deployment/01_docker_compose_ps.txt |
| GET /health/database | {"Base de datos":"OK"} | EJECUTADO | evidencias/deployment/03_health_endpoints.txt |
| GET /health/internet | {"message":"Conexion a Internet exitosa"} | EJECUTADO | evidencias/deployment/03_health_endpoints.txt |
| GET /docs | HTTP 200 | EJECUTADO | evidencias/deployment/03_health_endpoints.txt |
| GET /openapi.json | title "RehniMarket API", version 2.4.0, 130 rutas | EJECUTADO | evidencias/deployment/03_health_endpoints.txt |
| GET /public/products?limit=2 | HTTP 200, total 26 productos | EJECUTADO | evidencias/deployment/03_health_endpoints.txt |
| Frontend http://localhost:5173/ | HTTP 200 | EJECUTADO | evidencias/deployment/03_health_endpoints.txt |
| MinIO /minio/health/live | HTTP 200 | EJECUTADO | evidencias/deployment/03_health_endpoints.txt |
| alembic current | a1b2c3d4e5f6 (head) | EJECUTADO | evidencias/deployment/08_alembic_current.txt |
| Medicion de recursos del equipo | 12 hilos, 7,0 GiB RAM, NVMe 128 GB; contenedores aprox. 613 MiB en reposo | EJECUTADO | evidencias/hardware/entorno_medido.txt |
| Requisitos oficiales de produccion | No definidos por el proyecto | PENDIENTE (requiere campana de carga) | — |

## 11.3 Checklist de verificacion para un entorno nuevo

Los siguientes items deben comprobarse en el entorno concreto de despliegue (este documento no puede marcarlos por adelantado):

- Sistema operativo Linux con Docker Engine (`docker --version`).
- Plugin Docker Compose v2 disponible (`docker compose version`).
- `RehniMarket-backend/.env` creado con todas las variables que lee `app/Config.py`.
- `URL_DATABASE` usa host `postgres` y credenciales coincidentes con POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB.
- `SECRET_KEY` con un valor propio y robusto (no el de ejemplo).
- `docker compose build` finaliza sin errores.
- `docker compose ps` muestra los 4 contenedores en estado "Up".
- `GET /health/database` responde OK.
- En los logs del backend aparece `alembic upgrade head` sin error.
- El frontend carga en `http://localhost:5173`.
- Los logs del backend no muestran la advertencia de no poder crear el bucket `uploads`.

# 12. EVIDENCIAS REPRODUCIBLES

Todas las evidencias son reproducibles con los comandos de la seccion 11.1. No hay capturas de navegador (las de la interfaz requieren interaccion manual y se listan en el documento 06).

[[TABLA]] Evidencias del criterio 1.

| Evidencia | Tipo | Ubicacion | Que demuestra | Estado |
|---|---|---|---|---|
| 01_docker_compose_ps.txt | Salida de comando | evidencias/deployment/ | Los 4 servicios levantan y las comprobaciones de salud pasan | EJECUTADO |
| 02_compose_up.txt | Salida de comando | evidencias/deployment/ | Arranque previo del stack | EJECUTADO |
| 03_health_endpoints.txt | Salida de comando | evidencias/deployment/ | Salud de base de datos, Internet, /docs, /openapi.json, frontend, MinIO | EJECUTADO |
| 05_logs_postgres.txt / 06_logs_minio.txt / 07_logs_frontend.txt | Logs de contenedor | evidencias/deployment/ | Arranque correcto de cada servicio | EJECUTADO |
| 08_alembic_current.txt | Salida de comando | evidencias/deployment/ | Revision de esquema en la cabeza (a1b2c3d4e5f6) | EJECUTADO |
| 09_stack_post_rebuild.txt | Salida de comando | evidencias/deployment/ | Estado del stack tras reconstruir con dependencias actualizadas | EJECUTADO |
| entorno_medido.txt | Salida de comando | evidencias/hardware/ | Recursos reales del equipo de validacion | EJECUTADO |
| Captura de docker compose ps y de /docs en el navegador | Captura de pantalla | docs/evidencias/01_infraestructura/ | Estado visual del stack durante la sustentacion | PENDIENTE (capturar en la sustentacion) |

# 13. LIMITACIONES Y PENDIENTES

- No existe una especificacion oficial de hardware de produccion. Requiere una campana de pruebas de carga (documento 08 / criterio 8).
- El stack de desarrollo (`docker-compose.yml`) usa modo desarrollo: `uvicorn --reload`, dev server de Vite, bind mounts y puertos de base de datos y MinIO publicados. La configuracion de produccion endurecida existe y esta probada (documento 03), pero el despliegue real en un servidor con TLS esta PENDIENTE.
- La aplicacion movil no tiene empaquetado nativo configurado (sin `eas.json`, sin carpetas `android/` o `ios/`); su uso soportado es mediante Expo Go.

# 14. CONCLUSION

La plataforma de servidor de RehniMarket esta completamente contenerizada y es reproducible con un unico comando (`docker compose up -d`). Las versiones de todo el software estan fijadas de forma reproducible en archivos del repositorio. El entorno se verifico el 2026-08-31 con comandos reales cuya salida esta versionada en `evidencias/deployment/` y `evidencias/hardware/`: los cuatro servicios levantan, las comprobaciones de salud pasan y el esquema de la base de datos esta en la revision de cabeza. El unico elemento sin resolver a nivel de infraestructura es el dimensionamiento oficial de produccion, que depende de una campana de pruebas de carga aun no ejecutada.
