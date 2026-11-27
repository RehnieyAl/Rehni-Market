# Evidencias QA: respaldo, despliegue, rollback y restore (simulación aislada)

Fecha de ejecución: 2026-11-27 02:20 UTC (2026-11-26, hora de Bogotá). Equipo local, sin acceso a Azure ni a
GitHub Actions. Docker 29.9.2, Compose 5.7.0, git 2.56.0, jq 1.8.2.

```bash
bash scripts/ops/qa-simulacion.sh /ruta/de/trabajo   # termina con código 0 solo si todos los casos pasan
```

## Entorno

- PostgreSQL `postgres:17-alpine` y MinIO (la misma imagen fijada por digest en `docker-compose.yml`) en
  contenedores desechables `rehni-sim-*`, con datos de prueba (tabla `alembic_version` = `a1`, 2 pedidos, 2
  objetos en `uploads`). La base de desarrollo y producción no se tocan.
- Repositorio Git temporal (origen *bare* + clon que hace de `/opt/rehnimarket`) con tags `vA`, `vB`, `vC`, una
  versión B sin salud y una versión C con migración y sin salud. La «aplicación» es un servidor HTTP con
  `/health` y `/version`, levantado con `docker compose up --wait`.
- Los scripts reales (`backup_rehnimarket.sh`, `restore_rehnimarket.sh`, `deploy_rehnimarket.sh`,
  `ops/ssh-gate.sh`) con rutas temporales (`BACKUP_DIR`, `LOG_DIR`) y `RUNNER` vacío (sin sudo).
- Al terminar, los contenedores se eliminan (comprobado: ninguno queda en `docker ps -a`).

## Resultados: 30 de 30

| # | Caso | Resultado |
|---|---|---|
| 1 | Respaldo de A antes de publicar B: fecha UTC, tag `vA`, SHA completo, run, checksums | OK |
| 2 | El manifiesto registra la revisión de Alembic (`a1`) | OK |
| 3 | Respaldo fallido (PostgreSQL detenido) termina con error y manifiesto `fallido` | OK (código 1) |
| 4 | Ese respaldo fallido bloquea el despliegue | OK (código 1, HEAD sigue en A) |
| 5 | El registro del intento indica la causa («no está verificado») | OK |
| 6 | Respaldo con un archivo alterado: `restore --dry-run` lo rechaza («SHA256SUMS no coincide») | OK (código 1) |
| 7 | Respaldo alterado: el despliegue se cancela («los checksums… no coinciden») | OK (código 1) |
| 8 | Respaldo copiado con otro nombre: el restore lo rechaza («manifiesto de otro respaldo») | OK (código 1) |
| 9 | Respaldo copiado con otro nombre: el despliegue se cancela | OK (código 1) |
| 10 | `--list` marca la copia como `alterado` y `--find=vA` encuentra el original | OK |
| 11 | `--find` sin coincidencias termina con error | OK (código 1) |
| 12 | Despliegue exitoso de B con el respaldo de A | OK (código 0, `/version` = B) |
| 13 | Respaldo que no es de la versión desplegada se rechaza | OK (código 1) |
| 14 | Health check fallido sin migraciones → rollback automático a B | OK (código 2, HEAD vuelve a B) |
| 15 | Rollback manual B → A (sin migraciones entre ambas) permitido | OK (código 0) |
| 16 | Despliegue de C, que trae una migración | OK (código 0) |
| 17 | Fallo de salud con migración nueva → rollback automático bloqueado | OK (código 3) |
| 18 | Rollback incompatible C → A (hay migración de por medio) bloqueado | OK (código 1, HEAD sigue en C) |
| 19 | Restore por ID en QA aislado (contenedores desechables): PostgreSQL y MinIO verificados | OK |
| 20 | Restore real sin `--confirm` rechazado | OK (código 1) |
| 21 | Restore real con el código desplegado de otra versión rechazado | OK (código 1) |
| 22 | Compuerta SSH: confirmación distinta del ID denegada | OK (código 126) |
| 23 | Compuerta SSH: la llave de backup no puede restaurar | OK (código 126) |
| 24 | Compuerta SSH: orden arbitraria (`bash -i`) denegada | OK (código 126) |
| 25 | Compuerta SSH: inyección en argumentos (`;id`) denegada | OK (código 126) |
| 26 | Restore autorizado por la compuerta: respaldo preventivo y datos de vuelta (2 pedidos) | OK |
| 27 | Respaldo concurrente bloqueado por el candado | OK (código 75) |
| 28 | Despliegue concurrente bloqueado por el candado | OK (código 75) |
| 29 | Logs de éxito y de error en `auditoria.jsonl`, `releases.jsonl`, `backup.log`, `deploy.log` | OK |
| 30 | Ningún secreto (contraseñas de prueba) en logs ni manifiestos | OK |

Revisado a mano en la misma ejecución: `version-actual.json` registra el SHA, el tag (`vC`), la fecha UTC, el
respaldo previo y el run del último despliegue exitoso; cada intento de `releases.jsonl` lleva su motivo.

Defectos encontrados y corregidos durante la simulación (no habrían aparecido sin ejecutarla):

- El tar de MinIO guardaba el directorio raíz con modo 700 y MinIO (usuario sin privilegios) no veía los objetos
  restaurados. Se normalizan los permisos al crear y al restaurar.
- La consulta de la revisión de Alembic usaba `","` (un identificador en SQL) y el manifiesto la dejaba vacía.
- Un respaldo `fallido` se rechazaba por «checksums», no por su estado. Ahora el estado se comprueba primero.
- `--list` mostraba el `id` escrito en el manifiesto, así que una copia renombrada se hacía pasar por otro
  respaldo. Ahora el ID es el nombre del directorio, y el restore y el despliegue exigen que coincidan.
- Faltaba bloquear el retroceso a una versión anterior con migraciones de por medio.

## CI (equipo local, sobre el código de `main`)

| Comprobación | Resultado |
|---|---|
| `actionlint` (incluye shellcheck de los `run`) sobre los 4 workflows | Sin errores |
| `shellcheck -S warning` de los 5 scripts nuevos o modificados | Sin advertencias |
| Web: ESLint, `tsc`, Vitest con cobertura (184 pruebas), `pnpm build` | Todo en verde |
| Mobile: `pnpm install --frozen-lockfile`, `tsc --noEmit`, `expo lint` | Todo en verde |
| PR de dependencias con `package.json` desincronizado del lockfile | `pnpm install --frozen-lockfile` falla (código 1): el CI lo bloquea |
| Lógica de `rama-origen` con 6 combinaciones (develop, hotfix, Dependabot y feature hacia main, fork, Dependabot hacia develop) | Las 6 dan lo esperado |

## Lo que esta simulación NO prueba

- La conexión SSH real, las llaves, `authorized_keys`, sudoers y el usuario `rehniops` en Azure
  (`[PENDIENTE: configuración del propietario y prueba en el servidor]`).
- La ejecución de `rehnimarket-deploy.yml` y `rehnimarket-restore.yml` en GitHub Actions: solo se validó su
  sintaxis (`[PENDIENTE: primer run real tras activar DEPLOY_ENABLED / RESTORE_ENABLED]`).
- La pila completa de RehniMarket (backend, PgBouncer, Caddy, migraciones Alembic reales) dentro del despliegue: la
  aplicación de la simulación es un servidor HTTP mínimo.
- Los PR reales de Dependabot contra `develop`: `dependabot.yml` solo se activa al llegar a `main`
  (`[PENDIENTE: primer PR de Dependabot y su CI]`).
- Pruebas E2E con Playwright: no hay suite permanente en el repositorio.
