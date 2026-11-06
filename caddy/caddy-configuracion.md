# Configuración de Caddy — RehniMarket

Cómo está configurado Caddy como **reverse proxy** de RehniMarket y cómo dejarlo funcionando con
los dominios locales `rehnimarket` (frontend) y `api.rehnimarket` (API), con HTTPS.

Para la guía de la semana 3 (prácticas, plan de implantación, entregable) ver `caddy/readme.md`.

Todos los comandos, desde la raíz del proyecto:

```bash
cd ~/Escritorio/Rehni-Market
```

---

## 1. Resumen

| URL | Qué sirve |
|---|---|
| `https://rehnimarket/` | **Frontend** (build de React servido por Caddy desde `/srv`) |
| `https://api.rehnimarket/` | **API** (Caddy → `backend:8000`) |
| `http://…` | Redirige a HTTPS con `308` |
| `http://<IP-LAN>:8000/` | API directa, sin Caddy (solo la app móvil en la red local) |

```
                         ┌─ Host: rehnimarket      → /srv (React)
Navegador ──► Caddy ─────┤                            /assets/* caché 1 año · resto → index.html
 (:80 → :443)            └─ Host: api.rehnimarket  → backend:8000 ──► pgbouncer ──► postgres
                                                                  └──► minio
```

Caddy vive en el servicio `frontend` de `docker-compose.yml`: es el **único punto de entrada**
(puertos 80 y 443) y separa los dos sitios por el nombre (`Host` / SNI), con un solo contenedor
y una sola IP.

---

## 2. Archivos que intervienen

| Archivo | Qué tiene |
|---|---|
| `caddy/Caddyfile` | Los dos sitios, encabezados de seguridad, tope del cuerpo y healthcheck. **Único** para todos los entornos |
| `docker-compose.yml` | Servicio `frontend` (Caddy): puertos, volúmenes `caddy_data`/`caddy_config`, IP fija `172.30.0.10` y variables |
| `RehniMarket-frontend/Dockerfile` | Etapa 1 `pnpm build` (con `VITE_API_URL`); etapa 2 `caddy:2.11-alpine` con el build en `/srv` |
| `.env` (raíz) | Dominios, puertos, CA local, URL de la API y CORS |
| `RehniMarket-backend/.env` | `URL_FRONTEND` (correos y CORS de errores) y `URL_BACKEND` (app móvil) |
| `/etc/hosts` | Resuelve `rehnimarket` y `api.rehnimarket` a `127.0.0.1` |

El `Caddyfile` no se toca para cambiar de entorno: lee las variables con `{$VARIABLE:defecto}`.
**Solo cambian los `.env`.**

---

## 3. Configuración paso a paso

### 3.1 Resolver los nombres (`/etc/hosts`)

`rehnimarket` no es un dominio real: hay que decirle al sistema que apunta a este equipo.

```bash
grep rehnimarket /etc/hosts || printf '127.0.0.1 rehnimarket\n127.0.0.1 api.rehnimarket\n' | sudo tee -a /etc/hosts
getent hosts rehnimarket api.rehnimarket     # las dos en 127.0.0.1
```

### 3.2 `.env` de la raíz

```bash
# Dominios de los dos sitios (caddy/Caddyfile)
SITE_ADDRESS=rehnimarket
API_ADDRESS=api.rehnimarket

# CA local de Caddy para cualquier nombre (no son dominios públicos: Let's Encrypt no sirve)
CADDY_LOCAL_CERTS=local_certs

# URL de la API que usa el frontend. Se graba en el JS al compilar
VITE_API_URL=https://api.rehnimarket

# Origen del frontend que la API acepta (la API está en otro dominio)
CORS_EXTRA_ORIGINS=https://rehnimarket

# Opcionales (valores por defecto)
# HTTP_PORT=80
# HTTPS_PORT=443
# DOCS_ENABLED=false
```

| Variable | Para qué | Si se cambia |
|---|---|---|
| `SITE_ADDRESS` / `API_ADDRESS` | Nombres de los dos sitios de Caddy | `docker compose up -d frontend` |
| `CADDY_LOCAL_CERTS` | `local_certs` = certificados de la CA local con cualquier nombre. Vacía = Let's Encrypt para dominios públicos | `docker compose up -d frontend` |
| `HTTP_PORT` / `HTTPS_PORT` | Puertos de Caddy en el host (mismo puerto dentro y fuera, para que la redirección HTTP → HTTPS sea correcta) | Las URL llevan el puerto, y `VITE_API_URL` también |
| `VITE_API_URL` | URL de la API dentro del JavaScript del frontend | **Rebuild**: `docker compose up -d --build frontend` |
| `CORS_EXTRA_ORIGINS` | Orígenes permitidos por CORS (separados por coma) | `docker compose up -d backend` |
| `DOCS_ENABLED` | Swagger/ReDoc en `https://api.rehnimarket/docs` | `docker compose up -d backend` |

### 3.3 `RehniMarket-backend/.env`

```bash
URL_FRONTEND="https://rehnimarket"
# URL_BACKEND="http://<IP-LAN>:8000"   ← se deja así: la usa la app móvil
```

- **`URL_FRONTEND`**: enlaces de los correos y `Access-Control-Allow-Origin` de las respuestas
  de error (`app/utils/Response.py`). Si no coincide con el dominio del frontend, los errores
  de la API llegan al navegador como fallos de CORS.
- **`URL_BACKEND`**: base de las URL de imágenes cuando no se entra por Caddy (app móvil al
  `:8000`). Por Caddy, el backend usa el `X-Forwarded-Host` (`PublicBaseUrlMiddleware`) y arma
  `https://api.rehnimarket/media/proxy?path=…`.

### 3.4 Levantar

```bash
docker compose up -d --build --wait
docker compose ps        # los 5 servicios en "healthy"
```

`--build` es necesario la primera vez y cada vez que cambie `VITE_API_URL`.

### 3.5 Confiar en la CA local (una vez)

Caddy firma los certificados con su propia CA (vive en el volumen `caddy_data`). Hasta que el
sistema confíe en ella, el navegador muestra un aviso de certificado. En CachyOS / Arch:

```bash
docker compose cp frontend:/data/caddy/pki/authorities/local/root.crt /tmp/caddy-root.crt
sudo trust anchor --store /tmp/caddy-root.crt
trust list | grep -i caddy           # «Caddy Local Authority - …»
```

> **Este paso no es opcional.** Sin él, el frontend no llega al backend (sección 7.1). Caddy
> intenta instalar su raíz al arrancar (`installing root certificate` en los logs), pero dentro
> del contenedor no puede: hay que hacerlo en el host.

Reinicia el navegador (Firefox y Chromium leen el almacén del sistema con `p11-kit`). Si se
borra el volumen `caddy_data`, Caddy genera otra raíz y hay que repetirlo. Para quitarla:
`sudo trust anchor --remove /tmp/caddy-root.crt`.

---

## 4. Verificar

```bash
curl -sS -o /dev/null -w 'site %{http_code}\n' https://rehnimarket/            # site 200
curl -sS https://api.rehnimarket/health/database; echo                         # {"Base de datos":"OK"}
curl -sS -o /dev/null -w '%{http_code} → %{redirect_url}\n' http://rehnimarket/  # 308 → https://rehnimarket/

# CORS: la API acepta el origen del frontend
curl -sS -o /dev/null -D - -X OPTIONS \
  -H 'Origin: https://rehnimarket' -H 'Access-Control-Request-Method: GET' \
  https://api.rehnimarket/health/database | grep -i access-control-allow-origin
# access-control-allow-origin: https://rehnimarket

# El build del frontend apunta a la API correcta
docker compose exec frontend sh -c 'grep -l "api.rehnimarket" /srv/assets/*.js'
```

Sin haber hecho 3.5, añade `--cacert /tmp/caddy-root.crt` a cada `curl`.

---

## 5. El `Caddyfile` explicado

```
{
	http_port {$HTTP_PORT:80}
	https_port {$HTTPS_PORT:443}
	{$CADDY_LOCAL_CERTS}                     # local_certs o vacío
}

(seguridad) { … }                          # nosniff, Referrer-Policy, quita "Server"
(frontend)  { … }                          # gzip/zstd, HSTS, X-Frame-Options, caché, SPA

{$SITE_ADDRESS:localhost} {                # rehnimarket
	import frontend
}

{$API_ADDRESS:api.localhost} {             # api.rehnimarket
	encode zstd gzip
	import seguridad
	request_body { max_size 26MiB }        # subida más grande del backend + margen → 413
	reverse_proxy backend:8000
}

http://:8081 {                             # healthcheck interno (no publicado)
	respond "ok" 200
}
```

- **Sin `tls` ni `http://` en los sitios** → HTTPS automático y redirección HTTP → HTTPS.
  `localhost`/`*.localhost`/IP usan la CA local; un dominio público, Let's Encrypt;
  con `local_certs`, la CA local para todo.
- **SPA**: `try_files {path} /index.html` deja que React Router resuelva las rutas.
  `/assets/*` (con hash de Vite) se cachea un año; lo demás, `no-cache`.
- **`reverse_proxy`** reenvía sin cambiar la ruta y añade `X-Forwarded-For/Proto/Host`.
  Uvicorn corre con `--proxy-headers` y solo confía en la IP fija de Caddy
  (`FORWARDED_ALLOW_IPS=172.30.0.10`), así el rate limit ve la IP real del cliente.

Recargar tras editar el `Caddyfile` (sin reiniciar; si hay un error, sigue la configuración anterior):

```bash
docker compose exec frontend caddy reload --config /etc/caddy/Caddyfile
```

---

## 6. Otros entornos (solo cambian los `.env`)

| Variable | `localhost` (por defecto) | `rehnimarket` (local) | Producción |
|---|---|---|---|
| `SITE_ADDRESS` | `localhost` | `rehnimarket` | `<dominio>` |
| `API_ADDRESS` | `api.localhost` | `api.rehnimarket` | `api.<dominio>` |
| `CADDY_LOCAL_CERTS` | vacía | `local_certs` | vacía (Let's Encrypt) |
| `VITE_API_URL` | `https://api.localhost` | `https://api.rehnimarket` | `https://api.<dominio>` |
| `CORS_EXTRA_ORIGINS` | `https://localhost` | `https://rehnimarket` | `https://<dominio>` |
| `URL_FRONTEND` (backend) | `https://localhost` | `https://rehnimarket` | `https://<dominio>` |
| `BACKEND_BIND` | `0.0.0.0` (app móvil) | `0.0.0.0` (app móvil) | `127.0.0.1` |
| `/etc/hosts` | no hace falta | `127.0.0.1 rehnimarket api.rehnimarket` | no: registros DNS `A` |

En producción, los dos registros DNS deben apuntar al servidor y los puertos 80 y 443 estar
abiertos para que Let's Encrypt valide cada dominio. Plantilla: `deploy/env.prod.example`.

---

## 7. Problemas frecuentes

### 7.1 El frontend no conecta con el backend

**Síntoma:** `https://rehnimarket` carga, pero no aparecen productos, el login no responde o
la consola del navegador (F12) muestra `net::ERR_CERT_AUTHORITY_INVALID`, «Network Error» o un
error de CORS en las llamadas a `https://api.rehnimarket`. En los logs del backend
(`docker compose logs backend`) no aparece ninguna de esas peticiones.

**Causa:** el sistema no confía en la CA local de Caddy. `rehnimarket` y `api.rehnimarket`
tienen **certificados distintos**: aceptar el aviso al abrir `https://rehnimarket` solo vale para
ese nombre. Las llamadas `fetch`/axios del frontend a `https://api.rehnimarket` no muestran
aviso: el navegador las corta antes de que lleguen a Caddy.

**Diagnóstico:**

```bash
trust list | grep -i caddy                        # vacío = la raíz no está instalada
curl -sS https://api.rehnimarket/health/database  # curl: (60) … unable to get local issuer certificate
```

**Solución:** instalar la raíz de Caddy en el sistema (paso 3.5) y **cerrar y abrir el
navegador por completo**:

```bash
docker compose cp frontend:/data/caddy/pki/authorities/local/root.crt /tmp/caddy-root.crt
sudo trust anchor --store /tmp/caddy-root.crt
curl -sS https://api.rehnimarket/health/database  # {"Base de datos":"OK"}, sin error de certificado
```

> **Comprobado el 06/11/2026** (CachyOS): con esta solución el frontend volvió a conectar con
> el backend. Resultado tras instalar la raíz:
>
> ```
> $ trust list | grep -i caddy
>     label: Caddy Local Authority - 2026 ECC Root
> $ curl -sS https://api.rehnimarket/health/database
> {"Base de datos":"OK"}
> $ curl -sS -o /dev/null -w '%{http_code}\n' https://rehnimarket/
> 200
> ```
>
> La raíz vive en el volumen `caddy_data`: si se borra (`docker compose down -v`), Caddy crea
> otra y hay que repetir los dos comandos.

**Alternativa rápida** (sin instalar la raíz, por navegador y temporal): abrir
`https://api.rehnimarket/health/database`, aceptar el aviso y recargar `https://rehnimarket`.

Si con la raíz instalada sigue fallando, revisar en este orden: `VITE_API_URL` dentro del build
(sección 4, último comando), `CORS_EXTRA_ORIGINS` y `URL_FRONTEND` = `https://rehnimarket`, y
el error exacto en F12 → Red.

### 7.2 Otros problemas

| Síntoma | Causa | Solución |
|---|---|---|
| El frontend carga pero no llega a la API | La CA de Caddy no es de confianza para `api.rehnimarket` | Sección 7.1 |
| Aviso de certificado en el navegador / `curl: (60)` | El sistema no confía en la CA de Caddy | Paso 3.5 |
| `Could not resolve host: rehnimarket` | Falta `/etc/hosts` | Paso 3.1 |
| El frontend carga pero las llamadas fallan por CORS | `CORS_EXTRA_ORIGINS` / `URL_FRONTEND` no coinciden con `https://rehnimarket` | Corregir y `docker compose up -d backend` |
| El frontend llama a `api.localhost` u otra URL vieja | `VITE_API_URL` se graba al compilar | `docker compose up -d --build frontend` |
| Caddy intenta Let's Encrypt con `rehnimarket` y falla | Falta `CADDY_LOCAL_CERTS=local_certs` | Añadirlo y `docker compose up -d frontend` |
| `bind: address already in use` en 80/443 | Otro servidor (o el laboratorio de la semana 3) usa el puerto | Pararlo, o cambiar `HTTP_PORT`/`HTTPS_PORT` |
| Imágenes con URL `http://…:8000` en la web | La petición no pasó por Caddy | Entrar por `https://api.rehnimarket`, no por el `:8000` |

Logs de Caddy: `docker compose logs -f frontend`.
