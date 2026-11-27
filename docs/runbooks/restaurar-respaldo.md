# Runbook — Restaurar el respaldo

> Resumen operativo de `docs/plan-implantacion.md` §3.4 y de `docs/mantenimiento/backup-restore.md` §2. Síntoma: pérdida o
> corrupción de datos, o un rollback con migración no compatible (§5.2).

1. Decidir: `sudo rehnimarket status` (contenedores y `/health/database`). El responsable técnico decide si se
   restaura.
2. Contener: `sudo rehnimarket stop frontend`.
3. Elegir el respaldo: `sudo rehnimarket backup list` y `sudo rehnimarket backup info <ID>`. El estado debe ser
   `verificado` y el commit, el desplegado; si es otro, primero `sudo rehnimarket deploy <sha-del-respaldo>`.
4. Probar sin tocar producción: `sudo rehnimarket restore <ID> --qa` debe terminar con `OK: restore completo`.
5. Restaurar: `ssh -t rehni-prod sudo rehnimarket restore <ID>` y escribir el ID para confirmar. Antes hace un
   respaldo preventivo del estado actual.
6. Comprobar: `sudo rehnimarket status` (todo `healthy`, salud OK) y
   `sudo rehnimarket exec backend uv run --no-sync alembic current`.
7. Reabrir: `sudo rehnimarket start` y avisar a los usuarios del punto restaurado.
8. Registrar el ID, la salida del paso 5 y la duración, y compararla con el RTO de 4 h.

Probado por: responsable técnico el 04/11/2026 con los scripts directos (§3.5, verificación completa en 12,8 s);
[PENDIENTE: prueba con el comando `rehnimarket` en el servidor]; [PENDIENTE: tercero en el simulacro].
