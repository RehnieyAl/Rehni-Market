# Entregable S03 — Estrategia de Hosting y Dominio

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | 1 persona: Yeinher Jose Algarin Cardozo, aprendiz ADSO, ficha 3171618 |
| Fecha | 2026-11-18 |

---

## 4.1 Tipo de hosting por componente

| Componente | Tipo de hosting | Proveedor candidato | Justificación |
|---|---|---|---|
| Frontend (build de React) + Caddy | IaaS: VM con contenedores | Microsoft Azure, VM Ubuntu Server 24.04 (Azure for Students) | Caddy sirve el build y es el único punto de entrada (`0.0.0.0:80` y `:443` en `docker-compose.yml`) |
| API (FastAPI) | IaaS: misma VM | Microsoft Azure | Corre junto a PgBouncer, PostgreSQL y MinIO en la red interna `data` del mismo `docker-compose.yml` |
| PostgreSQL + PgBouncer | IaaS: contenedores en la misma VM | Microsoft Azure | Mismo `docker-compose.yml` que en desarrollo; respaldo con `scripts/respaldar.sh` |
| MinIO (imágenes y certificados) | IaaS: contenedor en la misma VM | Microsoft Azure | No se publica; las imágenes salen por el backend en `/media/proxy` |
| DNS | Subdominio gratuito | DuckDNS | Registros A de `rehnimarket` y `apirehnimarket` ([`deploy/README.md`](../../deploy/README.md) §4) |

Alternativa en servidor propio (VM Ubuntu del laboratorio o del cliente): los cinco servicios de [`docker-compose.yml`](../../docker-compose.yml) con el `.env` de [`deploy/env.prod.example`](../../deploy/env.prod.example), cambiando `SITE_ADDRESS` y `API_ADDRESS` por los dominios del cliente. Probado en un clon limpio en el equipo de desarrollo el 16/11/2026: cinco servicios `healthy` en 2 min 4 s y prueba de humo 7 de 7 ([`docs/pruebas/evidencias/2026-11-16_gate-docker.txt`](../pruebas/evidencias/2026-11-16_gate-docker.txt)).

## 4.2 Dominio

| Campo | Valor |
|---|---|
| Nombre de dominio o subdominio | `rehnimarket.duckdns.org` (web) y `apirehnimarket.duckdns.org` (API) |
| Tipo (propio / subdominio gratuito / PaaS) | Subdominio gratuito |
| Registrador o proveedor | DuckDNS (<https://www.duckdns.org>); servidores de nombres `ns2`, `ns8` y `ns9.duckdns.org` ([`docs/evidencias/hosting-produccion-2026-11-18.txt`](../evidencias/hosting-produccion-2026-11-18.txt)) |
| Responsable de pago y renovación (rol) | Responsable técnico (dueño de la cuenta de DuckDNS); sin pago |
| Fecha de vencimiento | Sin fecha publicada: la FAQ de DuckDNS (<https://www.duckdns.org/faqs.jsp>, consultada el 18/11/2026) no menciona vencimiento ni renovación de los subdominios |

## 4.3 Registros DNS

| Nombre | Tipo | Valor | TTL | Propósito |
|---|---|---|---|---|
| `rehnimarket.duckdns.org` | A | `<ip-servidor>` (IP pública estática de la VM de Azure) | 60 | Web (frontend) |
| `apirehnimarket.duckdns.org` | A | `<ip-servidor>` (la misma IP) | 60 | API |

TTL medido con `dig` el 18/11/2026: [`docs/evidencias/hosting-produccion-2026-11-18.txt`](../evidencias/hosting-produccion-2026-11-18.txt).

## 4.4 Camino de una petición

1. El usuario abre `https://rehnimarket.duckdns.org`; DuckDNS responde con `<ip-servidor>`.
2. El grupo de seguridad de red (NSG) de Azure deja pasar el puerto 443 hacia la VM.
3. HTTPS termina en Caddy ([`caddy/Caddyfile`](../../caddy/Caddyfile)) con certificado de Let's Encrypt (emisor `YE2`, vence el 15/02/2027); el puerto 80 responde `308` hacia `https://` ([evidencia del 18/11/2026](../evidencias/hosting-produccion-2026-11-18.txt)).
4. Caddy elige el sitio por el encabezado `Host`: `rehnimarket.duckdns.org` devuelve el build de React; `apirehnimarket.duckdns.org` se reenvía a `backend:8000` por la red `edge`.
5. El backend consulta PostgreSQL por `pgbouncer:6432` → `postgres:5432` y lee las imágenes de `minio:9000`, por la red `data`, a la que Caddy no pertenece ([`docs/evidencias/verificacion-redes-produccion-2026-11-17.txt`](../evidencias/verificacion-redes-produccion-2026-11-17.txt)).

Puertos abiertos a Internet:

| Puerto | Servicio | ¿Por qué debe estar abierto? |
|---|---|---|
| 22/TCP | SSH | Administración y transferencia con llave; solo desde la IP del administrador ([`deploy/README.md`](../../deploy/README.md) §4) |
| 80/TCP | Caddy (HTTP) | Validación HTTP-01 de Let's Encrypt y redirección a HTTPS |
| 443/TCP y 443/UDP | Caddy (HTTPS y HTTP/3) | Acceso a la web y a la API |

## 4.5 Reverse proxy

Archivo en el repositorio: [`caddy/Caddyfile`](../../caddy/Caddyfile) (el mismo en desarrollo y en producción; los nombres salen de `SITE_ADDRESS` y `API_ADDRESS` del `.env`).

Evidencia de prueba local:

```
# 2026-11-04 21:51:58 UTC · SITE_ADDRESS=rehnimarket API_ADDRESS=api.rehnimarket CADDY_LOCAL_CERTS=local_certs · curl --cacert <raíz de Caddy> --resolve <nombre>:443:127.0.0.1
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

## 4.6 Transferencia de archivos

| Qué se transfiere | Método | Autenticación | Frecuencia |
|---|---|---|---|
| `.env` de producción | `scp .env rehni-prod:Rehni-Market/.env` y `chmod 600` en la VM | Llave SSH del administrador (alias `rehni-prod` en `~/.ssh/config`, [`deploy/checklist-azure.md`](../../deploy/checklist-azure.md) §1) | Instalación inicial y al rotar un secreto |
| Evidencias de producción | `scp "rehni-prod:Rehni-Market/docs/evidencias/*.txt" docs/evidencias/` | Llave SSH del administrador | Después de cada prueba en la VM |
| Código | `git fetch --tags` + `git checkout vX.Y.Z` desde GitHub por HTTPS | Ninguna (repositorio público, solo lectura) | En cada liberación |
| Respaldos de base de datos y MinIO | [PENDIENTE: SFTP o `rsync` sobre SSH hacia la copia fuera del sitio, que todavía no existe (semana 6, §3.1)] | [PENDIENTE: llave SSH de un usuario solo SFTP en el destino] | Diaria (RPO 24 h) |
