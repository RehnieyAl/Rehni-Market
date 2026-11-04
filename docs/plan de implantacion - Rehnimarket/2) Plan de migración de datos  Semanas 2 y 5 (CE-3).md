| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | Yeinher Algarin |
| Fecha | 21/10/2026 |
| Actualizado | 04/11/2026 |

---

## 2. Plan de migración de datos — Semanas 2 y 5 (CE-3)

### 2.1 Objetivo medible

Migrar a la tabla `users` (rol `user`) el 100 % de los clientes válidos del sistema anterior (`legacy-data/clientes_legado.csv`), con un reporte de rechazos en el que cada registro no migrado tenga su motivo y se cumpla `origen = migrados + rechazados`, en una ventana máxima de 2 horas, sin modificar ni eliminar ningún usuario existente.

### 2.2 Inventario de origen

| Origen | Formato | Volumen estimado | Responsable de entregarlo | Estado de calidad |
|---|---|---|---|---|
| Sistema anterior — clientes (`legacy-data/clientes_legado.csv`) | CSV con encabezado, delimitador `;`, UTF-8; columnas `codigo`, `nombre_completo`, `correo`, `fecha_alta`, `telefono` | 100 filas | Rol: responsable del sistema anterior | Datos sintéticos. Espacios y tabuladores sobrantes, correos con mayúsculas, fechas en texto (`YYYY-MM-DD` y `DD/MM/YYYY`), teléfonos con espacios; vacíos (nombre 3, correo 2, fecha 2, teléfono 2), 4 correos inválidos y 4 correos repetidos |

### 2.3 Estrategia

- Estrategia de corte (big bang / por fases) y justificación: big bang. Es una sola entidad (clientes) sin dependencias con otros datos; una única transacción (`transformar.sql`) permite conciliar y revertir el conjunto completo.
- Ventana de mantenimiento propuesta: 2 horas con `frontend` y `backend` detenidos (`docker compose stop frontend backend`), después del respaldo previo. En el ensayo del 04/11/2026 sobre una copia restaurada, las opciones 3 a 5 tardaron **12,2 s** (sección 2.9). A eso se suman el respaldo previo (1 min 58 s, sección 3.5) y la apertura y el cierre de la ventana.

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
- Rol que decide: responsable técnico del proyecto (Yeinher Algarin), con aprobación del cliente.

### 2.7 Matriz de riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Formato real de fechas o codificación distinto del supuesto | Media | Alto | Las fechas no reconocidas se rechazan (`FECHA_INVALIDA`), nunca se inventan; ensayo previo con el archivo |
| Correos repetidos con distinta capitalización | Alta | Medio | Normalización a minúsculas y comparación con `lower(email)` en origen y destino |
| Registros nuevos en `users` durante la carga | Baja | Alto | `frontend` y `backend` detenidos + `LOCK TABLE public.users` en la transacción |
| Rechazo masivo por una regla mal definida | Media | Medio | Revisión del reporte de rechazos con el cliente antes de reabrir; rollback selectivo |
| Rollback selectivo imposible por actividad posterior | Media | Alto | Respaldo previo obligatorio y restauración con `restore_rehnimarket.sh` |
| Exposición de datos personales del archivo de origen | Media | Alto | Copia solo en `/tmp/migracion` del contenedor, borrada al cerrar la ventana; solo datos sintéticos en pruebas |

### 2.8 Ejecución de los scripts

Los scripts se ejecutan con un menú, desde la raíz del proyecto y con los contenedores en marcha:

```bash
bash scripts/migracion/migrar.sh
```

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

### 2.9 Ensayo sobre una copia restaurada

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
