# Semana 3 — Pasos a seguir

Hosting, dominio y transferencia de archivos. Guía paso a paso basada en
`bc-implantacion/bootcamp/week-03-hosting_dominio_y_transferencia/`. Los pasos 0-5 son las
prácticas del curso; el paso 6 aplica la semana a **RehniMarket**, donde Caddy ya reemplazó a
Nginx: frontend en `rehnimarket` y API en `api.rehnimarket`.

> **Ojo con el puerto HTTP:** en tu copia, `compose.yaml` publica el HTTP del proxy en **8081**
> (los documentos del curso dicen 8080). En esta guía se usa 8081. RehniMarket usa 8080 y 8443:
> el `8443` choca con el laboratorio, así que no levantes los dos a la vez.

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

Todos los comandos de este paso, desde la raíz del proyecto:

```bash
cd ~/Escritorio/Rehni-Market
```

### 6.1 Las dos URL

| URL | Qué es |
|---|---|
| `https://rehnimarket:8443/` | **Frontend** (React) |
| `https://api.rehnimarket:8443/` | **API** (FastAPI). Swagger en `/docs` y ReDoc en `/redoc`, solo con `DOCS_ENABLED=true` |
| `http://localhost:8080/` o `http://<IP-de-tu-equipo>:8080/` | Frontend por HTTP, sin dominio |
| `http://localhost:8000/` | API directa al backend (sin Caddy; la usa la app móvil) |

Es la técnica de la práctica 02: **virtual hosts**. Las dos URL llegan al mismo puerto del mismo
Caddy, y Caddy decide por el nombre (`Host` / SNI).

### 6.2 Servicios del proyecto

| Servicio | Qué es | Puerto publicado | ¿Accesible desde fuera? |
|---|---|---|---|
| `frontend` | **Caddy**: sirve el build de React y hace de reverse proxy de la API | `8080` (HTTP) y `8443` (HTTPS) | ✅ Es el punto de entrada |
| `backend` | FastAPI + Uvicorn en el `8000` | `${BACKEND_BIND}:8000` | Debería ser solo por Caddy (ver 6.8) |
| `postgres` | PostgreSQL 17 | `127.0.0.1:5433` (solo por `docker-compose.override.yml`) | ❌ Nunca |
| `pgbouncer` | Pool de conexiones a Postgres | ninguno | ❌ Nunca |
| `minio` | Almacén de imágenes | ninguno | ❌ Nunca |

### 6.3 Camino de una petición

```
                       ┌─ Host: rehnimarket      → archivos del build (/srv)
Navegador ──► Caddy ───┤                                      /assets/* caché 1 año · resto → index.html
  (:80/:443)           └─ Host: api.rehnimarket  → backend:8000 ──► pgbouncer ──► postgres
                                                                         └──► minio
```

1. El navegador abre `https://rehnimarket:8443/` y recibe el frontend.
2. El JavaScript del frontend llama a `https://api.rehnimarket:8443/...`
   (`VITE_API_URL`). Es **otro origen**, así que el navegador pregunta antes por CORS y el
   backend responde que ese origen está permitido (`CORS_EXTRA_ORIGINS`).
3. Caddy reenvía la petición al backend **sin cambiar la ruta**: `/auth/login-user` llega
   igual. Con `DOCS_ENABLED=true`, Swagger funciona en `/docs` sin ningún ajuste.

### 6.4 Archivos que intervienen

| Archivo | Qué tiene |
|---|---|
| `caddy/Caddyfile` | Los dos sitios. Se monta en `/etc/caddy` (por eso esta guía también aparece dentro del contenedor; no afecta) |
| `RehniMarket-frontend/Dockerfile` | Etapa 1: `pnpm build`. Etapa 2: `caddy:2.11-alpine` con el build en `/srv` |
| `docker-compose.yml` | Servicio `frontend` con Caddy; `backend` con `--proxy-headers`, `DOCS_ENABLED` y `CORS_EXTRA_ORIGINS` |
| `.env` | `VITE_API_URL`, `DOCS_ENABLED`, `CORS_EXTRA_ORIGINS` |
| `RehniMarket-backend/app/middleware/PublicBaseUrlMiddleware.py` | Arma las URL de imágenes con el host por el que entró el cliente (6.5) |

El `Caddyfile` en resumen (léelo completo en `caddy/Caddyfile`):

```
(frontend) {
	# encabezados de seguridad, caché de /assets y try_files {path} /index.html
}

{$SITE_ADDRESS:rehnimarket} {          # frontend
	tls {$CADDY_TLS:internal}
	import frontend
}

{$API_ADDRESS:api.rehnimarket} {       # API
	tls {$CADDY_TLS:internal}
	reverse_proxy backend:8000
}

:80 {                                           # frontend por IP o localhost, en HTTP
	import frontend
}
```

- **Snippet `(frontend)`**: la configuración del frontend se escribe una vez y se reutiliza
  con `import`.
- **`{$VARIABLE:valor}`**: Caddy lee variables de entorno. Para producción no hay que tocar el
  archivo, solo las variables (6.9).
- **Bloque `:80`**: deja entrar al frontend por IP en HTTP, como se hacía con Nginx. Lo usa
  también el healthcheck del contenedor. En un servidor con dominio público se puede quitar.

### 6.5 Variables

| Archivo | Variable | Valor actual | Para qué |
|---|---|---|---|
| `.env` | `VITE_API_URL` | `https://api.rehnimarket:8443` | URL de la API que usa el frontend. **Se graba al compilar**: tras cambiarla, `docker compose up -d --build frontend` |
| `.env` | `CORS_EXTRA_ORIGINS` | `https://rehnimarket:8443` | Origen del frontend que la API acepta. `URL_FRONTEND` sigue para los correos |
| `.env` | `DOCS_ENABLED` | `false` | Swagger y ReDoc. Con `false`, `/docs`, `/redoc` y `/openapi.json` responden 401. Para usarlos en local: `true` y `docker compose up -d backend`. **En producción, `false`** |
| `.env` (opcional) | `SITE_ADDRESS` / `API_ADDRESS` | `rehnimarket` / `api.rehnimarket` | Dominios de los dos sitios |
| `.env` (opcional) | `CADDY_TLS` | `internal` | CA local; en producción, un correo para Let's Encrypt |
| `.env` (opcional) | `FRONTEND_PORT` / `FRONTEND_HTTPS_PORT` | `8080` / `8443` | Puertos en el host |
| `.env` (opcional) | `FORWARDED_ALLOW_IPS` | `172.16.0.0/12` | Redes de las que Uvicorn acepta `X-Forwarded-For` (las de Docker) |

**¿Por qué `--proxy-headers`?** El `RateLimitMiddleware` usa `request.client.host`. Detrás de
Caddy, sin esa opción, todas las peticiones llegarían con la IP del proxy y el límite de un
usuario bloquearía a todos. Solo se confía en la red de Docker: quien llega directo al `:8000`
no puede falsear su IP.

**¿Por qué `PublicBaseUrlMiddleware`?** Las URL de las imágenes (MinIO, servidas por
`/media/proxy`) las arma el backend. Cuando la petición llega por Caddy, el encabezado
`X-Forwarded-Host` le dice por qué host entró el cliente:

| Cómo entra el cliente | URL de imagen que recibe |
|---|---|
| `https://api.rehnimarket:8443` (el frontend) | `https://api.rehnimarket:8443/media/proxy?path=…` |
| App móvil directo al `:8000` | `URL_BACKEND/media/proxy?path=…` (sin cambios) |

### 6.6 Levantar

```bash
docker compose up -d --build --wait
docker compose ps        # los 5 servicios en "healthy"
```

> El laboratorio de la semana 3 también usa el `8443`: **no levantes los dos a la vez**.

Si solo editas `caddy/Caddyfile`, recárgalo sin reiniciar ni reconstruir:

```bash
docker compose exec frontend caddy reload --config /etc/caddy/Caddyfile
```

Si la nueva configuración tiene un error, Caddy lo rechaza y sigue con la anterior.

### 6.7 Probar (evidencia del entregable)

Ejecútalo con `bash` (en fish, la variable `R` no se separa en argumentos). Con `--resolve`
funciona aunque todavía no hayas tocado `/etc/hosts`:

```bash
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
```

Resultado obtenido el 20/10/2026:

| Prueba | Esperado | Obtenido |
|---|---|---|
| Frontend `/` (HTTPS y HTTP) | 200 | ✅ 200 |
| `/admin/dashboard` (ruta de React, recarga de página) | 200, no 404 | ✅ 200 |
| `/assets/no-existe.js` | 404 | ✅ 404 |
| API `/health/database` | 200 JSON | ✅ 200 |
| API `/docs`, `/redoc`, `/openapi.json` | 200 con `DOCS_ENABLED=true`; 401 con `false` | ✅ 200 (`true`) |
| API `/cart` sin token | 401 | ✅ 401 |
| HTTP → HTTPS en los dos dominios | 308 | ✅ 308 |
| CORS desde `https://rehnimarket:8443` y `http://localhost:8080` | Permitido | ✅ |
| CORS desde un origen cualquiera | Sin permiso | ✅ |
| Imagen de MinIO por la API (`/public/catalogs` → `image_url`) | `https://api…:8443/media/proxy…`, 200 `image/webp` | ✅ |
| App móvil (`:8000` directo) | URL de imagen con `URL_BACKEND` | ✅ |
| Encabezados del frontend (`X-Frame-Options`, `Cache-Control`…) | Presentes; en la API no | ✅ |
| IP vista por el backend | La del cliente, no la de Caddy | ✅ |
| Tests del backend (`pytest`) | Todos pasan | ✅ 238 |

Repetido el 21/10/2026 con `DOCS_ENABLED=false`: frontend 200 (HTTPS, ruta de React y HTTP),
API `/health/database` 200, `/docs` **401** (esperado con `false`), `/cart` sin token 401,
HTTP → HTTPS 308 y `access-control-allow-origin: https://rehnimarket:8443`.

### 6.7.1 Acceder desde el navegador

**1. Que los dos nombres apunten a tu equipo.** En tu terminal (no en Claude Code: `sudo` pide
la contraseña). Si ya tenías la línea de `rehnimarket`, esto agrega solo la de la API:

```bash
grep -q "api.rehnimarket" /etc/hosts \
  || echo "127.0.0.1 api.rehnimarket" | sudo tee -a /etc/hosts
grep -q " rehnimarket" /etc/hosts \
  || echo "127.0.0.1 rehnimarket" | sudo tee -a /etc/hosts

getent hosts rehnimarket api.rehnimarket   # ambos → 127.0.0.1
```

> Si Firefox dice "Servidor no encontrado", usa DNS sobre HTTPS y no lee `/etc/hosts`: en
> `about:config`, `network.dns.localDomains` = `rehnimarket,api.rehnimarket`.

**2. Aceptar el certificado de los dos dominios** (CA interna de Caddy). Firefox lo pide **por
dominio**, y el de la API no lo verás nunca si solo abres el frontend: las llamadas fallarían
en silencio. En este orden:

1. Abre `https://api.rehnimarket:8443/health/database` → **Avanzado → Aceptar el riesgo y continuar**.
2. Abre `https://rehnimarket:8443/` → lo mismo.

**3. Usar Swagger con endpoints protegidos** (requiere `DOCS_ENABLED=true` en `.env` y
`docker compose up -d backend`): en `/docs`, `POST /auth/login-user` → **Try it out** →
**Execute**; copia el `access_token`, pulsa **Authorize** y pégalo.

**Quitar los nombres** cuando ya no los necesites:

```bash
sudo sed -i '/rehnimarket/d' /etc/hosts
```

### 6.8 Pendientes antes de producción

1. **App móvil.** Sigue entrando directo al `:8000` con `URL_BACKEND`. En producción debería
   usar `https://api.<dominio>` (`EXPO_PUBLIC_API_URL` y `URL_BACKEND`).
2. **Cerrar el `:8000`.** Cuando la app móvil use la API por Caddy, `BACKEND_BIND=127.0.0.1`.
3. **`URL_FRONTEND`** (enlaces de los correos y CORS) con el dominio real: `https://<dominio>`.
4. **Frontend por IP desde otro equipo:** carga, pero no puede llamar a la API, porque ese
   equipo no resuelve `api.rehnimarket`. Con dominios públicos (DNS real) desaparece.
5. **Documentación:** la ficha técnica
   (`docs/plan de implantacion - Rehnimarket/1) Ficha tecnica y requisitos minimos - Semana 1 (CE-1, CE2).md`,
   secciones 1.4 y 1.5) y los documentos de `docs/docs++/` aún mencionan Nginx.

### 6.9 Paso a producción (para la sección 4 del plan)

Solo cambian variables y puertos; el `Caddyfile` es el mismo:

```bash
# .env en el servidor
SITE_ADDRESS=<dominio>
API_ADDRESS=api.<dominio>
CADDY_TLS=<correo-del-responsable>     # Let's Encrypt en lugar de la CA interna
FRONTEND_PORT=80
FRONTEND_HTTPS_PORT=443
VITE_API_URL=https://api.<dominio>
CORS_EXTRA_ORIGINS=https://<dominio>
DOCS_ENABLED=false
BACKEND_BIND=127.0.0.1
```

Requisitos: los dos registros DNS ya deben apuntar al servidor y los puertos 80 y 443 deben
estar abiertos en el firewall, para que Let's Encrypt verifique cada dominio.

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

- [x] `caddy/Caddyfile` en el repo, probado en local con `tls internal` y `curl --resolve`
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
`https://api.rehnimarket:8443/media/proxy`), nunca el puerto 9000.

### Estado actual en el compose

- `postgres`, `pgbouncer` y `minio` **no tienen `ports:`** en `docker-compose.yml`. ✅
- `docker-compose.override.yml` publica Postgres en `127.0.0.1:5433` para DbSchema. Es solo
  local, y está bien en tu equipo. **En el servidor no copies el override**, o déjalo igual de
  limitado a `127.0.0.1`.
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

Con el override limitado a `127.0.0.1:5433`, usa un **túnel SSH**:

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
