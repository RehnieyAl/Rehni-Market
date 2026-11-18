# Entregable S03 — Estrategia de Hosting y Dominio

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | 1 persona (responsable técnico) |
| Fecha | 2026-11-18 |
| Semana | 3 de 9 — Hosting, dominio y transferencia de archivos (CE-1) |
| Guía del bootcamp | `bc-implantacion/bootcamp/week-03-hosting_dominio_y_transferencia/3-proyecto/README.md`, plantilla `3-proyecto/starter/entregable-s03-hosting-y-dominio.md`, rúbrica `rubrica-evaluacion.md` |
| Sección del plan consolidado | §4 de [`docs/plan-implantacion.md`](../plan-implantacion.md) |
| Estado | Parcial: 2 `[PENDIENTE]` |

La IP pública de la VM no aparece en este documento: se escribe `<ip-de-la-vm>`.

---

## 4.1 Tipo de hosting por componente

| Componente | Tipo de hosting | Proveedor candidato | Justificación |
|---|---|---|---|
| Frontend (build de React) + Caddy | IaaS: VM Linux con contenedores | Microsoft Azure, VM Ubuntu Server 24.04 (suscripción Azure for Students) | Caddy sirve el build y es el único punto de entrada: termina el TLS de los dos dominios y hace de reverse proxy de la API |
| API (FastAPI) | IaaS: misma VM | Azure | Necesita a su lado PgBouncer, PostgreSQL y MinIO en una red privada (`data`); con varios workers de Uvicorn y límites de CPU propios |
| PostgreSQL + PgBouncer | IaaS: contenedores en la misma VM | Azure | Control total de versión, extensiones (`pg_trgm`, `unaccent`) y respaldo con `pg_dump`. Alternativa gestionada (Neon, Supabase) descartada: ver abajo |
| MinIO (imágenes y certificados) | IaaS: contenedor en la misma VM | Azure | Almacén S3 propio; no se expone, las imágenes salen por el backend en `/media/proxy` |
| DNS | Subdominio gratuito | DuckDNS | Sin costo, registros A editables desde la web; suficiente para la entrega |

**Por qué no PaaS (Render + Neon/Supabase), que es lo que usa la práctica 03 de la semana 4.** El
proyecto usa **un solo** [`docker-compose.yml`](../../docker-compose.yml) y **un solo**
[`caddy/Caddyfile`](../../caddy/Caddyfile) en todos los ambientes, y solo cambia el `.env`. En un
PaaS habría que partir el stack (sitio estático, servicio web, base gestionada y un S3 externo
para MinIO), mantener otra configuración y perder PgBouncer y la red `data`; además el plan gratuito
de Render suspende el servicio por inactividad. Con una VM, lo que se prueba en local es
exactamente lo que corre en producción. Detalle de la decisión en la
[semana 4](semana-04-procedimiento-despliegue.md), §5.3.

Alternativa en servidor propio (VM Ubuntu del laboratorio o del cliente): es la misma arquitectura.
Los cinco servicios del compose corren en un servidor Ubuntu Server 24.04 con Docker Compose; Caddy
publica 80 y 443, la API queda en `127.0.0.1:8000` y PostgreSQL en `127.0.0.1:5433` (se administra
con `docker compose exec` o por túnel SSH, `ssh -L 5433:127.0.0.1:5433 …`). Solo cambian
`SITE_ADDRESS` y `API_ADDRESS` en el `.env` y los registros DNS. Ya se probó así en el equipo de
desarrollo con un clon limpio
([`docs/pruebas/evidencias/2026-11-16_gate-docker.txt`](../pruebas/evidencias/2026-11-16_gate-docker.txt):
cinco servicios `healthy` en 2 min 4 s y humo 7 de 7).

## 4.2 Dominio

| Campo | Valor |
|---|---|
| Nombre de dominio o subdominio | `rehnimarket.duckdns.org` (web) y `apirehnimarket.duckdns.org` (API) |
| Tipo (propio / subdominio gratuito / PaaS) | Subdominio gratuito |
| Registrador o proveedor | DuckDNS (<https://www.duckdns.org>); servidores de nombres `ns*.duckdns.org` ([evidencia](../evidencias/hosting-produccion-2026-11-18.txt)) |
| Responsable de pago y renovación (rol) | Responsable técnico, dueño de la cuenta de DuckDNS. Sin pago. El token de la cuenta no va al repositorio |
| Fecha de vencimiento | [PENDIENTE: confirmar en el panel o la FAQ de DuckDNS si los subdominios vencen o piden actividad de la cuenta, y anotarlo con fecha de consulta] |

Si el cliente compra un dominio propio, solo cambian `SITE_ADDRESS`, `API_ADDRESS`,
`VITE_API_URL`, `URL_FRONTEND`, `URL_BACKEND` y `CORS_EXTRA_ORIGINS` en el `.env`, y Caddy pide los
certificados nuevos solo.

## 4.3 Registros DNS

| Nombre | Tipo | Valor | TTL | Propósito |
|---|---|---|---|---|
| `rehnimarket.duckdns.org` | A | `<ip-de-la-vm>` (IP pública estática de Azure) | 60 | Frontend |
| `apirehnimarket.duckdns.org` | A | `<ip-de-la-vm>` (la misma IP) | 60 | API |

TTL medido con `dig` el 18/11/2026 ([`docs/evidencias/hosting-produccion-2026-11-18.txt`](../evidencias/hosting-produccion-2026-11-18.txt)).
DuckDNS lo fija en 60 s, así que un cambio de IP se propaga en un minuto y no hace falta bajarlo
antes. La IP de la VM es estática ([`deploy/checklist-azure.md`](../../deploy/checklist-azure.md) §1),
por eso no se usa el cron de actualización de DuckDNS. No se usan registros AAAA, CNAME, MX ni TXT:
el correo sale por SMTP de Gmail y DuckDNS no los administra.

## 4.4 Camino de una petición

```
                                  ┌─ Host: rehnimarket.duckdns.org    → build de React (/srv)
Navegador ─► DNS (DuckDNS) ─► Caddy (VM de Azure, :80/:443) ─┤
                                  └─ Host: apirehnimarket.duckdns.org → backend:8000 ─► pgbouncer:6432 ─► postgres:5432
                                                                              └─► minio:9000
```

1. El usuario abre `https://rehnimarket.duckdns.org`; DuckDNS responde con `<ip-de-la-vm>`.
2. El grupo de seguridad de red (NSG) de Azure deja pasar 443 y la petición llega a Caddy.
3. **HTTPS termina en Caddy** ([`caddy/Caddyfile`](../../caddy/Caddyfile)), con certificado de Let's
   Encrypt. HTTP en el puerto 80 responde `308` hacia `https://`.
4. Caddy elige el sitio por el encabezado `Host`: el frontend devuelve el build; la API se reenvía a
   `backend:8000` por la red `edge`, con `X-Forwarded-For` (el backend solo lo acepta de Caddy,
   `FORWARDED_ALLOW_IPS=172.30.0.10`).
5. El JavaScript llama a `https://apirehnimarket.duckdns.org`. Es otro origen: el backend lo permite
   por CORS (`CORS_EXTRA_ORIGINS=https://rehnimarket.duckdns.org`).
6. El backend consulta PostgreSQL por PgBouncer y lee las imágenes de MinIO por la red `data`, a la
   que Caddy no pertenece. Si el backend se reinicia, Caddy retiene la petición hasta 30 s
   (`lb_try_duration`) en lugar de responder 502 ([#48](https://github.com/RehnieyAl/Rehni-Market/issues/48)).

Puertos abiertos a Internet (NSG de Azure, [`deploy/README.md`](../../deploy/README.md) §4):

| Puerto | Servicio | ¿Por qué debe estar abierto? |
|---|---|---|
| 22/TCP | SSH | Administración y transferencia con llave; solo desde la IP del administrador |
| 80/TCP | Caddy (HTTP) | Validación HTTP-01 de Let's Encrypt y redirección a HTTPS |
| 443/TCP y 443/UDP | Caddy (HTTPS y HTTP/3) | Acceso a la web y a la API |

Cerrados: 5432 y 5433 (PostgreSQL), 6432 (PgBouncer), 8000 (API directa), 9000 y 9001 (MinIO).
Comprobado desde dentro del servidor con
[`docs/evidencias/verificacion-redes-produccion-2026-11-17.txt`](../evidencias/verificacion-redes-produccion-2026-11-17.txt)
(41 verificaciones, 0 fallan). La comprobación desde fuera y las reglas del NSG se documentan en la
[semana 6](semana-06-seguridad-y-respaldo.md), §7.2.

## 4.5 Reverse proxy

Archivo en el repositorio: [`caddy/Caddyfile`](../../caddy/Caddyfile) (el mismo en desarrollo y en
producción). Los sitios se leen del `.env` (`{$SITE_ADDRESS}`, `{$API_ADDRESS}`) y Caddy elige el
emisor por el nombre:

| `.env` | Emisor del certificado | Para qué |
|---|---|---|
| `localhost` / `api.localhost` (`.env.example`) | CA local de Caddy | Desarrollo |
| `rehnimarket` / `api.rehnimarket` con `CADDY_LOCAL_CERTS=local_certs` | CA local, forzada (equivale a `tls internal`) | Prueba local con `curl --resolve` (abajo) |
| `rehnimarket.duckdns.org` / `apirehnimarket.duckdns.org` ([`deploy/env.prod.example`](../../deploy/env.prod.example)) | Let's Encrypt | Producción |

Evidencia de prueba local: ver abajo (04/11/2026). Evidencia en producción (18/11/2026,
[`docs/evidencias/hosting-produccion-2026-11-18.txt`](../evidencias/hosting-produccion-2026-11-18.txt)):

```
http://rehnimarket.duckdns.org/          308 -> https://rehnimarket.duckdns.org/
http://apirehnimarket.duckdns.org/       308 -> https://apirehnimarket.duckdns.org/
https://rehnimarket.duckdns.org/                        200 (HTTP/2)
https://apirehnimarket.duckdns.org/health/database      {"Base de datos":"OK"} 200
https://apirehnimarket.duckdns.org/docs                 401
subject=CN=rehnimarket.duckdns.org      issuer=C=US, O=Let's Encrypt, CN=YE2   notAfter=Feb 15 00:03:01 2027 GMT
subject=CN=apirehnimarket.duckdns.org   issuer=C=US, O=Let's Encrypt, CN=YE2   notAfter=Feb 15 00:03:01 2027 GMT
```

#### Prueba local — Nombres `rehnimarket` / `api.rehnimarket` con `tls internal` y `curl --resolve`

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

Con la configuración por defecto (`localhost` / `api.localhost`, sin `CADDY_LOCAL_CERTS`) la prueba de humo ([semana 4](semana-04-procedimiento-despliegue.md), §5.2) pasa completa contra `https://localhost` y `https://api.localhost`.

#### Endurecimiento de producción (encabezados, tamaño del cuerpo e IP real)

- **Encabezados** (snippet `(seguridad)` del `Caddyfile`, en los dos sitios): `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y sin encabezado `Server` (ni el de Caddy ni el `uvicorn` del backend). Solo el frontend añade `X-Frame-Options: SAMEORIGIN` y `Strict-Transport-Security: max-age=31536000`, sin `includeSubDomains`.
- **Tamaño del cuerpo** en la API: `request_body max_size 26MiB`. Es la subida más grande que el backend acepta con límite explícito, un reporte con 5 imágenes de 5 MB (`MAX_EVIDENCE_IMAGES` y `MAX_EVIDENCE_FILE_SIZE_BYTES`, `RehniMarket-backend/app/services/commerce/ReportService.py`), más 1 MiB de margen para el multipart. Comprobado el 04/11/2026 con un token válido: 27 MiB → `413` de Caddy; 4 MiB → llega al backend (`422`, faltan campos). Caddy solo corta al leer el cuerpo: si el backend responde antes (p. ej. `401` sin token), no hay `413`. Las imágenes de productos y variantes no tienen límite propio en el backend, así que para ellas el tope efectivo pasa a ser este.
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
| Código | `git fetch --tags` + `git checkout vX.Y.Z` en la VM, desde GitHub por HTTPS (repositorio público, solo lectura) | No requiere credenciales para leer | En cada liberación ([semana 4](semana-04-procedimiento-despliegue.md), §5.1) |
| `.env` de producción | `scp` desde el equipo del administrador y `chmod 600` en la VM; nunca por Git | Llave SSH ed25519 (`~/.ssh/rehni_azure`, `Host rehni-azure`; [`deploy/checklist-azure.md`](../../deploy/checklist-azure.md) §1) | Instalación inicial y al rotar un secreto |
| Evidencias (`docs/evidencias/*.txt`) | `scp rehni-azure:~/evidencias-<fecha>/*.txt docs/evidencias/` hacia el equipo del administrador | Llave SSH | Tras cada prueba en producción |
| Respaldos (`backups/`) | SFTP o `rsync` sobre SSH desde la VM hacia una copia fuera del sitio | [PENDIENTE: llave SSH de un usuario restringido a SFTP en el destino externo; se define con la copia 3 en la semana 6] | Diaria, después del respaldo (RPO 24 h, [semana 2](semana-02-migracion-respaldo-instalacion.md), §3.2) |

FTP no se usa: envía usuario, contraseña y archivos sin cifrar.
