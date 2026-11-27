# Evidencias: conexión privada de GitHub Actions a Azure por Tailscale

Fecha: 2026-11-27, entre 07:40 y 07:50 UTC. Servidor `rehni-prod` (Azure, Ubuntu 24.04.5). Pruebas no destructivas:
no se ejecutó ningún deploy, backup ni restore real. `DEPLOY_ENABLED` y `RESTORE_ENABLED` no existen (0 variables
de repositorio), así que los workflows de deploy y restore siguen bloqueados.

## 1. Servidor en la tailnet

`tailscale status --json` en el servidor: `BackendState=Running`, host `RehniMarket`, tag `tag:rehnimarket-prod`,
IP `100.96.201.52`, en línea. Tras el run no queda ningún par en `tailscale status`: los nodos de CI son efímeros y
salieron al terminar.

## 2. Primer intento: 403 en el canje OIDC (run 45959764019)

`tailscale up` respondió `token exchange failed with status 403: Unauthorized` en los dos jobs. Causa: el repositorio
usa el subject inmutable de GitHub (`gh api repos/RehnieyAl/Rehni-Market/actions/oidc/customization/sub` →
`use_immutable_subject: true`, prefijo `repo:RehnieyAl@232988648/Rehni-Market@1302198737`) y las credenciales
tenían el formato antiguo. El propietario corrigió los subjects en Tailscale y en [`tailscale.md`](tailscale.md).

## 3. Comprobación SSH (run 45960540838): todo en verde

`rehnimarket-ssh-check.yml` en `main` (10d2811), aprobado por el revisor de los dos environments.

| Comprobación | Job `produccion` | Job `produccion-restore` |
|---|---|---|
| Canje OIDC y nodo efímero en la tailnet (sin 403) | OK (`tag:ci-produccion`) | OK (`tag:ci-restore`) |
| Ping al servidor por la tailnet | OK | OK |
| Llave de deploy: conecta, autentica y la compuerta aplica el rol `deploy` | OK | — |
| Llave de backup: ídem, rol `backup` | OK | — |
| Llave de restore: ídem, rol `restore` | — | OK |
| Puertos 80, 443, 8000 y 5433 filtrados por la política | OK (4/4) | OK (4/4) |

## 4. Lado del servidor

**sshd** (`journalctl -u ssh`): las conexiones de CI llegan desde IP de la tailnet, no desde Internet:

```
07:47:06 Accepted publickey for deploy from 100.99.51.36 … SHA256:dC/8ZAZf…
07:47:07 Accepted publickey for backup-restore from 100.99.51.36 … SHA256:7Mpsk…
07:47:11 Accepted publickey for backup-restore from 100.118.120.97 … SHA256:ivM63z6D…
```

**Compuerta** (`journalctl -t rehnimarket-ssh-gate`): cada llave quedó atada a su rol y la orden de prueba fue
rechazada sin ejecutar nada:

```
rol=deploy  orden=comprobar-conexion → denegado: orden no permitida para el rol 'deploy'
rol=backup  orden=comprobar-conexion → denegado: orden no permitida para el rol 'backup'
rol=restore orden=comprobar-conexion → denegado: orden no permitida para el rol 'restore'
```

**authorized_keys:** las tres llaves de GitHub tienen `restrict,command="/usr/local/lib/rehnimarket/ssh-gate.sh <rol>"`;
las personales, `restrict,pty`.

**sudoers:** `visudo -c` → `parsed OK`. `sudo -l -U deploy` solo permite `deploy_rehnimarket.sh` con SHA de 40
hexadecimales, ID de respaldo y número de run (regex anclada). `backup-restore` solo permite el respaldo con
`GITHUB_RUN_ID` numérico y el restore en sus modos `--list`, `--dry-run`, `--verify-only` y `--confirm=<mismo ID>`.

**Scripts instalados** (`/usr/local/lib/rehnimarket`, `root:root 755`): el sha256 de los cuatro coincide con `main`:

| Script | sha256 (prefijo) |
|---|---|
| `ssh-gate.sh` | `a9fbf84679969b10` |
| `deploy_rehnimarket.sh` | `61747e0148175856` |
| `backup_rehnimarket.sh` | `23da5a25f3c90cc4` |
| `restore_rehnimarket.sh` | `702e0f6fb6324644` |

## 5. Red desde Internet (NSG de Azure)

Prueba TCP desde la IP del administrador, sin nada escuchando en el servidor:

| Puerto | Resultado | Lectura |
|---|---|---|
| 80, 443 | Conexión rehusada | El NSG deja pasar; el servidor responde que no hay servicio |
| 5433, 8000, 9001 | Tiempo agotado | El NSG los bloquea |

[PENDIENTE: confirmar en el portal de Azure que las reglas de 80/443 admiten cualquier origen (no solo la IP del
administrador) y que existe la de UDP 443; esta prueba no lo distingue.]

## 6. Protección de `main` y environments

| Control | Estado |
|---|---|
| Ruleset `CODEOWNER` (rama) | **Desactivado** (`disabled`) por el propietario |
| Ruleset `versiones` (tags) | **Desactivado** (`disabled`) |
| Protección clásica de `main` | No hay (`Branch not protected`) |
| Environment `produccion` | Revisor obligatorio `RehnieyAl`; ramas: `main` y tags `v*` |
| Environment `produccion-restore` | Revisor obligatorio `RehnieyAl`; ramas: `main` |
| `DEPLOY_ENABLED` / `RESTORE_ENABLED` | No existen (deploy y restore bloqueados) |

Hoy cualquier push a `main` entra sin PR ni revisión. Los environments sí exigen la aprobación del propietario para
llegar al servidor. Hay que volver a activar los rulesets antes de crear `DEPLOY_ENABLED`.
