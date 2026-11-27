# DevOps de RehniMarket

Una sola cuenta administra el servidor (`rehnimarket`). Se despliega **a mano por SSH** con respaldo obligatorio.
GitHub Actions valida el código; no entra al servidor.

```text
commit en develop (CI) → PR develop → main (CI) → merge
         → en el servidor: sudo rehnimarket deploy main  (respaldo verificado → despliegue → health checks → registro)
```

| Documento | Contenido |
|---|---|
| [servidor-azure.md](servidor-azure.md) | Cuenta, directorios, permisos, comandos de Compose, instalación desde cero, recuperación del acceso y migración pendiente |
| [backup-restore.md](backup-restore.md) | Respaldo, consulta, restore, despliegue manual y rollback |
| [inicializacion-roles-owner.md](inicializacion-roles-owner.md) | Roles, datos base y owner, en ese orden |
| [scripts-operativos.md](scripts-operativos.md) | Inventario de scripts y resultados de validación |
| [dependabot-y-seguridad.md](dependabot-y-seguridad.md) | Dependabot y PR de seguridad contra `main` |
| [tailscale.md](tailscale.md) | Red privada que usan los workflows de despliegue (en revisión, sección 3) |
| [evidencias-qa-2026-11-26.md](evidencias-qa-2026-11-26.md), [evidencias-tailscale-2026-11-27.md](evidencias-tailscale-2026-11-27.md) | Evidencias históricas con fecha |

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

## 2. Ramas

`main` es producción y `develop`, integración: las dos son permanentes. Se trabaja y se hace commit directamente en
`develop` (`git push` normal, nunca force push), y a `main` solo se llega por PR `develop → main` (o `hotfix/*`).

| Ajuste | Valor |
|---|---|
| *Automatically delete head branches* (`delete_branch_on_merge`) | Desactivado: antes borraba `develop` en cada PR `develop → main` |
| Ruleset `ramas-main-develop` ([rulesets/ramas-main-develop.json](rulesets/ramas-main-develop.json)) | `main` y `develop`: no se pueden borrar ni recibir force push |
| Ruleset `main-pr-ci` (JSON abajo) | Solo `main`: PR obligatorio con **0 aprobaciones** (GitHub no deja aprobar los PR propios), conversaciones resueltas, merge o squash, y los checks `backend`, `frontend`, `auditoria`, `mobile`, `dependencias` y `rama-origen` en verde, sin exigir rama al día |

`develop` no exige PR a propósito: el desarrollador único hace push directo y el CI corre igual en cada push.
`dependencias` y `rama-origen` solo se ejecutan en `pull_request`, que es el único camino hacia `main`. Ningún
ruleset tiene actores con bypass. En una emergencia, el propietario puede desactivar `main-pr-ci` en
Settings → Rules y volver a activarlo después.

```json
{
  "name": "main-pr-ci",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "rules": [
    { "type": "pull_request", "parameters": { "required_approving_review_count": 0, "dismiss_stale_reviews_on_push": true,
      "require_code_owner_review": false, "require_last_push_approval": false, "required_review_thread_resolution": true,
      "allowed_merge_methods": ["merge", "squash"] } },
    { "type": "required_status_checks", "parameters": { "strict_required_status_checks_policy": false,
      "do_not_enforce_on_create": false, "required_status_checks": [
        { "context": "backend", "integration_id": 15368 }, { "context": "frontend", "integration_id": 15368 },
        { "context": "auditoria", "integration_id": 15368 }, { "context": "mobile", "integration_id": 15368 },
        { "context": "dependencias", "integration_id": 15368 }, { "context": "rama-origen", "integration_id": 15368 } ] } }
  ]
}
```

`integration_id` 15368 es GitHub Actions: el check solo cuenta si lo publica un workflow, no cualquier aplicación.

## 3. GitHub Actions

| Workflow | Función | Estado |
|---|---|---|
| `ci.yml` | CI obligatorio (sección 1) | Vigente |
| `sonarqube.yml` | Análisis de SonarCloud | Vigente |
| `rehnimarket-deploy.yml` | Despliegue por SSH con las cuentas `deploy` y `backup-restore` | Apagado (`DEPLOY_ENABLED` sin crear). **Incompatible** con la cuenta única |
| `rehnimarket-restore.yml` | Restore manual por SSH con `backup-restore` | Apagado (`RESTORE_ENABLED` sin crear). **Incompatible** |
| `rehnimarket-ssh-check.yml` | Prueba de conexión de las tres llaves | Manual. **Incompatible** |

Los tres últimos dependen de cuentas que se retiran y de `ssh-gate.sh`. Darles una llave en `rehnimarket`, que tiene
sudo sin contraseña y está en `docker`, daría a GitHub Actions control total del servidor; por eso no se migran.
Propuesta: eliminar los tres workflows, `scripts/ops/ssh-gate.sh`, los environments `produccion` y
`produccion-restore` con sus secretos `AZURE_*`, y las credenciales OIDC de Tailscale (o sacar el servidor de la
tailnet si no se usa para nada más). [PENDIENTE: autorización]
