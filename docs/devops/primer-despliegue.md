# Plan del primer despliegue en Azure (instalación manual)

Servidor `rehni-prod` (IP pública en `~/.ssh/config` del administrador), con el repo en `/opt/rehnimarket` (usuario `rehniops`) y el único `.env` ahí
mismo. Es la **primera** instalación: no hay nada desplegado que respaldar, así que no se hace con
`rehnimarket-deploy.yml`, que exige un respaldo verificado de lo desplegado. Este plan adapta
[`deploy/checklist-azure.md`](../../deploy/checklist-azure.md) §3-7 y [`deploy/OWNER.md`](../../deploy/OWNER.md) a la
estructura del servidor (fases 3-6, [`servidor-ssh.md`](servidor-ssh.md)).

**Nada de esto se ejecuta sin la autorización del propietario.** Cada fase termina en un punto de control: si falla,
se para ahí.

Convención: los comandos se ejecutan en `ssh rehni-prod` como el administrador, y todo lo que toca el repo o el `.env`
va con `R="sudo -u rehniops -H"` y `C="$R docker compose --project-directory /opt/rehnimarket"`.

## Estado de partida (verificado el 2026-11-27)

| Punto | Estado |
|---|---|
| Conexión CI → servidor | Tailscale OK, compuerta y sudoers OK ([evidencias](evidencias-tailscale-2026-11-27.md)) |
| `docker compose config --quiet` | Código 0; 5 servicios; solo 80/443 en `0.0.0.0`; postgres `127.0.0.1:5433`; backend `127.0.0.1:8000` |
| DNS | `rehnimarket` y `apirehnimarket.duckdns.org` → la IP pública de la VM |
| NSG | 80/443 TCP llegan (rehusada); 5433/8000/9001 bloqueados (tiempo agotado) |
| Recursos | 2 vCPU, 3,8 GiB de RAM, 2 GiB de swap, 20 GB libres |
| Clon | Detached en 099f84b; `main` está en 10d2811 (solo cambian workflows y docs) |
| Docker | 0 contenedores, 0 volúmenes; **imágenes viejas** `rehni-market-backend:latest` (9 días), `rehni-market-frontend:latest` (10 días), `hello-world` |
| `.env` | `RUN_SEED=false`, `CADDY_LOCAL_CERTS` vacío (Let's Encrypt real); **vacíos:** `GMAIL_USERNAME`, `GMAIL_APP_PASSWORD`, `USER_NAME_OWNER`, `OWNER_DEFAULT`, `OWNER_PASSWORD_DEFAULT` |
| Protección de `main` | Rulesets `CODEOWNER` y `versiones` desactivados |

## Fase A · Lo que debe hacer el propietario antes (bloqueante)

1. **Correo:** cargar `GMAIL_USERNAME` y `GMAIL_APP_PASSWORD` con `ssh -t rehni-prod sudo rehnimarket-secretos`.
   `SMTP_USERNAME` y `EMAIL_FROM` toman ese valor cuando están vacíos (`app/Config.py`). Sin correo, el registro no
   puede verificar cuentas y la prueba de humo de la fase F no se puede hacer.
2. **Owner: elegir un método.** Recomendado: **`deploy/sql/crear-owner.sql`** (OWNER.md §3). La clave se escribe con
   `read -rsp` y nunca queda en el `.env`, así que `USER_NAME_OWNER`, `OWNER_DEFAULT` y `OWNER_PASSWORD_DEFAULT` se
   quedan vacías. La alternativa (llenarlas y que `datos-base.sh` cree el owner) obliga a vaciarlas después y deja la
   clave en disco mientras tanto.
3. **NSG en el portal:** confirmar que TCP 80/443 admiten **cualquier origen** (Let's Encrypt valida desde fuera) y
   que existe UDP 443 (HTTP/3). [PENDIENTE: captura de las reglas de entrada del NSG]
4. **Versión:** recomiendo `main` en 10d2811, que es lo que aprobó CI y lo que permite el environment `produccion`.
   [PENDIENTE: confirmar 10d2811 o un tag `v*` nuevo]
5. **Rulesets:** decidir si se reactivan ahora o antes de crear `DEPLOY_ENABLED`. No afecta a la instalación manual.

## Fase B · Comprobaciones previas (solo lectura)

```bash
$R git -C /opt/rehnimarket fetch --tags origin
$R git -C /opt/rehnimarket checkout --detach <sha-de-la-fase-A4>   # cambia solo el árbol de trabajo
$R git -C /opt/rehnimarket status --short                         # vacío (.env ignorado)
$R bash -c 'cd /opt/rehnimarket && PORTS="80 443" bash scripts/verificar-requisitos.sh'   # todo CUMPLE
$R grep -cE '^[A-Z_]+=.*CAMBIAR' /opt/rehnimarket/.env           # 0
$R grep -cE '^(GMAIL_USERNAME|GMAIL_APP_PASSWORD)=$' /opt/rehnimarket/.env   # 0 (correo cargado)
$C config --quiet                                                  # código 0
```

Punto de control: todo como se indica. El `checkout` solo mueve el clon: no hay nada en marcha.

## Fase C · Imágenes viejas: construir siempre desde el código

Las imágenes `rehni-market-backend:latest` y `rehni-market-frontend:latest` son de una instalación anterior de origen
desconocido. Como `docker-compose.yml` usa esos mismos nombres en `image:`, un `up` sin `--build` las usaría y
arrancaría código viejo. Por eso:

```bash
docker image rm rehni-market-backend:latest rehni-market-frontend:latest hello-world:latest   # no hay contenedores que las usen
$C build --pull backend      # de una en una: con 2 vCPU / 3,8 GiB, las dos a la vez pueden quedarse sin memoria
$C build --pull frontend     # VITE_API_URL sale del .env (URL pública de la API)
docker images --format '{{.Repository}}:{{.Tag}} {{.CreatedSince}}' | grep rehni-market   # las dos «seconds/minutes ago»
```

Si no se quieren borrar, basta `build --pull` y comprobar la fecha. Borrarlas evita que un `up` posterior sin build
vuelva a la versión vieja si un build falla a medias.

Punto de control: las dos imágenes recién creadas. Si un build falla por memoria, repetirlo solo (hay swap).

## Fase D · Arranque escalonado

Por capas, para que un fallo de base de datos no gaste intentos de Let's Encrypt:

```bash
$C up -d --wait postgres pgbouncer minio
$C up -d --wait backend            # aplica `alembic upgrade head` al arrancar
curl -fsS http://127.0.0.1:8000/health/database      # {"Base de datos":"OK"}
$C up -d --wait frontend           # Caddy pide los certificados en el primer acceso
$C ps                              # cinco servicios healthy; solo rehni-frontend en 0.0.0.0
```

Punto de control: los cinco `healthy`. Si el backend no llega a `healthy`: `$C logs --tail=100 backend` y parar.

## Fase E · Datos base y owner (`RUN_SEED=false`)

Con `RUN_SEED=false` el backend **no siembra nada** (`app/main.py`): tras el primer arranque la base queda en el head
de Alembic pero con `0` roles, categorías y transportadoras. Sin el rol `user` el registro falla y sin el rol `owner`
`crear-owner.sql` se detiene. Visto en el primer arranque del 2026-11-27: los cinco servicios `healthy` y
`roles|catalog|shipping_carriers` = `0|0|0`.

### Ejecutar `scripts/datos-base.sh` en el servidor

Crea, dentro del contenedor `rehni-backend`, los 4 roles, el catálogo (120 categorías con especificaciones y
atributos) y las 4 transportadoras, y muestra los conteos. Es idempotente: no duplica ni modifica lo que ya existe.
Con las `OWNER_*` vacías no crea ningún owner (la línea `OK  seed_owner` solo indica que el paso terminó).

Requisito: el stack arriba (`docker ps` muestra `rehni-backend` como `healthy`). El administrador no puede leer
`/opt/rehnimarket` (750), por eso el script corre como `rehniops`.

Desde el equipo del administrador, en un solo comando:

```bash
ssh rehni-prod "sudo -u rehniops -H bash -c 'cd /opt/rehnimarket && bash scripts/datos-base.sh'"
```

O paso a paso dentro del servidor:

```bash
ssh rehni-prod
docker ps                                                                   # rehni-backend (healthy)
sudo -u rehniops -H bash -c 'cd /opt/rehnimarket && bash scripts/datos-base.sh'
exit
```

La copia de consulta (`~/opt/rehnimarket`, mismo commit) también sirve, sin `sudo`:
`bash ~/opt/rehnimarket/scripts/datos-base.sh`.

Salida esperada:

```
OK  ensure_base_data
OK  seed_owner
    roles: 4
    catalog: 120
    shipping_carriers: 4
    users: 0
    company: 0
    products: 0
```

Si muestra `ERROR: el contenedor rehni-backend no existe`, el backend no está en marcha (`docker ps`). Comprobación
independiente, sin modificar nada:

```bash
docker exec rehni-postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT (SELECT count(*) FROM roles), (SELECT count(*) FROM catalog), (SELECT count(*) FROM shipping_carriers);"'
# 4|120|4
```

### Solo los roles: `deploy/sql/crear-roles.sql`

Alternativa cuando solo hacen falta los roles (por ejemplo, para desbloquear `crear-owner.sql`). Inserta `user`,
`company`, `admin` y `owner` con `ON CONFLICT (name) DO NOTHING`: repetirlo no duplica ni cambia ids. No crea el
catálogo ni las transportadoras, que siguen saliendo de `datos-base.sh`. Si el clon del servidor aún no tiene el
archivo, se envía desde el equipo del administrador:

```bash
ssh rehni-prod "docker exec -i rehni-postgres sh -c 'psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\"'" < deploy/sql/crear-roles.sql
# INSERT 0 4 la primera vez; INSERT 0 0 las siguientes
```

### Owner

Owner con el método recomendado (OWNER.md §3, adaptado: el admin no puede leer `/opt/rehnimarket`, el SQL llega por
`rehniops`):

```bash
read -rsp 'Clave del owner: ' OWNER_CLAVE; echo; export OWNER_CLAVE
export OWNER_CORREO='<correo-del-owner>' OWNER_NOMBRE='<nombre completo>' OWNER_TELEFONO='<10 dígitos>'
$R cat /opt/rehnimarket/deploy/sql/crear-owner.sql | docker exec -i -e OWNER_CLAVE -e OWNER_CORREO -e OWNER_NOMBRE -e OWNER_TELEFONO rehni-postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v clave="$OWNER_CLAVE" -v correo="$OWNER_CORREO" -v nombre="$OWNER_NOMBRE" -v telefono="$OWNER_TELEFONO"'
unset OWNER_CLAVE OWNER_CORREO OWNER_NOMBRE OWNER_TELEFONO
```

Punto de control: `INSERT 0 1`, la consulta de OWNER.md §4 devuelve una fila con `is_owner = t` y el inicio de sesión
en la web abre el **Panel Propietario**.

## Fase F · Verificación

```bash
curl -fsS https://apirehnimarket.duckdns.org/health/database                       # {"Base de datos":"OK"}
curl -fsS -o /dev/null -w '%{http_code}\n' https://rehnimarket.duckdns.org/         # 200
curl -sI http://rehnimarket.duckdns.org | head -1                                   # 308
$C logs frontend | grep -i 'certificate obtained'                                   # los dos nombres
$R bash -c 'cd /opt/rehnimarket && bash scripts/verificar-redes.sh'                 # 0 fallan (reinicia el backend una vez)
```

Desde fuera (equipo del administrador): `nc -zv -w5 <ip-publica> 5433`, `… 8000` y `… 9001` **fallan**; 80 y 443
**conectan**. [PENDIENTE: comprobar 80/443 desde una red distinta a la del administrador]

Prueba de humo: registrar y verificar por correo una cuenta de comprador de prueba (no la del owner) y luego
`SMOKE_EMAIL=… SMOKE_PASSWORD=… BASE_URL=https://apirehnimarket.duckdns.org FRONTEND_URL=https://rehnimarket.duckdns.org bash scripts/smoke-test.sh`
→ `7 pasan, 0 fallan`. [PENDIENTE: resultado]

## Fase G · Primer respaldo (deja listo el camino del deploy automático)

```bash
sudo -u rehniops -H /usr/local/lib/rehnimarket/backup_rehnimarket.sh    # termina con BACKUP_ID=<id>
sudo -u rehniops -H /usr/local/lib/rehnimarket/restore_rehnimarket.sh <id> --verify-only
```

Este es el primer respaldo **real**: solo con la autorización expresa del propietario. Con él, el workflow de deploy
ya tendrá un respaldo verificado de lo desplegado.

## Fase H · Después (decisiones del propietario)

- Reactivar los rulesets `CODEOWNER` y `versiones`.
- Solo después, crear `DEPLOY_ENABLED=true` (y `RESTORE_ENABLED=true` si se quiere el restore por CI).
- Guardar la evidencia (`$C ps`, `verificar-redes.sh`, `smoke-test.sh`, respaldo) en `docs/evidencias/` y llenar
  S04 §5.2, S05 y S06 §7.2 en `docs/implantacion/`.

## Si algo falla

Como no hay versión anterior, la vuelta atrás es parar sin borrar datos: `$C down` (**sin** `-v`: los volúmenes se
conservan), corregir y repetir desde la fase que falló. `datos-base.sh` y `crear-owner.sql` no duplican nada al
repetirse. Borrar los volúmenes (`down -v`) solo con autorización explícita y si la base todavía no tiene datos
reales.

| Síntoma | Causa probable | Acción |
|---|---|---|
| Build cancelado o `Killed` | Memoria | Repetir un servicio a la vez; mirar `free -h` |
| Backend no llega a `healthy` | `.env` (URL de la base, contraseña) o migración | `$C logs backend`; no seguir a Caddy |
| Caddy sin certificado | 80/443 cerrados a Internet o DNS | Revisar el NSG (fase A3) y `dig`; no reintentar en bucle (límite de Let's Encrypt) |
| Registro falla con 500 | Faltan datos base | Fase E (`datos-base.sh`) |
| No llega el correo de verificación | Credenciales de Gmail | `rehnimarket-secretos` y `$C up -d backend` |

## Contradicción en la documentación del repo

`deploy/checklist-azure.md` §6 y `deploy/OWNER.md` §2 dicen que el backend crea los roles, el catálogo y las
transportadoras **al arrancar** (#53). El código actual solo lo hace con `RUN_SEED=true`; con `RUN_SEED=false` hay
que correr `scripts/datos-base.sh` (así lo dicen `deploy/README.md` §7 y el propio script). Este plan sigue al código.
Falta corregir esos dos documentos.
