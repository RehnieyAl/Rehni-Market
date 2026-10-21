# Entregable S03 — Estrategia de Hosting y Dominio

<!-- 📝 Instrucción: completa cada sección con datos de TU proyecto real. Los valores en cursiva
son ejemplos parciales; reemplázalos. Usa IP de documentación (203.0.113.x) o marcadores
(<ip-servidor>), nunca IP reales. -->

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | Yeinher Algarin |
| Fecha | 21/10/2026 |

---

## 4.1 Tipo de hosting por componente

| Componente | Tipo de hosting | Proveedor candidato | Justificación |
|---|---|---|---|
| Frontend + Caddy | VPS | Pendiente | Caddy y el build de React van en el mismo contenedor (`frontend`), que es el único punto de entrada y termina el TLS de los dos dominios |
| Backend (API) | VPS | Pendiente | Uvicorn con varios workers, PgBouncer y MinIO al lado: necesita control del servidor |
| PostgreSQL + PgBouncer | VPS (contenedor), como hoy; alternativa gestionada | Contenedor en el VPS; gestionada: Neon o Supabase (free tier) | En el VPS: control total, con PgBouncer y la memoria ya ajustados. Gestionada: parches, respaldos y disponibilidad los pone el proveedor, con límites de conexiones y almacenamiento del free tier |
| MinIO (imágenes) | VPS (contenedor) | Pendiente | Almacén de objetos propio. Se sirve por el backend (`/media/proxy`), no se expone |

Alternativa en servidor propio (VM Ubuntu del laboratorio o del cliente):

<!-- 📝 Instrucción: describe cómo quedaría todo en un VPS con Docker Compose + Caddy. -->

Los cinco servicios de `docker-compose.yml` (`frontend` con Caddy, `backend`, `pgbouncer`, `postgres` y `minio`) corren en el mismo servidor con Docker Compose. Caddy es el único punto de entrada: sirve el frontend en `<dominio>` y hace de reverse proxy de la API en `api.<dominio>`. PostgreSQL, PgBouncer y MinIO no tienen puertos publicados y solo son accesibles dentro de la red de Docker (el `docker-compose.override.yml` de desarrollo, que publica PostgreSQL en `127.0.0.1:5433`, no se copia al servidor). El `Caddyfile` es el mismo que en local; para producción solo cambian las variables del `.env` del servidor: `SITE_ADDRESS=<dominio>`, `API_ADDRESS=api.<dominio>`, `CADDY_TLS=<correo-del-responsable>` (Let's Encrypt en lugar de la CA interna), `FRONTEND_PORT=80`, `FRONTEND_HTTPS_PORT=443`, `VITE_API_URL=https://api.<dominio>`, `CORS_EXTRA_ORIGINS=https://<dominio>`, `DOCS_ENABLED=false` y `BACKEND_BIND=127.0.0.1`.

## 4.2 Dominio

| Campo | Valor |
|---|---|
| Nombre de dominio o subdominio | `<dominio>` (frontend) y `api.<dominio>` (API). En local: `rehnimarket` y `api.rehnimarket` |
| Tipo (propio / subdominio gratuito / PaaS) | Propio |
| Registrador o proveedor | Pendiente |
| Responsable de pago y renovación (rol) | Pendiente |
| Fecha de vencimiento | Pendiente |

## 4.3 Registros DNS

| Nombre | Tipo | Valor | TTL | Propósito |
|---|---|---|---|---|
| `<dominio>` | A | `203.0.113.10` (IP pública del servidor) | 3600 (bajarlo a 300 antes de un cambio) | Frontend |
| `api.<dominio>` | A | `203.0.113.10` (la misma IP) | 3600 | API |

## 4.4 Camino de una petición

<!-- 📝 Instrucción: diagrama (imagen o lista) desde el navegador hasta la base de datos. Indica
dónde termina HTTPS. -->

```
                       ┌─ Host: <dominio>      → archivos del build (/srv)
Navegador ──► Caddy ───┤                                    /assets/* caché 1 año · resto → index.html
  (:80/:443)           └─ Host: api.<dominio>  → backend:8000 ──► pgbouncer:6432 ──► postgres:5432
                                                        └──► minio:9000
```

1. El usuario abre `https://<dominio>` y recibe el frontend.
2. El JavaScript del frontend llama a `https://api.<dominio>/...` (`VITE_API_URL`). Es otro origen, así que el navegador pregunta antes por CORS y el backend responde que ese origen está permitido (`CORS_EXTRA_ORIGINS`).
3. **HTTPS termina en Caddy**, que reenvía la petición al backend (`backend:8000`) sin cambiar la ruta.
4. El backend consulta PostgreSQL a través de PgBouncer (`pgbouncer:6432` → `postgres:5432`) y lee las imágenes de MinIO, que entrega al navegador por `/media/proxy`. Todo ocurre dentro de la red privada de Compose (las migraciones de Alembic, al arrancar el backend, se conectan directamente a `postgres:5432`).

Puertos abiertos a Internet:

| Puerto | Servicio | ¿Por qué debe estar abierto? |
|---|---|---|
| 80 | Caddy (HTTP) | Redirección a HTTPS y verificación de cada dominio por Let's Encrypt |
| 443 | Caddy (HTTPS) | Acceso al frontend y a la API |
| 22 | SSH | Administración y transferencia de archivos; limitado por firewall |

## 4.5 Reverse proxy

Archivo en el repositorio: `caddy/Caddyfile`

Evidencia de prueba local:

```
bash -c '
R="--resolve rehnimarket:8443:127.0.0.1 --resolve api.rehnimarket:8443:127.0.0.1 --resolve api.rehnimarket:8080:127.0.0.1"
F=https://rehnimarket:8443; A=https://api.rehnimarket:8443
c(){ printf "%-40s " "$1"; shift; curl -sk -o /dev/null -w "%{http_code}\n" $R "$@"; }
c "Frontend /"                 $F/
c "Frontend /admin/dashboard"  $F/admin/dashboard
c "Frontend por HTTP"          http://127.0.0.1:8080/
c "API /health/database"       $A/health/database
c "API /docs (Swagger)"        $A/docs
c "API /cart sin token"        $A/cart
c "API HTTP → HTTPS"           http://api.rehnimarket:8080/
curl -sk $R -o /dev/null -D - -X OPTIONS $A/auth/login-user \
  -H "Origin: $F" -H "Access-Control-Request-Method: POST" | grep -i "^access-control-allow-origin"
'

Salida obtenida el 21/10/2026 19:13 UTC:
Frontend /                               200
Frontend /admin/dashboard                200
Frontend por HTTP                        200
API /health/database                     200
API /docs (Swagger)                      401
API /cart sin token                      401
API HTTP → HTTPS                       308
access-control-allow-origin: https://rehnimarket:8443
```

`/docs` responde 401 porque `DOCS_ENABLED=false` (Swagger cerrado, igual que en producción); con `DOCS_ENABLED=true` responde 200.

## 4.6 Transferencia de archivos

| Qué se transfiere | Método | Autenticación | Frecuencia |
|---|---|---|---|
| Código e imágenes Docker | `git pull` + `docker compose up -d --build` en el servidor | Llave SSH / deploy key | Pendiente |
| `.env`, `.env.postgres`, `.env.minio` y `RehniMarket-backend/.env` | `scp` con llave y `chmod 600` en el servidor; nunca por Git | Llave SSH | Pendiente |
| Respaldos (`pg_dump` y datos de MinIO) | `rsync` o SFTP desde el servidor hacia un destino externo | Llave SSH | Pendiente |
