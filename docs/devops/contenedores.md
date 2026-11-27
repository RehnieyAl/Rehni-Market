# Contenedores de producción: auditoría y administración por SSH

Auditoría de solo lectura del servidor `rehni-prod` (Azure), hecha el 2026-11-27 **antes del primer arranque**: no
había ningún contenedor creado. Lo marcado como «comprobado» sale de la configuración resuelta de Compose, de los
metadatos de las imágenes y de recorrer sus capas con `docker image save` (sin crear contenedores). Lo marcado como
«pendiente» solo se puede verificar con los servicios en marcha.

Relacionado: [`primer-despliegue.md`](primer-despliegue.md) (cómo se levantan por primera vez),
[`servidor-ssh.md`](servidor-ssh.md) (usuarios, compuerta y sudoers) y [`tailscale.md`](tailscale.md).

## 1. Estado de Docker en el servidor

| Punto | Comprobado |
|---|---|
| Versiones | Docker Engine 29.9.3 (API 1.56), Docker Compose v5.7.1; el servicio `docker` arranca con el sistema |
| Contenedores | 0. Sin volúmenes ni redes del proyecto (solo `bridge`, `host`, `none`) |
| Proyecto Compose | `rehnimarket` (nombre de la carpeta `/opt/rehnimarket`); 5 servicios + `postgres-test` en el perfil `test`; `config --quiet` = 0 |
| Imágenes | `postgres:17-alpine`, MinIO y pgbouncer fijados por digest, `hello-world`, y `rehni-market-backend` / `rehni-market-frontend` **antiguas** (17/11/2026) |
| Daemon | Sin `/etc/docker/daemon.json`; logs `json-file` **sin rotación**; AppArmor y seccomp por defecto; cgroup v2; `live-restore` desactivado |
| Socket | `/var/run/docker.sock` `660 root:docker`; grupo `docker` = `rehnimarket` y `rehniops` |

La imagen antigua del backend tiene `CMD uv run uvicorn …` sin `--no-sync`, distinto del Dockerfile actual: es código
anterior. El primer arranque tiene que construir las imágenes de nuevo.

## 2. Contenedores definidos

| Servicio | Contenedor | Función | Usuario del proceso | Directorio | Shell | Red y puertos | Reinicio |
|---|---|---|---|---|---|---|---|
| `backend` | `rehni-backend` | FastAPI; aplica `alembic upgrade head` al arrancar y luego uvicorn | **root** (el Dockerfile no define `USER`) | `/app` | `sh` (dash) y `bash` | `data` + `edge`; `127.0.0.1:8000` | `unless-stopped` |
| `frontend` | `rehni-frontend` | **Caddy**: sirve el build de React (`/srv`) y hace de proxy de la API. Frontend y Caddy son el mismo contenedor | root (imagen de Caddy) | `/srv` | `sh` (busybox), sin bash | `edge` (172.30.0.10); `80/tcp`, `443/tcp+udp` públicos | `unless-stopped` |
| `postgres` | `rehni-postgres` | PostgreSQL 17 | el entrypoint arranca como root y pasa a `postgres` | `/` | `sh` y `bash` | `data`; `127.0.0.1:5433` | `unless-stopped` |
| `pgbouncer` | `pgbouncer_pool` | Pool de conexiones (6432) | `postgres` | `/` | `sh` (busybox) | `data` | `unless-stopped` |
| `minio` | `rehni-minio` | Almacenamiento de imágenes de productos | `65532` (sin privilegios) | — | `sh` y `bash` | `data` | `unless-stopped` |

- Redes: `data` 172.30.1.0/24 y `edge` 172.30.0.0/24, ninguna `internal`.
- Volúmenes: `postgres_data`, `minio_data`, `caddy_data`, `caddy_config`; `./caddy` montado en solo lectura.
- Límites de CPU y memoria por servicio (backend: 2 CPU / 1 GiB).
- Herramientas presentes en las imágenes: `psql` y `pg_dump` (postgres), `psql` (pgbouncer), `alembic`, `uvicorn`, `uv`
  y Python 3.13 (backend), `caddy` y `wget` (frontend), `mc` (MinIO).

**Pendiente con los servicios en marcha:** usuario real de cada proceso, salud, revisión de Alembic y dependencias de
la imagen nueva.

## 3. Acceso a los contenedores

El administrador no puede leer `/opt/rehnimarket` (750, `rehniops`): Compose se ejecuta como `rehniops`.

```bash
C='sudo -u rehniops -H docker compose --project-directory /opt/rehnimarket'
```

| Para | Comando |
|---|---|
| Listar | `$C ps` (o `docker ps -a`) |
| Estado y salud | `$C ps --format 'table {{.Service}}\t{{.Status}}'` · `docker inspect --format '{{json .State.Health.Status}}' rehni-backend` |
| Backend | `$C exec backend bash` |
| Frontend / Caddy | `$C exec frontend sh` |
| PostgreSQL (shell) | `$C exec postgres bash` |
| PostgreSQL (psql) | `$C exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'` |
| pgbouncer / MinIO | `$C exec pgbouncer sh` · `$C exec minio sh` |
| Un comando sin sesión | `$C exec -T backend <comando>` |
| Logs | `$C logs --tail=200 backend` · `$C logs -f --tail=50 frontend` · `$C logs --since=30m` |
| Salir | `exit` o `Ctrl-D`. No usar `docker attach`: `Ctrl-C` pararía el proceso principal |

`docker exec -it rehni-backend bash` también funciona (el administrador está en el grupo `docker`).

**Muestran secretos; no usarlos en sesiones compartidas ni en evidencias:** `$C config` sin `--quiet`,
`docker inspect` sin `--format`, `$C exec backend env`, `printenv`.

## 4. Diagnóstico sin modificar datos

### FastAPI

```bash
$C exec -T backend uv run --no-sync python --version      # Python del entorno de la app
$C exec -T backend uv pip list                            # dependencias instaladas
$C exec -T backend uv run --no-sync alembic --version
$C exec -T backend uv run --no-sync alembic current        # revisión aplicada (solo lee)
$C exec -T backend uv run --no-sync alembic heads          # revisión que espera el código
docker top rehni-backend                                   # uvicorn y sus workers
curl -fsS http://127.0.0.1:8000/health/database
$C logs --tail=200 backend
```

Nunca `alembic upgrade|downgrade|stamp` ni `python -m app.utils.seed` como diagnóstico: modifican la base.

### PostgreSQL (sesión en solo lectura)

```bash
$C exec -T postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
$C exec -T -e PGOPTIONS='-c default_transaction_read_only=on' postgres sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT version(); SELECT version_num FROM alembic_version; SELECT pg_size_pretty(pg_database_size(current_database()));"'
```

### Caddy

```bash
$C exec -T frontend caddy version
$C exec -T frontend caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
$C logs frontend | grep -iE 'certificate obtained|error'
curl -sI https://rehnimarket.duckdns.org | head -1
```

## 5. Riesgos y recomendaciones

| # | Hallazgo | Impacto | Propuesta |
|---|---|---|---|
| 1 | Logs `json-file` sin rotación | Un error en bucle puede llenar el disco (20 GB libres) y tumbar PostgreSQL | `/etc/docker/daemon.json` con `"log-opts": {"max-size": "10m", "max-file": "5"}`; exige reiniciar Docker, mejor sin contenedores |
| 2 | Backend y Caddy como root, sin `no-new-privileges` ni `cap_drop` | Una vulnerabilidad de la app tendría root dentro del contenedor | PR posterior: `USER` sin privilegios en el backend, `security_opt: [no-new-privileges:true]`, `cap_drop: [ALL]` (Caddy solo `NET_BIND_SERVICE`) |
| 3 | Red `data` no `internal` | PostgreSQL, pgbouncer y MinIO tienen salida a Internet sin necesitarla | `internal: true` en `data` (el backend sale por `edge`); probar con `scripts/verificar-redes.sh` |
| 4 | Grupo `docker` = root en la práctica (`rehnimarket`, `rehniops`) | `rehniops` es root efectivo; solo se llega por las reglas sudoers ancladas | Correcto: `deploy` y `backup-restore` no están en `docker`. No agregar a nadie más |
| 5 | Una orden manual de Compose no respeta `/var/log/rehnimarket/operacion.lock` | Un `restart` manual durante un deploy o restore puede romperlo | Herramienta `rehnimarket` (sección 6) con el mismo candado |
| 6 | Imágenes antiguas con los nombres que usa Compose | Un `up` sin build arrancaría código del 17/11 | Borrarlas antes del primer build |
| 7 | `NOPASSWD: ALL` del administrador duplicado en sudoers | Ninguno (desorden) | Opcional: dejar una sola regla |

## 6. Propuesta: comando administrativo `rehnimarket` (no implementado)

- `/usr/local/sbin/rehnimarket`, `root:root 755`, versionado como `scripts/ops/rehnimarket-admin.sh`. Solo para el
  administrador con `sudo`; **no** se añade a sudoers de `deploy` ni `backup-restore`.
- Lee `APP_DIR` y `LOG_DIR` de `/etc/rehnimarket/ops.env` y ejecuta Compose como `rehniops` con `runuser`.
- Toma `operacion.lock` sin esperar en todo lo que cambia estado: con un deploy, backup o restore en curso se niega
  (código 75).
- Registra cada uso en `/var/log/rehnimarket/admin.log` y en syslog (`logger -t rehnimarket-admin`).
- Valida el servicio contra `config --services` y los argumentos con regex.

| Subcomando | Qué hace | Límites |
|---|---|---|
| `status` | `ps`, salud, `curl` a las URL de salud, disco, última línea del registro de deploy | — |
| `ps` | `docker compose ps` | — |
| `logs [servicio] [--tail N] [-f]` | Logs (200 por defecto, 5000 como máximo) | — |
| `start [servicio]` | `docker compose start` (solo contenedores existentes) | Nunca `up`, `build` ni `pull`; sin contenedores remite al procedimiento de despliegue |
| `stop [servicio]` | `docker compose stop` | Nunca `down`, `rm` ni `-v` |
| `restart [servicio]` | `docker compose restart` (no recrea) | — |
| `diag <servicio> <chequeo>` | Lista cerrada de la sección 4 (`backend python\|deps\|alembic\|proc`, `postgres ready\|version\|size`, `frontend version\|validate`) | Sin órdenes libres |
| `shell <servicio>` | `exec -it` con el shell de cada imagen; queda registrado | — |
| `registro deploy\|backup\|restore`, `respaldos` | Consulta de logs y `restore --list` | Sin copiar respaldos ni cambiar permisos |

Excluidos siempre: `up`, `down`, `build`, `pull`, `rm`, `config`, `inspect`, `env`, migraciones y seeds.

Pruebas antes de instalarlo: `shellcheck` y casos en `scripts/ops/qa-simulacion.sh` (candado tomado, servicio o
argumento no válido, ningún secreto en la salida, `start` sin contenedores no despliega).

## 7. Cambios pendientes de autorización

1. Rotación de logs de Docker (riesgo 1), antes del primer arranque.
2. Borrar `rehni-market-backend:latest`, `rehni-market-frontend:latest` y `hello-world:latest`.
3. Implementar e instalar `rehnimarket` (sección 6) con PR y pruebas.
4. Endurecimiento de contenedores (riesgos 2 y 3) en un PR posterior al primer despliegue.
5. Opcional: una sola regla `NOPASSWD` del administrador.
