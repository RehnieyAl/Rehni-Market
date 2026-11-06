# Semana 3 — Pasos a seguir

Hosting, dominio y transferencia de archivos. Guía paso a paso basada en
`bc-implantacion/bootcamp/week-03-hosting_dominio_y_transferencia/`. Los pasos 0-5 son las
prácticas del curso; el paso 6 aplica la semana a **RehniMarket**, con Caddy como único reverse proxy: frontend en
`rehnimarket` y API en `api.rehnimarket` en local (en producción, `<dominio>` y
`api.<dominio>`), con HTTPS automático. Configuración: [`caddy-configuracion.md`](caddy-configuracion.md).

> **Ojo con el puerto HTTP:** en tu copia, `compose.yaml` publica el HTTP del proxy en **8081**
> (los documentos del curso dicen 8080). En esta guía se usa 8081. RehniMarket usa 80 y 443
> (y el 8081 dentro del contenedor, sin publicar): no levantes los dos a la vez.

Carpeta de la semana (la usan todos los pasos):

```bash
cd ~/Escritorio/bc-implantacion/bootcamp/week-03-hosting_dominio_y_transferencia
```

---

## Paso 0 — Preparar el equipo

- [ ] Docker y Compose funcionan: `docker compose version`
- [ ] Cliente OpenSSH: `ssh -V` y `sftp` disponibles
- [ ] `dig` instalado: `dig -v` (si no está: paquete `bind` en Arch/CachyOS, `dnsutils` en Ubuntu)
- [ ] Conexión a Internet (para la práctica 01)

---

## Paso 1 — Leer la teoría (≈ 4,5 h)

En orden, dentro de `1-teoria/`:

1. [ ] `01-tipos-de-hosting.md` — estático, compartido, VPS, dedicado, PaaS. *A más control, más responsabilidad.*
2. [ ] `02-dominios-y-dns.md` — resolución DNS, registros A/AAAA/CNAME/MX/TXT/NS y TTL.
3. [ ] `03-servidor-web-y-reverse-proxy.md` — virtual hosts, `X-Forwarded-*`, HTTPS con Let's Encrypt, Caddy.
4. [ ] `04-transferencia-de-archivos.md` — por qué FTP no, SFTP, `scp`, `rsync` y llaves SSH.

Conviene intercalar cada teoría con su práctica (1 → práctica 01, 3 → práctica 02, 4 → práctica 03).

---

## Paso 2 — Práctica 01: DNS con `dig` (≈ 1,5 h)

```bash
dig example.com A                       # leer la ANSWER SECTION: nombre, TTL, clase, tipo, valor
dig +short example.com A
dig +short example.com AAAA
dig +noall +answer www.github.com       # CNAME y luego A
dig +short NS wikipedia.org
dig +short MX gmail.com
dig +short TXT example.com
```

TTL y caché (ejecutar dos veces y comparar el TTL):

```bash
dig +noall +answer github.com A
sleep 10
dig +noall +answer github.com A
dig @1.1.1.1 +noall +answer github.com A
dig @8.8.8.8 +noall +answer github.com A
```

Camino completo:

```bash
dig +trace example.com A                # raíz (.) → TLD (com.) → autoritativo
```

- [ ] Respondí: con TTL 86400, ¿cuánto tardan los usuarios en ver una IP nueva? ¿Qué hago *antes* del cambio?

---

## Paso 3 — Levantar el laboratorio

```bash
cd 2-practicas/laboratorio
docker compose up -d --wait
docker compose ps                       # los 3 servicios en "healthy"
```

Para verlo en el navegador (opcional), los nombres `.test` deben apuntar a tu equipo. Elige una:

- `/etc/hosts` (en tu terminal, no en Claude Code):
  `echo "127.0.0.1 sitio.lab.test api.lab.test equipo.lab.test rehnimarket api.rehnimarket" | sudo tee -a /etc/hosts`
- Solo Firefox: `about:config` → `network.dns.localDomains` = `sitio.lab.test,api.lab.test,equipo.lab.test,rehnimarket,api.rehnimarket`

Luego abre `https://sitio.lab.test:8443/` y acepta el aviso del certificado.

---

## Paso 4 — Práctica 02: sitios por nombre, reverse proxy y HTTPS (≈ 2,5 h)

Desde `2-practicas/laboratorio/`:

1. **Dos sitios, un servidor.** Revisa `caddy/Caddyfile` y prueba:
   ```bash
   curl -k --resolve api.lab.test:8443:127.0.0.1 https://api.lab.test:8443/
   curl -k --resolve sitio.lab.test:8443:127.0.0.1 https://sitio.lab.test:8443/ -i
   ```
   - [ ] ¿Cómo elige Caddy el servicio? (encabezado `Host`)
2. **Lo que ve el backend.** En la respuesta de la API busca `RemoteAddr`, `X-Forwarded-For`,
   `X-Forwarded-Proto`, `X-Forwarded-Host`.
3. **HTTP → HTTPS:**
   ```bash
   curl -i -H "Host: sitio.lab.test" http://127.0.0.1:8081/      # espera 308
   ```
4. **El certificado:**
   ```bash
   curl -kv --resolve sitio.lab.test:8443:127.0.0.1 https://sitio.lab.test:8443/ 2>&1 \
     | grep -E "subject:|issuer:|expire date"
   ```
   - [ ] Prueba sin `-k` y explica por qué falla.
   - [ ] ¿Qué cambia en un servidor real? (se quita `tls internal`)
5. **Tu propio sitio.** Agrega al final de `caddy/Caddyfile`:
   ```
   equipo.lab.test {
   	tls internal
   	respond "Hola desde el equipo <nombre>"
   }
   ```
   ```bash
   docker compose exec proxy caddy reload --config /etc/caddy/Caddyfile
   curl -k --resolve equipo.lab.test:8443:127.0.0.1 https://equipo.lab.test:8443/
   ```
6. **Error provocado.** Borra una `}` del `Caddyfile`, ejecuta `caddy reload` y comprueba que los
   sitios siguen funcionando. Corrige el error y recarga.

---

## Paso 5 — Práctica 03: publicar archivos por SFTP (≈ 2 h)

Desde `2-practicas/laboratorio/`:

1. **Con contraseña** (`deploy-lab`, solo de laboratorio):
   ```bash
   sftp -P 2222 deploy@127.0.0.1
   ```
   Dentro de `sftp>`: `pwd`, `ls`, `cd sitio`, `put publicar/index.html`, `ls -l`, `bye`.
   ```bash
   curl -k --resolve sitio.lab.test:8443:127.0.0.1 https://sitio.lab.test:8443/
   ```
   - [ ] ¿Por qué `pwd` muestra `/`? (chroot)
2. **Con llave SSH** (ya tienes `~/.ssh/lab_hosting`; si no, créala):
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/lab_hosting -C "lab-hosting"
   cp ~/.ssh/lab_hosting.pub llaves/
   docker compose up -d --force-recreate sftp --wait
   sftp -P 2222 -i ~/.ssh/lab_hosting deploy@127.0.0.1      # no debe pedir contraseña
   ```
3. **Sin interacción** (como en un script de despliegue):
   ```bash
   printf 'cd sitio\nput publicar/index.html\nls -l\n' \
     | sftp -b - -P 2222 -i ~/.ssh/lab_hosting deploy@127.0.0.1
   ```
4. **`scp`** contra un servidor solo SFTP:
   ```bash
   echo "<p>segunda versión</p>" > /tmp/v2.html
   scp -P 2222 -i ~/.ssh/lab_hosting /tmp/v2.html deploy@127.0.0.1:sitio/
   scp -s -P 2222 -i ~/.ssh/lab_hosting /tmp/v2.html deploy@127.0.0.1:sitio/
   ```
5. **`rsync`** (debe fallar — el servidor no permite ejecutar comandos):
   ```bash
   rsync -av -e "ssh -p 2222 -i ~/.ssh/lab_hosting" publicar/ deploy@127.0.0.1:sitio/
   ```
6. **FTP:** solo comparar en la tabla de la teoría 04. ¿Qué exigirías a un proveedor que solo ofrece FTP?

---

## Paso 6 — Proyecto RehniMarket: estrategia de hosting y dominio (≈ 1,5 h + autónomo)

Sobre **RehniMarket**, no sobre el laboratorio. Guía del curso:
`3-proyecto/starter/entregable-s03-hosting-y-dominio.md`. Se completa la **sección 4** del plan:
`docs/plan de implantacion - Rehnimarket/4) Hosting y dominio — Semana 3 (CE-1).md`.

> **Estado:** la configuración del reverse proxy ya está hecha y probada (20/10/2026): Nginx se
> reemplazó por Caddy, y el frontend y la API quedaron en **URL separadas**. Este paso explica
> cómo quedó, cómo volver a probarlo y qué escribir en el plan. El detalle del cambio está en
> `RehniMarket-backend/CHANGELOG.md` → `[Unreleased]`.

> **Configuración:** la puesta en marcha con `rehnimarket` / `api.rehnimarket` (`/etc/hosts`,
> `.env`, CA local, verificación y problemas frecuentes) está en
> [`caddy-configuracion.md`](caddy-configuracion.md).

Todos los comandos de este paso, desde la raíz del proyecto:

```bash
cd ~/Escritorio/Rehni-Market
```

### 6.1 Las dos URL

| URL | Qué es |
|---|---|
| `https://rehnimarket/` | **Frontend** (React) |
| `https://api.rehnimarket/` | **API** (FastAPI). Swagger en `/docs` y ReDoc en `/redoc`, solo con `DOCS_ENABLED=true` |
| `http://<IP-LAN>:8000/` | API directa al backend (sin Caddy; la usa la app móvil en la red local) |

HTTP (`:80`) redirige a HTTPS (`:443`) con 308. Es la técnica de la práctica 02: **virtual
hosts**. Las dos URL llegan al mismo puerto del mismo Caddy, y Caddy decide por el nombre
(`Host` / SNI). Los dos nombres resuelven a `127.0.0.1` por `/etc/hosts`. Con los valores por
defecto (`localhost` / `api.localhost`) no hace falta: `*.localhost` ya resuelve a `127.0.0.1`.

### 6.2 Servicios del proyecto

| Servicio | Qué es | Puerto publicado | ¿Accesible desde fuera? |
|---|---|---|---|
| `frontend` | **Caddy**: sirve el build de React y hace de reverse proxy de la API | `${HTTP_PORT:-80}` y `${HTTPS_PORT:-443}` (TCP y UDP para HTTP/3) | ✅ Es el punto de entrada |
| `backend` | FastAPI + Uvicorn en el `8000` | `${BACKEND_BIND:-127.0.0.1}:8000` | Solo en local (app móvil); en producción `127.0.0.1` |
| `postgres` | PostgreSQL 17 | `127.0.0.1:${POSTGRES_PORT:-5433}` | ❌ Nunca (solo loopback; túnel SSH en el servidor) |
| `pgbouncer` | Pool de conexiones a Postgres | ninguno | ❌ Nunca |
| `minio` | Almacén de imágenes | ninguno | ❌ Nunca |
| `postgres-test` | Postgres desechable de pytest (`--profile test`) | `127.0.0.1:55433` | ❌ Nunca |

### 6.3 Camino de una petición

```
                       ┌─ Host: rehnimarket     → archivos del build (/srv)
Navegador ──► Caddy ───┤                                     /assets/* caché 1 año · resto → index.html
  (:80→:443)           └─ Host: api.rehnimarket → backend:8000 ──► pgbouncer ──► postgres
                                                                        └──► minio
```

1. El navegador abre `https://rehnimarket/` y recibe el frontend.
2. El JavaScript del frontend llama a `https://api.rehnimarket/...` (`VITE_API_URL`). Es
   **otro origen**, así que el navegador pregunta antes por CORS y el backend responde que
   ese origen está permitido (`CORS_EXTRA_ORIGINS`).
3. Caddy reenvía la petición al backend **sin cambiar la ruta**: `/auth/login-user` llega
   igual. Con `DOCS_ENABLED=true`, Swagger funciona en `/docs` sin ningún ajuste.

En producción es lo mismo con `<dominio>` y `api.<dominio>`.

### 6.4 Archivos que intervienen

| Archivo | Qué tiene |
|---|---|
| `caddy/Caddyfile` | **Único** (desarrollo y producción): los dos sitios y el healthcheck. Se monta en `/etc/caddy` (por eso esta guía también aparece dentro del contenedor; no afecta) |
| `RehniMarket-frontend/Dockerfile` | Etapa 1: `pnpm build`. Etapa 2: `caddy:2.11-alpine` con el build en `/srv` |
| `docker-compose.yml` | **Único**: servicio `frontend` con Caddy (80/443, `caddy_data`, `caddy_config`); `backend` con `--proxy-headers`, `DOCS_ENABLED` y `CORS_EXTRA_ORIGINS` |
| `.env` | `SITE_ADDRESS`, `API_ADDRESS`, `HTTP_PORT`, `HTTPS_PORT`, `VITE_API_URL`, `CORS_EXTRA_ORIGINS`, `DOCS_ENABLED` (`.env.example` / `deploy/env.prod.example`) |
| `RehniMarket-backend/app/middleware/PublicBaseUrlMiddleware.py` | Arma las URL de imágenes con el host por el que entró el cliente (6.5) |

El `Caddyfile` en resumen (léelo completo en `caddy/Caddyfile`):

```
{
	http_port {$HTTP_PORT:80}
	https_port {$HTTPS_PORT:443}
	{$CADDY_LOCAL_CERTS}                  # opcional: local_certs
}

(frontend) {
	# encabezados de seguridad, caché de /assets y try_files {path} /index.html
}

{$SITE_ADDRESS:localhost} {             # frontend
	import frontend
}

{$API_ADDRESS:api.localhost} {          # API
	reverse_proxy backend:8000
}

http://:8081 {                          # healthcheck del contenedor (no publicado)
	respond "ok" 200
}
```

- **Sin `tls` ni prefijo `http://` en los sitios**: Caddy activa el HTTPS automático y elige el
  emisor por el nombre. `localhost`, `*.localhost` o una IP → su CA local (como `tls internal`);
  un dominio público → Let's Encrypt. En los dos casos redirige HTTP → HTTPS.
- **`CADDY_LOCAL_CERTS=local_certs`**: fuerza la CA local con cualquier nombre. Solo para probar
  en local con los nombres elegidos (`rehnimarket` / `api.rehnimarket`, 6.7). Vacía en producción.
- **Snippet `(frontend)`**: la configuración del frontend se escribe una vez y se reutiliza
  con `import`.
- **`{$VARIABLE:valor}`**: Caddy lee variables de entorno. Para producción no hay que tocar el
  archivo, solo el `.env` (6.9).
- **Mismo puerto dentro y fuera** (`${HTTPS_PORT}:${HTTPS_PORT}`): la redirección HTTP → HTTPS
  apunta a `https_port`; si se publicara `8443:443`, redirigiría a un puerto equivocado.

### 6.5 Variables

| Archivo | Variable | Valor por defecto | Para qué |
|---|---|---|---|
| `.env` | `SITE_ADDRESS` / `API_ADDRESS` | `localhost` / `api.localhost` | Dominios de los dos sitios. En producción, `<dominio>` / `api.<dominio>` |
| `.env` | `HTTP_PORT` / `HTTPS_PORT` | `80` / `443` | Puertos de Caddy en el host. En producción, 80 y 443 (Let's Encrypt) |
| `.env` | `CADDY_LOCAL_CERTS` | vacía | `local_certs` para la prueba de 6.7 |
| `.env` | `VITE_API_URL` | `https://api.localhost` | URL de la API que usa el frontend. **Se graba al compilar**: tras cambiarla, `docker compose up -d --build frontend` |
| `.env` | `CORS_EXTRA_ORIGINS` | `https://localhost` | Origen del frontend que la API acepta. `URL_FRONTEND` sigue para los correos |
| `.env` | `DOCS_ENABLED` | `false` | Swagger y ReDoc. Con `false`, `/docs`, `/redoc` y `/openapi.json` responden 401. Para usarlos en local: `true` y `docker compose up -d backend`. **En producción, `false`** |
| `.env` | `POSTGRES_PORT` | `5433` | Puerto de Postgres en `127.0.0.1` |
| `.env` (opcional) | `FORWARDED_ALLOW_IPS` | `172.30.0.10` | Proxy del que Uvicorn acepta `X-Forwarded-For`: solo Caddy, con IP fija en `docker-compose.yml` |

**¿Por qué `--proxy-headers`?** El `RateLimitMiddleware` usa `request.client.host`. Detrás de
Caddy, sin esa opción, todas las peticiones llegarían con la IP del proxy y el límite de un
usuario bloquearía a todos. Solo se confía en la IP fija de Caddy (`172.30.0.10`), no en
toda la red de Docker: la pasarela (`172.30.0.1`) es por donde entra lo que llega al `:8000`
desde el propio equipo, y con un rango como `172.16.0.0/12` quien llegara directo al `:8000`
desde el servidor podría falsear su IP con `X-Forwarded-For` (comprobado el 04/11/2026).
Caddy, además, descarta el `X-Forwarded-For` que mande el cliente.

**¿Por qué `PublicBaseUrlMiddleware`?** Las URL de las imágenes (MinIO, servidas por
`/media/proxy`) las arma el backend. Cuando la petición llega por Caddy, el encabezado
`X-Forwarded-Host` le dice por qué host entró el cliente:

| Cómo entra el cliente | URL de imagen que recibe |
|---|---|
| `https://api.rehnimarket` (el frontend) | `https://api.rehnimarket/media/proxy?path=…` |
| App móvil directo al `:8000` | `URL_BACKEND/media/proxy?path=…` (sin cambios) |

### 6.6 Levantar

```bash
docker compose up -d --build --wait
docker compose ps        # los 5 servicios en "healthy"
docker compose watch     # desarrollo: recarga al guardar (develop.watch)
```

> El laboratorio de la semana 3 publica puertos propios (`8081`, `8443`): **no levantes los dos a la vez**.

Si solo editas `caddy/Caddyfile`, recárgalo sin reiniciar ni reconstruir (con
`docker compose watch` se reinicia solo):

```bash
docker compose exec frontend caddy reload --config /etc/caddy/Caddyfile
```

Si la nueva configuración tiene un error, Caddy lo rechaza y sigue con la anterior.

### 6.7 Probar (evidencia del entregable)

La prueba con los nombres elegidos (`rehnimarket` / `api.rehnimarket`, CA local forzada con
`CADDY_LOCAL_CERTS` y `curl --resolve`) y su salida están en la §4.5 del plan
(`docs/plan de implantacion - Rehnimarket/4) Hosting y dominio — Semana 3 (CE-1).md`). La
prueba de humo contra `https://localhost` está en la §5.2.

### 6.7.1 Confiar en la CA local

Caddy firma los certificados de `localhost` con su propia CA (volumen `caddy_data`). Para que
el navegador y `curl` no avisen, confía en su raíz **una vez** (en tu terminal: `sudo` pide la
contraseña). En CachyOS / Arch:

```bash
docker compose cp frontend:/data/caddy/pki/authorities/local/root.crt /tmp/caddy-root.crt
sudo trust anchor --store /tmp/caddy-root.crt
trust list | grep -i caddy          # «Caddy Local Authority - 2026 ECC Root»
curl -I https://rehnimarket          # sin -k: responde sin error de certificado
```

En Arch, `p11-kit` hace que Firefox y Chromium lean el almacén del sistema: reinicia el
navegador si estaba abierto. La raíz dura 10 años y vive en `caddy_data`: si borras el volumen,
se genera otra y hay que repetirlo. Para quitarla: `sudo trust anchor --remove /tmp/caddy-root.crt`.

Sin instalarla, `curl` acepta la raíz por variable: `CURL_CA_BUNDLE=/tmp/caddy-root.crt curl https://rehnimarket`.

**Usar Swagger con endpoints protegidos** (requiere `DOCS_ENABLED=true` en `.env` y
`docker compose up -d backend`): en `https://api.rehnimarket/docs`, `POST /auth/login-user` →
**Try it out** → **Execute**; copia el `access_token`, pulsa **Authorize** y pégalo.

Las líneas `rehnimarket` / `api.rehnimarket` de `/etc/hosts` hacen falta para abrir esos nombres
en el navegador (ver [`caddy-configuracion.md`](caddy-configuracion.md)); para la prueba con
`curl` de 6.7 bastan `curl --resolve`.

### 6.8 Pendientes antes de producción

1. **App móvil.** Sigue entrando directo al `:8000` con `URL_BACKEND`. En producción debería
   usar `https://api.<dominio>` (`EXPO_PUBLIC_API_URL` y `URL_BACKEND`).
2. **Cerrar el `:8000`.** En producción, `BACKEND_BIND=127.0.0.1` (ya en `deploy/env.prod.example`).
3. **`URL_FRONTEND`** (enlaces de los correos) con el dominio real: `https://<dominio>`
   (en local ya es `https://rehnimarket`).

### 6.9 Paso a producción (para la sección 4 del plan)

Mismo `docker-compose.yml` y mismo `Caddyfile`; solo cambia el `.env` (plantilla completa en
`deploy/env.prod.example`):

```bash
# .env en el servidor
SITE_ADDRESS=<dominio>
API_ADDRESS=api.<dominio>
HTTP_PORT=80
HTTPS_PORT=443
CADDY_LOCAL_CERTS=
VITE_API_URL=https://api.<dominio>
CORS_EXTRA_ORIGINS=https://<dominio>
DOCS_ENABLED=false
BACKEND_BIND=127.0.0.1
```

Requisitos: los dos registros DNS ya deben apuntar al servidor y los puertos 80 y 443 deben
estar abiertos en el firewall, para que Let's Encrypt verifique cada dominio. No hace falta
correo ACME: Let's Encrypt no lo exige.

### 6.10 Qué escribir en la sección 4 del plan

**Hosting por componente** (ejemplo para justificar):

| Componente | Tipo de hosting | Justificación |
|---|---|---|
| Frontend + Caddy | VPS | Mismo contenedor que es el punto de entrada y termina TLS de los dos dominios |
| Backend | VPS | Uvicorn con varios workers, PgBouncer y MinIO al lado: necesita control del servidor |
| PostgreSQL + PgBouncer | VPS (contenedor) o gestionada | Ver paso 6b |
| MinIO (imágenes) | VPS (contenedor) | Almacén de objetos propio. Se sirve por el backend, no se expone |

**DNS** (dos nombres, uno por URL):

| Tipo | Nombre | Valor | TTL |
|---|---|---|---|
| `A` | `<dominio>` | IP pública del servidor (ej. `203.0.113.10`) | 3600 (bajarlo a 300 antes de un cambio) |
| `A` | `api.<dominio>` | La misma IP | 3600 |

Las dos URL comparten servidor e IP; Caddy las separa por nombre. Si la API se moviera a otro
servidor o a un PaaS, solo cambiaría el registro de `api` (a otra `A` o a un `CNAME`).

**Puertos abiertos a Internet:** solo `80` y `443`, y `22` para SSH limitado por firewall.

**Transferencia de archivos:**

| Qué | Método | Autenticación |
|---|---|---|
| Código e imágenes Docker | `git pull` + `docker compose up -d --build` en el servidor (en la semana 7: imagen desde un registro) | Llave SSH / deploy key |
| `.env` y `RehniMarket-backend/.env` | `scp` con llave y `chmod 600` en el servidor. Nunca por Git | Llave SSH |
| Respaldos (`pg_dump`, datos de MinIO) | `rsync` o SFTP desde el servidor hacia un destino externo | Llave SSH |

**Evidencia:** la tabla de 6.7 y la salida de los comandos.

### 6.11 Checklist del entregable

- [x] `caddy/Caddyfile` en el repo, probado en local con la CA local (`CADDY_LOCAL_CERTS`) y `curl --resolve`
- [x] Frontend y API en URL separadas, detrás de un solo punto de entrada (Caddy), con HTTPS
- [x] Uvicorn con `--proxy-headers` (IP real para el rate limit)
- [ ] Pendientes de 6.8 resueltos o documentados en el plan
- [ ] Tipo de hosting por componente, justificado
- [ ] Dominio (quién lo paga y quién lo renueva) y tabla DNS con TTL
- [ ] Camino de una petición (diagrama de 6.3) y puertos abiertos
- [ ] Método de transferencia con llave, incluidos los `.env` y los respaldos
- [ ] Base de datos incluida en la estrategia (paso 6b)
- [ ] Sin IPs, hosts, usuarios ni contraseñas reales

---

## Paso 6b — La base de datos de RehniMarket

La base de datos es la pieza que **no se publica**. Caddy es un proxy HTTP; PostgreSQL habla su
propio protocolo por TCP y solo el **backend** llega a ella, y en RehniMarket ni siquiera
directamente:

```
backend ──► pgbouncer:6432 ──► postgres:5432        (red privada de Compose)
```

Por eso **no lleva registro DNS ni ruta en el `Caddyfile`**. Lo mismo aplica a MinIO: las
imágenes las entrega el backend en `/media/proxy` (por Caddy,
`https://api.<dominio>/media/proxy`), nunca el puerto 9000.

### Estado actual en el compose

- `pgbouncer` y `minio` **no tienen `ports:`** en `docker-compose.yml`. ✅
- `postgres` se publica en `127.0.0.1:${POSTGRES_PORT:-5433}` para DbSchema, **también en el
  servidor**: solo en el loopback, nunca `0.0.0.0`. Desde fuera solo se llega por túnel SSH. ✅
- Los datos viven en el volumen `postgres_data` y las imágenes en `minio_data`.
  `docker compose down -v` **los borra**: nunca lo ejecutes en el servidor.
- Las credenciales están en `RehniMarket-backend/.env`, ignorado por Git. ✅

### Opciones de hosting

| Opción | Ventaja | Lo que asumes tú |
|---|---|---|
| **Contenedor en el VPS** (como hoy) | Control total, PgBouncer y la configuración de memoria ya ajustados | Respaldos, actualizaciones y espacio en disco |
| **Gestionada** (Neon, Supabase, free tier) | Parches, respaldos y disponibilidad los pone el proveedor | Límites de conexiones y almacenamiento del free tier; la URL con TLS es un secreto |

En una gestionada la base sí tiene un nombre público (ej. `ep-xxx.neon.tech`), pero lo pone el
proveedor y la protegen la contraseña, TLS obligatorio y, si se puede, una lista de IPs
permitidas. No lo agregas a tu DNS.

### Administrarla en el servidor sin abrir el puerto

Postgres está publicado solo en `127.0.0.1:5433` del servidor; usa un **túnel SSH**:

```bash
ssh -L 5433:127.0.0.1:5433 usuario@servidor    # tu equipo:5433 → servidor:5433
# DbSchema o psql contra localhost:5433
```

### Qué se transfiere

Nada de la base se sube a mano. Solo viajan los **respaldos**: `pg_dump` (y una copia de
`minio_data`) en el servidor, y de ahí a un destino externo por SFTP o `rsync` con llave. En tu
equipo van a `backups/`, que está ignorado por Git. El plan de respaldo viene de la semana 2, y
en la semana 9 otro equipo debe restaurar uno.

### En el entregable

- [ ] Dónde vive PostgreSQL (contenedor o gestionada) y por qué; el papel de PgBouncer
- [ ] Que ni Postgres, ni PgBouncer, ni MinIO tienen puerto abierto a Internet
- [ ] Que no tienen registro DNS propio en tu dominio
- [ ] Cómo salen los respaldos de la base y de MinIO del servidor, con qué método y con llave

---

## Paso 7 — Limpieza

Desde `2-practicas/laboratorio/`:

```bash
docker compose down -v
rm llaves/lab_hosting.pub
```

Si añadiste los dominios a `/etc/hosts`: `sudo sed -i '/lab.test/d' /etc/hosts` (en tu terminal).

---

## ✅ Checklist final de la semana

- [ ] Sé qué administro yo y qué el proveedor en cada tipo de hosting
- [ ] Interpreto la salida de `dig` y sé para qué sirve el TTL
- [ ] Publiqué dos servicios en un servidor diferenciados por nombre, con HTTPS
- [ ] Publiqué archivos por SFTP con llave SSH, sin contraseña
- [ ] Puedo explicar por qué FTP plano no se usa
- [ ] Mi entregable no contiene IPs, hosts ni credenciales reales

**Siguiente:** semana 4 — despliegue local y en la nube.
