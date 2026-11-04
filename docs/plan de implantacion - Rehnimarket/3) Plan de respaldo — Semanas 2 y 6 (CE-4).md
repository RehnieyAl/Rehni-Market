| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | Yeinher Algarin |
| Actualizado | 04/11/2026 (evidencia de restauración de la sección 3.5) |

---

## 3. Plan de respaldo (v0) — Semanas 2 y 6 (CE-4)

### 3.1 Qué se respalda

| Elemento | Ubicación | Método | ¿Contiene datos personales? |
|---|---|---|---|
| Base de datos PostgreSQL 17 | Contenedor `rehni-postgres`, base `rehnimarket` | `pg_dump -F c -Z 6` con `bash scripts/backup_rehnimarket.sh` | Sí |
| Archivos de MinIO (imágenes, logos, banners, certificados PDF) | Contenedor `rehni-minio`, bucket `uploads` | `mc mirror` + `.tar.gz` con `bash scripts/backup_rehnimarket.sh` (mismo `TS` que la base) | Sí |
| Configuración (`.env`, `.env.postgres`, `.env.minio`) | Raíz del proyecto y `RehniMarket-backend/` | Copia manual cifrada con GPG (propuesta, no implementada) | No (contiene credenciales) |

**Script.** El bootcamp pide `scripts/respaldar.sh`. En RehniMarket es un envoltorio de una línea que ejecuta `scripts/backup_rehnimarket.sh` con los mismos argumentos y variables (`exec bash .../backup_rehnimarket.sh "$@"`), sin lógica propia: `bash scripts/respaldar.sh` y `bash scripts/backup_rehnimarket.sh` son equivalentes. Comprobado el 04/11/2026: `bash scripts/respaldar.sh --no-stop` terminó con `=== FIN backup 2026-11-04_14-31 — OK ===` en 1 min 33 s, y el log no registra `deteniendo backend`, así que el argumento llegó al script original.

### 3.2 Objetivos

| RPO | RTO | Justificación (acordada con el cliente) |
|---|---|---|
| 24 horas | 1 hora (mismo servidor) / 4 horas (servidor nuevo) | Propuesta: con un respaldo diario se pierde como máximo el trabajo de un día; en un servidor nuevo se suma preparar el equipo, Docker y validar la aplicación. La restauración medida de la base tarda 1,0 s y la verificación completa 12,8 s (sección 3.5), muy por debajo del RTO. <!-- PENDIENTE: acuerdo del RPO/RTO con el cliente (acta o correo con fecha). --> |

### 3.3 Política

| Aspecto | Decisión |
|---|---|
| Tipo (completo / incremental / diferencial) | Completo |
| Frecuencia y hora | Diaria a las 02:00 UTC (propuesta; hoy se ejecuta a mano) <!-- PENDIENTE: programarlo con cron/systemd en el servidor (semana 6) --> |
| Retención | Los 7 respaldos más recientes (`KEEP_DAILY=7`, `scripts/backup_rehnimarket.sh:8`) |
| Copia 1 — ubicación y medio | Disco local del servidor, carpeta `backups/` del proyecto (excluida de Git en `.gitignore:4`) |
| Copia 2 — ubicación y medio | <!-- PENDIENTE: segundo medio distinto del disco del servidor (decisión del responsable). --> |
| Copia 3 (fuera del sitio) | <!-- PENDIENTE: destino externo; se transfiere con rsync/SFTP por llave (sección 4.6). --> |
| Cifrado | <!-- PENDIENTE: método de cifrado (propuesta: GPG) y custodia de la llave (semana 6). --> |
| Responsable (rol) | Responsable técnico del proyecto (Yeinher Algarin) |

### 3.4 Procedimiento de restauración

1. Detectar y decidir: `docker compose ps` y `curl -fsS http://localhost:8000/health/database`; el responsable técnico decide restaurar.
2. Contener: `docker compose stop frontend`
3. Elegir el respaldo: `ls -1t backups/postgres/*.dump`, luego `TS=<TS elegido>` y `(cd backups/postgres && sha256sum -c "rehni_market_postgres_${TS}.dump.sha256")` y `(cd backups/minio && sha256sum -c "rehni_market_minio_${TS}.tar.gz.sha256")`
4. Respaldar el estado actual: `bash scripts/backup_rehnimarket.sh`
5. Restaurar: `bash scripts/restore_rehnimarket.sh "$TS" --verify-only` y, si da `OK`, `bash scripts/restore_rehnimarket.sh "$TS"`
6. Verificar: `docker inspect -f '{{.State.Health.Status}}' rehni-backend` (esperado `healthy`) y `docker compose exec backend uv run alembic current`
7. Reabrir y comunicar: `docker compose start frontend` e informar a los usuarios del punto restaurado.
8. Registrar: anotar el `TS`, la salida del paso 5, la duración y la decisión sobre la base `rehnimarket_prev`.

### 3.5 Evidencia de restauración

Ejecutada el 04/11/2026 en el equipo de desarrollo (CachyOS, Docker 29.6.2), sobre la base del proyecto.

**1. Respaldo** (`bash scripts/backup_rehnimarket.sh`, extracto de `backups/backup.log`):

```
[2026-11-04 14:15:24 UTC] === INICIO backup 2026-11-04_14-15 ===
[2026-11-04 14:15:24 UTC] deteniendo backend para consistencia...
[2026-11-04 14:15:25 UTC] pg_dump -> .../backups/postgres/rehni_market_postgres_2026-11-04_14-15.dump
[2026-11-04 14:17:21 UTC] objetos respaldados: 4351
[2026-11-04 14:17:22 UTC] backend reanudado
[2026-11-04 14:17:22 UTC] === FIN backup 2026-11-04_14-15 — OK ===
bash scripts/backup_rehnimarket.sh  1,09s user 0,74s system 1% cpu 1:58,07 total
```

El backend estuvo detenido 1 min 58 s; casi todo el tiempo es la copia de MinIO (20,23 MiB, 4351 objetos, 01m52s).

**2. Restauración en una base aparte** (`rehnimarket_verif`, en el mismo contenedor de PostgreSQL, eliminada al terminar):

```bash
(cd backups/postgres && sha256sum -c rehni_market_postgres_2026-11-04_14-15.dump.sha256)
docker cp backups/postgres/rehni_market_postgres_2026-11-04_14-15.dump rehni-postgres:/tmp/verif.dump
docker exec rehni-postgres sh -c 'createdb -U "$POSTGRES_USER" rehnimarket_verif && \
  pg_restore -U "$POSTGRES_USER" -d rehnimarket_verif --no-owner /tmp/verif.dump'
# conteos: misma consulta en rehnimarket y en rehnimarket_verif
docker exec rehni-postgres sh -c 'dropdb -U "$POSTGRES_USER" rehnimarket_verif && rm /tmp/verif.dump'
```

Resultado: `La suma coincide`, `pg_restore exit=0`, duración de la restauración medida: **1,0 s**.

| Tabla | Filas en producción | Filas restauradas |
|---|---|---|
| `roles` | 4 | 4 |
| `users` | 26 | 26 |
| `company` | 20 | 20 |
| `products` | 865 | 865 |
| `product_variants` | 4100 | 4100 |
| `orders` | 5 | 5 |
| `order_items` | 5 | 5 |
| `wallets` | 3 | 3 |
| `wallet_transactions` | 10 | 10 |
| `alembic_version` | `c3e5a7f9d1b2` | `c3e5a7f9d1b2` |

**3. Verificación completa en entorno desechable** (`bash scripts/restore_rehnimarket.sh 2026-11-04_14-15 --verify-only`):

```
[2026-11-04 14:18:25 UTC] SHA-256 OK: rehni_market_postgres_2026-11-04_14-15.dump
[2026-11-04 14:18:25 UTC] SHA-256 OK: rehni_market_minio_2026-11-04_14-15.tar.gz
[2026-11-04 14:18:25 UTC] dump valido: 38 tablas con datos
[2026-11-04 14:18:26 UTC] objetos en el backup de MinIO: 4351
[2026-11-04 14:18:34 UTC] tablas restauradas: 38 | alembic_version: 1
[2026-11-04 14:18:37 UTC] objetos en el bucket: 4351 | del backup: 4351 | faltantes: 0
RESULTADO DEL RESTORE (2026-11-04_14-15)
  PostgreSQL : VERIFICADO (38 tablas, entorno desechable)
  MinIO      : VERIFICADO (4351 objetos, entorno desechable)
[2026-11-04 14:18:37 UTC] OK: restore completo.
bash scripts/restore_rehnimarket.sh 2026-11-04_14-15 --verify-only  0,92s user 0,54s system 11% cpu 12,764 total
```

**Corrección en el script.** El primer intento de `--verify-only` falló a los 4 s con `ERROR: PostgreSQL desechable no arranco`: durante `initdb`, la imagen de PostgreSQL levanta un servidor temporal solo por socket, `pg_isready` respondía OK y la segunda comprobación caía cuando ese servidor se reiniciaba. Se cambió la espera a TCP (`pg_isready -h 127.0.0.1`, `scripts/restore_rehnimarket.sh:167-174`) y la verificación pasó (salida de arriba).

La evidencia anterior (respaldo `2026-08-31_16-59`, «≈ 30 segundos») se reemplaza por esta, que tiene salida y duración medidas.

### 3.6 Calendario de pruebas

| Prueba | Frecuencia | Responsable |
|---|---|---|
| `sha256sum -c` del último respaldo | En cada respaldo | Responsable técnico |
| `bash scripts/restore_rehnimarket.sh <TS> --verify-only` | Mensual y tras cada migración de Alembic | Responsable técnico |

---
