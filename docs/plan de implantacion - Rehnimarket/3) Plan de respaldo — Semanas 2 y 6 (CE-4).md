### 3. Plan de respaldo (v0)

### 3.1 Qué se respalda

| Elemento | Ubicación | Método | ¿Contiene datos personales? |
|---|---|---|---|
| Base de datos PostgreSQL 17 | Contenedor `rehni-postgres`, base `rehnimarket` | `pg_dump -F c -Z 6` con `bash scripts/backup_rehnimarket.sh` | Sí |
| Archivos de MinIO (imágenes, logos, banners, certificados PDF) | Contenedor `rehni-minio`, bucket `uploads` | `mc mirror` + `.tar.gz` con `bash scripts/backup_rehnimarket.sh` (mismo `TS` que la base) | Sí |
| Configuración (`.env`, `.env.postgres`, `.env.minio`) | Raíz del proyecto y `RehniMarket-backend/` | Copia manual cifrada con GPG (propuesta, no implementada) | No (contiene credenciales) |

### 3.2 Objetivos

| RPO | RTO | Justificación (acordada con el cliente) |
|---|---|---|
| 24 horas | 1 hora (mismo servidor) / 4 horas (servidor nuevo) | Propuesta pendiente de acordar con el cliente: con un respaldo diario se pierde como máximo el trabajo de un día; en un servidor nuevo se suma preparar el equipo, Docker y validar la aplicación |

### 3.3 Política

| Aspecto | Decisión |
|---|---|
| Tipo (completo / incremental / diferencial) | Completo |
| Frecuencia y hora | Diaria a las 02:00 UTC (propuesta; hoy se ejecuta a mano) |
| Retención | Los 7 respaldos más recientes (`KEEP_DAILY=7`) |
| Copia 1 — ubicación y medio | Disco local del servidor (SSD NVMe), carpeta `backups/` del proyecto |
| Copia 2 — ubicación y medio | Pendiente (no implementada) |
| Copia 3 (fuera del sitio) | Pendiente (no implementada) |
| Cifrado | Pendiente (propuesta: GPG) |
| Responsable (rol) | Responsable técnico del proyecto (Yeinher Algarin) |

### 3.4 Procedimiento de restauración

<!-- 📝 Instrucción: los 8 pasos de la teoría 04, con comandos exactos y copiables. -->

1. Detectar y decidir: `docker compose ps` y `curl -fsS http://localhost:8000/health/database`; el responsable técnico decide restaurar.
2. Contener: `docker compose stop frontend`
3. Elegir el respaldo: `ls -1t backups/postgres/*.dump`, luego `TS=<TS elegido>` y `(cd backups/postgres && sha256sum -c "rehni_market_postgres_${TS}.dump.sha256")` y `(cd backups/minio && sha256sum -c "rehni_market_minio_${TS}.tar.gz.sha256")`
4. Respaldar el estado actual: `bash scripts/backup_rehnimarket.sh`
5. Restaurar: `bash scripts/restore_rehnimarket.sh "$TS" --verify-only` y, si da `OK`, `bash scripts/restore_rehnimarket.sh "$TS"`
6. Verificar: `docker inspect -f '{{.State.Health.Status}}' rehni-backend` (esperado `healthy`) y `docker compose exec backend uv run alembic current`
7. Reabrir y comunicar: `docker compose start frontend` e informar a los usuarios del punto restaurado.
8. Registrar: anotar el `TS`, la salida del paso 5, la duración y la decisión sobre la base `rehnimarket_prev`.

### 3.5 Evidencia de restauración

<!-- 📝 Instrucción: respaldo de la base de TU proyecto restaurado en una base aparte. -->

| Tabla | Filas en producción | Filas restauradas |
|---|---|---|
| `roles` | 4 | 4 |
| `users` | 11 | 11 |
| `company` | 6 | 6 |
| `products` | 33 | 33 |
| `product_variants` | 112 | 112 |
| `orders` | 22 | 22 |
| `order_items` | 30 | 30 |
| `wallets` | 4 | 4 |
| `wallet_transactions` | 26 | 26 |

Tiempo de restauración medido: ≈ 30 segundos (respaldo `2026-08-31_16-59`, restaurado en entorno aislado el 31/08/2026).

### 3.6 Calendario de pruebas

| Prueba | Frecuencia | Responsable |
|---|---|---|
| `sha256sum -c` del último respaldo | En cada respaldo | Responsable técnico |
| `bash scripts/restore_rehnimarket.sh <TS> --verify-only` | Mensual y tras cada migración de Alembic | Responsable técnico |

---
