# Runbook — Restaurar el respaldo

> Resumen operativo de `docs/plan-implantacion.md` §3.4. Síntoma: pérdida o corrupción de datos,
> o un rollback con migración no compatible (§5.2).

1. Decidir: `docker compose ps` y `curl -fsS http://localhost:8000/health/database`; el
   responsable técnico decide restaurar.
2. Contener: `docker compose stop frontend`.
3. Elegir el respaldo: `ls -1t backups/postgres/*.dump`, `TS=<TS>` y comprobar las huellas
   (`sha256sum -c` de la base y de MinIO, §3.4 paso 3).
4. Respaldar el estado actual: `bash scripts/backup_rehnimarket.sh`.
5. Verificar y restaurar: `bash scripts/restore_rehnimarket.sh "$TS" --verify-only`; si da `OK`,
   `bash scripts/restore_rehnimarket.sh "$TS"`.
6. Comprobar: `docker inspect -f '{{.State.Health.Status}}' rehni-backend` = `healthy` y
   `docker compose exec backend uv run alembic current`.
7. Reabrir: `docker compose start frontend` y avisar a los usuarios del punto restaurado.
8. Registrar `TS`, salida del paso 5 y duración; comparar con el RTO de 4 h.

Probado por: responsable técnico el 04/11/2026 (§3.5, verificación completa en 12,8 s);
[PENDIENTE: tercero en el simulacro].
