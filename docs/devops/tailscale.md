# Red privada de GitHub Actions con Tailscale

El NSG de Azure solo admite SSH (22) desde la IP pública del propietario. Los runners de GitHub no pueden llegar al
servidor por Internet (comprobado: `Connection timed out` y ningún intento registrado por `sshd`). En lugar de abrir
el 22, cada job autorizado se une a una tailnet privada como nodo efímero y llega al servidor por ella.

```text
job en environment protegido (aprobación del propietario, solo main)
  → token OIDC de GitHub (id-token: write) → credencial federada de Tailscale (subject = ese environment)
  → nodo efímero tag:ci-* → tailnet → tag:rehnimarket-prod, solo TCP 22 → OpenSSH → ssh-gate.sh → sudo → script
```

OpenSSH, las llaves por rol, la compuerta y sudoers no cambian: Tailscale solo aporta el camino de red. Tailscale SSH
está desactivado (`--ssh=false` y `"ssh": []` en la política).

## Servidor

| Dato | Valor |
|---|---|
| Paquete | `tailscale` 1.104.7 del repositorio oficial `pkgs.tailscale.com/stable/ubuntu noble` (llave de Tailscale Inc., huella `2596 A99E AAB3 3821 893C 0A79 458C A832 957F 5868`) |
| Registro | `sudo tailscale up --advertise-tags=tag:rehnimarket-prod --ssh=false --accept-routes=false --accept-dns=false` (lo ejecuta el propietario y aprueba el enlace en su navegador) |
| IP en la tailnet | `100.96.201.52` (`rehnimarket.tail1adfcc.ts.net`), etiqueta `tag:rehnimarket-prod`, `RunSSH=false`, sin rutas ni DNS de la tailnet |
| Efectos | Servicio `tailscaled` e interfaz `tailscale0` (~37 MB). No cambia `eth0`, el NSG, `sshd`, Docker ni el DNS del sistema |

## Política de la tailnet (Access controls)

Sustituye la política por defecto, que lo permite todo:

```json
{
  "tagOwners": {
    "tag:rehnimarket-prod": ["autogroup:admin"],
    "tag:ci-produccion":    ["autogroup:admin"],
    "tag:ci-restore":       ["autogroup:admin"]
  },
  "grants": [
    { "src": ["tag:ci-produccion", "tag:ci-restore"], "dst": ["tag:rehnimarket-prod"], "ip": ["tcp:22"] }
  ],
  "ssh": [],
  "tests": [
    { "src": "tag:ci-produccion", "accept": ["tag:rehnimarket-prod:22"], "deny": ["tag:rehnimarket-prod:80", "tag:rehnimarket-prod:443", "tag:rehnimarket-prod:8000", "tag:rehnimarket-prod:5433"] },
    { "src": "tag:ci-restore",    "accept": ["tag:rehnimarket-prod:22"], "deny": ["tag:rehnimarket-prod:80", "tag:rehnimarket-prod:443", "tag:rehnimarket-prod:8000", "tag:rehnimarket-prod:5433"] }
  ]
}
```

- Los runners solo alcanzan el TCP 22 del servidor; nadie en la tailnet alcanza a los runners ni otros puertos.
- Los `tests` hacen que la consola rechace guardar una política que abra 80, 443, 8000 o 5433 a CI.

## Credenciales OIDC (Settings → Trust credentials → OpenID Connect)

| Credencial | Issuer | Subject | Scope | Tag | Variables del environment |
|---|---|---|---|---|---|
| CI producción | GitHub (`https://token.actions.githubusercontent.com`) | `repo:RehnieyAl@232988648/Rehni-Market@1302198737:environment:produccion` | `auth_keys` (escritura) | `tag:ci-produccion` | `TS_OAUTH_CLIENT_ID`, `TS_AUDIENCE` en `produccion` |
| CI restore | GitHub | `repo:RehnieyAl@232988648/Rehni-Market@1302198737:environment:produccion-restore` | `auth_keys` (escritura) | `tag:ci-restore` | `TS_OAUTH_CLIENT_ID`, `TS_AUDIENCE` en `produccion-restore` |

El repositorio usa el **subject inmutable** de GitHub (`use_immutable_subject: true`, consultable con
`gh api repos/RehnieyAl/Rehni-Market/actions/oidc/customization/sub`): el `sub` lleva el ID del propietario
(`232988648`) y del repositorio (`1302198737`). Con el formato antiguo `repo:RehnieyAl/Rehni-Market:...` Tailscale
rechaza el canje con `403 Unauthorized`. Los IDs no cambian aunque se renombre el usuario o el repositorio.

El subject con `environment:` hace que solo un job de ese environment (aprobado por el propietario y limitado a
`main`) obtenga un token válido: un PR u otro workflow no pueden entrar en la tailnet. El Client ID y el Audience no
son secretos (la documentación de Tailscale lo indica); se guardan como **variables** del environment. No hay
secretos nuevos.

## Workflows

`rehnimarket-deploy.yml` (`publicar`), `rehnimarket-restore.yml` (`restaurar`) y `rehnimarket-ssh-check.yml` (ambos
jobs): solo esos jobs tienen `id-token: write` y el paso `tailscale/github-action@064b10558093f38325e838ddea35486bdc6b1d5c`
(v4.4.0, Tailscale 1.104.4 por defecto; OIDC exige ≥ 1.94). El paso usa la etiqueta del environment, hace `ping` al
servidor antes del SSH y el nodo efímero sale al terminar el job. `AZURE_SSH_HOST` pasa a ser la IP de la tailnet y
`AZURE_SSH_KNOWN_HOSTS` repite las mismas claves de host ya verificadas para esa dirección.

## Pruebas

`Comprobación SSH producción` (manual): cada llave envía una orden que la compuerta rechaza (126 con su rol = red,
clave de host, autenticación y rol correctos) y los puertos 80, 443, 8000 y 5433 deben quedar sin respuesta.

| Prueba | Resultado |
|---|---|
| Run 45954905111, sin Tailscale | Las 3 llaves: `Connection timed out` (NSG) |
| Run con Tailscale | `[PENDIENTE: run, resultado por llave y por puerto]` |

## Reversión

1. GitHub: quitar el paso de Tailscale y `id-token: write` de los workflows (revertir el PR), borrar las variables
   `TS_OAUTH_CLIENT_ID`/`TS_AUDIENCE` de los dos environments y devolver `AZURE_SSH_HOST` y `AZURE_SSH_KNOWN_HOSTS`
   a la IP pública.
2. Consola de Tailscale: borrar las dos credenciales OIDC y el nodo del servidor.
3. Servidor: `sudo tailscale down && sudo tailscale logout`, `sudo apt-get purge -y tailscale` y borrar
   `/etc/apt/sources.list.d/tailscale.list` y `/usr/share/keyrings/tailscale-archive-keyring.gpg`.
