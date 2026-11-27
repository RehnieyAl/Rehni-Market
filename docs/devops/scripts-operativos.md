# Scripts operativos: inventario y validación

## Inventario

| Script | Función | Lo usan | Estado |
|---|---|---|---|
| `scripts/ops/rehnimarket` | Comando administrativo del servidor (`/usr/local/bin/rehnimarket`) | Administrador | Nuevo: probado en local, sin instalar |
| `scripts/ops/crear_owner.py` | Crea el owner con el hash del backend | `rehnimarket init owner` | Nuevo: probado en base temporal |
| `scripts/backup_rehnimarket.sh` | Respaldo versionado con manifiesto y checksums | `rehnimarket backup` y `deploy`, `respaldar.sh` | Vigente. Ruta por defecto: `/home/rehnimarket/backups/rehnimarket` |
| `scripts/restore_rehnimarket.sh` | Listado, verificación, QA aislado y restore | `rehnimarket backup list/verify` y `restore` | Vigente. El listado ahora muestra tamaño y Alembic |
| `scripts/deploy_rehnimarket.sh` | Despliegue con respaldo previo y rollback de código | `rehnimarket deploy` | Vigente |
| `scripts/respaldar.sh` | Envoltorio de `backup_rehnimarket.sh` | Entregable de la semana 2 de implantación | Vigente (lo exige el referente) |
| `scripts/datos-base.sh` | Roles, catálogo y transportadoras | `rehnimarket init base`, desarrollo | Vigente |
| `deploy/sql/crear-roles.sql` | Solo los 4 roles | `rehnimarket init roles` | Vigente |
| `deploy/sql/crear-owner.sql` | Owner por SQL, incluida la conversión de una cuenta registrada | `deploy/OWNER.md` | Vigente (alternativa) |
| `scripts/smoke-test.sh`, `acceptance_smoke.sh`, `perf_test.sh`, `verificar-redes.sh`, `verificar-requisitos.sh` | Pruebas de humo, aceptación, carga, redes y requisitos | Entregables S04-S07, aceptación y Manual Técnico | Vigentes |
| `scripts/migracion/` | Migración de datos (semana 2) | CI, plan de implantación | Vigente |
| `scripts/ops/qa-simulacion.sh` | Simulación aislada de backup, restore, deploy y compuerta | Evidencias QA 2026-11-26 | Vigente; los casos de la compuerta se retiran junto con ella |
| `scripts/ops/ssh-gate.sh` | Comando forzado de las llaves de GitHub Actions (cuentas `deploy` y `backup-restore`) | Workflows deploy, restore y ssh-check | **Obsoleto** tras la migración. Se elimina junto con esos workflows, con autorización |

No hay servicios systemd propios. El único cron es la línea rota del crontab de `rehnimarket`
(`cd $HOME/Rehni-Market && bash scripts/respaldar.sh`, una ruta que no existe). Se retira en la migración
([servidor-azure.md](servidor-azure.md) §6).

El entregable S06 del bootcamp de implantación pide un respaldo programado con cron. Si se mantiene, el reemplazo
mínimo es esta línea en el crontab de `rehnimarket`, que reutiliza el mismo comando:
`0 8 * * * /usr/local/bin/rehnimarket backup >> /var/log/rehnimarket/cron.log 2>&1`.
[PENDIENTE: decisión del propietario]

## Validación

2026-11-27, comando ejecutado contra la pila local de desarrollo (proyecto `rehni-market`) con respaldos en una
carpeta temporal:

| Prueba | Resultado |
|---|---|
| `bash -n` de todos los scripts y `py_compile` de `crear_owner.py` | OK |
| `shellcheck -S warning` (imagen `koalaman/shellcheck:stable`) | 0 avisos; 2 SC2016 informativos, intencionados: las variables se expanden dentro del contenedor |
| `status`, `ps`, `logs --tail 3 backend` | OK |
| `logs noexiste`, orden desconocida, `backup info ../../etc` | Rechazados con mensaje claro |
| `exec <servicio> sh -c …` en los 5 servicios | `sh` disponible en todos |
| `backup` | `VERIFICADO (43 tablas, 4352 objetos)` en 15 s; el backend volvió a `healthy` |
| `backup list`, `info` y `verify` | OK. Una copia renombrada sale `alterado` y `info` la rechaza |
| `restore <ID> --qa` | PostgreSQL y MinIO verificados en contenedores desechables, que se eliminan al terminar |
| `restore` e `init owner` sin terminal | Rechazados (`pide confirmación`) |
| `init roles` repetido | 4 roles, sin duplicados |
| `qa-simulacion.sh` con los scripts modificados | 30/30: respaldo, despliegue, rollback, restore real en contenedores desechables, compuerta, candados y ausencia de secretos en logs |
| `crear_owner.py` en base temporal | Rechaza sin rol owner (2), clave débil (1), teléfono inválido (1) y segundo owner (3); crea el owner con `is_owner = t` y hash bcrypt `$2b$` que `verify_password` acepta |

No probado con el comando `rehnimarket`: restore real y `deploy` (sus scripts sí, en la simulación), `start --build`
e `init owner` interactivo completo. Todo en el servidor queda pendiente de la migración.
