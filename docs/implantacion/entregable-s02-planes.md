# Entregable S02 — Planes de Migración, Respaldo e Instalación (v0)

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | 1 persona: Yeinher Jose Algarin Cardozo, aprendiz ADSO, ficha 3171618 |
| Fecha | 2026-11-18 |

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
| Conciliación de conteos | Control 1 de [`scripts/migracion/validar.sql`](../../scripts/migracion/validar.sql); ensayo del 04/11/2026: `origen=100 migrados=73 rechazados=27`, OK | origen = migrados + rechazados |
| Checksum | Control 9 de `validar.sql` (hash de los datos normalizados frente a los leídos de `users`) y `sha256sum` del CSV antes y después; ensayo del 04/11/2026: `cbcb1b239c3f47b57c36e76a9feb6045` = `cbcb1b239c3f47b57c36e76a9feb6045`, OK | hashes iguales |
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

---

## 3. Plan de respaldo (v0)

### 3.1 Qué se respalda

| Elemento | Ubicación | Método | ¿Contiene datos personales? |
|---|---|---|---|
| Base de datos PostgreSQL 17 | Contenedor `rehni-postgres`, base `rehnimarket` | `pg_dump -F c -Z 6` con `bash scripts/backup_rehnimarket.sh` | Sí |
| Archivos de MinIO (imágenes, logos, banners, certificados PDF) | Contenedor `rehni-minio`, bucket `uploads` | `mc mirror` + `.tar.gz` con `bash scripts/backup_rehnimarket.sh` (mismo `TS` que la base) | Sí |
| Configuración (`.env` único) | Raíz del proyecto | Copia cifrada con `age` (decisión del 04/11/2026; implementación: semana 6) | No (contiene credenciales) |

Script: [`scripts/respaldar.sh`](../../scripts/respaldar.sh) (ejecuta [`scripts/backup_rehnimarket.sh`](../../scripts/backup_rehnimarket.sh)).

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

Tiempo de restauración medido: 1,0 s (`pg_restore` del respaldo `2026-11-04_14-15` en la base aparte `rehnimarket_verif`, 04/11/2026); verificación completa con `bash scripts/restore_rehnimarket.sh 2026-11-04_14-15 --verify-only` (38 tablas y 4351 objetos de MinIO): 12,764 s.

### 3.6 Calendario de pruebas

| Prueba | Frecuencia | Responsable |
|

---

## 5. Plan de instalación (v0)

| # | Sección | Contenido |
|---|---|---|
| 1 | Alcance | Instalar los cinco servicios de `docker-compose.yml` (`frontend` con Caddy, `backend`, `pgbouncer`, `postgres`, `minio`) en un servidor Ubuntu Server 24.04 LTS con Docker Compose. La app móvil (`RehniMarket-mobile/`) no forma parte de `docker-compose.yml` y queda fuera de este plan |
| 2 | Ambientes | Un único `docker-compose.yml` y un único `caddy/Caddyfile` en todos los ambientes; solo cambia el `.env` de la raíz. **Desarrollo:** CachyOS, `docker compose up -d` o `docker compose watch`, HTTPS en `https://localhost` y `https://api.localhost` (CA local de Caddy) y API directa en `:8000`. **Pruebas:** `docker compose --profile test up -d --wait postgres-test`. **Producción:** Ubuntu Server 24.04 LTS, `docker compose up -d` con el `.env` de `deploy/env.prod.example`, HTTPS con Let's Encrypt en `:443`. **Producción en la nube:** VM Ubuntu 24.04 en Azure (IaaS), clon en `~/Rehni-Market`; detalle en la semana 4 ([§5.2 y §5.3](entregable-s04-procedimiento-despliegue.md)) |
| 3 | Roles | Responsable técnico (Yeinher Jose Algarin Cardozo): ejecuta la instalación, decide el rollback (sección 2.6). Cliente: aprueba el resultado y el reporte de rechazos de la migración (sección 2.6). Equipo de una persona: el responsable técnico es también el administrador de la VM. [PENDIENTE: nombre y rol del contacto del cliente que aprueba] |
| 4 | Prerrequisitos | Ver [semana 1](entregable-s01-ficha-tecnica.md) (ficha técnica): matriz 1.5 y `scripts/verificar-requisitos.sh` con código de salida `0` |
| 5 | Preparación | Ubuntu Server 24.04 LTS con Docker Engine y el plugin Compose instalados según la guía oficial (paso 2 de la instalación inicial), usuario de despliegue en el grupo `docker`, DNS apuntando al servidor y puertos 80/443/22 abiertos ([semana 3](entregable-s03-hosting-y-dominio.md), §4.3 y §4.4) |
| 6 | Procedimiento | Ver pasos abajo (versión v1 con comandos probados: entregable de la semana 4, §5.2) |
| 7 | Migración de datos | Esquema: el backend aplica `alembic upgrade head` al arrancar (`docker-compose.yml`). Datos del sistema anterior: sección 2 (`scripts/migracion/migrar.sh`) |
| 8 | Verificación | `docker compose ps` con los cinco servicios `healthy`, `curl` a `/health/database` y [`scripts/smoke-test.sh`](../../scripts/smoke-test.sh) con `BASE_URL` ([semana 4](entregable-s04-procedimiento-despliegue.md), §5.2) |
| 9 | Rollback | Volver a la etiqueta anterior; si hubo una migración no compatible, restaurar el respaldo previo (§3.4). Tabla de migraciones en la [semana 4](entregable-s04-procedimiento-despliegue.md), §5.2 |
| 10 | Cronograma | Ver tabla abajo |

### Procedimiento

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | Verificar requisitos del servidor | `PORTS="80 443" bash scripts/verificar-requisitos.sh` | Código de salida 0 |
| 2 | Clonar el repositorio en la versión | `git clone https://github.com/RehnieyAl/Rehni-Market.git ~/Rehni-Market && cd ~/Rehni-Market && git checkout v1.0.1` | `git describe --tags` = `v1.0.1` |
| 3 | Crear la configuración | `cp deploy/env.prod.example .env && chmod 600 .env` y reemplazar cada `CAMBIAR_*` | `grep -nE '^[A-Z_]+=.*CAMBIAR' .env` no muestra nada |
| 4 | Levantar los servicios | `docker compose build backend && docker compose build frontend && docker compose up -d --wait` | Cinco servicios `healthy` en `docker compose ps` |
| 5 | Verificar | `curl -fsS https://apirehnimarket.duckdns.org/health/database` y `bash scripts/smoke-test.sh` | `{"Base de datos":"OK"}` y `7 pasan, 0 fallan` |
| 6 | Primer respaldo | `bash scripts/respaldar.sh` | `=== FIN backup <TS> — OK ===` |

### Cronograma de la ventana

| Fase | Duración | Acumulado |
|---|---|---|
| Verificar requisitos (`verificar-requisitos.sh`) | 0,14 s (VM, 18/11/2026, [`verificar-requisitos-azure-2026-11-18.txt`](../evidencias/verificar-requisitos-azure-2026-11-18.txt)) | 0,14 s |
| Respaldo previo (`respaldar.sh`) | 1 min 58 s (medido el 04/11/2026 en desarrollo, sección 3.5) | |
| `git checkout <versión>` + compilación + `docker compose up -d --wait` (incluye `alembic upgrade head`) | 26 s a v1.0.0 (12 s de compilación + 14 s de `up`) y 18 s de vuelta (4 + 14), VM, 18/11/2026 ([`rollback-v1.0.1-v1.0.0-2026-11-18.txt`](../evidencias/rollback-v1.0.1-v1.0.0-2026-11-18.txt)) | 26,1 s |
| Verificación (`ps`, `/health/database`, `smoke-test.sh`) | ~1 s para `ps`, salud, JWT y sitio ([`rollback-v1.0.1-v1.0.0-2026-11-18.txt`](../evidencias/rollback-v1.0.1-v1.0.0-2026-11-18.txt)). [PENDIENTE: duración de `smoke-test.sh` con la cuenta de comprador] | ~27 s |
| Migración de datos del sistema anterior (si aplica, sección 2) | Opciones 3-5 de `migrar.sh`: 12,2 s en el ensayo del 04/11/2026 sobre una copia (evidencia del ensayo, arriba). Sin contar la apertura y el cierre de la ventana | |

Punto de no retorno: el arranque del backend con la nueva imagen, porque ejecuta `alembic upgrade head` (`docker-compose.yml`). Si la versión trae una migración **no compatible hacia atrás** (tabla de clasificación de la semana 4, §5.2), volver a la versión anterior exige restaurar el respaldo previo (sección 3.4) y se pierde lo escrito después de él.
