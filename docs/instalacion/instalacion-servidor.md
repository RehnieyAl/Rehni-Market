# Instalación e inicio de RehniMarket

Un solo `docker-compose.yml` y un solo `caddy/Caddyfile` sirven para desarrollo y producción; solo cambia el `.env`
de la raíz. Hay cinco servicios: `backend` (FastAPI), `frontend` (Caddy con la web compilada), `postgres`,
`pgbouncer` y `minio`.

Después de instalar se crean los datos iniciales ([../base-datos/inicializacion.md](../base-datos/inicializacion.md))
y el primer respaldo ([../mantenimiento/backup-restore.md](../mantenimiento/backup-restore.md)).

## 1. Linux local (desarrollo)

Requisitos: Docker Engine con Compose 2.24 o superior, y el usuario dentro del grupo `docker`.

```bash
git clone https://github.com/RehnieyAl/Rehni-Market.git && cd Rehni-Market
cp .env.example .env && chmod 600 .env      # reemplazar cada CAMBIAR_*
docker compose up -d --build --wait          # los cinco servicios en healthy
docker compose ps
```

El backend aplica `alembic upgrade head` al arrancar. Por defecto, la web queda en `https://localhost` y la API en
`https://api.localhost`, con la CA local de Caddy (`caddy/caddy-configuracion.md`). Para el desarrollo con recarga
automática: `docker compose watch`.

## 2. Servidor de Azure (producción)

| Dato | Valor |
|---|---|
| VM | Ubuntu 24.04 en Azure; SSH con la cuenta `rehnimarket` (alias `rehni-prod` en el `~/.ssh/config` del administrador) |
| Red | El NSG solo admite el puerto 22 desde la IP del administrador; 80 y 443 están abiertos |
| Dominios | `rehnimarket.duckdns.org` (web) y `apirehnimarket.duckdns.org` (API), con certificados de Let's Encrypt |
| Proyecto | `/opt/rehnimarket` (clon de `main` por HTTPS, sin credenciales) |
| Secretos | `/opt/rehnimarket/.env`, permisos 600 |
| Clon de consulta | `/home/rehnimarket/opt/rehnimarket`: push deshabilitado y sin `.env`. **Nunca** se ejecuta Compose desde ahí |

### Instalación desde cero

```bash
sudo install -d -o rehnimarket -g rehnimarket -m 750 /opt/rehnimarket
git clone https://github.com/RehnieyAl/Rehni-Market.git /opt/rehnimarket && cd /opt/rehnimarket
git checkout --detach origin/main
```

El `.env` sale de la plantilla de producción o de una copia ya preparada en el equipo del administrador:

```bash
cp deploy/env.prod.example .env && chmod 600 .env      # en la VM; reemplazar cada CAMBIAR_*
# o, desde el equipo del administrador:
scp .env.produccion rehni-prod:/opt/rehnimarket/.env && ssh rehni-prod chmod 600 /opt/rehnimarket/.env
```

La contraseña de PostgreSQL va **igual** en `POSTGRES_PASSWORD`, `URL_DATABASE` y `URL_DATABASE_POOLED`. Con
`grep -nE '^[A-Z_]+=.*CAMBIAR' .env` no debe salir nada.

Para construir y arrancar:

```bash
docker compose -p rehnimarket --project-directory /opt/rehnimarket config --quiet   # valida sin levantar nada
sudo rehnimarket start --build
```

En 2 vCPU y 4 GiB, si la compilación se queda sin memoria, construir una imagen cada vez
(`docker compose build backend` y luego `frontend`). Caddy pide los certificados en el primer acceso. Let's Encrypt
limita los certificados repetidos por semana, así que conviene no repetir instalaciones desde cero.

### Comando `rehnimarket`

Se instala como root desde un commit de `main` y opera siempre sobre `/opt/rehnimarket`, desde cualquier carpeta.
Con `sudo`, se vuelve a ejecutar como `rehnimarket`.

```bash
git -C /opt/rehnimarket fetch origin main && SHA="$(git -C /opt/rehnimarket rev-parse origin/main)"
for f in scripts/backup_rehnimarket.sh scripts/restore_rehnimarket.sh scripts/deploy_rehnimarket.sh; do
  git -C /opt/rehnimarket show "${SHA}:${f}" | sudo install -o root -g root -m 0755 /dev/stdin "/usr/local/lib/rehnimarket/$(basename "$f")"
done
git -C /opt/rehnimarket show "${SHA}:scripts/ops/rehnimarket" | sudo install -o root -g root -m 0755 /dev/stdin /usr/local/bin/rehnimarket
```

`/etc/rehnimarket/ops.env` (root, 644, sin secretos):

```bash
OPS_USER=rehnimarket
APP_DIR=/opt/rehnimarket
BACKUP_DIR=/home/rehnimarket/backups/rehnimarket
LOG_DIR=/var/log/rehnimarket
HEALTH_URLS="http://127.0.0.1:8000/health/database"
```

| Comando | Qué hace |
|---|---|
| `sudo rehnimarket status` | Versión desplegada, contenedores, `/health/database`, último respaldo y espacio libre |
| `sudo rehnimarket ps` | Contenedores del proyecto |
| `sudo rehnimarket logs [-f] [--tail N] [servicio…]` | Logs; por defecto las 100 últimas líneas |
| `sudo rehnimarket start [--build]` | Levanta los servicios y espera a que estén sanos |
| `sudo rehnimarket stop [servicio…]` / `restart [servicio…]` | Detiene o reinicia servicios, sin borrar contenedores ni datos |
| `sudo rehnimarket exec <servicio> [comando…]` | Comando dentro de un servicio en marcha; por defecto `sh` |

Los scripts se ejecutan desde `/usr/local/lib` y no desde el repositorio porque `deploy` cambia de commit en
`/opt/rehnimarket`, y bash podría leer un script a medio reescribir. El comando no ofrece `down -v`, borrado de
volúmenes ni limpieza de imágenes.

## 3. Comprobación

```bash
read -rs SMOKE_PASSWORD; export SMOKE_PASSWORD
SMOKE_EMAIL=<correo-de-una-cuenta-verificada> \
BASE_URL=https://apirehnimarket.duckdns.org FRONTEND_URL=https://rehnimarket.duckdns.org \
  bash scripts/smoke-test.sh      # RESULTADO: 7 pasan, 0 fallan
```

Desde otro equipo, `nc -zv <ip-de-la-vm> 5433` y `nc -zv <ip-de-la-vm> 9001` deben fallar.

## 4. Errores frecuentes

| Síntoma | Causa | Qué hacer |
|---|---|---|
| `permission denied` al usar Docker | La sesión se abrió antes de entrar al grupo `docker` | Cerrar sesión y volver a entrar |
| `servicio desconocido: rehnimarket-backend` | Se usó el nombre de un contenedor; el servicio es `backend` | `sudo rehnimarket logs backend` |
| Caddy no obtiene el certificado | El DNS no apunta a la VM o el puerto 80 está cerrado | `nslookup` de los dos dominios, reglas 80/443 del NSG, `sudo rehnimarket logs frontend` |
| El backend no conecta a la base | Contraseña distinta en `POSTGRES_PASSWORD` y en `URL_DATABASE*` | La base guarda la contraseña con la que se creó el volumen |
| La web no llega a la API | `VITE_API_URL` se graba al compilar | `sudo rehnimarket start --build`; revisar `CORS_EXTRA_ORIGINS` y `URL_FRONTEND` |
| Un contenedor se reinicia durante la compilación | Falta de memoria | `free -h`, `dmesg \| grep -i oom`, compilar de una imagen a la vez |

## 5. Recuperación del acceso al servidor

Si se pierde el acceso SSH, usar el portal de Azure: VM → *Run command* (como root) o *Reset password / SSH public
key*. La contraseña de `rehnimarket` está bloqueada, así que la consola serie no permite iniciar sesión. Antes de
tocar SSH, sudoers o cuentas, abrir una segunda sesión SSH y no cerrarla hasta comprobar el cambio.

## 6. Estado del servidor (2026-11-27)

Producción está **apagada y vacía**: no hay contenedores, volúmenes ni imágenes, y el repositorio está en
`099f84b`. Todavía no se ha aplicado la simplificación:

- siguen las cuentas `deploy`, `backup-restore` y `rehniops`, sus grupos (987, 986 y 985), sus llaves y
  `/etc/sudoers.d/rehnimarket`;
- `/opt/rehnimarket` y los logs pertenecen a `rehniops`;
- el comando `rehnimarket` no está instalado.

Mientras tanto, Compose se ejecuta como
`sudo -u rehniops -H docker compose --project-directory /opt/rehnimarket …`.

Migración pendiente de autorización, en este orden:

1. `chown -R rehnimarket:rehnimarket /opt/rehnimarket /var/log/rehnimarket`.
2. Crear `/home/rehnimarket/backups/rehnimarket` (700) y mover `/var/lib/rehniops/env-respaldos` a
   `/home/rehnimarket/env-respaldos`.
3. Poner `/opt/rehnimarket` en el `main` actual.
4. Instalar el comando y `ops.env` (sección 2).
5. `start --build`, datos iniciales y primer respaldo.
6. Bloquear `deploy` y `backup-restore`, y comprobar el acceso.
7. Borrar las cuentas y los grupos, `/etc/sudoers.d/rehnimarket`, `/usr/local/lib/rehnimarket/ssh-gate.sh` y la
   línea rota del crontab (`cd $HOME/Rehni-Market && bash scripts/respaldar.sh`).
8. Comprobar que `find / -xdev \( -nouser -o -nogroup \)` solo devuelve archivos de las capas de Docker.
