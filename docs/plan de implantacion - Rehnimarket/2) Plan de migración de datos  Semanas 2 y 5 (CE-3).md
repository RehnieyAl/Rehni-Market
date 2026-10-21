# Entregable S02 — Planes de Migración, Respaldo e Instalación (v0)

<!-- 📝 Instrucción: completa cada sección con datos de TU proyecto real. Los valores en cursiva
son ejemplos parciales del laboratorio de la biblioteca; reemplázalos. Solo datos sintéticos. -->

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | Yeinher Algarin |
| Fecha | 21/10/2026 |

---

## 2. Plan de migración de datos

### 2.1 Objetivo medible

<!-- 📝 Instrucción: qué se migra, criterio de éxito, ventana máxima, qué no se puede alterar. -->

Migrar a la tabla `users` (rol `user`) el 100 % de los clientes válidos del sistema anterior (`legacy-data/clientes_legado.csv`), con un reporte de rechazos en el que cada registro no migrado tenga su motivo y se cumpla `origen = migrados + rechazados`, en una ventana máxima de 2 horas, sin modificar ni eliminar ningún usuario existente.

### 2.2 Inventario de origen

| Origen | Formato | Volumen estimado | Responsable de entregarlo | Estado de calidad |
|---|---|---|---|---|
| Sistema anterior — clientes (`legacy-data/clientes_legado.csv`) | CSV con encabezado, delimitador `;`, UTF-8; columnas `codigo`, `nombre_completo`, `correo`, `fecha_alta`, `telefono` | 100 filas | Rol: responsable del sistema anterior | Datos sintéticos. Espacios y tabuladores sobrantes, correos con mayúsculas, fechas en texto (`YYYY-MM-DD` y `DD/MM/YYYY`), teléfonos con espacios; vacíos (nombre 3, correo 2, fecha 2, teléfono 2), 4 correos inválidos y 4 correos repetidos |

### 2.3 Estrategia

- Estrategia de corte (big bang / por fases) y justificación: big bang. Es una sola entidad (clientes) sin dependencias con otros datos; una única transacción (`transformar.sql`) permite conciliar y revertir el conjunto completo.
- Ventana de mantenimiento propuesta: 2 horas con `frontend` y `backend` detenidos (`docker compose stop frontend backend`), después del respaldo previo. La carga medida en el ensayo del 21/10/2026 tardó 11,8 s.

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
| 1 | Respaldo previo (`backup_rehnimarket.sh`) | Respaldo de PostgreSQL y MinIO; detiene el backend menos de 1 minuto. No modifica datos |
| 2 | Abrir ventana | Detiene `frontend` y `backend` y copia el CSV y los scripts al contenedor. La aplicación queda fuera de servicio |
| 3 | `carga-staging.sql` | Carga las 100 filas en el esquema `migracion`. No toca `users` |
| 4 | `transformar.sql` | Inserta los clientes válidos en `users` en una sola transacción. Único paso que escribe en `users` |
| 5 | `validar.sql` | Solo lectura: 11 controles. Correcto si da `OK=10` y `FALLA=0` |
| 6 | `rollback.sql` | Borra solo los usuarios de la ejecución (pide escribir `SI`) |
| 7 | Cerrar ventana | Exporta el reporte de rechazos a `backups/` y reabre la aplicación. Solo se permite si la validación fue correcta |
| 8 | Restaurar el respaldo previo | Contingencia si el rollback aborta: descarta todos los cambios posteriores al respaldo (pide escribir `SI`) |
| 9 | Ver estado | Muestra el respaldo, la última validación, el número de usuarios y las ejecuciones |

Orden normal: 1 → 2 → 3 → 4 → 5 → 7. Si la validación falla: 6 (y 8 si el rollback aborta).

---
