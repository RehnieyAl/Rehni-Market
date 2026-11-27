# DevOps de RehniMarket: dependencias, CI, respaldo, despliegue y restore

Flujo completo:

```text
Dependabot → PR a develop → CI obligatorio → revisión y merge manual → PR develop → main → CI obligatorio
→ merge → «Deploy producción»: verifica el merge y el CI del commit final → aprobación del environment
→ respaldo versionado de lo desplegado → verificación → despliegue por SSH → health checks → registro
```

| Pieza | Archivo | Estado |
|---|---|---|
| Actualizaciones de dependencias | `.github/dependabot.yml` | Implementado; activa al llegar a `main` |
| CI obligatorio (también para Dependabot) | `.github/workflows/ci.yml` | Implementado |
| Despliegue automático | `.github/workflows/rehnimarket-deploy.yml` | Implementado, **bloqueado** (`DEPLOY_ENABLED`) |
| Restore manual | `.github/workflows/rehnimarket-restore.yml` | Implementado, **bloqueado** (`RESTORE_ENABLED`) |
| Respaldo versionado | `scripts/backup_rehnimarket.sh` (y `scripts/respaldar.sh`) | Implementado y probado en QA |
| Restore por ID / tag / SHA | `scripts/restore_rehnimarket.sh` | Implementado y probado en QA |
| Ejecutor de despliegue en el servidor | `scripts/deploy_rehnimarket.sh` | Implementado y probado en QA |
| Comando forzado de las llaves SSH | `scripts/ops/ssh-gate.sh` | Implementado y probado en QA |
| Simulación aislada (versiones A/B/C) | `scripts/ops/qa-simulacion.sh` | 30/30 casos (ver evidencias) |

Documentos relacionados: [dependabot-y-seguridad.md](dependabot-y-seguridad.md) (incluye el procedimiento de los
PR de seguridad que GitHub abre contra `main`), [servidor-ssh.md](servidor-ssh.md) (usuarios, llaves, sudoers e
instalación en Azure), [tailscale.md](tailscale.md) (red privada de CI), [primer-despliegue.md](primer-despliegue.md)
(primera instalación manual, datos base con `scripts/datos-base.sh` y owner), [contenedores.md](contenedores.md)
(administración de los contenedores por SSH), [evidencias-qa-2026-11-26.md](evidencias-qa-2026-11-26.md) y
[evidencias-tailscale-2026-11-27.md](evidencias-tailscale-2026-11-27.md).

## 1. CI obligatorio

`ci.yml` corre en todo `pull_request` (incluidos los de Dependabot) y en cada push a `main` y `develop`, con el
`GITHUB_TOKEN` de solo lectura y sin secretos. No usa `pull_request_target` ni `continue-on-error`.

| Check | Qué valida |
|---|---|
| `backend` | `uv sync --frozen --no-build`, ruff, `alembic upgrade head` sobre PostgreSQL de servicio, pytest con el umbral `fail_under` de `pyproject.toml` |
| `frontend` | `pnpm install --frozen-lockfile`, ESLint, `tsc`, Vitest con umbrales de cobertura, `pnpm build` |
| `mobile` | `pnpm install --frozen-lockfile`, `tsc --noEmit`, `expo lint` (la app aún no tiene pruebas en `main`) |
| `auditoria` | pip-audit sobre `uv.lock` y `pnpm audit --prod` (altas y críticas); excepciones con fecha en `.github/auditoria-excepciones.txt` |
| `dependencias` | `dependency-review-action`: vulnerabilidades altas/críticas nuevas y licencias GPL-3.0/AGPL-3.0 en lo que cambia el PR |
| `rama-origen` | Hacia `main` solo desde `develop` o `hotfix/*` del mismo repositorio |

Playwright: la suite E2E permanente aún no está integrada en el repositorio; cuando lo esté, se añade como job y
como check obligatorio. No se declara ningún resultado E2E en CI hasta entonces.

## 2. Respaldo versionado

```bash
sudo -u rehniops env OPS_ENV=/etc/rehnimarket/ops.env /usr/local/lib/rehnimarket/backup_rehnimarket.sh
```

Cada respaldo es un directorio `/var/backups/rehnimarket/<AAAAMMDDTHHMMSSZ>_<sha12>/` (modo 700) con:

| Archivo | Contenido |
|---|---|
| `postgres.dump` | `pg_dump -Fc` validado con `pg_restore -l` |
| `postgres.toc.txt` | Índice del dump (tablas con datos) |
| `minio.tar.gz` | Objetos del bucket `uploads` (`mc mirror`), contados y comprobados |
| `SHA256SUMS` | Checksums de los tres archivos |
| `manifest.json` (+ `.sha256`) | ID, fechas UTC, `git_tag`, `commit_sha` completo, árbol limpio, revisión de Alembic, `github_run_id`, tamaños, conteos y `estado` (`verificado` o `fallido`) |
| `backup.log` | Log de ese respaldo |

El respaldo es de la versión **desplegada en ese momento** (lee el `HEAD` de `/opt/rehnimarket`), nunca de la
candidata. Si algo falla, el manifiesto queda en `fallido` y el despliegue se cancela. **No borra respaldos**:
la limpieza es manual y decidida (no hay rotación automática). El `.env` y los certificados de Caddy no entran en
el respaldo: el `.env` lo custodia el propietario y los certificados se vuelven a emitir solos.

## 3. Despliegue

`rehnimarket-deploy.yml` se dispara con `workflow_run` cuando el CI termina bien sobre un push a `main`:

1. **verificar** (sin secretos): el commit es el `merge_commit_sha` de un PR fusionado desde `develop` (o
   `hotfix/*`) del mismo repositorio, sigue siendo la punta de `main` y los checks `backend`, `frontend`,
   `auditoria` y `mobile` están en verde sobre ese SHA.
2. **publicar** (environment `produccion`, aprobación del propietario): respaldo con la llave de backup →
   `verify-backup` → despliegue con la llave `deploy` → health checks públicos → resumen en el run.

El ejecutor del servidor (`deploy_rehnimarket.sh <sha> <backup_id> <run_id>`) vuelve a comprobar que el commit
pertenece a `origin/main`, que el árbol no tiene cambios, que el respaldo está verificado, íntegro, tiene menos de
120 minutos y es **de la versión desplegada**. Despliega con `git checkout --detach <sha>` y
`docker compose up -d --build --wait`, y comprueba `HEALTH_URLS`.

| Situación | Resultado | Código |
|---|---|---|
| Todo sano | `desplegado`, `version-actual.json` actualizado | 0 |
| Falla la salud y no hay migraciones nuevas | Vuelve al código anterior (`revertido`) | 2 |
| Falla la salud y hay migraciones nuevas | Rollback automático **bloqueado**; decisión manual de restore | 3 |
| Bajar a una versión anterior con migraciones de por medio | **Cancelado** (rollback incompatible) | 1 |
| Respaldo ausente, fallido, alterado, viejo o de otra versión | **Cancelado** | 1 |
| Otra operación en curso | Rechazado | 75 |

Los datos (PostgreSQL y MinIO) **nunca** se restauran automáticamente por un despliegue fallido.

Cada intento queda en `/var/log/rehnimarket/releases.jsonl` (fecha UTC, SHA y tag destino, SHA y tag anteriores,
respaldo previo, run, resultado, health checks) y en `auditoria.jsonl`.

## 4. Restore

```bash
restore_rehnimarket.sh --list                       # todos los respaldos (ID, fecha, tag, estado, SHA)
restore_rehnimarket.sh --find=v1.2.0                # por tag o por SHA
restore_rehnimarket.sh <ID> --dry-run               # valida manifiesto, checksums, dump y tar; no toca nada
restore_rehnimarket.sh <ID> --verify-only           # QA aislado: restaura en contenedores desechables
restore_rehnimarket.sh <ID> --confirm=<ID>          # producción: respaldo preventivo + restore
```

El restore real exige `--confirm` igual al ID, que el código desplegado sea el del respaldo (o
`--allow-version-mismatch` si se comprobó que la migración es compatible) y hace antes un respaldo preventivo del
estado actual; si ese respaldo falla, no restaura. PostgreSQL se restaura en una base temporal y se intercambia
(la anterior queda como `<base>_prev`). Por GitHub: workflow «Restore producción» (manual, environment
`produccion-restore`, llave propia).

## 5. PENDIENTE DE CONFIGURACIÓN MANUAL POR EL PROPIETARIO

Nada de esto se ha hecho; ninguna rama se declara protegida hasta verificarlo en GitHub.

1. **Seguridad de dependencias** (Settings → Code security): activar *Dependency graph* (público: ya activo),
   *Dependabot alerts* y *Dependabot security updates*. Las *version updates* se activan solas al fusionar
   `dependabot.yml` en `main`.
2. **Etiquetas** que usa Dependabot (las que no existan no se aplican):
   `gh label create backend; gh label create frontend; gh label create mobile; gh label create ci; gh label create security`
3. **Ruleset de ramas**: importar `docs/devops/rulesets/ramas-main-develop.json` (Settings → Rules → Rulesets →
   Import) y luego retirar el ruleset «CODEOWNER», que queda contenido en el nuevo. Añade: prohibir borrado de
   `main` y `develop`, y los checks `mobile`, `dependencias` y `rama-origen`. Sin actores con bypass, así tampoco
   el administrador se salta las reglas. Aprobaciones requeridas: 0, porque en un equipo de una persona GitHub no
   permite aprobar los PR propios; la revisión de los PR de Dependabot es el merge manual del propietario (Dependabot
   no fusiona y el auto-merge del repositorio está desactivado).
4. **Environments**: `produccion` ya existe con revisor obligatorio; restringirlo a la rama `main` y crear
   `produccion-restore` con el propietario como revisor obligatorio.
5. **Secretos** (de environment, nunca de repositorio, para que ningún PR los vea):
   `produccion`: `AZURE_SSH_HOST`, `AZURE_SSH_PORT`, `AZURE_SSH_KNOWN_HOSTS`, `AZURE_DEPLOY_SSH_KEY`,
   `AZURE_BACKUP_SSH_KEY`. `produccion-restore`: `AZURE_SSH_HOST`, `AZURE_SSH_PORT`, `AZURE_SSH_KNOWN_HOSTS`,
   `AZURE_RESTORE_SSH_KEY`.
6. **Servidor**: usuarios, llaves restringidas, sudoers, rutas y paso de `~/Rehni-Market` a `/opt/rehnimarket`
   según [servidor-ssh.md](servidor-ssh.md). Mientras las llaves sigan con `command="/usr/bin/true"`, ninguna
   orden se ejecuta.
7. **Activación**: variables de repositorio `DEPLOY_ENABLED=true` y `RESTORE_ENABLED=true` (y, si cambian,
   `PUBLIC_HEALTH_URLS`). Antes: un restore `verificar-qa` y una prueba real autorizada.
