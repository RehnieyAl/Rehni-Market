# Runbook — Salud en rojo

> Plan de implantación §8.5 y §9.2. Síntoma: un contenedor `unhealthy`, `/health/database`
> distinto de 200 o el monitor externo en rojo.

1. **Ver el estado**: `cd ~/Rehni-Market && docker compose ps`. Anotar qué servicio no está `healthy`.
2. **Leer los logs** del servicio: `docker compose logs --tail=200 <servicio>`.
3. **Según el servicio**:
   - `postgres` / `pgbouncer`: `docker compose exec postgres pg_isready`. Si no responde,
     `docker compose restart postgres pgbouncer` y revisar disco libre (`df -h`).
   - `minio`: un volumen creado por una imagen anterior da `file access denied`: aplicar el
     `chown 65532:65532` de la sección 5.2.
   - `backend`: si falla al arrancar por configuración, revisar los marcadores `CAMBIA` de los
     `.env` (§5.2) y `docker compose exec backend uv run alembic current`.
   - `frontend` (Caddy): `curl -I http://<dominio>/` debe dar `308`; si falla el certificado,
     revisar DNS (§4.3) y que los puertos 80/443 estén abiertos (§7.2).
4. **Si el fallo empezó con el último despliegue**: rollback con la tabla «Rollback» de la §5.2.
5. **Verificar**: `bash scripts/smoke-test.sh` contra la URL de producción (§5.2 paso 9).
6. **Registrar** en una incidencia de GitHub: hora de inicio y fin, causa, acción y si se
   cumplió el tiempo de la prioridad (§9.2).

Probado por: [PENDIENTE: rol de quien lo ejecuta en el simulacro o en una prueba].
