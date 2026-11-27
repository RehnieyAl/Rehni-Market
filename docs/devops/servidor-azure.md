# Servidor de Azure: administración con la cuenta `rehnimarket`

Servidor `rehni-prod` (Ubuntu 24.04, Docker 29 y Compose 5). La IP pública solo está en el `~/.ssh/config` del
administrador. El NSG solo admite SSH desde su IP; 80 y 443 están abiertos a Internet.

> **Estado (2026-11-27).** Este documento describe el esquema **definitivo**. El comando `rehnimarket` está
> preparado y probado contra la pila local (ver [scripts-operativos.md](scripts-operativos.md#validación)), pero
> **todavía no está instalado en el servidor**. Hasta aplicar la migración de la sección 6, el servidor sigue con
> las cuentas `deploy`, `backup-restore` y `rehniops`. Producción está **apagada**: el propietario eliminó los
> contenedores, volúmenes e imágenes el 2026-11-27. El próximo arranque es una instalación desde cero (sección 4).

## 1. Una sola cuenta administradora

| Cuenta | Para qué |
|---|---|
| `rehnimarket` (uid 1000) | Único usuario humano y operativo: SSH con su llave personal, sudo, Docker Compose, respaldos, restore y despliegues |
| Cuentas internas de Ubuntu (`root`, `backup`, `syslog`, `systemd-*`…) | Del sistema operativo; no se tocan |

Grupos de `rehnimarket`: `rehnimarket` (principal), `sudo` (administración), `docker` (Compose sin sudo) y `adm`
(lectura de logs del sistema). `cdrom` y `dip` vienen de la imagen de Azure y son inofensivos. Se le quita `lxd`,
porque equivale a root y no se usa.

Pertenecer a `docker` equivale a ser root en el host. Por eso **ninguna llave de automatización** se instala en esta
cuenta: GitHub Actions no despliega por SSH (ver [README.md](README.md#3-github-actions)).

## 2. Directorios

| Ruta | Dueño y modo | Contenido |
|---|---|---|
| `/opt/rehnimarket` | `rehnimarket:rehnimarket` 750 | Clon de `main` (HTTPS, sin credenciales), en un commit fijo (`detached`) |
| `/opt/rehnimarket/.env` | `rehnimarket` 600 | Único archivo de secretos de producción |
| `/home/rehnimarket/backups/rehnimarket` | `rehnimarket` 700 | Respaldos, uno por directorio `<AAAAMMDDTHHMMSSZ>_<sha12>` |
| `/home/rehnimarket/env-respaldos` | `rehnimarket` 700 | Copias anteriores del `.env` (archivos 600) |
| `/var/log/rehnimarket` | `rehnimarket` 750 | `backup.log`, `deploy.log`, `releases.jsonl`, `auditoria.jsonl`, `version-actual.json` |
| `/etc/rehnimarket/ops.env` | `root` 644 | Rutas que leen los scripts (sin secretos) |
| `/usr/local/lib/rehnimarket/` | `root` 755 | Copias de los scripts, tomadas de un commit revisado |
| `/usr/local/bin/rehnimarket` | `root` 755 | Comando administrativo |
| `/home/rehnimarket/opt/rehnimarket` | `rehnimarket` | **Clon de consulta**: push deshabilitado y sin `.env`. Nunca se ejecuta Compose desde ahí |

Los volúmenes de Docker (`rehnimarket_postgres_data`, `rehnimarket_minio_data`, `rehnimarket_caddy_data` y
`rehnimarket_caddy_config`) mantienen sus dueños internos: PostgreSQL uid 70, MinIO uid 65532 y Caddy root. Nunca
se les cambia el propietario.

Los scripts se ejecutan desde `/usr/local/lib` y no desde el repositorio porque `deploy` hace `git checkout` sobre
`/opt/rehnimarket`: un script que se reescribe mientras bash lo está leyendo puede ejecutar líneas mezcladas.

`/etc/rehnimarket/ops.env`:

```bash
OPS_USER=rehnimarket
APP_DIR=/opt/rehnimarket
BACKUP_DIR=/home/rehnimarket/backups/rehnimarket
LOG_DIR=/var/log/rehnimarket
HEALTH_URLS="http://127.0.0.1:8000/health/database"
```

## 3. Comandos de administración

Todos operan sobre `/opt/rehnimarket` con rutas absolutas y el proyecto `rehnimarket`, desde cualquier carpeta.
Con `sudo`, el comando vuelve a ejecutarse como `rehnimarket`; también funciona sin `sudo`.

| Comando | Qué hace |
|---|---|
| `sudo rehnimarket status` | Versión desplegada, contenedores, `/health/database`, último respaldo y espacio libre |
| `sudo rehnimarket ps` | Contenedores del proyecto |
| `sudo rehnimarket logs [-f] [--tail N] [servicio…]` | Logs; por defecto las 100 últimas líneas de todos |
| `sudo rehnimarket start [--build]` | `up -d --wait`; `--build` reconstruye las imágenes desde el código |
| `sudo rehnimarket stop [servicio…]` | Detiene servicios sin borrar contenedores, volúmenes ni datos |
| `sudo rehnimarket restart [servicio…]` | Reinicia servicios |
| `sudo rehnimarket exec <servicio> [comando…]` | Comando dentro de un servicio en marcha; por defecto `sh` |

Servicios: `backend`, `frontend` (Caddy), `postgres`, `minio` y `pgbouncer`. Los contenedores se llaman
`rehni-backend`, `rehni-frontend`, `rehni-postgres`, `rehni-minio` y `pgbouncer_pool`. El comando usa siempre el
nombre del **servicio**. Los cinco tienen `sh`.

El comando no ofrece `down`, `down -v`, borrado de volúmenes ni limpieza de imágenes. Para eso se usa Docker a
mano, con una decisión explícita.

Errores frecuentes:

| Mensaje | Causa |
|---|---|
| `no hay acceso al demonio de Docker` | La sesión se abrió antes de entrar al grupo `docker`: cerrar sesión y volver a entrar |
| `servicio desconocido: rehnimarket-backend` | Se usó el nombre de un contenedor; el nombre de servicio es `backend` |
| `el servicio X no está en marcha` | `sudo rehnimarket start` |
| `esta operación pide confirmación` | `restore` e `init owner` necesitan una terminal interactiva (`ssh -t`) |

## 4. Instalación desde cero

1. Comprobar la configuración sin levantar nada:
   `docker compose -p rehnimarket --project-directory /opt/rehnimarket config --quiet`.
2. Construir y levantar: `sudo rehnimarket start --build`. En 2 vCPU y 4 GiB, si la construcción se queda sin
   memoria, construir una imagen cada vez con `docker compose build backend` y luego `frontend`. El backend aplica
   `alembic upgrade head` al arrancar.
3. Datos base, siempre en este orden: `sudo rehnimarket init roles`, `init base` e `init owner`
   ([inicializacion-roles-owner.md](inicializacion-roles-owner.md)).
4. Primer respaldo: `sudo rehnimarket backup`, y comprobarlo con `backup verify <ID>`
   ([backup-restore.md](backup-restore.md)).
5. Prueba de humo: `deploy/README.md` §8.

Caddy pide los certificados de Let's Encrypt en el primer acceso. Como se borró el volumen `caddy_data`, se emiten
de nuevo. Let's Encrypt limita los certificados duplicados por semana, así que conviene no repetir instalaciones
desde cero.

## 5. Recuperación del acceso

- Antes de cambiar cuentas, sudoers o SSH, abrir **una segunda sesión SSH** de `rehnimarket` y no cerrarla hasta
  validar el cambio.
- Si se pierde el acceso SSH, usar el portal de Azure: VM → *Run command* (como root) o *Reset password / SSH
  public key* (extensión VMAccess). El agente `walinuxagent` está activo. La contraseña de `rehnimarket` está
  bloqueada, así que la consola serie no sirve para iniciar sesión.
- `/etc/sudoers.d/90-cloud-init-users` y `waagent` (sudo de `rehnimarket`) los crea Azure y no se modifican.

## 6. Migración pendiente de autorización

Cada paso se hace con la segunda sesión SSH abierta y se verifica antes de pasar al siguiente.

1. Traspasar los archivos (los contenedores no se detienen; Caddy monta `caddy/` en solo lectura):
   - `chown -R rehnimarket:rehnimarket /opt/rehnimarket /var/log/rehnimarket`. Son 1454 archivos del repositorio,
     todos de `rehniops`; no incluye volúmenes.
   - Crear `install -d -o rehnimarket -g rehnimarket -m 700 /home/rehnimarket/backups /home/rehnimarket/backups/rehnimarket`.
   - Mover `/var/lib/rehniops/env-respaldos/` a `/home/rehnimarket/env-respaldos/` (700, archivos 600).
   - `/var/backups/rehnimarket` está vacío: se elimina con `rmdir` cuando la ruta nueva esté validada.
2. Escribir `/etc/rehnimarket/ops.env` como en la sección 2.
3. Instalar los scripts y el comando desde el commit revisado. `git` se ejecuta como `rehnimarket`, nunca como
   root, para que `.git` no quede con archivos de root. `SHA` es el commit revisado de `main`:
   ```bash
   git -C /opt/rehnimarket fetch origin main
   for f in scripts/backup_rehnimarket.sh scripts/restore_rehnimarket.sh scripts/deploy_rehnimarket.sh \
            scripts/datos-base.sh deploy/sql/crear-roles.sql scripts/ops/crear_owner.py; do
     git -C /opt/rehnimarket show "${SHA}:${f}" \
       | sudo install -o root -g root -m 0755 /dev/stdin "/usr/local/lib/rehnimarket/$(basename "$f")"
   done
   git -C /opt/rehnimarket show "${SHA}:scripts/ops/rehnimarket" \
     | sudo install -o root -g root -m 0755 /dev/stdin /usr/local/bin/rehnimarket
   ```
   Comprobar: `sha256sum` de cada archivo instalado contra `git -C /opt/rehnimarket show "${SHA}:<ruta>" | sha256sum`.
4. Validar con la cuenta `rehnimarket` en una sesión nueva: `status`, `start --build`, `init roles`, `init base`,
   `init owner`, `backup`, `backup list`, `backup info`, `backup verify` y `restore <ID> --qa`.
5. Retirar las cuentas antiguas:
   - Bloquear primero `deploy` y `backup-restore` (`usermod -L -e 1`, reversible).
   - Archivar sus homes en un tar 600 de root. Solo contienen archivos de entorno, historial y `.ssh`.
   - Borrar las cuentas y sus homes: `userdel -r deploy`, `userdel -r backup-restore` y `userdel rehniops`.
   - Borrar los grupos `rehnimarket-deploy` (987), `rehnimarket-backup` (986) y `rehniops` (985) si `userdel` no lo
     hizo.
   - Borrar `/var/lib/rehniops`, ya revisado y sin `env-respaldos`.
6. Limpiar:
   - Borrar `/etc/sudoers.d/rehnimarket` y comprobar con `visudo -c`.
   - Borrar `/usr/local/lib/rehnimarket/ssh-gate.sh`.
   - Quitar la línea obsoleta del crontab de `rehnimarket` (`cd $HOME/Rehni-Market && bash scripts/respaldar.sh`,
     ruta inexistente).
   - `gpasswd -d rehnimarket lxd`.
7. Verificación final:
   - `find / -xdev \( -nouser -o -nogroup \) -print`, que solo puede devolver archivos dentro de las capas de
     Docker;
   - `grep -rE 'rehniops|backup-restore|deploy' /etc/sudoers.d /etc/passwd /etc/group /etc/rehnimarket`, sin
     resultados;
   - contenedores `healthy` y `/health/database` en 200.

El uid 999 de `rehniops` no se libera antes del `chown`. Si se liberara, un paquete del sistema podría recibir ese
uid y quedarse con los archivos de producción.
