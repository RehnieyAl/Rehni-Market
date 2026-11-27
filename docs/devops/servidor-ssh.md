# Servidor de Azure: usuarios, llaves SSH y ejecutores

Estado (2026-11-27): aplicado en el servidor de Azure tal como se describe aquí, con autorización del propietario.
Las llaves privadas las guarda solo el propietario; ningún script ni workflow del repositorio las lee, copia o
imprime.

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
useradd --system --create-home --home-dir /var/lib/rehniops --shell /usr/sbin/nologin rehniops
usermod -aG docker rehniops
install -d -o rehniops -g rehniops -m 750 /opt/rehnimarket /var/log/rehnimarket
install -d -o rehniops -g rehniops -m 700 /var/backups/rehnimarket
# El repositorio es público: rehniops lo clona por HTTPS, sin llaves ni credenciales en el servidor.
sudo -u rehniops -H git clone https://github.com/RehnieyAl/Rehni-Market.git /opt/rehnimarket

# Scripts propiedad de root, copiados de un commit revisado (no del árbol desplegado, que rehniops podría editar)
install -d -m 755 /usr/local/lib/rehnimarket /etc/rehnimarket
for f in scripts/ops/ssh-gate.sh scripts/backup_rehnimarket.sh scripts/restore_rehnimarket.sh scripts/deploy_rehnimarket.sh; do
  sudo -u rehniops -H git -C /opt/rehnimarket show "<sha>:$f" | install -o root -g root -m 0755 /dev/stdin "/usr/local/lib/rehnimarket/$(basename "$f")"
done
cat > /etc/rehnimarket/ops.env <<'EOF'
APP_DIR=/opt/rehnimarket
BACKUP_DIR=/var/backups/rehnimarket
LOG_DIR=/var/log/rehnimarket
HEALTH_URLS="http://127.0.0.1:8000/health/database"
EOF
chmod 644 /etc/rehnimarket/ops.env
apt-get install -y jq   # lo usan los tres scripts
```

`/etc/sudoers.d/rehnimarket` (0440 root). Las reglas usan **expresiones regulares exactas** (sudo ≥ 1.9.10): un
comodín `*` en los argumentos también encaja con espacios y permitiría colar otro comando antes del script. En
sudoers hay que escapar `=` y `,` dentro de los argumentos.

```text
Defaults:deploy,backup-restore !requiretty, env_reset
Cmnd_Alias REHNI_DEPLOY = /usr/local/lib/rehnimarket/deploy_rehnimarket.sh ^[0-9a-f]{40} [0-9]{8}T[0-9]{6}Z_[0-9a-f]{12} [0-9]+$
Cmnd_Alias REHNI_BACKUP = /usr/bin/env ^GITHUB_RUN_ID\=[0-9]+ /usr/local/lib/rehnimarket/backup_rehnimarket[.]sh$, \
    /usr/local/lib/rehnimarket/restore_rehnimarket.sh ^[0-9]{8}T[0-9]{6}Z_[0-9a-f]{12} --dry-run$
Cmnd_Alias REHNI_RESTORE = /usr/local/lib/rehnimarket/restore_rehnimarket.sh --list, \
    /usr/local/lib/rehnimarket/restore_rehnimarket.sh ^[0-9]{8}T[0-9]{6}Z_[0-9a-f]{12} --verify-only$, \
    /usr/bin/env ^GITHUB_RUN_ID\=[0-9]+ /usr/local/lib/rehnimarket/restore_rehnimarket[.]sh [0-9]{8}T[0-9]{6}Z_[0-9a-f]{12} --confirm\=[0-9]{8}T[0-9]{6}Z_[0-9a-f]{12}$
deploy ALL=(rehniops) NOPASSWD: REHNI_DEPLOY
backup-restore ALL=(rehniops) NOPASSWD: REHNI_BACKUP, REHNI_RESTORE
```

Instalar siempre validando antes: `visudo -cf <archivo>` → `install -m 0440` → `visudo -c`.

Comprobar qué permite cada regla **sin ejecutar nada**. Hay que indicar el usuario destino (`-u rehniops`): sin él,
`sudo -l` pregunta si se puede ejecutar como root y responde «no» incluso para las órdenes válidas.

```bash
sudo -l -U deploy -u rehniops /usr/local/lib/rehnimarket/deploy_rehnimarket.sh <sha40> <backup_id> 1   # permitida
sudo -l -U deploy -u rehniops /usr/local/lib/rehnimarket/deploy_rehnimarket.sh <sha40> <backup_id> "1;id"  # denegada
sudo -l -U backup-restore -u rehniops /usr/bin/env GITHUB_RUN_ID=1 /bin/bash -c id /usr/local/lib/rehnimarket/backup_rehnimarket.sh  # denegada
sudo -l -U deploy /usr/local/lib/rehnimarket/deploy_rehnimarket.sh <sha40> <backup_id> 1   # como root: denegada
```

Resultado en el servidor (2026-11-27): 19/19 casos correctos (válidas permitidas; inyección, argumentos de más,
`LD_PRELOAD`, rutas con `../` y otros roles denegados) y ninguna orden permitida como root.

La compuerta valida cada argumento (SHA de 40 hexadecimales, ID de respaldo, run numérico, confirmación igual al ID)
antes de llamar a sudo; sudo es la segunda barrera.

## Llaves (`authorized_keys`)

Llaves de GitHub Actions en `~deploy/.ssh/authorized_keys` y `~backup-restore/.ssh/authorized_keys` (antes tenían
`command="/usr/bin/true"`); las llaves personales del propietario (`restrict,pty`) no se tocan:

```text
restrict,command="/usr/local/lib/rehnimarket/ssh-gate.sh deploy" ssh-ed25519 AAAA... github-actions-rehnimarket-deploy
restrict,command="/usr/local/lib/rehnimarket/ssh-gate.sh backup" ssh-ed25519 AAAA... github-actions-rehnimarket-backup
restrict,command="/usr/local/lib/rehnimarket/ssh-gate.sh restore" ssh-ed25519 AAAA... github-actions-rehnimarket-restore
```

Las dos primeras en sus usuarios (`deploy`, `backup-restore`) y la de restore también en `backup-restore`, pero con
otra llave y otro rol. Copia previa de cada archivo: `authorized_keys.antes-gate-20261127`.

`restrict` desactiva PTY, reenvíos y agentes. Órdenes que acepta cada rol:

| Rol | Órdenes |
|---|---|
| `deploy` | `deploy <sha40> <backup_id> <run_id>` |
| `backup` | `backup <run_id>`, `verify-backup <backup_id>` |
| `restore` | `list`, `restore-verify <backup_id>`, `restore <backup_id> <backup_id> <run_id>` |

Cualquier otra cosa se rechaza (código 126) y se registra con `logger -t rehnimarket-ssh-gate`.

## Red

El NSG solo admite SSH (22) desde la IP pública del propietario: no se abre a Internet. GitHub Actions entra por
una red privada de Tailscale; ver [tailscale.md](tailscale.md). La clave de host se guarda en `AZURE_SSH_KNOWN_HOSTS`
solo después de comprobar sus huellas contra el `known_hosts` del propietario, ya confiable.

## Comprobaciones tras configurar

```bash
ssh -i deploy_key deploy@host "bash -i"                 # → denegado (126)
ssh -i backup_key backup-restore@host "restore X X 1"   # → denegado (126)
ssh -i restore_key backup-restore@host list             # → lista de respaldos
```

Después: workflow «Restore producción» en modo `verificar-qa` sobre el último respaldo y, con autorización, un
despliegue real de prueba.
