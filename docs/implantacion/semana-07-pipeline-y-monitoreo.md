# Entregable S07 — Pipeline de Despliegue y Monitoreo

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | 1 persona (responsable técnico) |
| Autor | Yeinher Jose Algarin Cardozo, aprendiz ADSO, ficha 3171618 |
| Versión del software | 1.0.1 |
| Fecha | 2026-11-18 |
| Semana | 7 de 9 — CI/CD de despliegue y monitoreo (CE-1, CE-5) |
| Guía | Bootcamp de Implantación del SENA, semana 7: guía del proyecto de la semana, plantilla «Entregable S07» y rúbrica de evaluación (evidencia de Producto) |
| Sección del plan consolidado | §8 de [`docs/plan-implantacion.md`](../plan-implantacion.md) |
| Estado | Parcial: 19 `[PENDIENTE]` (CI completo; faltan `release.yml`, `desplegar.sh`, ambiente `produccion` y monitoreo externo) |

Resumen honesto: la **integración continua** está completa y protegida (CI en cada push y PR, checks
obligatorios en `main` y `develop`, un PR rechazado de verdad). La **entrega continua** no existe
todavía: la liberación es por etiqueta y release, pero la imagen se compila en la VM y el despliegue
es manual (§8.4). Tampoco hay monitoreo externo. Cada brecha queda como `[PENDIENTE]` con su plan;
este PR solo documenta.

---

## 8.1 Pipeline

```
push a main/develop, pull request ──► ci.yml ─┬─ backend   : uv sync → ruff → alembic upgrade head (BD vacía) → pytest --cov (fail_under 64)
                                              ├─ frontend  : pnpm install → eslint → tsc → vitest --coverage
                                              └─ auditoria : pip-audit (uv.lock) + pnpm audit --prod --audit-level=high
                                   └────────► sonarqube.yml: análisis de SonarCloud (Quality Gate)
   si falla backend o frontend ──► el ruleset bloquea el merge del PR

etiqueta vX.Y.Z + release en GitHub ──► (manual) en la VM: respaldo → git checkout vX.Y.Z → build → up --wait → humo   (§8.4)
```

| Workflow | Evento | Etapas | Resultado |
|---|---|---|---|
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | push a `main` y `develop`, todo pull request, `workflow_dispatch` | `backend`: lint → migraciones → pruebas con cobertura; `frontend`: lint → tipos → pruebas con cobertura; `auditoria`: dependencias vulnerables | Checks `backend`, `frontend` y `auditoria` |
| [`.github/workflows/sonarqube.yml`](../../.github/workflows/sonarqube.yml) | push a `main` y `develop`, pull request | Análisis estático | Quality Gate de SonarCloud |
| `release.yml` | — | No existe | [PENDIENTE: workflow que, con una etiqueta `vX.Y.Z` que esté en `main`, construya las dos imágenes con `APP_VERSION`, corra la prueba de humo contra el stack levantado en el runner, las publique en GHCR como `ghcr.io/rehnieyal/rehni-market-{backend,frontend}:X.Y.Z` y despliegue en la VM por SSH desde el ambiente `produccion`, con `workflow_dispatch` para volver a una versión sin reconstruir. Requiere que `docker-compose.yml` acepte `image: …:${APP_VERSION}`] |

Enlaces a los workflows en el repositorio: [`ci.yml`](../../.github/workflows/ci.yml),
[`sonarqube.yml`](../../.github/workflows/sonarqube.yml) y
[`dependabot.yml`](../../.github/dependabot.yml) (actualizaciones semanales que entran por PR y
pasan por el mismo CI).

Reglas de protección (consultadas con `gh api repos/RehnieyAl/Rehni-Market/rulesets/25681376` el 18/11/2026):

| Regla | Configuración |
|---|---|
| Ramas `main` y `develop` | Ruleset `CODEOWNER` (id 25681376), **activo**: pull request obligatorio, sin force-push (`non_fast_forward`), checks obligatorios `backend` y `frontend`. `auditoria` no es obligatorio y `strict_required_status_checks_policy=false` (no exige la rama al día). [PENDIENTE: agregar `auditoria` como check obligatorio y activar `strict` en el ruleset] |
| Ambiente `produccion` | No existe (`gh api repos/RehnieyAl/Rehni-Market/environments` devuelve 0 ambientes). [PENDIENTE: crearlo con revisor obligatorio (el responsable) y restringido a etiquetas `v*`, para los secretos de despliegue] |
| Etiquetas | Sin protección. [PENDIENTE: ruleset de etiquetas `v*`: solo el responsable las crea y no se borran ni mueven] |

## 8.2 Secretos y variables del pipeline

| Nombre | Tipo | Ámbito | Para qué | Quién lo rota |
|---|---|---|---|---|
| `SONAR_TOKEN` | Secreto | Repositorio | Análisis de SonarCloud (`sonarqube.yml`) | Responsable técnico (regenerar en SonarCloud) |
| `GITHUB_TOKEN` | Automático | Cada ejecución | Comentarios de SonarCloud en el PR | GitHub (vence al terminar el job) |
| Variables de CI del job `backend` | Valores ficticios en el propio `ci.yml` | Workflow | PostgreSQL de servicio del job (`rehni_test`) y `SECRET_KEY: ci-only-not-a-secret` | No son secretos |
| `VM_SSH_KEY`, `VM_HOST`, `VM_USER` | Secreto | Ambiente `produccion` | Despliegue por SSH desde `release.yml` | [PENDIENTE: no existen; se crean con el ambiente y con una llave propia del despliegue, distinta de la del administrador] |

Ningún workflow tiene un secreto escrito: `grep -n 'secrets\.' .github/workflows/*.yml` solo
muestra `secrets.GITHUB_TOKEN` y `secrets.SONAR_TOKEN`.

## 8.3 Evidencia de ejecución

| Evento | Enlace a la ejecución | Duración | Resultado |
|---|---|---|---|
| Pull request con regresión: [PR #67](https://github.com/RehnieyAl/Rehni-Market/pull/67), Dependabot sube `bcrypt` 3.2.2 → 5.0.0 | [run 44021492520](https://github.com/RehnieyAl/Rehni-Market/actions/runs/44021492520) (17/11/2026) | 4 min 23 s | **Rechazado**: job `backend` en rojo (`ValueError: password cannot be longer than 72 bytes`, passlib no es compatible con bcrypt 5; `Coverage failure: total of 45.90 is less than fail-under=64.00`). El ruleset bloqueó el merge y el PR se cerró sin integrar |
| CI en `main` tras liberar `v1.0.1` | [run 44023670196](https://github.com/RehnieyAl/Rehni-Market/actions/runs/44023670196) (commit `723f138`, 17/11/2026 05:22 UTC) | 6 min 15 s | Verde: `backend`, `frontend` y `auditoria` |
| CI en `main`, segunda ejecución seguida | [run 44103349861](https://github.com/RehnieyAl/Rehni-Market/actions/runs/44103349861) (commit `0c19dff`, 17/11/2026 14:27 UTC) | 8 min 44 s | Verde |
| CI en `develop` | [run 44167682455](https://github.com/RehnieyAl/Rehni-Market/actions/runs/44167682455) (commit `1022695`) | 8 min 14 s | Verde |
| Liberación `v1.0.1` | [release v1.0.1](https://github.com/RehnieyAl/Rehni-Market/releases/tag/v1.0.1) (etiqueta sobre `45ea99d`, 17/11/2026 05:19 UTC) | — | Release publicado; sin workflow de liberación, así que no hay ejecución que enlazar. [PENDIENTE: run de `release.yml` en verde] |
| Rollback a `v1.0.0` y vuelta a `v1.0.1` | Manual en la VM ([semana 4](semana-04-procedimiento-despliegue.md), §5.2, comando «c») | [PENDIENTE: duración medida] | [PENDIENTE: resultado del humo en cada paso] |

## 8.4 Procedimiento de despliegue y rollback

### En la nube

La nube es la misma VM de Azure (IaaS, [semana 4](semana-04-procedimiento-despliegue.md), §5.3),
así que el procedimiento es el del servidor.

1. Fusionar a `main` por PR con los checks en verde.
2. Actualizar [`CHANGELOG.md`](../../CHANGELOG.md) (con «Al actualizar»), crear la etiqueta `vX.Y.Z` y publicar el release.
3. En la VM, seguir «En el servidor».

### En el servidor

Hoy no hay `desplegar.sh`: el responsable ejecuta a mano, como `<usuario-admin>` (grupo `docker`,
sin `sudo`), los pasos de la tabla «Actualización» de la
[semana 4](semana-04-procedimiento-despliegue.md#actualización) desde `~/Rehni-Market`. Se entera
de una versión nueva por el release de GitHub. Resumen:

```bash
cd ~/Rehni-Market
bash scripts/respaldar.sh                                   # respaldo previo, anotar el TS
git fetch --tags
git diff --stat "$(git describe --tags)" vX.Y.Z -- RehniMarket-backend/alembic/versions   # migraciones nuevas
git checkout vX.Y.Z
docker compose build backend && docker compose build frontend && docker compose up -d --wait
curl -fsS https://apirehnimarket.duckdns.org/health/database && bash scripts/smoke-test.sh
# si falla: git checkout <anterior> y repetir build + up (rollback de la semana 4)
```

```
[PENDIENTE: scripts/desplegar.sh (adaptado del `desplegar.sh` de la app de referencia del Bootcamp de Implantación del SENA, semana 7) que haga respaldo, cambio de versión, espera de salud, prueba de humo y rollback automático a la versión anterior si algo falla, y que escriba ~/Rehni-Market/despliegues.log. Pegar aquí el log de un despliegue exitoso y de uno detenido a propósito (p. ej. con una etiqueta inexistente o un .env con un CAMBIAR_*)]
```

### Migraciones compatibles hacia atrás

Regla del equipo: no se usa `alembic downgrade`. Cada migración se clasifica antes de liberar
([semana 4](semana-04-procedimiento-despliegue.md), §5.2, «Clasificación de migraciones»): las que
agregan (tablas, columnas que aceptan nulos o tienen valor por defecto, índices) se pueden
desplegar y revertir sin restaurar; las que borran o renombran se hacen en dos versiones (expandir
y contraer) o se liberan como MAJOR, con restauración del respaldo como rollback.

¿Alguna migración existente impide el rollback? Sí: `d4e5f6a7b8c9` (borra columnas de
`advertisements`) impide volver a versiones anteriores a ella sin restaurar, y `a7c4e1f9b2d8`
(valor nuevo del enum `NEEDS_UPDATE`) lo impide si alguna empresa queda en ese estado. Entre
`v1.0.0` y `v1.0.1` no hay migraciones.

## 8.5 Monitoreo

| Monitor | Tipo | Objetivo | Intervalo | Reintentos | Qué hace quien recibe la alerta |
|---|---|---|---|---|---|
| Salud de contenedores | Healthcheck de Docker (interno) | Los cinco servicios ([semana 5](semana-05-configuracion-y-verificacion.md), §6.2) | El del compose | El del compose; `restart: unless-stopped` | `docker compose ps` y `docker compose logs <servicio>`; runbook [`salud-en-rojo.md`](../runbooks/salud-en-rojo.md) |
| Backend fuera de rotación | Health check activo de Caddy (interno) | `/health/database` cada 5 s ([`caddy/Caddyfile`](../../caddy/Caddyfile)) | 5 s | Reintenta la petición hasta 30 s (`lb_try_duration`) | Igual |
| Salud externa | HTTP | `https://apirehnimarket.duckdns.org/health/database` | [PENDIENTE: 60 s] | [PENDIENTE: 2] | Runbook [`salud-en-rojo.md`](../runbooks/salud-en-rojo.md); si coincide con un despliegue, volver a la versión anterior |
| Web | HTTP con palabra clave | `https://rehnimarket.duckdns.org/` | [PENDIENTE: 60 s] | [PENDIENTE: 2] | Revisar `docker compose logs frontend` y el certificado |
| Versión | HTTP | [PENDIENTE: no hay endpoint de versión; agregar `GET /health/version` que devuelva `APP_VERSION`] | — | — | Comparar con la última etiqueta liberada |
| Respaldo diario | Push (latido) | Al final de `respaldar.sh`, `curl` a la URL push del monitor | [PENDIENTE: 25 h] | 0 | Runbook [`restaurar-respaldo.md`](../runbooks/restaurar-respaldo.md): revisar `backups/cron.log` y ejecutar el respaldo a mano |

| Campo | Valor |
|---|---|
| Dónde corre Uptime Kuma | [PENDIENTE: fuera de la VM que vigila, p. ej. `docker run -d -p 3001:3001 -v uptime-kuma:/app/data louislam/uptime-kuma:1` en el equipo del responsable] |
| Canal de alertas y quién lo lee | [PENDIENTE: correo del responsable técnico (o Telegram), configurado en Uptime Kuma; la URL del canal es secreta] |
| Horario de atención de alertas | El de soporte: lunes a viernes de 08:00 a 17:00 (plan §9.2) |

Evidencia de una alerta y su recuperación (captura o texto):

```
[PENDIENTE: alerta real del monitor de salud (p. ej. `docker compose stop backend` en una ventana avisada) y su recuperación, con hora de caída, hora de alerta y hora de recuperación]
```
