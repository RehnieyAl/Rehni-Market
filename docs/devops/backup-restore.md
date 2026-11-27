# Respaldo, restore, despliegue manual y rollback

Todo se ejecuta en el servidor con la cuenta `rehnimarket`, mediante el comando `rehnimarket`
([servidor-azure.md](servidor-azure.md)). El comando delega en `backup_rehnimarket.sh`, `restore_rehnimarket.sh` y
`deploy_rehnimarket.sh`, instalados en `/usr/local/lib/rehnimarket`.

> **Estado (2026-11-27).** Probado contra la pila local (scripts-operativos.md, «Validación»): `backup`, `list`,
> `info`, `verify` y `restore --qa`. El restore real y `deploy` no se probaron con el comando nuevo; los scripts
> que usan pasaron la simulación aislada de 30 casos ([evidencias-qa-2026-11-26.md](evidencias-qa-2026-11-26.md)).
> En el servidor todavía no existe ningún respaldo.

Un solo respaldo, restore o despliegue a la vez: los tres comparten el candado `/var/log/rehnimarket/operacion.lock`
y, si hay otra operación en curso, terminan con el código 75.

## 1. Crear un respaldo

```bash
sudo rehnimarket backup
```

- **Requisitos:** `postgres`, `minio` y `backend` en marcha. Espacio libre en la carpeta de respaldos de al menos el
  doble del tamaño de la base más 1 GiB (`MIN_FREE_MB`).
- **Qué hace:**
  1. Detiene el backend unos segundos para que el volcado sea coherente.
  2. Hace `pg_dump -Fc` de PostgreSQL y `mc mirror` del bucket `uploads` de MinIO.
  3. Vuelve a arrancar el backend.
  4. Verifica el dump con `pg_restore -l` y el número de objetos de MinIO.
  5. Escribe `SHA256SUMS` y `manifest.json`, con su propio `.sha256`.
- **Resultado esperado:** la última línea es `BACKUP_ID=<AAAAMMDDTHHMMSSZ>_<sha12>`. El respaldo queda en
  `/home/rehnimarket/backups/rehnimarket/<ID>/` (700, archivos 600).
- **Validación:** `sudo rehnimarket backup verify <ID>`.
- **Precauciones:**
  - El respaldo es de la versión **desplegada** (el `HEAD` de `/opt/rehnimarket`).
  - No borra respaldos anteriores: no hay rotación, así que hay que vigilar el disco con `status`.
  - El `.env` y los certificados de Caddy no entran en el respaldo. Las copias del `.env` están en
    `/home/rehnimarket/env-respaldos`.
  - Durante unos segundos después del respaldo, `status` puede dar la salud como fallida mientras el backend
    termina de arrancar.

Contenido de cada respaldo:

| Archivo | Contenido |
|---|---|
| `postgres.dump` y `postgres.toc.txt` | Volcado de PostgreSQL y su índice |
| `minio.tar.gz` | Objetos del bucket `uploads` |
| `SHA256SUMS` | Checksums de los tres archivos anteriores |
| `manifest.json` y `manifest.json.sha256` | ID, fechas UTC, commit, tag, revisión de Alembic, tamaños, conteos y `estado` (`verificado` o `fallido`) |
| `backup.log` | Log de ese respaldo |

## 2. Consultar respaldos

| Comando | Muestra |
|---|---|
| `sudo rehnimarket backup list` | ID, fecha, tag, estado, commit, tamaño y revisión de Alembic. Si el manifiesto no coincide con su checksum o con el nombre de la carpeta, el estado sale como `alterado` |
| `sudo rehnimarket backup info <ID>` | Metadatos del manifiesto (no contiene secretos) y tamaño en disco |
| `sudo rehnimarket backup verify <ID>` | Manifiesto, `SHA256SUMS`, dump legible y tar legible, sin restaurar nada |

## 3. Restaurar

Prueba sin tocar producción: restaura en contenedores desechables y comprueba tablas y objetos.

```bash
sudo rehnimarket restore <ID> --qa
```

Restore de producción. Solo con la autorización expresa del propietario y desde una terminal interactiva:

```bash
ssh -t rehni-prod sudo rehnimarket restore <ID>
```

1. Comprueba el ID, el manifiesto y los checksums (`backup info` y `verify`), y el espacio libre.
2. Avisa de que se **reemplazan** los datos de PostgreSQL y MinIO y de qué servicios se ven afectados.
3. Pide escribir el ID otra vez. Si no coincide, no restaura nada.
4. El script exige que el código desplegado sea el mismo commit del respaldo. Si es otro, se cancela: primero hay
   que desplegar ese commit (sección 4). No se ofrece `--allow-version-mismatch` desde el comando.
5. Antes de restaurar hace un **respaldo preventivo** del estado actual. Si ese respaldo falla, no restaura.
6. PostgreSQL se restaura en una base temporal y se intercambia; la anterior queda como `<base>_prev`.

Validación posterior: `sudo rehnimarket status`, `sudo rehnimarket logs --tail 50 backend`, inicio de sesión del
owner y la prueba de humo de `deploy/README.md` §8.

Runbook de incidente: [docs/runbooks/restaurar-respaldo.md](../runbooks/restaurar-respaldo.md).

## 4. Desplegar a mano

```bash
sudo rehnimarket deploy main          # o el SHA completo de un commit de origin/main
```

1. Hace `git fetch` y comprueba que el commit pertenece a `origin/main`.
2. Hace un **respaldo obligatorio** de la versión desplegada. Si no queda `verificado`, el despliegue se cancela.
3. Hace `git checkout --detach <sha>` y `up -d --build --wait`, y comprueba `HEALTH_URLS`.

| Situación | Resultado | Código |
|---|---|---|
| Todo sano | `desplegado` y `/var/log/rehnimarket/version-actual.json` actualizado | 0 |
| Falla la salud sin migraciones nuevas | Vuelve solo al código anterior (`revertido`) | 2 |
| Falla la salud con migraciones nuevas | Rollback automático **bloqueado**; hay que decidir un restore | 3 |
| Volver a una versión anterior con migraciones de por medio | Cancelado | 1 |
| Ni la versión nueva ni la anterior quedan sanas | `rollback_fallido`: intervención manual | 4 |
| Otra operación en curso | Rechazado | 75 |

Cada intento queda en `releases.jsonl` y en `auditoria.jsonl` con el commit, el tag, la versión anterior, el
respaldo previo, el resultado y los health checks. La revisión de Alembic de cada versión queda en el manifiesto de
su respaldo previo.

La **primera instalación** no usa `deploy`, porque no hay nada desplegado que respaldar: sigue la sección 4 de
[servidor-azure.md](servidor-azure.md).

## 5. Rollback

- **Código, sin migraciones de por medio:** `sudo rehnimarket deploy <sha-anterior>`. También pasa por el respaldo
  previo.
- **Con migraciones de por medio:** cambiar de commit no deshace el esquema y no se usa `alembic downgrade`. Se
  despliega el commit del respaldo elegido y se restaura ese respaldo (sección 3), con autorización.
- **Clasificación de las migraciones:** `docs/plan-implantacion.md` §5.2.
- Un despliegue fallido **nunca** restaura datos de forma automática.
