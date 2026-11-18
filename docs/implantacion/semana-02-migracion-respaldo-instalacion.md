# Entregable S02 — Planes de Migración, Respaldo e Instalación (v0)

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | 1 persona (responsable técnico) |
| Autor | Yeinher Jose Algarin Cardozo, aprendiz ADSO, ficha 3171618 |
| Fecha | 2026-11-18 (planes y evidencias del 04/11/2026) |
| Semana | 2 de 9 — Plan de instalación, migración y respaldo (CE-3, CE-4, CE-5) |
| Guía | Bootcamp de Implantación del SENA, semana 2: guía del proyecto de la semana, plantilla «Entregable S02» y rúbrica de evaluación (evidencia de Producto) |
| Sección del plan consolidado | §2, §3 (v0) y §5 (v0) de [`docs/plan-implantacion.md`](../plan-implantacion.md) |
| Estado | Parcial: 5 `[PENDIENTE]` (3 se cierran con los comandos «a» y «c» en la VM) |

Esta semana entrega versiones iniciales: la migración se ejecuta en la semana 5
([`semana-05`](semana-05-configuracion-y-verificacion.md), §2.8), el respaldo se automatiza y cifra
en la semana 6 ([`semana-06`](semana-06-seguridad-y-respaldo.md), §3 final) y la instalación pasa a
comandos reales en la semana 4 ([`semana-04`](semana-04-procedimiento-despliegue.md), §5 v1).

---

## 2. Plan de migración de datos

### 2.1 Objetivo medible

Migrar a la tabla `users` (rol `user`) el 100 % de los clientes válidos del sistema anterior (`legacy-data/clientes_legado.csv`), con un reporte de rechazos en el que cada registro no migrado tenga su motivo y se cumpla `origen = migrados + rechazados`, en una ventana máxima de 2 horas, sin modificar ni eliminar ningún usuario existente.

### 2.2 Inventario de origen

| Origen | Formato | Volumen estimado | Responsable de entregarlo | Estado de calidad |
|---|---|---|---|---|
| Sistema anterior — clientes (`legacy-data/clientes_legado.csv`) | CSV con encabezado, delimitador `;`, UTF-8; columnas `codigo`, `nombre_completo`, `correo`, `fecha_alta`, `telefono` | 100 filas | Rol: responsable del sistema anterior | Datos sintéticos. Espacios y tabuladores sobrantes, correos con mayúsculas, fechas en texto (`YYYY-MM-DD` y `DD/MM/YYYY`), teléfonos con espacios; vacíos (nombre 3, correo 2, fecha 2, teléfono 2), 4 correos inválidos y 4 correos repetidos |

### 2.3 Estrategia

- Estrategia de corte (big bang / por fases) y justificación: big bang. Es una sola entidad (clientes) sin dependencias con otros datos; una única transacción (`transformar.sql`) permite conciliar y revertir el conjunto completo.
- Ventana de mantenimiento propuesta: 2 horas con `frontend` y `backend` detenidos (`docker compose stop frontend backend`), después del respaldo previo. En el ensayo del 04/11/2026 sobre una copia restaurada, las opciones 3 a 5 tardaron **12,2 s** (evidencia del ensayo, arriba). A eso se suman el respaldo previo (1 min 58 s, sección 3.5) y la apertura y el cierre de la ventana.

### 2.4 Tabla de mapeo

| Origen | Destino | Transformación | Regla de rechazo |
|---|---|---|---|
| `correo` | `users.email` | `btrim` + minúsculas | Vacío → `CORREO_VACIO`; formato no válido → `CORREO_INVALIDO`; más de 50 caracteres → `CORREO_EXCEDE_50`; ya existe en `users` → `YA_EXISTE_DESTINO`; repetido en el origen → `DUPLICADO_ORIGEN` (se conserva la primera ocurrencia) |
| `nombre_completo` | `users."fullName"` | Espacios y tabuladores repetidos → un espacio, y `btrim` | Vacío → `NOMBRE_VACIO`; más de 50 caracteres → `NOMBRE_EXCEDE_50` |
| `telefono` | `users.tell` | Se eliminan todos los caracteres excepto dígitos y `+` | No cumple `^\+?[0-9]{7,15}$` → `TELEFONO_INVALIDO` |
| `fecha_alta` | `users.created_at` | `YYYY-MM-DD` o `DD/MM/YYYY` → fecha a las 00:00 UTC | Vacía, formato no reconocido o fecha inexistente → `FECHA_INVALIDA`; posterior a hoy → `FECHA_FUTURA` |
| `codigo` | — (solo trazabilidad en `migracion.usuarios_migrados`) | `btrim` | — |
| — | `users.hashed_password` | Hash bcrypt propio por cuenta de un secreto aleatorio (acceso con «¿Olvidaste tu contraseña?») | — |
| — | `users.role_id` / `verified` / `"isActive"` | Rol `user` / `false` / `true` | Si no existe el rol `user`, la ejecución completa falla |

### 2.5 Validaciones

| Validación | Consulta o método | Resultado esperado |
|---|---|---|
| Conciliación de conteos | Control 1 de `scripts/migracion/validar.sql` | origen = migrados + rechazados |
| Checksum | Control 9 de `validar.sql` (hash de los datos normalizados frente a los leídos de `users`) y `sha256sum` del CSV antes y después | hashes iguales |
| Usuarios existentes sin alterar | Control 8 de `validar.sql` (hash de cada fila frente a la línea base) | 0 usuarios distintos |
| Conteo en destino | Control 3 de `validar.sql` | `users` = línea base + migrados |
| Sin correos duplicados | Control 5 de `validar.sql` | 0 correos repetidos |

### 2.6 Rollback

- Criterio para ejecutar rollback: cualquier control de `validar.sql` en `FALLA`, que el SHA-256 del CSV cambie o que el cliente rechace el reporte de rechazos.
- Método principal: `scripts/migracion/rollback.sql` con el `id_ejecucion`; borra solo los usuarios de esa ejecución. Si aborta (usuario migrado modificado o referenciado por otra tabla), se restaura el respaldo previo con `bash scripts/restore_rehnimarket.sh <TS>`.
- Rol que decide: responsable técnico del proyecto (Yeinher Jose Algarin Cardozo), con aprobación del cliente.

### 2.7 Matriz de riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Formato real de fechas o codificación distinto del supuesto | Media | Alto | Las fechas no reconocidas se rechazan (`FECHA_INVALIDA`), nunca se inventan; ensayo previo con el archivo |
| Correos repetidos con distinta capitalización | Alta | Medio | Normalización a minúsculas y comparación con `lower(email)` en origen y destino |
| Registros nuevos en `users` durante la carga | Baja | Alto | `frontend` y `backend` detenidos + `LOCK TABLE public.users` en la transacción |
| Rechazo masivo por una regla mal definida | Media | Medio | Revisión del reporte de rechazos con el cliente antes de reabrir; rollback selectivo |
| Rollback selectivo imposible por actividad posterior | Media | Alto | Respaldo previo obligatorio y restauración con `restore_rehnimarket.sh` |
| Exposición de datos personales del archivo de origen | Media | Alto | Copia solo en `/tmp/migracion` del contenedor, borrada al cerrar la ventana; solo datos sintéticos en pruebas |


### Evidencia: menú de ejecución y ensayo sobre una copia restaurada

Los SQL viven en [`scripts/migracion/`](../../scripts/migracion/) (`carga-staging.sql`,
`transformar.sql`, `validar.sql`, `rollback.sql`) y se ejecutan con el menú
[`scripts/migracion/migrar.sh`](../../scripts/migracion/migrar.sh). Origen sintético:
[`legacy-data/clientes_legado.csv`](../../legacy-data/clientes_legado.csv).

| Opción | Acción | Impacto |
|---|---|---|
| 1 | Respaldo previo (`backup_rehnimarket.sh`, o su envoltorio `respaldar.sh`) | Respaldo de PostgreSQL y MinIO; detiene el backend mientras dura (1 min 58 s medidos el 04/11/2026, sección 3.5). No modifica datos |
| 2 | Abrir ventana | Detiene `frontend` y `backend` y copia el CSV y los scripts al contenedor. La aplicación queda fuera de servicio |
| 3 | `carga-staging.sql` | Carga las 100 filas en el esquema `migracion`. No toca `users` |
| 4 | `transformar.sql` | Inserta los clientes válidos en `users` en una sola transacción. Único paso que escribe en `users` |
| 5 | `validar.sql` | Solo lectura: 11 controles. Correcto si da `OK=10` y `FALLA=0` |
| 6 | `rollback.sql` | Borra solo los usuarios de la ejecución (pide escribir `SI`) |
| 7 | Cerrar ventana | Exporta el reporte de rechazos a `backups/` y reabre la aplicación. Solo se permite si la validación fue correcta |
| 8 | Restaurar el respaldo previo | Contingencia si el rollback aborta: descarta todos los cambios posteriores al respaldo (pide escribir `SI`) |
| 9 | Ver estado | Muestra el respaldo, la última validación, el número de usuarios y las ejecuciones |

Orden normal: 1 → 2 → 3 → 4 → 5 → 7. Si la validación falla: 6 (y 8 si el rollback aborta).

Ejecutado el 04/11/2026 a las 14:41 UTC. Se hizo sobre una **base aparte** (`rehnimarket_ensayo`), restaurada del respaldo `2026-11-04_14-31`, y no sobre la base de desarrollo. La aplicación siguió en marcha, porque no usa esa base. Se aplicaron los mismos SQL que ejecuta `migrar.sh` (opciones 3 a 6), con `psql -d rehnimarket_ensayo`:

```bash
TS=2026-11-04_14-31; DB=rehnimarket_ensayo
(cd backups/postgres && sha256sum -c "rehni_market_postgres_${TS}.dump.sha256")
docker cp "backups/postgres/rehni_market_postgres_${TS}.dump" rehni-postgres:/tmp/ensayo.dump
docker exec rehni-postgres sh -c 'createdb -U "$POSTGRES_USER" rehnimarket_ensayo && pg_restore -U "$POSTGRES_USER" -d rehnimarket_ensayo --no-owner /tmp/ensayo.dump'
docker exec rehni-postgres mkdir -p /tmp/migracion
docker cp legacy-data/clientes_legado.csv rehni-postgres:/tmp/migracion/clientes_legado.csv
docker cp scripts/migracion/. rehni-postgres:/tmp/migracion/
q(){ docker exec -i rehni-postgres sh -c 'psql -U "$POSTGRES_USER" -d rehnimarket_ensayo -v ON_ERROR_STOP=1 "$@"' psql "$@"; }
SHA=$(sha256sum legacy-data/clientes_legado.csv | cut -d' ' -f1)
q -f /tmp/migracion/carga-staging.sql                               # opción 3
q -v archivo_sha256="$SHA" -f /tmp/migracion/transformar.sql        # opción 4
ID=$(q -Atc "SELECT id_ejecucion FROM migracion.ejecuciones WHERE estado = 'APLICADA'")
q -v id_ejecucion="$ID" -f /tmp/migracion/validar.sql               # opción 5
q -v id_ejecucion="$ID" -f /tmp/migracion/rollback.sql              # opción 6 (ensayo del rollback)
docker exec rehni-postgres sh -c 'dropdb -U "$POSTGRES_USER" rehnimarket_ensayo && rm -rf /tmp/migracion /tmp/ensayo.dump'
```

Resultado: extracto de la salida, con los tiempos de cada paso medidos con `date +%s.%N`. Cada control de `validar.sql` (que psql imprime como tabla) va en una sola línea; se omiten los controles 2, 6 y 7, que también dieron `OK`. La salida completa da `OK=10`:

```
== Ensayo 2026-11-04 14:41:32 UTC | respaldo 2026-11-04_14-31 | base rehnimarket_ensayo
rehni_market_postgres_2026-11-04_14-31.dump: La suma coincide
restauración de la copia: 1.0 s
users antes: 26
SHA-256 del CSV: b29efeac92531725a599418ffe9aa17e1631c47b05ecc9c4f4ce00cf4bd8e990
--- 3) carga-staging.sql      duración: 0.1 s
--- 4) transformar.sql        duración: 12.0 s     id_ejecucion: 1
--- 5) validar.sql            duración: 0.1 s
 1. Conciliación origen = migrados + rechazados | OK | origen=100 migrados=73 rechazados=27
 3. users = línea base + migrados               | OK | antes=26 migrados=73 ahora=99
 4. Rechazos: CORREO_EXCEDE_50 1 · CORREO_INVALIDO 4 · CORREO_VACIO 2 · DUPLICADO_ORIGEN 4 ·
    FECHA_FUTURA 1 · FECHA_INVALIDA 7 · NOMBRE_EXCEDE_50 2 · NOMBRE_VACIO 2 · TELEFONO_INVALIDO 4
 5. Sin duplicados de email en users             | OK | 0 correos repetidos
 8. Preexistentes sin alterar                    | OK | 0 usuarios preexistentes distintos de la línea base
 9. Checksum normalizados = destino              | OK | esperado=cbcb1b239c3f47b57c36e76a9feb6045 obtenido=cbcb1b239c3f47b57c36e76a9feb6045
10. Hash bcrypt único por migrado                | OK | 73 migrados, 73 hashes distintos, 0 no bcrypt
11. Migrados sin verificar                       | OK | 0 verificados de 73 migrados
psql exit=0  OK=10  FALLA=0  CSV sin cambios: OK
carga + transformación + validación (opciones 3-5): 12.2 s
users después: 99
--- 6) rollback.sql   Rollback: migrados restantes en users | OK | 0 restantes
                      Rollback: preexistentes intactos      | OK | 0 distintos de la línea base
rollback exit=0  duración: 0.1 s
users tras rollback: 26
```

Casi todo el tiempo está en `transformar.sql` (12,0 s), que calcula un hash bcrypt distinto por cada uno de los 73 migrados (control 10). Después del ensayo, la base de desarrollo seguía con 26 usuarios y sin el esquema `migracion`.

---

## 3. Plan de respaldo (v0)

### 3.1 Qué se respalda

| Elemento | Ubicación | Método | ¿Contiene datos personales? |
|---|---|---|---|
| Base de datos PostgreSQL 17 | Contenedor `rehni-postgres`, base `rehnimarket` | `pg_dump -F c -Z 6` con `bash scripts/backup_rehnimarket.sh` | Sí |
| Archivos de MinIO (imágenes, logos, banners, certificados PDF) | Contenedor `rehni-minio`, bucket `uploads` | `mc mirror` + `.tar.gz` con `bash scripts/backup_rehnimarket.sh` (mismo `TS` que la base) | Sí |
| Configuración (`.env` único) | Raíz del proyecto | Copia cifrada con `age` (decisión del 04/11/2026; implementación: semana 6) | No (contiene credenciales) |

**Script ([`scripts/respaldar.sh`](../../scripts/respaldar.sh)).** El Bootcamp de Implantación del SENA, semana 2, pide `scripts/respaldar.sh`. En RehniMarket es un envoltorio de una línea que ejecuta `scripts/backup_rehnimarket.sh` con los mismos argumentos y variables (`exec bash .../backup_rehnimarket.sh "$@"`), sin lógica propia: `bash scripts/respaldar.sh` y `bash scripts/backup_rehnimarket.sh` son equivalentes. Comprobado el 04/11/2026: `bash scripts/respaldar.sh --no-stop` terminó con `=== FIN backup 2026-11-04_14-31 — OK ===` en 1 min 33 s, y el log no registra `deteniendo backend`, así que el argumento llegó al script original.

### 3.2 Objetivos

| RPO | RTO | Justificación (acordada con el cliente) |
|---|---|---|
| 24 horas | 4 horas | **Decisión del responsable (04/11/2026); [PENDIENTE: aceptación del cliente en el acta de entrega].** Con un respaldo diario se pierde como máximo el trabajo de un día. Las 4 horas cubren el peor caso, restaurar en un servidor nuevo (preparar el equipo, Docker y validar la aplicación). La restauración medida de la base tarda 1,0 s y la verificación completa 12,8 s (sección 3.5), muy por debajo del RTO |

### 3.3 Política

| Aspecto | Decisión |
|---|---|
| Tipo (completo / incremental / diferencial) | Completo |
| Frecuencia y hora | Diaria a las 02:00 UTC (propuesta; hoy se ejecuta a mano). Programación con cron/systemd en el servidor: semana 6 |
| Retención | Los 7 respaldos más recientes (`KEEP_DAILY=7`, `scripts/backup_rehnimarket.sh:8`) |
| Copia 1 — ubicación y medio | Disco local del servidor, carpeta `backups/` del proyecto (excluida de Git en `.gitignore:4`) |
| Copia 2 — ubicación y medio | Disco externo (decisión del responsable, 04/11/2026). Implementación y procedimiento de copia: semana 6 |
| Copia 3 (fuera del sitio) | Almacenamiento en la nube: Backblaze B2 (decisión del responsable, 04/11/2026). Implementación (subida del archivo cifrado): semana 6 |
| Cifrado | `age` (decisión del responsable, 04/11/2026): las copias 2 y 3 salen del servidor cifradas. Implementación y custodia de la llave privada: semana 6 |
| Responsable (rol) | Responsable técnico del proyecto (Yeinher Jose Algarin Cardozo) |

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

## 5. Plan de instalación (v0)

| # | Sección | Contenido |
|---|---|---|
| 1 | Alcance | Instalar los cinco servicios de `docker-compose.yml` (`frontend` con Caddy, `backend`, `pgbouncer`, `postgres`, `minio`) en un servidor Ubuntu Server 24.04 LTS con Docker Compose. La app móvil (`RehniMarket-mobile/`) no forma parte de `docker-compose.yml` y queda fuera de este plan |
| 2 | Ambientes | Un único `docker-compose.yml` y un único `caddy/Caddyfile` en todos los ambientes; solo cambia el `.env` de la raíz. **Desarrollo:** CachyOS, `docker compose up -d` o `docker compose watch`, HTTPS en `https://localhost` y `https://api.localhost` (CA local de Caddy) y API directa en `:8000`. **Pruebas:** `docker compose --profile test up -d --wait postgres-test`. **Producción:** Ubuntu Server 24.04 LTS, `docker compose up -d` con el `.env` de `deploy/env.prod.example`, HTTPS con Let's Encrypt en `:443`. **Producción en la nube:** VM Ubuntu 24.04 en Azure (IaaS), clon en `~/Rehni-Market`; detalle en la semana 4 ([§5.2 y §5.3](semana-04-procedimiento-despliegue.md)) |
| 3 | Roles | Responsable técnico (Yeinher Jose Algarin Cardozo): ejecuta la instalación, decide el rollback (sección 2.6). Cliente: aprueba el resultado y el reporte de rechazos de la migración (sección 2.6). Equipo de una persona: el responsable técnico es también el administrador de la VM. [PENDIENTE: nombre y rol del contacto del cliente que aprueba] |
| 4 | Prerrequisitos | Ver [semana 1](semana-01-ficha-tecnica.md) (ficha técnica): matriz 1.5 y `scripts/verificar-requisitos.sh` con código de salida `0` |
| 5 | Preparación | Ubuntu Server 24.04 LTS con Docker Engine y el plugin Compose instalados según la guía oficial (paso 2 de la instalación inicial), usuario de despliegue en el grupo `docker`, DNS apuntando al servidor y puertos 80/443/22 abiertos ([semana 3](semana-03-hosting-y-dominio.md), §4.3 y §4.4) |
| 6 | Procedimiento | v0: clonar, crear el `.env` desde `deploy/env.prod.example`, `docker compose up -d --build --wait`. Comandos exactos en la [semana 4](semana-04-procedimiento-despliegue.md) (§5.2: instalación, actualización y rollback) |
| 7 | Migración de datos | Esquema: el backend aplica `alembic upgrade head` al arrancar (`docker-compose.yml`). Datos del sistema anterior: sección 2 (`scripts/migracion/migrar.sh`) |
| 8 | Verificación | `docker compose ps` con los cinco servicios `healthy`, `curl` a `/health/database` y [`scripts/smoke-test.sh`](../../scripts/smoke-test.sh) con `BASE_URL` ([semana 4](semana-04-procedimiento-despliegue.md), §5.2) |
| 9 | Rollback | Volver a la etiqueta anterior; si hubo una migración no compatible, restaurar el respaldo previo (§3.4). Tabla de migraciones en la [semana 4](semana-04-procedimiento-despliegue.md), §5.2 |
| 10 | Cronograma | Ver tabla de abajo |

#### Cronograma de la ventana

| Fase | Duración | Acumulado |
|---|---|---|
| Verificar requisitos (`verificar-requisitos.sh`) | [PENDIENTE: medir en la VM (comando «a»)] | |
| Respaldo previo (`respaldar.sh`) | 1 min 58 s (medido el 04/11/2026 en desarrollo, sección 3.5) | |
| `git checkout <versión>` + compilación + `docker compose up -d --wait` (incluye `alembic upgrade head`) | [PENDIENTE: medir en la VM (rollback cronometrado, comando «c»)] | |
| Verificación (`ps`, `/health/database`, `smoke-test.sh`) | [PENDIENTE: medir en la VM (comando «c»)] | |
| Migración de datos del sistema anterior (si aplica, sección 2) | Opciones 3-5 de `migrar.sh`: 12,2 s en el ensayo del 04/11/2026 sobre una copia (evidencia del ensayo, arriba). Sin contar la apertura y el cierre de la ventana | |

**Punto de no retorno:** el arranque del backend con la nueva imagen, porque ejecuta `alembic upgrade head` (`docker-compose.yml`). Si la versión trae una migración **no compatible hacia atrás** (tabla de clasificación de la semana 4, §5.2), volver a la versión anterior exige restaurar el respaldo previo (sección 3.4) y se pierde lo escrito después de él.
