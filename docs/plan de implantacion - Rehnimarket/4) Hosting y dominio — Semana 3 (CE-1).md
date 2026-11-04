| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | Yeinher Algarin |
| Fecha | 21/10/2026 |
| Actualizado | 04/11/2026 (configuraciones de Caddy y evidencias de la sección 4.5) |

---

## 4. Hosting y dominio — Semana 3 (CE-1)

## 4.1 Tipo de hosting por componente

| Componente | Tipo de hosting | Proveedor candidato | Justificación |
|---|---|---|---|
| Frontend + Caddy | VPS | <!-- PENDIENTE: proveedor del VPS (decisión del responsable; con plan y precio de la sección 5.4) --> | Caddy y el build de React van en el mismo contenedor (`frontend`), que es el único punto de entrada y termina el TLS de los dos dominios en producción (sección 4.5) |
| Backend (API) | VPS | <!-- PENDIENTE: mismo proveedor del VPS --> | Uvicorn con varios workers (`UVICORN_WORKERS`, `docker-compose.yml:138`), PgBouncer y MinIO al lado: necesita control del servidor |
| PostgreSQL + PgBouncer | VPS (contenedor), como hoy; alternativa gestionada | Contenedor en el VPS; gestionada: Neon o Supabase (free tier) | En el VPS: control total, con PgBouncer y la memoria ya ajustados (`docker-compose.yml:23-113`). Gestionada: parches, respaldos y disponibilidad los pone el proveedor, con límites de conexiones y almacenamiento del free tier |
| MinIO (imágenes) | VPS (contenedor) | <!-- PENDIENTE: mismo proveedor del VPS --> | Almacén de objetos propio. Se sirve por el backend (`/media/proxy`), no se expone |

Alternativa en servidor propio (VM Ubuntu Server 24.04 LTS del laboratorio o del cliente):

Los cinco servicios de `docker-compose.yml` (`frontend` con Caddy, `backend`, `pgbouncer`, `postgres` y `minio`) corren en el mismo servidor con Docker Compose. Caddy es el único punto de entrada: sirve el frontend en `<dominio>` y hace de reverse proxy de la API en `api.<dominio>`. PostgreSQL, PgBouncer y MinIO no tienen puertos publicados y solo son accesibles dentro de la red de Docker (el `docker-compose.override.yml` de desarrollo, que publica PostgreSQL en `127.0.0.1:5433`, no se usa en el servidor: allí los archivos se pasan con `-f`). En producción se añade el override `deploy/compose.prod.yaml`, que usa `deploy/Caddyfile` (HTTPS automático con Let's Encrypt) y publica el puerto 443; las variables del `.env` del servidor salen de `deploy/env.prod.example`: `SITE_ADDRESS=<dominio>`, `API_ADDRESS=api.<dominio>`, `ACME_EMAIL=<correo-del-responsable>`, `FRONTEND_PORT=80`, `VITE_API_URL=https://api.<dominio>`, `CORS_EXTRA_ORIGINS=https://<dominio>`, `DOCS_ENABLED=false` y `BACKEND_BIND=127.0.0.1`. El procedimiento completo está en la sección 5.

## 4.2 Dominio

| Campo | Valor |
|---|---|
| Nombre de dominio o subdominio | `<dominio>` (frontend) y `api.<dominio>` (API). En local: `rehnimarket` y `api.rehnimarket` |
| Tipo (propio / subdominio gratuito / PaaS) | Propio |
| Registrador o proveedor | <!-- PENDIENTE: registrador elegido (dato del responsable/cliente) --> |
| Responsable de pago y renovación (rol) | <!-- PENDIENTE: rol que paga y renueva (acuerdo con el cliente) --> |
| Fecha de vencimiento | <!-- PENDIENTE: fecha de vencimiento del registro (panel del registrador) --> |

## 4.3 Registros DNS

| Nombre | Tipo | Valor | TTL | Propósito |
|---|---|---|---|---|
| `<dominio>` | A | `203.0.113.10` (IP de documentación; en el registro real va la IP pública del servidor) | 3600 (bajarlo a 300 antes de un cambio) | Frontend |
| `api.<dominio>` | A | `203.0.113.10` (la misma IP) | 3600 | API |

## 4.4 Camino de una petición

```
                       ┌─ Host: <dominio>      → archivos del build (/srv)
Navegador ──► Caddy ───┤                                    /assets/* caché 1 año · resto → index.html
  (:80/:443)           └─ Host: api.<dominio>  → backend:8000 ──► pgbouncer:6432 ──► postgres:5432
                                                        └──► minio:9000
```

1. El usuario abre `https://<dominio>` y recibe el frontend.
2. El JavaScript del frontend llama a `https://api.<dominio>/...` (`VITE_API_URL`). Es otro origen, así que el navegador pregunta antes por CORS y el backend responde que ese origen está permitido (`CORS_EXTRA_ORIGINS`).
3. **En producción, HTTPS termina en Caddy** (`deploy/Caddyfile`), que reenvía la petición al backend (`backend:8000`) sin cambiar la ruta. Con la configuración por defecto del repositorio (`caddy/Caddyfile`) no hay HTTPS: todo el camino es HTTP (ver la sección 4.5).
4. El backend consulta PostgreSQL a través de PgBouncer (`pgbouncer:6432` → `postgres:5432`) y lee las imágenes de MinIO, que entrega al navegador por `/media/proxy`. Todo ocurre dentro de la red privada de Compose (las migraciones de Alembic, al arrancar el backend, se conectan directamente a `postgres:5432`).

Puertos abiertos a Internet (servidor de producción):

| Puerto | Servicio | ¿Por qué debe estar abierto? |
|---|---|---|
| 80 | Caddy (HTTP) | Redirección a HTTPS y verificación de cada dominio por Let's Encrypt |
| 443 | Caddy (HTTPS) | Acceso al frontend y a la API |
| 22 | SSH | Administración y transferencia de archivos; limitado por firewall |

El puerto 8000 del backend no se abre: en producción se publica solo en `127.0.0.1` (`BACKEND_BIND=127.0.0.1`, `docker-compose.yml:146`).

## 4.5 Reverse proxy

El repositorio tiene tres configuraciones de Caddy. Comparten los dos sitios (frontend y API) y se diferencian en el transporte:

| Archivo | Cómo se activa | Transporte | Para qué sirve |
|---|---|---|---|
| `caddy/Caddyfile` | Por defecto (`docker compose up -d`) | Solo HTTP en `:8080` (prefijo `http://`, L38 y L44) | Desarrollo y red local: el navegador no muestra el aviso de certificado no confiable |
| `caddy/Caddyfile.tls-internal` | Override `docker-compose.tls-local.yml` | HTTP en `:8080` + HTTPS en `:8443` con la CA interna de Caddy (`tls internal`) | Probar en local el HTTPS y el CORS entre los dos dominios, como en la práctica 02 de la semana 3 |
| `deploy/Caddyfile` | Override `deploy/compose.prod.yaml` | HTTPS automático con Let's Encrypt (correo `ACME_EMAIL`) y redirección de HTTP a HTTPS | Servidor de producción con dominio público (sección 5.2). No se puede probar en local: necesita un dominio real que apunte al servidor |

**Por qué la configuración por defecto es solo HTTP.** El commit `926d421` (22/10/2026) quitó `tls {$CADDY_TLS:internal}` de los dos sitios, les puso el prefijo `http://`, dejó de publicar el puerto `8443` y cambió `.env.example` a URL `http://...:8080`. El motivo quedó escrito en el comentario de `caddy/Caddyfile:9-10`: «el prefijo http:// desactiva el HTTPS automático de Caddy (sin CA interna ni certificados autofirmados, así el navegador no avisa de conexión insegura)». El mensaje del commit no lo menciona (solo habla de la dependencia de MinIO). Por eso la evidencia del 21/10/2026 (contra `https://...:8443`) ya no se puede reproducir con la configuración por defecto y se reemplaza por las dos pruebas de abajo.

### Prueba 1 — Configuración por defecto (`caddy/Caddyfile`, solo HTTP)

```bash
docker compose up -d
R="--resolve rehnimarket:8080:127.0.0.1 --resolve api.rehnimarket:8080:127.0.0.1"
F=http://rehnimarket:8080; A=http://api.rehnimarket:8080
c(){ printf "%-40s " "$1"; shift; curl -s -o /dev/null -w "%{http_code}\n" $R "$@"; }
c "Frontend /"                 $F/
c "Frontend /admin/dashboard"  $F/admin/dashboard
c "Frontend por IP (bloque :80)" http://127.0.0.1:8080/
c "API /health/database"       $A/health/database
c "API /docs (Swagger)"        $A/docs
c "API /cart sin token"        $A/cart
printf "%-40s " "HTTPS :8443 (no publicado)"; curl -sk -o /dev/null -w "%{http_code}\n" --connect-timeout 3 https://127.0.0.1:8443/
printf "%-40s " "CORS preflight desde $F"
curl -s $R -o /dev/null -D - -X OPTIONS $A/auth/login-user \
  -H "Origin: $F" -H "Access-Control-Request-Method: POST" | grep -i "^access-control-allow-origin"
```

Salida obtenida el 2026-11-04 14:21 UTC:

```
Frontend /                               200
Frontend /admin/dashboard                200
Frontend por IP (bloque :80)             200
API /health/database                     200
API /docs (Swagger)                      401
API /cart sin token                      401
HTTPS :8443 (no publicado)               000
CORS preflight desde http://rehnimarket:8080 Access-Control-Allow-Origin: http://rehnimarket:8080
```

### Prueba 2 — Variante de prueba local con `tls internal`

```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml \
  -f docker-compose.tls-local.yml up -d frontend backend
R="--resolve rehnimarket:8443:127.0.0.1 --resolve api.rehnimarket:8443:127.0.0.1 --resolve rehnimarket:8080:127.0.0.1 --resolve api.rehnimarket:8080:127.0.0.1"
F=https://rehnimarket:8443; A=https://api.rehnimarket:8443
c(){ printf "%-40s " "$1"; shift; curl -sk -o /dev/null -w "%{http_code}\n" $R "$@"; }
c "HTTPS Frontend /"                $F/
c "HTTPS Frontend /admin/dashboard" $F/admin/dashboard
c "HTTPS API /health/database"      $A/health/database
c "HTTPS API /docs (Swagger)"       $A/docs
c "HTTPS API /cart sin token"       $A/cart
c "HTTP  Frontend /"                http://rehnimarket:8080/
c "HTTP  API /health/database"      http://api.rehnimarket:8080/health/database
printf "%-40s " "Emisor del certificado (api)"
curl -skv $R -o /dev/null $A/health/database 2>&1 | grep -i "issuer:"
printf "%-40s " "CORS preflight desde $F"
curl -sk $R -o /dev/null -D - -X OPTIONS $A/auth/login-user \
  -H "Origin: $F" -H "Access-Control-Request-Method: POST" | grep -i "^access-control-allow-origin"
# Volver a la configuración por defecto:
docker compose up -d frontend backend
```

Salida obtenida el 2026-11-04 14:21 UTC:

```
HTTPS Frontend /                         200
HTTPS Frontend /admin/dashboard          200
HTTPS API /health/database               200
HTTPS API /docs (Swagger)                401
HTTPS API /cart sin token                401
HTTP  Frontend /                         200
HTTP  API /health/database               200
Emisor del certificado (api)             issuer: CN=Caddy Local Authority - ECC Intermediate
CORS preflight desde https://rehnimarket:8443 access-control-allow-origin: https://rehnimarket:8443
```

En las dos pruebas, `/docs` responde 401 porque `DOCS_ENABLED=false` (Swagger cerrado, igual que en producción) y `/cart` responde 401 porque exige token. En la variante `tls internal`, HTTP sigue respondiendo 200 en lugar de redirigir: el `Caddyfile.tls-internal` importa los sitios `http://` del `Caddyfile` por defecto para no duplicarlos. La redirección HTTP → HTTPS solo la hace `deploy/Caddyfile`.

## 4.6 Transferencia de archivos

| Qué se transfiere | Método | Autenticación | Frecuencia |
|---|---|---|---|
| Código e imágenes Docker | `git pull` + `docker compose ... up -d --build` en el servidor (sección 5.2) | Llave SSH / deploy key | En cada liberación (sección 5.1) |
| `.env`, `.env.postgres`, `.env.minio` y `RehniMarket-backend/.env` | `scp` con llave y `chmod 600` en el servidor; nunca por Git | Llave SSH | En la instalación inicial y al rotar un secreto |
| Respaldos (`pg_dump` y datos de MinIO) | `rsync` o SFTP desde el servidor hacia un destino externo | Llave SSH de un usuario restringido a SFTP <!-- PENDIENTE: crear el usuario solo SFTP en el destino externo (semana 6) --> | <!-- PENDIENTE: depende de la frecuencia del respaldo acordada (sección 3.3) --> |
