# Servidor de Azure: usuarios, llaves SSH y ejecutores

**Todo este documento es PENDIENTE DE CONFIGURACIÓN MANUAL POR EL PROPIETARIO.** Las llaves privadas las genera y
guarda solo el propietario; ningún script ni workflow del repositorio las lee, copia o imprime.

## Identidades

| Usuario Linux | Para qué | Llaves autorizadas (rol del comando forzado) |
|---|---|---|
| `deploy` (existe) | Desplegar un commit de `main` | `AZURE_DEPLOY_SSH_KEY` → rol `deploy` |
| `backup-restore` (existe) | Respaldar y restaurar | `AZURE_BACKUP_SSH_KEY` → rol `backup`; `AZURE_RESTORE_SSH_KEY` → rol `restore` (llave distinta) |
| `rehniops` (crear) | Dueño de `/opt/rehnimarket`, en el grupo `docker`; ejecuta los scripts | Ninguna: no inicia sesión |

`deploy` y `backup-restore` **no** entran al grupo `docker` ni tienen sudo general: solo pueden ejecutar la
compuerta, que lanza como `rehniops` uno de los tres scripts instalados por root. Pertenecer a `docker` equivale a
root en el host; por eso solo lo tiene `rehniops`, que no tiene llaves ni contraseña.

## Instalación (como root)

```bash
# Usuario operativo y rutas
useradd --system --create-home --shell /usr/sbin/nologin rehniops
usermod -aG docker rehniops
install -d -o rehniops -g rehniops -m 750 /opt/rehnimarket /var/log/rehnimarket
install -d -o rehniops -g rehniops -m 700 /var/backups/rehnimarket
# Mover el despliegue actual (~/Rehni-Market) a /opt/rehnimarket en una ventana de mantenimiento:
#   docker compose down (sin -v) → mv → chown -R rehniops: → docker compose up -d --wait
# Los volúmenes de Docker se identifican por el nombre del proyecto (directorio): fijar
# COMPOSE_PROJECT_NAME=rehni-market en /opt/rehnimarket/.env para que siga usando los mismos volúmenes.

# Scripts propiedad de root (una versión revisada del repositorio, no la del árbol desplegado)
install -d -m 755 /usr/local/lib/rehnimarket /etc/rehnimarket
install -m 755 scripts/backup_rehnimarket.sh scripts/restore_rehnimarket.sh scripts/deploy_rehnimarket.sh \
  scripts/ops/ssh-gate.sh /usr/local/lib/rehnimarket/
cat > /etc/rehnimarket/ops.env <<'EOF'
APP_DIR=/opt/rehnimarket
BACKUP_DIR=/var/backups/rehnimarket
LOG_DIR=/var/log/rehnimarket
HEALTH_URLS="http://127.0.0.1:8000/health/database"
EOF
chmod 644 /etc/rehnimarket/ops.env
apt-get install -y jq   # lo usan los tres scripts
```

`/etc/sudoers.d/rehnimarket` (validar con `visudo -cf`):

```text
deploy         ALL=(rehniops) NOPASSWD: /usr/local/lib/rehnimarket/deploy_rehnimarket.sh
backup-restore ALL=(rehniops) NOPASSWD: /usr/bin/env GITHUB_RUN_ID=* /usr/local/lib/rehnimarket/backup_rehnimarket.sh, \
                                        /usr/local/lib/rehnimarket/restore_rehnimarket.sh, \
                                        /usr/bin/env GITHUB_RUN_ID=* /usr/local/lib/rehnimarket/restore_rehnimarket.sh
Defaults:deploy,backup-restore !requiretty, env_reset
```

La compuerta valida cada argumento (SHA de 40 hexadecimales, ID de respaldo, run numérico, confirmación igual al ID)
antes de llamar a sudo; sudo solo permite esos archivos.

## Llaves (`authorized_keys`)

Estado actual: las llaves automatizadas tienen `restrict,command="/usr/bin/true"` (no ejecutan nada). Sustitución
cuando se autorice, en `~deploy/.ssh/authorized_keys` y `~backup-restore/.ssh/authorized_keys`:

```text
restrict,command="/usr/local/lib/rehnimarket/ssh-gate.sh deploy",from="<rangos de GitHub Actions o del runner>" ssh-ed25519 AAAA... deploy-gha
restrict,command="/usr/local/lib/rehnimarket/ssh-gate.sh backup",from="<...>" ssh-ed25519 AAAA... backup-gha
restrict,command="/usr/local/lib/rehnimarket/ssh-gate.sh restore",from="<...>" ssh-ed25519 AAAA... restore-gha
```

`restrict` desactiva PTY, reenvíos y agentes. Órdenes que acepta cada rol:

| Rol | Órdenes |
|---|---|
| `deploy` | `deploy <sha40> <backup_id> <run_id>` |
| `backup` | `backup <run_id>`, `verify-backup <backup_id>` |
| `restore` | `list`, `restore-verify <backup_id>`, `restore <backup_id> <backup_id> <run_id>` |

Cualquier otra cosa se rechaza (código 126) y se registra con `logger -t rehnimarket-ssh-gate`.

## Red

No abrir SSH a todo Internet. Opciones, de mejor a peor: runner autoalojado dentro de la VNet (el puerto 22 queda
cerrado al exterior); regla del NSG limitada a los rangos de GitHub Actions (`https://api.github.com/meta`,
clave `actions`, cambian con frecuencia); o túnel/bastión. Guardar en `AZURE_SSH_KNOWN_HOSTS` la huella real del
servidor (`ssh-keyscan -p <puerto> <host>` desde una red de confianza y comprobada contra la consola de Azure).

## Comprobaciones tras configurar

```bash
ssh -i deploy_key deploy@host "bash -i"                 # → denegado (126)
ssh -i backup_key backup-restore@host "restore X X 1"   # → denegado (126)
ssh -i restore_key backup-restore@host list             # → lista de respaldos
```

Después: workflow «Restore producción» en modo `verificar-qa` sobre el último respaldo y, con autorización, un
despliegue real de prueba.
