# Respaldo, restore, actualización y rollback

Los respaldos y restores se hacen **a mano**: ningún workflow entra al servidor. En Azure se usa el comando
`rehnimarket` ([../instalacion/instalacion-servidor.md](../instalacion/instalacion-servidor.md) §2). En local, los
mismos scripts se ejecutan directamente.

| Operación | Azure | Linux local |
|---|---|---|
| Crear un respaldo | `sudo rehnimarket backup` | `bash scripts/respaldar.sh` |
| Listar | `sudo rehnimarket backup list` | `bash scripts/restore_rehnimarket.sh --list` |
| Ver la información | `sudo rehnimarket backup info <ID>` | `jq . <carpeta>/<ID>/manifest.json` |
| Verificar la integridad | `sudo rehnimarket backup verify <ID>` | `bash scripts/restore_rehnimarket.sh <ID> --dry-run` |
| Probar un restore sin tocar datos | `sudo rehnimarket restore <ID> --qa` | `bash scripts/restore_rehnimarket.sh <ID> --verify-only` |
| Restaurar | `ssh -t rehni-prod sudo rehnimarket restore <ID>` | `bash scripts/restore_rehnimarket.sh <ID> --confirm=<ID>` |

Los respaldos quedan en `/home/rehnimarket/backups/rehnimarket` (modo 700), que es el valor por defecto de los
scripts. En local, conviene indicar otra carpeta con `BACKUP_DIR=…` y `LOG_DIR=…`. Respaldos, restores y
despliegues comparten un candado (`operacion.lock`): si ya hay otra operación en curso, terminan con el código 75.

## 1. Crear un respaldo

- **Requisitos:** `postgres`, `minio` y `backend` en marcha. Espacio libre de al menos el doble del tamaño de la base
  más 1 GiB.
- **Qué hace:**
  1. Detiene el backend unos segundos para que el volcado sea coherente.
  2. Hace `pg_dump -Fc` de PostgreSQL y una copia del bucket `uploads` de MinIO.
  3. Vuelve a arrancar el backend.
  4. Verifica el dump con `pg_restore -l` y el número de objetos.
  5. Escribe `SHA256SUMS` y `manifest.json`, con su propio `.sha256`.
- **Resultado:** la última línea es `BACKUP_ID=<AAAAMMDDTHHMMSSZ>_<sha12>`.
- **Contenido del manifiesto:** fechas UTC, commit y tag desplegados, revisión de Alembic, tamaños, conteos y
  `estado` (`verificado` o `fallido`).
- **Lo que no se respalda:** el `.env` y los certificados de Caddy. Las copias del `.env` están en
  `/home/rehnimarket/env-respaldos`.
- **Retención:** ningún respaldo se borra automáticamente. Hay que vigilar el disco con `sudo rehnimarket status`.

Durante unos segundos después del respaldo, `status` puede dar la salud como fallida mientras el backend termina de
arrancar.

## 2. Restaurar

Solo con autorización expresa. Antes de reemplazar datos, el restore:

1. comprueba el manifiesto, `SHA256SUMS`, el dump y el tar, además del espacio libre;
2. muestra la información del respaldo y avisa de que **se reemplazan** los datos de PostgreSQL y MinIO;
3. pide escribir el ID otra vez y, si no coincide, no restaura nada;
4. exige que el código desplegado sea el mismo commit del respaldo (si no lo es, primero hay que desplegar ese
   commit, sección 3);
5. hace un **respaldo preventivo** del estado actual y, si ese respaldo falla, no restaura.

PostgreSQL se restaura en una base temporal y se intercambia; la anterior queda como `<base>_prev`. Después:
`sudo rehnimarket status`, inicio de sesión del owner y la prueba de humo
([../instalacion/instalacion-servidor.md](../instalacion/instalacion-servidor.md) §3). Runbook de incidente:
[../runbooks/restaurar-respaldo.md](../runbooks/restaurar-respaldo.md).

## 3. Actualizar y volver atrás

```bash
sudo rehnimarket deploy main            # o el SHA completo de un commit de origin/main
```

`deploy_rehnimarket.sh` hace estos pasos:

1. comprueba que el commit pertenece a `origin/main`;
2. hace un **respaldo obligatorio** de la versión desplegada, y cancela el despliegue si no queda `verificado`;
3. cambia de commit y ejecuta `up -d --build --wait`;
4. comprueba la salud.

| Situación | Resultado | Código |
|---|---|---|
| Todo sano | `desplegado` | 0 |
| Falla la salud sin migraciones nuevas | Vuelve solo al código anterior | 2 |
| Falla la salud con migraciones nuevas | Rollback automático bloqueado: hay que decidir un restore | 3 |
| Volver a una versión anterior con migraciones de por medio | Cancelado | 1 |
| Ni la versión nueva ni la anterior quedan sanas | Intervención manual | 4 |

- **Rollback de código, sin migraciones de por medio:** `sudo rehnimarket deploy <sha-anterior>`.
- **Con migraciones de por medio:** se despliega el commit del respaldo elegido y se restaura ese respaldo. No se usa
  `alembic downgrade`.
- Un despliegue fallido **nunca** restaura datos de forma automática.
- **Registro:** cada intento queda en `/var/log/rehnimarket/releases.jsonl` y en `auditoria.jsonl`.

## 4. Respaldo programado

[PENDIENTE: activar solo después de comprobar en Azure `backup`, `backup verify` y `restore --qa`.] Sustituye a la
línea rota del crontab de `rehnimarket` y se instala con `crontab -e` como `rehnimarket`:

```text
0 8 * * * /usr/local/bin/rehnimarket backup >> /var/log/rehnimarket/cron.log 2>&1
```

## 5. Errores frecuentes

| Mensaje | Causa |
|---|---|
| `el servicio X no está en marcha` | `sudo rehnimarket start` |
| `espacio insuficiente para un respaldo seguro` | Liberar disco o mover respaldos antiguos fuera del servidor (decisión manual) |
| `hay otra operación … en curso` (código 75) | Esperar a que termine el respaldo, restore o despliegue en curso |
| Estado `alterado` en `backup list` | El manifiesto no coincide con su checksum o con el nombre de la carpeta: no usar ese respaldo |
| `el código desplegado (…) no es el del respaldo` | `sudo rehnimarket deploy <sha-del-respaldo>` antes de restaurar |
| `restore pide confirmación` | Ejecutarlo con `ssh -t`, en una terminal interactiva |

## 6. Validación

[Evidencia de la simulación aislada del 2026-11-26](../evidencias/simulacion-respaldo-restore-2026-11-26.md).
`bash scripts/ops/qa-simulacion.sh` la repite con contenedores desechables de PostgreSQL y MinIO, sin tocar la base
de desarrollo ni producción: respaldo, despliegue, rollback, restore, candados y ausencia de secretos en los logs.
