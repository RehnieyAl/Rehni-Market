# Entregable S05 — Configuración, Verificación y Migración Ejecutada

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | 1 persona (responsable técnico) |
| Autor | Yeinher Jose Algarin Cardozo, aprendiz ADSO, ficha 3171618 |
| Versión del software | 1.0.1 |
| Fecha | 2026-11-18 |
| Semana | 5 de 9 — Configuración y pruebas en servidor (CE-1, CE-3) |
| Guía | Bootcamp de Implantación del SENA, semana 5: guía del proyecto de la semana, plantilla «Entregable S05» y rúbrica de evaluación (evidencia de Producto) |
| Sección del plan consolidado | §6 y evidencia de §2 (2.8) de [`docs/plan-implantacion.md`](../plan-implantacion.md) |
| Estado | Parcial: 9 `[PENDIENTE]` (1 se cierra con el comando «b»; 5 dependen de ejecutar la migración en la VM) |

Ambientes: **Desarrollo** = equipo del responsable (`.env` de [`.env.example`](../../.env.example));
**Servidor** = **Nube** = VM Ubuntu 24.04 de Azure, `~/Rehni-Market/.env` creado desde
[`deploy/env.prod.example`](../../deploy/env.prod.example) ([semana 4](semana-04-procedimiento-despliegue.md), §5.3:
la nube es Azure IaaS). Un solo `.env` por ambiente; nunca se pegan valores reales.

---

## 6.1 Inventario de configuración

Nombre, propósito y ejemplo ficticio de cada variable:
[semana 4, §5.2 «Variables de entorno»](semana-04-procedimiento-despliegue.md#variables-de-entorno).
Inventario de los `.env` antiguos (sin valores, antes de unificarlos):
[`historico/inventario-env-2026-11-04.md`](historico/inventario-env-2026-11-04.md).

| Variable | ¿Secreto? | Desarrollo | Servidor | Nube | Si falta… |
|---|:---:|---|---|---|---|
| `POSTGRES_PASSWORD` | Sí | `.env` | `~/Rehni-Market/.env` (600), generada con `openssl rand` | La misma VM | PostgreSQL no inicializa el volumen; el backend no conecta |
| `URL_DATABASE` / `URL_DATABASE_POOLED` | Sí (llevan la contraseña) | `.env` | Mismo archivo (600) | La misma VM | El backend no arranca, pero con un error de SQLAlchemy y no con un mensaje propio (ver «Falla rápida») |
| `SECRET_KEY` | Sí | `.env` | Mismo archivo (600) | La misma VM | **Arranca** y falla después: el login responde error al firmar el JWT |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | Sí | `.env` | Mismo archivo (600) | La misma VM | MinIO no pasa el healthcheck y el backend no arranca (`depends_on` healthy) |
| `GMAIL_USERNAME` / `GMAIL_APP_PASSWORD` | Sí | `.env` | Mismo archivo (600), contraseña de aplicación propia de producción | La misma VM | Arranca; no salen los códigos de verificación y el registro queda bloqueado |
| `SITE_ADDRESS` / `API_ADDRESS` | No | `localhost` / `api.localhost` | `rehnimarket.duckdns.org` / `apirehnimarket.duckdns.org` | La misma VM | Caddy sirve los nombres de desarrollo |
| `VITE_API_URL` | No (se compila en el build) | `https://api.localhost` | `https://apirehnimarket.duckdns.org` | La misma VM | La web no llega a la API |
| `CORS_EXTRA_ORIGINS` | No | Orígenes locales | `https://rehnimarket.duckdns.org` | La misma VM | El navegador bloquea las llamadas a la API |
| `BACKEND_CPUS` / `POSTGRES_CPUS` / `UVICORN_WORKERS` | No | Por defecto (4 / 3 / 3) | `2` / `1.5` / `2` ([`deploy/README.md`](../../deploy/README.md) §3) | La misma VM | Con los valores por defecto Docker no crea los contenedores en 2 vCPU |
| `PGBOUNCER_MAX_CLIENT_CONN` | No | Por defecto (1200) | `200` | La misma VM | Si queda por debajo de (pool + overflow) × workers, el backend no arranca **con mensaje claro** (`app/Config.py`) |
| `RATE_LIMIT_ENABLED` / `FORWARDED_ALLOW_IPS` | No | `false` / `172.30.0.10` | `true` / `172.30.0.10` | La misma VM | Sin límite de peticiones por IP |
| `DOCS_ENABLED` | No | `true` | `false` | La misma VM | Swagger oculto (valor por defecto) |
| `RUN_SEED` y cuentas del seed | Sí (contraseñas del seed) | `true` con cuentas de desarrollo | `false`, cuentas vacías | La misma VM | Sin datos de demo; los datos base se crean igual (#53) |

### Falla rápida

| Caso | Comportamiento hoy | Evidencia |
|---|---|---|
| Número fuera de rango (`UVICORN_WORKERS`, `SMTP_PORT`…) | No arranca: `RuntimeError: UVICORN_WORKERS=… fuera de rango [1, 16]` | `RehniMarket-backend/app/Config.py` (`_int_env`) |
| Presupuesto de conexiones de PgBouncer insuficiente | No arranca con mensaje propio | `app/Config.py` (validación del pool) |
| `SMTP_SECURITY` inválido | No arranca: `SMTP_SECURITY debe ser 'starttls' o 'ssl'` | `app/Config.py` |
| Falta `URL_DATABASE`, `SECRET_KEY` o `MINIO_*` | Sin validación propia: falla tarde o con un error genérico | — |
| Queda un marcador `CAMBIAR_*` | Arranca; se detecta antes con `grep -nE '^[A-Z_]+=.*CAMBIAR' .env` | [semana 4](semana-04-procedimiento-despliegue.md), §5.2, paso 8 |

[PENDIENTE: validar en `app/Config.py` al arrancar que existan `URL_DATABASE`, `SECRET_KEY`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` y `MINIO_URL` y que ninguna empiece por `CAMBIAR`, con un `RuntimeError` que nombre la variable (cambio de código: issue aparte, fuera de este PR de documentación)].

## 6.2 Servicios

Datos de [`docker-compose.yml`](../../docker-compose.yml) (compose único).

| Servicio | Imagen / versión | Depende de | Política de reinicio | Healthcheck | Rotación de logs |
|---|---|---|---|---|---|
| `minio` | `cgr.dev/chainguard/minio` fijada por digest | — | `unless-stopped` | `mc ready local` | Sin `logging:` (valor por defecto del daemon) |
| `postgres` | `postgres:17-alpine` | `minio` (healthy) | `unless-stopped` | `pg_isready` | Igual |
| `pgbouncer` | `edoburu/pgbouncer:latest` | `postgres` (healthy) | `unless-stopped` | `psql -c 'SELECT 1'` a `:6432` | Igual |
| `backend` | `rehni-market-backend` (build, `python:3.13-slim`) | `postgres`, `minio`, `pgbouncer` (healthy) | `unless-stopped` | `GET /health/database` = 200 | Igual |
| `frontend` | `rehni-market-frontend` (build `node:22-alpine` → `caddy:2.11-alpine`) | `backend` (healthy) | `unless-stopped` | `wget http://127.0.0.1:8081/` (sitio interno, no publicado) | Igual |

Límites de memoria por servicio: 256M, 768M, 128M, 1G y 128M (suman 2,25 GiB).

[PENDIENTE: agregar a cada servicio `logging: {driver: json-file, options: {max-size: "10m", max-file: "3"}}` y fijar la etiqueta de `edoburu/pgbouncer` en lugar de `latest` (cambio en `docker-compose.yml`, fuera de este PR). Mientras tanto, en la VM se puede limitar en `/etc/docker/daemon.json` con `"log-opts": {"max-size": "10m", "max-file": "3"}`].

## 6.3 Endpoint de salud

| Campo | Valor |
|---|---|
| Ruta | `GET /health/database` ([`RehniMarket-backend/app/routers/HealthRouter.py`](../../RehniMarket-backend/app/routers/HealthRouter.py)) |
| Dependencias que verifica | Conexión a PostgreSQL. No revisa MinIO ni el correo a propósito: una caída del SMTP no debe sacar la API de servicio, y MinIO ya tiene su propio healthcheck del que depende el backend |
| Respuesta si está sano | `200` con `{"Base de datos":"OK"}` (producción, 18/11/2026: [`docs/evidencias/hosting-produccion-2026-11-18.txt`](../evidencias/hosting-produccion-2026-11-18.txt)) |
| Respuesta si falla una dependencia | `503` con `{"Base de datos":"ERROR", …}`: el healthcheck de Docker marca `unhealthy` y Caddy lo saca de rotación (health check activo cada 5 s, [`caddy/Caddyfile`](../../caddy/Caddyfile)) |

## 6.4 Pruebas

### Prueba de humo

[`scripts/smoke-test.sh`](../../scripts/smoke-test.sh), solo HTTP contra una URL base: sirve igual
para desarrollo y producción. La clave de la cuenta de prueba entra por `read -rsp` y no se imprime.

Verificaciones incluidas:

| # | Verificación | Resultado esperado |
|---|---|---|
| 1 | `GET /health/database` | 200 |
| 2 | `GET /public/products?limit=1` | 200 con `total` |
| 3 | `GET /cart` sin token | 401 |
| 4 | Login con correo inexistente `@example.com` (verificación propia: credenciales erróneas) | 400 `INVALID_CREDENTIALS` |
| 5 | Login con la cuenta de prueba | 200 con `access_token` y su rol |
| 6 | `GET /auth/me` con el token (verificación propia: el correo coincide) | 200 |
| 7 | Frontend (`FRONTEND_URL`) | 200 |

Salida contra el servidor y contra la nube (la misma VM):

```
[PENDIENTE: salida del comando «b» de la semana 4 contra https://apirehnimarket.duckdns.org (docs/evidencias/smoke-produccion-<fecha>.txt)]
```

Contra desarrollo con HTTPS (04/11/2026 y clon limpio del 16/11/2026): `7 pasan, 0 fallan`
([semana 4](semana-04-procedimiento-despliegue.md), §5.2 «Evidencia»).

### Casos funcionales

| ID | Caso | Pasos | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| F-01 | Datos base sin seed | Arrancar con `RUN_SEED=false` y contar roles, categorías y transportadoras | `4\|120\|4` | `4\|120\|4` en producción, 17/11/2026 ([evidencia](../evidencias/owner-unico-produccion-2026-11-17.txt)) |
| F-02 | Un solo owner | Insertar un segundo owner dentro de `BEGIN … ROLLBACK` | `duplicate key … uq_users_single_owner` | Rechazado y sin cambios, producción 17/11/2026 ([evidencia](../evidencias/owner-unico-produccion-2026-11-17.txt)) |
| F-03 | Swagger cerrado | `GET https://apirehnimarket.duckdns.org/docs` | 401 | 401, 18/11/2026 ([evidencia](../evidencias/hosting-produccion-2026-11-18.txt)) |
| F-04 | HTTP redirige a HTTPS | `curl http://rehnimarket.duckdns.org/` | 308 a `https://` | 308 en los dos dominios, 18/11/2026 ([evidencia](../evidencias/hosting-produccion-2026-11-18.txt)) |
| F-05 | Reinicio del backend sin cortes | `docker compose restart backend` con sondeo cada 0,5 s | Ningún 502/503/504 | 4 × 200, producción 17/11/2026 ([evidencia](../evidencias/verificacion-redes-produccion-2026-11-17.txt)) |
| F-06 | Base y MinIO aislados de Caddy | Conectar desde `rehni-frontend` a `postgres`, `pgbouncer` y `minio` | Los nombres no resuelven | No resuelven, producción 17/11/2026 ([evidencia](../evidencias/verificacion-redes-produccion-2026-11-17.txt)) |
| F-07 | Registro y verificación de un comprador | Registrarse en la web y verificar el correo con el código | Cuenta con rol `user` y `verified` | [PENDIENTE: ejecutar en producción con una cuenta de prueba y anotar fecha y resultado] |

Pruebas de aceptación con el cliente: semana 9 ([`docs/aceptacion/pruebas-de-aceptacion.md`](../aceptacion/pruebas-de-aceptacion.md)).

## 6.5 Lista de verificación posterior al despliegue

- [ ] `docker compose ps`: cinco servicios `healthy` y solo `rehni-frontend` en `0.0.0.0`
- [ ] `git describe --tags` = versión que se quería desplegar
- [ ] `curl -fsS https://apirehnimarket.duckdns.org/health/database` → `{"Base de datos":"OK"}`
- [ ] `curl -s -o /dev/null -w '%{http_code}' http://rehnimarket.duckdns.org/` → `308`
- [ ] Certificado de Let's Encrypt vigente: `echo | openssl s_client -connect rehnimarket.duckdns.org:443 -servername rehnimarket.duckdns.org 2>/dev/null | openssl x509 -noout -issuer -enddate`
- [ ] `docker compose exec backend uv run alembic current` = `head` de la versión (`d7e3f1a9c5b2` en 1.0.x)
- [ ] `grep -nE '^[A-Z_]+=.*CAMBIAR' .env` sin resultados y `ls -l .env` = `-rw-------`
- [ ] `scripts/smoke-test.sh` → `7 pasan, 0 fallan`
- [ ] `bash scripts/verificar-redes.sh` → `0 fallan` (reinicia el backend una vez)
- [ ] `bash scripts/respaldar.sh` → `=== FIN backup <TS> — OK ===`

---

## 2.8 Evidencia de migración ejecutada (se agrega a la sección 2)

| Campo | Valor |
|---|---|
| Origen (tipo y versión) | CSV del sistema anterior, `legacy-data/clientes_legado.csv` (100 filas sintéticas, `;`, UTF-8) — plan de la [semana 2](semana-02-migracion-respaldo-instalacion.md), §2 |
| Destino (proveedor, versión, región) | PostgreSQL 17 en contenedor, VM de Azure (región: ver [semana 4](semana-04-procedimiento-despliegue.md), §5.3) |
| Diferencias resueltas (dueño, versión, SSL…) | Misma imagen `postgres:17-alpine` en desarrollo y en producción (sin diferencia de versión). Dueño de las tablas: `POSTGRES_USER`, el mismo rol en los dos ambientes. Sin SSL dentro de la red `data` (no sale del servidor). Diferencias del servidor ya resueltas al desplegar: límites de CPU para 2 vCPU, `RUN_SEED=false` con datos base siempre creados (#53), owner creado por SQL ([`deploy/OWNER.md`](../../deploy/OWNER.md)), `ALGORITHM` para volver a v1.0.0 |

Registro de la ventana:

| Paso | Hora inicio | Hora fin | Resultado |
|---|---|---|---|
| [PENDIENTE: migración no ejecutada todavía en la VM] | | | |

Ensayo previo sobre una copia, en desarrollo (04/11/2026): carga, transformación y validación en
12,2 s, `OK=10 FALLA=0`, conciliación `origen=100 migrados=73 rechazados=27` y checksum igual
(`cbcb1b239c3f47b57c36e76a9feb6045` esperado = obtenido), rollback probado
([semana 2](semana-02-migracion-respaldo-instalacion.md), «Evidencia: ensayo»).

Huellas:

```
[PENDIENTE: salida del control 9 de validar.sql (checksum de origen normalizado = destino) y sha256sum del CSV antes y después, en la VM]
```

Prueba de humo después del corte:

```
[PENDIENTE: scripts/smoke-test.sh contra producción después de cerrar la ventana]
```

¿Fue necesario el rollback? ¿Por qué? [PENDIENTE: depende de la ejecución].

**Plan para ejecutarla.** Los datos del CSV son sintéticos y crearían 73 cuentas de prueba en la
base de producción. Hay dos caminos; la decisión es del responsable:
(a) ejecutar `bash scripts/migracion/migrar.sh` en la VM (opciones 1 → 2 → 3 → 4 → 5 → 7), con la
ventana anotada, y después `rollback.sql` (opción 6) para dejar producción sin las cuentas
sintéticas; o (b) ejecutarla sobre una base aparte de la VM, restaurada del respaldo de producción,
igual que el ensayo de desarrollo. [PENDIENTE: elegir (a) o (b) y ejecutarla].
