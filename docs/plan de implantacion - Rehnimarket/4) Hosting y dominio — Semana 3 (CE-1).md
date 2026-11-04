| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | Yeinher Algarin |
| Fecha | 21/10/2026 |
| Actualizado | 04/11/2026 (compose y Caddyfile únicos con HTTPS; evidencias de la sección 4.5 repetidas) |

---

## 4. Hosting y dominio — Semana 3 (CE-1)

## 4.1 Tipo de hosting por componente

| Componente | Tipo de hosting | Proveedor candidato | Justificación |
|---|---|---|---|
| Frontend + Caddy | VPS | <!-- PENDIENTE: proveedor del VPS (decisión del responsable; con plan y precio de la sección 5.4) --> | Caddy y el build de React van en el mismo contenedor (`frontend`), que es el único punto de entrada y termina el TLS de los dos dominios en producción (sección 4.5) |
| Backend (API) | VPS | <!-- PENDIENTE: mismo proveedor del VPS --> | Uvicorn con varios workers (`UVICORN_WORKERS`, `docker-compose.yml:158`), PgBouncer y MinIO al lado: necesita control del servidor |
| PostgreSQL + PgBouncer | VPS (contenedor), como hoy; alternativa gestionada | Contenedor en el VPS; gestionada: Neon o Supabase (free tier) | En el VPS: control total, con PgBouncer y la memoria ya ajustados (`docker-compose.yml:39-133`). Gestionada: parches, respaldos y disponibilidad los pone el proveedor, con límites de conexiones y almacenamiento del free tier |
| MinIO (imágenes) | VPS (contenedor) | <!-- PENDIENTE: mismo proveedor del VPS --> | Almacén de objetos propio. Se sirve por el backend (`/media/proxy`), no se expone |

Alternativa en servidor propio (VM Ubuntu Server 24.04 LTS del laboratorio o del cliente):

Los cinco servicios de `docker-compose.yml` (`frontend` con Caddy, `backend`, `pgbouncer`, `postgres` y `minio`) corren en el mismo servidor con Docker Compose. Caddy es el único punto de entrada: sirve el frontend en `<dominio>` y hace de reverse proxy de la API en `api.<dominio>`. PgBouncer y MinIO no tienen puertos publicados y solo son accesibles dentro de la red de Docker. PostgreSQL se publica **solo en el loopback** del servidor, `127.0.0.1:${POSTGRES_PORT:-5433}` (`docker-compose.yml:50`), nunca en `0.0.0.0`: desde fuera solo se llega por túnel SSH (`ssh -L 5433:127.0.0.1:5433 …`), para administrarla con DbSchema o `psql` sin abrir el puerto en el firewall. El servidor usa el **mismo `docker-compose.yml` y el mismo `caddy/Caddyfile`** que el desarrollo; solo cambia el `.env` de la raíz, que sale de `deploy/env.prod.example`: `SITE_ADDRESS=<dominio>`, `API_ADDRESS=api.<dominio>`, `HTTP_PORT=80`, `HTTPS_PORT=443`, `CADDY_LOCAL_CERTS` vacía, `VITE_API_URL=https://api.<dominio>`, `CORS_EXTRA_ORIGINS=https://<dominio>`, `DOCS_ENABLED=false` y `BACKEND_BIND=127.0.0.1`. Con un dominio público, Caddy pide los certificados a Let's Encrypt (sin correo ACME: Let's Encrypt no lo exige). El procedimiento completo está en la sección 5.

## 4.2 Dominio

| Campo | Valor |
|---|---|
| Nombre de dominio o subdominio | `<dominio>` (frontend) y `api.<dominio>` (API). En local: `localhost` y `api.localhost`; la prueba de la sección 4.5 usa `rehnimarket` y `api.rehnimarket` |
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
3. **HTTPS termina en Caddy** (`caddy/Caddyfile`, el mismo en local y en producción), que redirige HTTP → HTTPS y reenvía la petición al backend (`backend:8000`) sin cambiar la ruta. En local los certificados los firma la CA de Caddy; en producción, Let's Encrypt (sección 4.5).
4. El backend consulta PostgreSQL a través de PgBouncer (`pgbouncer:6432` → `postgres:5432`) y lee las imágenes de MinIO, que entrega al navegador por `/media/proxy`. Todo ocurre dentro de la red privada de Compose (las migraciones de Alembic, al arrancar el backend, se conectan directamente a `postgres:5432`).

Puertos abiertos a Internet (servidor de producción):

| Puerto | Servicio | ¿Por qué debe estar abierto? |
|---|---|---|
| 80 | Caddy (HTTP) | Redirección a HTTPS y verificación de cada dominio por Let's Encrypt |
| 443 | Caddy (HTTPS) | Acceso al frontend y a la API |
| 22 | SSH | Administración y transferencia de archivos; limitado por firewall |

El puerto 8000 del backend no se abre: en producción se publica solo en `127.0.0.1` (`BACKEND_BIND=127.0.0.1`, `docker-compose.yml:170`). PostgreSQL tampoco: se publica en `127.0.0.1:5433` (`docker-compose.yml:50`), solo en el loopback, y se administra por túnel SSH.

## 4.5 Reverse proxy

El repositorio tiene **un único `caddy/Caddyfile`** y **un único `docker-compose.yml`** para desarrollo y producción. La dirección de los dos sitios sale del `.env` (`{$SITE_ADDRESS}`, `{$API_ADDRESS}`) y los sitios no llevan `tls` ni prefijo `http://`, así que Caddy activa el HTTPS automático y elige el emisor por el nombre:

| `.env` | Emisor del certificado | Para qué |
|---|---|---|
| `SITE_ADDRESS=localhost`, `API_ADDRESS=api.localhost` (por defecto) | CA local de Caddy, automática con `localhost` y `*.localhost` | Desarrollo. Para que el navegador no avise, se confía en la raíz de Caddy una vez (`caddy/readme.md`, 6.7.1) |
| `SITE_ADDRESS=rehnimarket`, `API_ADDRESS=api.rehnimarket`, `CADDY_LOCAL_CERTS=local_certs` | CA local de Caddy, forzada (`local_certs`, equivale a `tls internal`) | La prueba de abajo, con los nombres elegidos y `curl --resolve` (práctica 02) |
| `SITE_ADDRESS=<dominio>`, `API_ADDRESS=api.<dominio>` (`deploy/env.prod.example`) | Let's Encrypt | Producción (sección 5.2). No se puede probar en local: necesita un dominio real que apunte al servidor |

En los tres casos Caddy redirige HTTP → HTTPS (308). Publica `HTTP_PORT` y `HTTPS_PORT` (80 y 443 por defecto) con el mismo número dentro y fuera del contenedor, para que la redirección apunte al puerto correcto; los certificados y la CA local viven en los volúmenes `caddy_data` y `caddy_config`. El healthcheck del contenedor usa un sitio interno, `http://:8081`, que no se publica.

**Historia.** Hasta el 04/11/2026 había tres Caddyfile: `caddy/Caddyfile` solo HTTP (el commit `926d421`, del 22/10/2026, le quitó el TLS para que el navegador no avisara), `caddy/Caddyfile.tls-internal` (prueba local con `tls internal`, activada con el override `docker-compose.tls-local.yml`) y `deploy/Caddyfile` (Let's Encrypt, con el override `deploy/compose.prod.yaml`). Se unificaron en uno: el aviso del navegador se resuelve confiando en la raíz de Caddy, y la diferencia entre entornos queda en el `.env`. Las evidencias anteriores (04/11/2026 14:21 UTC, contra `:8080` y `:8443`) ya no se pueden reproducir y se reemplazan por la de abajo.

### Prueba — Nombres `rehnimarket` / `api.rehnimarket` con `tls internal` y `curl --resolve`

Se ejecuta con `bash` desde la raíz del repositorio. Las variables de la primera línea sustituyen a las del `.env` solo en ese comando; `curl` valida el certificado contra la raíz de Caddy (`--cacert`, sin `-k`):

```bash
SITE_ADDRESS=rehnimarket API_ADDRESS=api.rehnimarket CADDY_LOCAL_CERTS=local_certs \
CORS_EXTRA_ORIGINS=https://rehnimarket docker compose up -d --wait frontend backend
docker compose cp frontend:/data/caddy/pki/authorities/local/root.crt /tmp/caddy-root.crt
R=(--cacert /tmp/caddy-root.crt --resolve rehnimarket:443:127.0.0.1 --resolve api.rehnimarket:443:127.0.0.1
   --resolve rehnimarket:80:127.0.0.1 --resolve api.rehnimarket:80:127.0.0.1)
F=https://rehnimarket; A=https://api.rehnimarket
c(){ printf "%-40s " "$1"; shift; curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "${R[@]}" "$@"; }
c "HTTPS Frontend /"                $F/
c "HTTPS Frontend /admin/dashboard" $F/admin/dashboard
c "HTTPS API /health/database"      $A/health/database
c "HTTPS API /docs (Swagger)"       $A/docs
c "HTTPS API /cart sin token"       $A/cart
c "HTTP  Frontend / (redirige)"     http://rehnimarket/
c "HTTP  API (redirige)"            http://api.rehnimarket/health/database
printf "%-40s " "Emisor del certificado (api)"
curl -sv "${R[@]}" -o /dev/null $A/health/database 2>&1 | grep -i "issuer:" | sed 's/^\* *//'
printf "%-40s " "CORS preflight desde $F"
curl -s "${R[@]}" -o /dev/null -D - -X OPTIONS $A/auth/login-user \
  -H "Origin: $F" -H "Access-Control-Request-Method: POST" | grep -i "^access-control-allow-origin" | tr -d '\r'
printf "%-40s " "PostgreSQL publicado en"
docker compose port postgres 5432
# Volver a la configuración del .env (localhost / api.localhost):
docker compose up -d --wait frontend backend
```

Salida obtenida el 2026-11-04 21:51 UTC (rama `refactor/compose-unico`):

```
2026-11-04 21:51:58 UTC
HTTPS Frontend /                         200
HTTPS Frontend /admin/dashboard          200
HTTPS API /health/database               200
HTTPS API /docs (Swagger)                401
HTTPS API /cart sin token                401
HTTP  Frontend / (redirige)              308 https://rehnimarket/
HTTP  API (redirige)                     308 https://api.rehnimarket/health/database
Emisor del certificado (api)             issuer: CN=Caddy Local Authority - ECC Intermediate
CORS preflight desde https://rehnimarket access-control-allow-origin: https://rehnimarket
PostgreSQL publicado en                  127.0.0.1:5433
```

`/docs` responde 401 porque `DOCS_ENABLED=false` (Swagger cerrado, igual que en producción) y `/cart` responde 401 porque exige token. HTTP redirige a HTTPS con 308 en los dos dominios. `curl` aceptó el certificado sin `-k`, validándolo contra la raíz de Caddy. PostgreSQL queda publicado solo en el loopback.

Con la configuración por defecto (`localhost` / `api.localhost`, sin `CADDY_LOCAL_CERTS`) la prueba de humo de la sección 5.2 pasa completa contra `https://localhost` y `https://api.localhost`.

### Endurecimiento de producción (encabezados, tamaño del cuerpo e IP real)

- **Encabezados** (snippet `(seguridad)` del `Caddyfile`, en los dos sitios): `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y sin encabezado `Server` (ni el de Caddy ni el `uvicorn` del backend). Solo el frontend añade `X-Frame-Options: SAMEORIGIN` y `Strict-Transport-Security: max-age=31536000`, sin `includeSubDomains`.
- **Tamaño del cuerpo** en la API: `request_body max_size 26MiB`. Es la subida más grande que el backend acepta con límite explícito, un reporte con 5 imágenes de 5 MB (`MAX_EVIDENCE_IMAGES` y `MAX_EVIDENCE_FILE_SIZE_BYTES`, `RehniMarket-backend/app/services/commerce/ReportService.py:24-25`), más 1 MiB de margen para el multipart. Comprobado el 04/11/2026 con un token válido: 27 MiB → `413` de Caddy; 4 MiB → llega al backend (`422`, faltan campos). Caddy solo corta al leer el cuerpo: si el backend responde antes (p. ej. `401` sin token), no hay `413`. Las imágenes de productos y variantes no tienen límite propio en el backend, así que para ellas el tope efectivo pasa a ser este.
- **IP real del cliente detrás de Caddy** (`RATE_LIMIT_ENABLED=true`): Uvicorn solo acepta `X-Forwarded-For` de Caddy (`FORWARDED_ALLOW_IPS=172.30.0.10`, IP fija en `docker-compose.yml`). Con el valor anterior, `172.16.0.0/12`, una petición directa al `:8000` desde el propio equipo con `X-Forwarded-For: 203.0.113.9` quedó registrada como `203.0.113.9`: la pasarela de Docker por la que entra estaba dentro del rango. Prueba con el valor nuevo (cada petición en el access log de Uvicorn, que muestra el `request.client.host` con el que cuenta el rate limit; `:0` = IP tomada de `X-Forwarded-For`):

```
# 2026-11-04 22:15:01 UTC   RATE_LIMIT_ENABLED=true   FORWARDED_ALLOW_IPS=172.30.0.10
1. Caddy, cliente LAN <IP-LAN> (?p=lan)                      200
2. Caddy, localhost + XFF falso 203.0.113.7 (?p=caddy-xff)   200
3. Directo :8000 desde LAN + XFF falso 203.0.113.8 (?p=lan-8000) 200
4. Directo :8000 desde 127.0.0.1 + XFF falso 203.0.113.9 (?p=lo-8000) 200
--- access log de Uvicorn:
INFO:     <IP-LAN>:0 - "GET /health/database?p=lan HTTP/1.1" 200 OK
INFO:     172.30.0.1:0 - "GET /health/database?p=caddy-xff HTTP/1.1" 200 OK
INFO:     <IP-LAN>:59300 - "GET /health/database?p=lan-8000 HTTP/1.1" 200 OK
INFO:     172.30.0.1:40438 - "GET /health/database?p=lo-8000 HTTP/1.1" 200 OK
```

Las peticiones por Caddy llegan con la IP del cliente que vio Caddy (la de la LAN, o la pasarela de Docker cuando el cliente es el propio equipo) y Caddy descarta el `X-Forwarded-For` que manda el cliente. Las directas al `:8000` llegan con su IP de origen y el `X-Forwarded-For` falso se ignora.

## 4.6 Transferencia de archivos

| Qué se transfiere | Método | Autenticación | Frecuencia |
|---|---|---|---|
| Código e imágenes Docker | `git pull` + `docker compose up -d --build` en el servidor (sección 5.2) | Llave SSH / deploy key | En cada liberación (sección 5.1) |
| `.env`, `.env.postgres`, `.env.minio` y `RehniMarket-backend/.env` | `scp` con llave y `chmod 600` en el servidor; nunca por Git | Llave SSH | En la instalación inicial y al rotar un secreto |
| Respaldos (`pg_dump` y datos de MinIO) | `rsync` o SFTP desde el servidor hacia un destino externo | Llave SSH de un usuario restringido a SFTP <!-- PENDIENTE: crear el usuario solo SFTP en el destino externo (semana 6) --> | <!-- PENDIENTE: depende de la frecuencia del respaldo acordada (sección 3.3) --> |
