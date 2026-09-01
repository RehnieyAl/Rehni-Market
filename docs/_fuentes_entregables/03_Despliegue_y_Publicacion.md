<!-- Fuente del entregable 03 (Criterio SENA 3). Solo informacion verificable. -->

# PORTADA

SERVICIO NACIONAL DE APRENDIZAJE — SENA

PROGRAMA: TECNOLOGO EN ANALISIS Y DESARROLLO DE SOFTWARE (ADSO)

TRIMESTRE: SEXTO

---

## DESPLIEGUE Y PUBLICACION

PROYECTO REHNIMARKET — PLATAFORMA DE COMERCIO ELECTRONICO TIPO MARKETPLACE

CRITERIO DE EVALUACION SENA: 3 — DESPLIEGUE Y PUBLICACION

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

Este documento se elaboro cuando la configuracion endurecida se distribuia como `docker-compose.prod.yml` + `RehniMarket-frontend/Dockerfile.prod` + `.env.prod` + `.env.prod.example`, junto a un `docker-compose.yml` de desarrollo. Los nombres se normalizaron despues: la configuracion endurecida es ahora la configuracion POR DEFECTO (`docker-compose.yml`, `RehniMarket-frontend/Dockerfile`, imagenes `rehni-market-backend` / `rehni-market-frontend`, contenedores `rehni-backend` / `rehni-frontend` / `rehni-postgres` / `rehni-minio`, volumen `minio_data`) y el modo desarrollo pasa a `docker-compose.dev.yml` / `RehniMarket-frontend/Dockerfile.dev` / `RehniMarket-backend/.env.dev`. Se levanta con `docker compose up -d` sin `-f`. El cuerpo de este documento ya usa los nombres normalizados; la evidencia `evidencias/deployment/10_prod_compose_smoke.txt` conserva el nombre antiguo por ser un registro historico de esa prueba.

<!-- PAGEBREAK -->

# 1. INTRODUCCION Y ESTADO ACTUAL

Este documento describe la arquitectura de despliegue de RehniMarket, la configuracion de produccion, el proceso de construccion (build) del backend y del frontend, las comprobaciones de salud, los puertos, las diferencias entre desarrollo y produccion, y el estado real de la publicacion.

Estado actual, sin ambiguedad:

- DEMO LOCAL: verificada. El stack de desarrollo (`docker-compose.yml`) se levanta con `docker compose up -d`; los cuatro servicios responden y las comprobaciones de salud marcan a PostgreSQL, MinIO y backend como "healthy". Evidencia: `evidencias/deployment/`.
- CONFIGURACION DE PRODUCCION: existe (`docker-compose.yml` + `RehniMarket-frontend/Dockerfile` + `nginx.conf` + `.env.public.example`), fue construida y levantada en un proyecto Compose aislado, y adicionalmente se probo su ejecucion directa en la red local del autor. Evidencia: `evidencias/deployment/10_prod_compose_smoke.txt`.
- PUBLICACION EN UN SERVIDOR DE PRODUCCION REAL CON DOMINIO Y CERTIFICADO TLS: NO REALIZADA. Requiere un servidor, un dominio y un reverse proxy con TLS. Esta parte REQUIERE INFRAESTRUCTURA EXTERNA y VALIDACION HUMANA.

# 2. ARQUITECTURA DE PRODUCCION

La arquitectura de produccion es la misma de tres capas descrita para el desarrollo, endurecida: el frontend se sirve como estaticos compilados por Nginx; el backend corre sin recarga en caliente; PostgreSQL y MinIO no publican puertos en el host; y por delante debe ir un reverse proxy que termine HTTPS.

[[FIGURA]] Arquitectura de produccion (representacion textual).

```
                Internet
                   |
                   v
     +----------------------------+
     |  Reverse proxy con TLS     |   <-- NO incluido: depende del dominio
     |  (Caddy / Traefik / Nginx) |       (termina HTTPS y enruta)
     +------+--------------+------+
            |              |
   https://DOMINIO   https://api.DOMINIO
            |              |
            v              v
     +-----------+   +---------------------+
     | frontend  |   | backend             |
     | Nginx :80 |   | uvicorn :8000        |
     | (SPA dist)|   | (127.0.0.1 o LAN)   |
     +-----------+   +----+-----------+----+
                          |           |
                          v           v
                  +-------------+ +--------+
                  | postgres 17 | | MinIO  |  <-- SIN puertos publicados;
                  | (red interna)| |(interna)|     solo red interna de Compose
                  +-------------+ +--------+
```

Fuente: `docker-compose.yml` y `RehniMarket-frontend/Dockerfile`.

# 3. COMPONENTES

## 3.1 Backend

Se construye desde `RehniMarket-backend/Dockerfile` (base `python:3.13-slim`, dependencias con `uv sync --frozen --no-dev`). En produccion arranca con:

```
sh -c "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"
```

Sin `--reload`, un solo worker, sin bind mount del codigo (usa la imagen construida). Aplica las migraciones antes de servir. `RATE_LIMIT_ENABLED` se fuerza a `true`.

## 3.2 Frontend

Se construye desde `RehniMarket-frontend/Dockerfile`, un build multietapa: etapa de compilacion con `node:22-alpine` (`corepack prepare pnpm@11.15.0`, `pnpm install --frozen-lockfile`, `pnpm build` que ejecuta `tsc -b && vite build`), y etapa de ejecucion con `nginx:1.27-alpine` que copia `nginx.conf` y el directorio `dist`. La URL del backend se inyecta en tiempo de compilacion mediante el argumento de build `VITE_API_URL`. Existe `RehniMarket-frontend/.dockerignore` para excluir `node_modules`, `dist` y los `.env` del contexto de build.

## 3.3 PostgreSQL

Imagen `postgres:17-alpine`. En produccion NO publica puertos en el host: solo es accesible por la red interna de Compose. Datos en el volumen `postgres_data`. Comprobacion de salud con `pg_isready`.

## 3.4 MinIO

Imagen fijada por digest (`minio/minio@sha256:14cea493d9a34af32f524e538b8346cf79f3321eff8e708c1e2960462bd8936e`) para que el build sea reproducible. NO publica puertos en el host ni expone la consola web. Datos en el volumen `minio_data`. Comprobacion de salud con `curl http://localhost:9000/minio/health/live`.

## 3.5 Nginx

Nginx 1.27-alpine sirve el SPA compilado en el puerto 80 del contenedor. La configuracion (`nginx.conf`) incluye: redireccion de rutas desconocidas a `index.html` (`try_files $uri $uri/ /index.html`, necesario para el enrutado del cliente), compresion gzip, cache larga para los assets con hash y `no-cache` para `index.html`, y cabeceras de seguridad (`X-Content-Type-Options nosniff`, `X-Frame-Options SAMEORIGIN`, `Referrer-Policy strict-origin-when-cross-origin`) repetidas por bloque `location` (la directiva `add_header` de Nginx no es aditiva entre niveles). Comprobacion de salud con `wget -qO- http://localhost/`.

## 3.6 Reverse proxy con TLS

NO incluido en el proyecto. Su configuracion depende del dominio y del certificado. La forma recomendada (Caddy, Traefik o Nginx) termina HTTPS y enruta `https://DOMINIO` al frontend (puerto 80) y `https://api.DOMINIO` al backend.

## 3.7 Cloudflared

En el equipo del autor existe un contenedor `dns_tunel` basado en `visibilityspots/cloudflared`. Segun la evidencia (`evidencias/deployment/01_docker_compose_ps.txt`), es un contenedor HUERFANO de una configuracion anterior, NO forma parte de `docker-compose.yml` ni de `docker-compose.dev.yml`, y NO almacena datos de la aplicacion ni publica RehniMarket. Un Cloudflare Tunnel seria una opcion valida para exponer el sistema sin abrir puertos, pero NO esta configurado para RehniMarket a la fecha de este documento.

# 4. VARIABLES DE ENTORNO DE PRODUCCION

El backend, PostgreSQL y MinIO leen `RehniMarket-backend/.env` (plantilla de referencia para un despliegue publico en `.env.public.example`). Ningun valor secreto real se incluye aqui.

[[TABLA]] Variables de entorno relevantes para produccion.

| Variable | Valor de produccion | Nota |
|---|---|---|
| URL_DATABASE | postgresql://usuario:CLAVE@postgres:5432/rehnimarket | Host `postgres` de la red interna |
| SECRET_KEY | (valor propio, generado con openssl rand -hex 32) | La plantilla trae un marcador explicito, no un valor real |
| URL_BACKEND | URL publica del backend visible desde el navegador | Debe coincidir con el VITE_API_URL usado en el build del frontend |
| URL_FRONTEND | Origen real del SPA | Se usa en CORS y en los enlaces de los correos; debe ser el origen desde el que se sirve la web |
| RATE_LIMIT_ENABLED | true | Forzado ademas en docker-compose.yml |
| RUN_SEED | false | La carga inicial se hace una sola vez, de forma controlada |
| MINIO_ROOT_USER / MINIO_ROOT_PASSWORD | Credenciales fuertes | Recomendado: crear un usuario de MinIO de minimo privilegio limitado al bucket uploads |

El frontend recibe en tiempo de build el argumento `VITE_API_URL` (y opcionalmente `VITE_REHNIMARKET_WHATSAPP`).

# 5. PROCESO DE CONSTRUCCION Y LEVANTAMIENTO

```
# 1) Configurar el entorno (variante para despliegue publico endurecido)
cp RehniMarket-backend/.env.public.example RehniMarket-backend/.env   # y rellenar

# 2) Construir las imagenes (el VITE_API_URL queda embebido en el bundle del frontend)
VITE_API_URL=https://api.TU-DOMINIO \
VITE_REHNIMARKET_WHATSAPP=573001234567 \
  docker compose build

# 3) Levantar (configuracion por defecto, sin -f)
docker compose up -d

# 4) Configurar el reverse proxy con TLS por delante:
#      https://TU-DOMINIO       -> frontend:80
#      https://api.TU-DOMINIO   -> backend
```

Para un despliegue directo en una red local sin reverse proxy (por ejemplo un servidor interno), se usa un override que publica el backend en todas las interfaces del host y se ajusta `URL_FRONTEND` al origen real de la web.

# 6. COMPROBACIONES DE SALUD (HEALTHCHECKS)

En esta entrega se anadieron comprobaciones de salud a los servicios.

[[TABLA]] Comprobaciones de salud por servicio.

| Servicio | Prueba | Uso |
|---|---|---|
| postgres | pg_isready -U $POSTGRES_USER -d $POSTGRES_DB | El backend no arranca hasta que la base este lista |
| minio | curl -fsS http://localhost:9000/minio/health/live | El backend no arranca hasta que MinIO responda |
| backend | urllib.request a http://localhost:8000/health/database | El frontend no arranca hasta que el backend responda |
| frontend | wget -qO- http://localhost/ | Verifica que Nginx sirve el SPA |

En `docker-compose.yml` los `depends_on` usan `condition: service_healthy`, de modo que el arranque es ordenado.

# 7. PUERTOS

[[TABLA]] Puertos: docker-compose.dev.yml frente a docker-compose.yml.

| Servicio | Desarrollo (docker-compose.dev.yml) | Por defecto (docker-compose.yml) |
|---|---|---|
| backend | 0.0.0.0:8001 -> 8000 | 127.0.0.1:BACKEND_PORT -> 8000 (tras el reverse proxy) |
| frontend | 5173 -> 5173 (dev server) | FRONTEND_PORT (por defecto 8080) -> 80 (Nginx) |
| postgres | 5434 -> 5432 (publicado) | sin puertos publicados (solo red interna) |
| minio | 9000 -> 9000 (publicado) | sin puertos publicados (solo red interna) |

# 8. SEGURIDAD DEL DESPLIEGUE

- Backend expuesto solo en la interfaz de bucle local (`127.0.0.1`), asumiendo un reverse proxy con TLS por delante.
- PostgreSQL y MinIO sin puertos publicados: solo accesibles por la red interna de Compose.
- Imagen de MinIO fijada por digest (build reproducible).
- `RATE_LIMIT_ENABLED=true` forzado.
- `SECRET_KEY` generado por entorno (la plantilla trae un marcador, no un valor real).
- Politica de reinicio `restart: unless-stopped`.
- CORS restringido a `URL_FRONTEND` (correccion ya aplicada en el codigo).
- Cabeceras de seguridad en Nginx.

Pendiente de seguridad para una publicacion real: el reverse proxy con TLS (depende del dominio) y un usuario de MinIO de minimo privilegio en lugar de las credenciales root. El detalle de seguridad esta en los documentos 04 y 09.

# 9. DIFERENCIAS ENTRE docker-compose.dev.yml Y docker-compose.yml

[[TABLA]] Diferencias entre docker-compose.dev.yml y docker-compose.yml.

| Aspecto | Desarrollo (docker-compose.dev.yml) | Por defecto (docker-compose.yml) |
|---|---|---|
| Backend | uvicorn --reload; bind mount del codigo | uvicorn sin --reload; sin bind mount (imagen construida) |
| Frontend | dev server de Vite | SPA compilado servido por Nginx (Dockerfile) |
| PostgreSQL | puerto 5434 publicado en el host | sin puertos publicados |
| MinIO | imagen :latest; puerto 9000 publicado | imagen fijada por digest; sin puertos publicados |
| Backend en el host | 0.0.0.0:8001 | 127.0.0.1:BACKEND_PORT |
| Limitacion de tasa | desactivada por defecto | RATE_LIMIT_ENABLED=true |
| Comprobaciones de salud | anadidas (informativas) | requeridas (depends_on: condition: service_healthy) |
| Politica de reinicio | restart: always | restart: unless-stopped |
| Datos iniciales | RUN_SEED configurable | RUN_SEED=false |
| Archivo de entorno | .env.dev | .env |
| Volumenes | postgres_rehni_data, minio_rehni_data | postgres_data, minio_data |

# 10. VERIFICACION DEL DESPLIEGUE

## 10.1 Verificacion del stack de desarrollo (2026-08-31)

Evidencia: `evidencias/deployment/01_docker_compose_ps.txt`, `03_health_endpoints.txt`.

```
docker compose up -d
docker compose ps
```

Resultado: `rehni-backend` Up (healthy), `rehni-postgres` Up (healthy), `rehni-minio` Up (healthy), `rehni-frontend` Up. Puertos publicados: backend 8001, frontend 5173, postgres 5434, minio 9000.

```
curl http://localhost:8001/health/database      # {"Base de datos":"OK"}
curl http://localhost:8001/health/internet      # {"message":"Conexion a Internet exitosa"}
curl -o /dev/null -w '%{http_code}' http://localhost:8001/docs        # 200
curl -o /dev/null -w '%{http_code}' http://localhost:5173/            # 200
curl -o /dev/null -w '%{http_code}' http://localhost:9000/minio/health/live   # 200
docker exec rehni-backend uv run alembic current                     # a1b2c3d4e5f6 (head)
```

## 10.2 Verificacion del stack de produccion en aislado (2026-08-31)

Evidencia: `evidencias/deployment/10_prod_compose_smoke.txt`.

`docker-compose.yml` se construyo y se levanto en un proyecto Compose aislado (con puertos alternos). Resultado: los cuatro servicios arrancaron respetando las comprobaciones de salud; `/health/database` OK; el SPA servido por Nginx con `fallback` a `index.html` y cabeceras de seguridad presentes; PostgreSQL y MinIO SIN puertos publicados en el host; backend solo en `127.0.0.1` y sin `--reload`. El entorno de prueba se desmonto con `docker compose down -v`.

## 10.3 Logs

Los logs de arranque de cada servicio estan en `evidencias/deployment/`:

- `04_logs_backend.txt` / registro de arranque: `alembic upgrade head` sin error y "Application startup complete".
- `05_logs_postgres.txt`: base lista para aceptar conexiones.
- `06_logs_minio.txt`: MinIO en linea.
- `07_logs_frontend.txt`: servidor sirviendo la web.

## 10.4 Acceso mediante navegador

- Desarrollo: `http://localhost:5173` (web) y `http://localhost:8001/docs` (documentacion interactiva de la API).
- Produccion tras reverse proxy: `https://TU-DOMINIO` y `https://api.TU-DOMINIO/docs`.
- Las capturas de navegador del frontend y de la app movil en Expo Go estan PENDIENTES (requieren operar la interfaz; se listan en el documento 06).

[[TABLA]] Resultado de la verificacion del despliegue.

| Comprobacion | Resultado | Estado | Evidencia |
|---|---|---|---|
| Stack de desarrollo levanta (4 servicios) | 4 contenedores Up; 3 healthy | EJECUTADO | deployment/01 |
| Salud de base de datos, Internet, /docs, frontend, MinIO | Todas OK / 200 | EJECUTADO | deployment/03 |
| Revision de esquema aplicada | a1b2c3d4e5f6 (head) | EJECUTADO | deployment/08 |
| docker compose config (por defecto y dev) | Ambos archivos validos | EJECUTADO | (verificado durante la preparacion) |
| Stack de produccion levanta en aislado | 4 servicios healthy; BD/MinIO sin puertos; backend en loopback | EJECUTADO | deployment/10 |
| Reverse proxy con TLS | No configurado (depende del dominio) | REQUIERE INFRAESTRUCTURA EXTERNA | — |
| Despliegue en un servidor de produccion real | No realizado | REQUIERE INFRAESTRUCTURA EXTERNA Y VALIDACION HUMANA | — |
| Capturas de navegador del frontend y de la app movil | No tomadas | PENDIENTE (documento 06) | — |

# 11. QUE FUNCIONA HOY Y QUE REQUIERE INFRAESTRUCTURA EXTERNA

Funciona hoy y es demostrable:

- Levantamiento completo del stack de servidor con un comando.
- Migraciones automaticas al arrancar.
- Comprobaciones de salud de PostgreSQL, MinIO y backend.
- Documentacion interactiva de la API en `/docs`.
- Configuracion de produccion endurecida, construida y probada en aislado (BD/MinIO sin puertos, backend en loopback, Nginx sirviendo el SPA, imagen de MinIO por digest).

Requiere infraestructura externa (servidor, dominio) y una persona:

- Aprovisionar un servidor con Docker.
- Registrar un dominio y sus registros DNS.
- Instalar y configurar un reverse proxy con TLS (Caddy / Traefik / Nginx) para el dominio y el subdominio de API.
- Generar la `SECRET_KEY` real del entorno de produccion.
- Crear un usuario y una politica de MinIO de minimo privilegio.
- Automatizar las copias de seguridad (documento 02).
- Tomar las capturas del sistema en ejecucion (documento 06).

# 12. CONCLUSION

RehniMarket tiene una demostracion local verificada y una configuracion de produccion endurecida, construida y probada en un entorno aislado, con evidencia reproducible en `evidencias/deployment/`. El proyecto NO se ha publicado en un servidor de produccion real con dominio y certificado TLS: esa parte del criterio 3 requiere infraestructura externa y la intervencion de una persona, y se documenta de forma explicita como PENDIENTE, sin afirmar en ningun punto que exista una publicacion en produccion.
