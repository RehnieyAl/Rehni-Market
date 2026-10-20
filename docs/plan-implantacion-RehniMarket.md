# 📘 Plan de Implantación — [Nombre del proyecto]

<!-- 📝 Instrucción: cada equipo copia esta plantilla al repositorio de su proyecto real
(`docs/plan-implantacion.md`) y completa una sección por semana. En la semana 9 el documento
debe permitir que otro equipo instale el proyecto desde cero sin ayuda. Solo datos sintéticos:
nada de IPs, usuarios ni contraseñas reales. Modelo completo: el plan de la app de referencia,
referencia/docs/plan-implantacion.md. -->

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | Yeinher Algarin |
| Versión del plan | V1.0 |
| Fecha | 07/10/2026 |

---

## 1. Ficha técnica y requisitos mínimos — Semana 1 (CE-1, CE-2)

Rehni-Market es una plataforma de comercio electrónico que permite a los usuarios consultar productos, gestionar un carrito y realizar pedidos, mientras que las empresas pueden publicar y administrar sus productos. Los administradores y el owner gestionan usuarios, empresas, permisos y diferentes aspectos administrativos. La solución utiliza una arquitectura basada en **frontend web + API backend + servicios de infraestructura**, desplegada mediante Docker Compose. El backend está desarrollado con FastAPI y utiliza PostgreSQL para persistencia y MinIO para almacenamiento de archivos.

## 1.2 Inventario de software

| Componente | Función | Versión | Licencia | ¿Genera costo? |
|---|---|---|---|---|
| PostgreSQL | Base de datos relacional | 17 / `postgres:17-alpine` | PostgreSQL License | No |
| FastAPI | Framework para API REST | 0.135.1 | MIT | No |
| Uvicorn | Servidor ASGI | 0.41.0 | BSD-3-Clause | No |
| SQLAlchemy | ORM y acceso a PostgreSQL | Según `requirements.txt` | MIT | No |
| Alembic | Migraciones de base de datos | Según `requirements.txt` | MIT | No |
| Pydantic | Validación y esquemas de datos | Según `requirements.txt` | MIT | No |
| MinIO | Almacenamiento de objetos/archivos | Según Docker Compose | AGPLv3 | No |
| React | Biblioteca para frontend | 19 | MIT | No |
| TypeScript | Tipado estático del frontend | Según `package.json` | Apache-2.0 | No |
| Vite | Herramienta de desarrollo y compilación | 8 | MIT | No |
| Tailwind CSS | Framework de estilos | Según `package.json` | MIT | No |
| Node.js | Runtime para frontend | 22 | MIT | No |
| pnpm | Gestor de paquetes | 11.15.0 | MIT | No |
| Nginx | Servidor web del frontend | 1.27-alpine | BSD-2-Clause | No |
| Docker | Contenedorización | Según entorno instalado | Apache-2.0 | No |
| Docker Compose | Orquestación de servicios | Según entorno instalado | Apache-2.0 | No |

## 1.3 Sistema operativo del servidor

| Campo | Valor |
|---|---|
| Distribución y versión | CachyOS Linux |
| Arquitectura | x86_64 |
| Fin de soporte estándar | No aplica bajo el esquema de soporte de Ubuntu LTS |
| Licencia | Software libre / componentes bajo sus respectivas licencias |
| Requisitos mínimos oficiales (enlace) | No se dispone en la información del proyecto de un enlace oficial de requisitos mínimos del servidor |

**Nota:** el entorno registrado del proyecto utiliza el kernel **7.1.4-1-cachyos**.

## 1.4 Medición de consumo

Esta sección requiere datos obtenidos directamente mediante `docker stats`. Como esos valores no están disponibles, no se inventan.

| Servicio | RAM reposo | RAM pico | CPU pico |
|---|---:|---:|---:|
| RehniMarket Backend | Pendiente de medición | Pendiente de medición | Pendiente de medición |
| RehniMarket Frontend/Nginx | Pendiente de medición | Pendiente de medición | Pendiente de medición |
| PostgreSQL | Pendiente de medición | Pendiente de medición | Pendiente de medición |
| MinIO | Pendiente de medición | Pendiente de medición | Pendiente de medición |
| Cloudflared / dns_tunel | Pendiente de medición | Pendiente de medición | Pendiente de medición |
| **Total** | **Pendiente** | **Pendiente** | **Pendiente** |

**Carga simulada con:** pruebas funcionales y de aceptación del proyecto. Para completar técnicamente esta sección se debe ejecutar `docker stats` en reposo y durante una prueba de carga, por ejemplo utilizando k6.



## 1.5 Matriz de requisitos

| Requisito | Mínimo | Recomendado | Justificación |
|---|---|---|---|
| CPU | 2 vCPU | 4 vCPU | Permite ejecutar simultáneamente backend, frontend/Nginx, PostgreSQL, MinIO y servicios auxiliares. |
| RAM | 4 GB | 8 GB | Permite ejecutar Docker Compose con los servicios principales y disponer de margen para PostgreSQL y MinIO. |
| Disco | 30 GB | 60 GB SSD | Contempla sistema, imágenes Docker, base de datos, archivos e imágenes almacenadas en MinIO. |
| Tipo de disco / IOPS | SSD | SSD NVMe | Mejora los tiempos de acceso de PostgreSQL, Docker y almacenamiento de archivos. |
| Red | 100 Mbps | 1 Gbps | Adecuado para transferencia de imágenes, comunicación entre servicios y acceso concurrente. |
| Arquitectura | x86_64 | x86_64 | Compatible con el entorno Linux y las imágenes Docker utilizadas. |
| Sistema operativo | Linux x86_64 | CachyOS Linux x86_64 | Es el entorno utilizado actualmente para el desarrollo y ejecución. |
| Docker / runtime | Docker + Docker Compose | Docker actualizado + Docker Compose | Permite ejecutar y administrar los servicios de manera reproducible. |
| Puertos | 8000, 8080, 5434, 9000 | Según configuración de Docker Compose | Se utilizan para backend, frontend, PostgreSQL y MinIO según el entorno configurado. |


## 1.6 Plataforma física recomendada

| Decisión | Elección | Justificación |
|---|---|---|
| Formato (torre / rack / blade) | Torre | Para una implementación pequeña o mediana resulta suficiente y facilita mantenimiento y ampliaciones. |
| Nivel RAID del servidor de base de datos | RAID 1 | Permite mantener una copia espejo y tolerar la falla de una unidad. |
| Plataforma de ejecución (bare metal / VM / contenedores) | Contenedores Docker | Es la plataforma utilizada por Rehni-Market y permite aislar los diferentes servicios. |

**Servidor donde se ejecutó:** entorno Linux CachyOS utilizado para ejecutar Rehni-Market mediante Docker Compose.

## 1.7 Verificación de requisitos

**Script:** `scripts/verificar-requisitos.sh` del repositorio del proyecto.

**Servidor donde se ejecutó:** entorno Linux CachyOS utilizado para ejecutar Rehni-Market mediante Docker Compose.

```text
REQUISITO          ESPERADO               ENCONTRADO             ESTADO
------------------------------------------------------------------------
Procesadores       >= 1                   12                     CUMPLE
RAM (MB)           >= 4096                7150                   CUMPLE
Disco libre (GB)   >= 10 en /             67                     CUMPLE
Arquitectura       x86_64 aarch64         x86_64                 CUMPLE
Sistema operativo  cachyos >= cachyos     cachyos cachyos        CUMPLE
Docker             >= 24.0                29.6.2                 CUMPLE
Puerto 8080        libre                  libre                  CUMPLE
Puerto 8000        libre                  libre                  CUMPLE
Puerto 9000        libre                  libre                  CUMPLE
Puerto 5432        libre                  libre                  CUMPLE

RESULTADO: 0.
```

## 2. Plan de migración de datos — Semanas 2 y 5 (CE-3)

# Entregable S02 — Planes de Migración, Respaldo e Instalación (v0)

<!-- 📝 Instrucción: completa cada sección con datos de TU proyecto real. Los valores en cursiva
son ejemplos parciales del laboratorio de la biblioteca; reemplázalos. Solo datos sintéticos. -->

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket|
| Equipo | Yeinher Algarin |
| Fecha | 14/10/26 |

---

## 2. Plan de migración de datos

> **Estado del plan:** los cuatro scripts se **ensayaron el 14/10/2026 con datos sintéticos** en
> una base PostgreSQL 17 desechable con el esquema real de RehniMarket (resultados en la sección
> 2.10). **La migración real no se ha ejecutado**: no se ha usado la base de desarrollo ni la de
> producción ni datos del sistema anterior. Los elementos marcados como *Pendiente* dependen de
> información del sistema legado que aún no se ha recibido.

**Mapa de la sección: qué se diseñó, qué se probó y qué falta**

| Elemento | Estado | Evidencia | Sección |
|---|---|---|---|
| Mapeo origen → `public.users`, reglas y motivos de rechazo | Diseñado | Esquema real (`ModelUser.py`, Alembic) | 2.2, 2.4 |
| Scripts `carga-staging`, `transformar`, `validar`, `rollback` | Diseñados y ensayados con datos sintéticos | Ensayo del 14/10/2026 | 2.8, 2.10 |
| Comportamiento defensivo (bloqueos y abortos) | Ensayado en copias aisladas | Ensayo del 14/10/2026 | 2.10 |
| Normalización de nombres con tabuladores | Defecto detectado y corregido en `transformar.sql`; corrección ensayada | Ensayo B (14/10/2026) | 2.10 |
| Procedimiento completo de la Semana 5 (respaldo, ventana y migración) | Documentado, **no ejecutado** | — | 2.9 |
| Restauración completa desde respaldo (contingencia) | Documentada, **no probada en este plan** | — | 3.4, 3.5 |
| Ensayo en copia aislada de la base actual con `clientes_legado.csv` | Ejecutado: 73 migrados, 27 rechazados, controles 1–11 OK; incidencia `.test` | Ensayo C (14/10/2026) | 2.10 |
| Ensayo con dominios comunes y respaldo previo verificado | Ejecutado: 73 / 27, controles 1–11 OK; respaldo `2026-10-14_20-55` verificado | Ensayo D (14/10/2026) | 2.10 |
| Migración en la base `rehnimarket` | **No ejecutada**: procedimiento listo para que lo ejecute el responsable | — | 2.12 |

**Migración de datos frente a migración de esquema.** Alembic (`alembic upgrade head`, ejecutado
al arrancar el servicio `backend`) crea y modifica la *estructura* de las tablas de RehniMarket;
no traslada datos de otro sistema. Este plan cubre la *migración de datos de negocio*: llevar los
clientes del sistema anterior a la tabla `public.users` de RehniMarket, que ya debe existir con el
esquema en `head`. Tampoco equivale al respaldo y la restauración (sección 3): un respaldo copia
la base de RehniMarket tal como está; la migración extrae, limpia, valida y traslada datos de un
sistema distinto.

### 2.1 Objetivo medible

Migrar a `public.users` (rol `user`) el 100 % de los clientes válidos del sistema anterior, con
un reporte de rechazos en el que cada registro no migrado tenga un motivo documentado, sin
modificar ni eliminar ningún usuario preexistente, y cumpliendo la conciliación
`filas de origen = migrados + rechazados`. Ventana máxima propuesta: 2 horas (*Pendiente* de
acordar con el cliente según el volumen real).

### 2.2 Inventario de origen

| Origen | Formato | Volumen estimado | Responsable de entregarlo | Estado de calidad |
|---|---|---|---|---|
| Sistema anterior — clientes (`clientes_legado.csv`) | CSV con encabezado, delimitador `;`, UTF-8 (*codificación pendiente de confirmar*) | *Pendiente* (se registra en la carga de staging) | Rol: responsable del sistema anterior | Correos sin normalizar, fechas en texto, posibles duplicados |

Columnas esperadas en el archivo: `codigo`, `nombre_completo`, `correo`, `fecha_alta`, `telefono`.

**Destino comprobado en el esquema real** (modelo `app/models/ModelUser.py` y migración Alembic
`29fe206320ce`): tabla `public.users` con `id` UUID, `"fullName"` VARCHAR(50) NOT NULL,
`email` VARCHAR(50) NOT NULL UNIQUE, `hashed_password` VARCHAR(255) NOT NULL, `tell`
VARCHAR(50) NOT NULL, `"profileImagen"` NULL, `verified` y `"isActive"` BOOLEAN NOT NULL,
`created_at` TIMESTAMPTZ NOT NULL y `role_id` (FK a `roles.id`). Ninguna de estas columnas tiene
valor por defecto en la base de datos (los valores por defecto los asigna SQLAlchemy), por lo que
la inserción por SQL debe proporcionarlos todos. La tabla no tiene columna de origen ni de
auditoría; la trazabilidad de la migración se lleva en el esquema auxiliar `migracion`.

### 2.3 Estrategia

- **Estrategia de corte:** *big bang*. Se trata de una única entidad (clientes) sin dependencias
  con otros datos del sistema anterior; una sola ejecución transaccional permite conciliar y
  revertir el conjunto completo.
- **Ventana de mantenimiento propuesta:** con los servicios `backend` y `frontend` detenidos
  para que no haya registros nuevos durante la carga; la duración se fijará tras medir la carga
  con datos sintéticos de volumen similar al real (*Pendiente*).
- **Etapas y scripts** (sección 2.8):

| # | Etapa | Script |
|---|---|---|
| 1 | Extracción y carga del archivo original sin transformar | `carga-staging.sql` |
| 2 | Transformación, normalización y reglas de negocio | `transformar.sql` |
| 3 | Rechazo documentado de registros inválidos o duplicados | `transformar.sql` |
| 4 | Inserción controlada en el destino | `transformar.sql` |
| 5 | Validación, conciliación y checksums | `validar.sql` |
| 6 | Rollback de los registros de la ejecución | `rollback.sql` |
| 7 | Contingencia: restauración completa del respaldo previo | Sección 3 |

Los scripts están en [`scripts/migracion/`](../scripts/migracion/) (sección 2.8).

### 2.4 Tabla de mapeo

| Origen | Destino | Transformación | Regla de rechazo |
|---|---|---|---|
| `correo` | `users.email` | `btrim` + minúsculas | Vacío → `CORREO_VACIO`; formato no válido → `CORREO_INVALIDO`; más de 50 caracteres → `CORREO_EXCEDE_50`; ya existe en `users` (sin distinguir mayúsculas) → `YA_EXISTE_DESTINO`; repetido en el origen → `DUPLICADO_ORIGEN` (se conserva la primera ocurrencia válida por `fecha_alta` y número de fila) |
| `nombre_completo` | `users."fullName"` | Toda secuencia de espacios en blanco (espacios, tabuladores, saltos de línea) se reduce a un solo espacio y **después** se aplica `btrim`. No se cambian mayúsculas ni minúsculas | Vacío → `NOMBRE_VACIO`; más de 50 caracteres → `NOMBRE_EXCEDE_50` |
| `telefono` | `users.tell` | Se eliminan todos los caracteres excepto dígitos y `+` | No cumple `^\+?[0-9]{7,15}$` o vacío → `TELEFONO_INVALIDO` |
| `fecha_alta` | `users.created_at` | Conversión segura a fecha (`YYYY-MM-DD` o `DD/MM/YYYY`, *formatos pendientes de confirmar*), 00:00 UTC (*zona horaria pendiente de confirmar*) | Vacía, formato no reconocido o fecha inexistente (p. ej. `30/02/2024`) → `FECHA_INVALIDA`; posterior a hoy → `FECHA_FUTURA` |
| `codigo` | — (sin columna en `users`) | `btrim` | Se conserva solo en `migracion.usuarios_migrados` para trazabilidad |
| — | `users.id` | `gen_random_uuid()` generado antes de insertar | — |
| — | `users.role_id` | `id` del rol `user` (el mismo que asigna `RegisterService`) | Si el rol no existe, la ejecución completa falla |
| — | `users.hashed_password` | Hash bcrypt de un secreto aleatorio que se descarta (cuenta sin contraseña utilizable) | — |
| — | `users.verified` / `"isActive"` / `"profileImagen"` | `false` / `true` / `NULL` | — |

**Un solo motivo por registro.** Cada registro rechazado se registra **una sola vez** en
`migracion.rechazos`. Si incumple varias reglas, todas se guardan en `motivos` (arreglo), pero el
`motivo_principal` es la primera en el orden de la tabla anterior. `DUPLICADO_ORIGEN` solo se
evalúa entre los registros que superaron todas las demás reglas. Así la conciliación cuenta
filas, no motivos, y nunca duplica registros.

### 2.5 Validaciones

Todas las consultas están en `validar.sql` (sección 2.8 C) y devuelven `OK`, `FALLA` o `INFO`.
Los conteos esperados no son cifras fijas: se derivan de la línea base que `transformar.sql`
guarda antes de insertar (`migracion.ejecuciones.users_antes` y `migracion.linea_base_users`).

| Validación | Consulta o método | Resultado esperado |
|---|---|---|
| Conciliación de conteos | Control 1 de `validar.sql` | origen = migrados + rechazados |
| Exclusión mutua | Control 2 | Ningún registro migrado y rechazado a la vez |
| Conteo destino | Control 3 | filas actuales de `users` = línea base + migrados |
| Desglose de rechazos | Control 4 | `INFO`: total por `motivo_principal` |
| Duplicados en destino | Control 5 | Ningún `lower(email)` repetido en `users` |
| Reglas de normalización | Control 6 | 0 registros migrados incumplen las reglas |
| Integridad referencial | Control 7 | Todos los migrados existen y su `role_id` es el rol `user` |
| Preexistentes sin alterar | Control 8 | Hash de cada fila preexistente igual al de la línea base |
| Checksum | Control 9 | Hash de los datos normalizados = hash de los datos leídos de `users` |
| Archivo de origen intacto | `sha256sum` antes de la carga y al finalizar | Hashes iguales |

Los controles 3 y 8 solo son concluyentes si se ejecutan **antes de reabrir la aplicación**,
porque después los usuarios pueden registrarse o modificar sus datos.

**Significado de `INFO` (control 4).** En `validar.sql`, el control 4 agrupa
`migracion.rechazos` por `motivo_principal` y devuelve siempre `INFO` con el número de registros
de cada motivo. No compara contra ningún valor esperado, así que no puede dar `OK` ni `FALLA`. Su
función es alimentar el reporte de rechazos. El criterio de aceptación asociado es que el cliente
apruebe ese reporte (sección 2.9); un `INFO` no equivale a un `OK`.

### 2.6 Rollback y contingencia

- **Criterio para ejecutar rollback:** cualquier control de `validar.sql` con `FALLA`, que el
  archivo de origen no conserve su sha256, o que el cliente rechace el reporte dentro de la
  ventana.
- **Método principal:** `rollback.sql` (sección 2.8 D). Elimina únicamente los usuarios
  registrados en `migracion.usuarios_migrados` para el `id_ejecucion` indicado. Antes de borrar
  comprueba que esos usuarios no se modificaron tras la inserción y que ninguna tabla los
  referencia (pedidos, carritos, billeteras, códigos, etc.). Si alguna comprobación falla, aborta
  sin borrar nada. Nunca elimina usuarios por coincidir su correo con el archivo de origen, y
  nunca se usa `DROP SCHEMA ... CASCADE` sobre `public` como rollback.
- **Contingencia:** restauración completa del respaldo tomado justo antes de la migración, con
  `scripts/restore_rehnimarket.sh` (procedimiento en la sección 3.4).
- **Rol que decide:** responsable técnico de la implantación, con aprobación del cliente
  (*nombres pendientes de confirmar*).

**Cuándo usar cada mecanismo:**

| Situación | Acción | Motivo |
|---|---|---|
| `validar.sql` da `FALLA` y la aplicación sigue cerrada | `rollback.sql` con el `id_ejecucion` | Solo existen los registros de la migración; el borrado selectivo no afecta a otros datos |
| `rollback.sql` termina con controles finales `OK` | Analizar la causa, corregir y repetir desde `transformar.sql` (sección 2.9) | El staging se conserva y la ejecución queda `REVERTIDA` |
| `rollback.sql` aborta (usuario migrado modificado o referenciado por otra tabla) | **No forzar el borrado.** Restauración completa (sección 3.4) | Hubo actividad posterior; el borrado selectivo ya no es seguro |
| Fallo detectado después de reabrir la aplicación | Evaluar con el cliente; normalmente restauración completa | Los controles 3 y 8 dejan de ser concluyentes y puede haber datos legítimos nuevos |
| Falla la restauración completa | Mantener la aplicación cerrada y escalar | El script de restauración no reemplaza la base si su propia verificación falla (sección 3.4) |

La restauración completa **descarta todos los cambios posteriores al respaldo**, incluidos los
legítimos, y también restaura los objetos de MinIO. Por eso es la contingencia y no el método
principal. Que el rollback selectivo funcione no demuestra que la restauración funcione: son
mecanismos distintos y se verifican por separado (secciones 2.10 y 3.5).

### 2.7 Matriz de riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Formato real de fechas o codificación distinto del supuesto | Media | Alto | Ensayo en Semana 2 con un extracto; `fecha_segura` devuelve `NULL` y el registro queda rechazado, nunca con una fecha inventada |
| Correos repetidos con distinta capitalización | Alta | Medio | Normalización a minúsculas y comparación `lower(email)` contra el origen y el destino |
| Registros nuevos en `users` durante la carga | Baja | Alto | Servicios `backend` y `frontend` detenidos + `LOCK TABLE public.users` en la transacción |
| Rechazo masivo por una regla mal definida | Media | Medio | Revisión del reporte de rechazos con el cliente antes de reabrir; rollback selectivo |
| Usuarios migrados sin contraseña utilizable | Alta | Medio | Comunicar el uso del flujo de recuperación de contraseña (*pendiente de verificar con cuentas `verified = false`*) |
| Rollback selectivo imposible por actividad posterior | Media | Alto | Respaldo previo obligatorio y restauración según la sección 3 |
| Archivo de origen con datos personales expuesto | Media | Alto | Copia solo en `/tmp/migracion` del contenedor, borrado al cerrar la ventana; solo datos sintéticos en pruebas |

### 2.8 Scripts de migración

> Los cuatro scripts se ejecutaron y validaron **solo en un entorno de pruebas aislado con datos
> sintéticos** (sección 2.10). No se han ejecutado contra una base de datos real.

| Orden | Archivo | Propósito | Variables `psql` |
|---|---|---|---|
| 1 | [`carga-staging.sql`](../scripts/migracion/carga-staging.sql) | Crea el esquema `migracion`, las tablas de control y carga el CSV sin transformar | — |
| 2 | [`transformar.sql`](../scripts/migracion/transformar.sql) | Normaliza, registra rechazos e inserta los válidos en `public.users` (una transacción) | `archivo_sha256` |
| 3 | [`validar.sql`](../scripts/migracion/validar.sql) | Conciliación, integridad y checksums (solo lectura) | `id_ejecucion` |
| — | [`rollback.sql`](../scripts/migracion/rollback.sql) | Revierte solo los usuarios de una ejecución; solo si se cumple el criterio de 2.6 | `id_ejecucion` |

Los comandos completos están en la cabecera de cada archivo y en el procedimiento de la sección
2.9. Para ejecutarlos hay que copiar `scripts/migracion/` dentro del contenedor (`/tmp/migracion/`).

Convenciones comunes:

- Se ejecutan con `psql` dentro del contenedor `rehni-postgres`, usando las variables de entorno
  del propio contenedor (`$POSTGRES_USER`, `$POSTGRES_DB`); no se escriben credenciales.
- Todos usan `ON_ERROR_STOP`: ante cualquier error `psql` termina y la transacción abierta se
  descarta.
- El esquema auxiliar `migracion` contiene solo datos de la migración (staging, normalizados,
  rechazos, línea base y trazabilidad). No forma parte del modelo de la aplicación ni de Alembic.

#### A. `carga-staging.sql`

Crea el esquema de trabajo y carga el CSV **tal cual**: todas las columnas son `TEXT` para que
ningún valor se rechace ni se altere en la carga; la limpieza se pospone a `transformar.sql`. La
columna `fila` (número de línea de carga) es la clave de trazabilidad, porque `codigo` del
sistema anterior puede venir vacío o repetido.

**Ruta del archivo.** `COPY ... FROM '<ruta>'` lo lee el **servidor** PostgreSQL, es decir, el
proceso que corre dentro del contenedor `rehni-postgres`; una ruta del equipo anfitrión no existe
ahí. El archivo debe copiarse antes al contenedor (`docker cp`, sección 2.9). Además, `COPY` desde
archivo exige ser superusuario o tener el rol `pg_read_server_files`. Alternativa sin esos
requisitos: `\copy` de `psql`, que lee el archivo desde el cliente que ejecuta `psql`.

**Archivo:** [`carga-staging.sql`](../scripts/migracion/carga-staging.sql). Muestra al final el
número de filas cargadas (`filas_cargadas`).

#### B. `transformar.sql`

Normaliza, aplica las reglas de la tabla 2.4, registra los rechazos e inserta solo los registros
válidos, todo en **una única transacción**: si falla cualquier paso o la conciliación interna, no
queda nada insertado en `public.users`. Todas las operaciones usadas (`CREATE TABLE`, `LOCK`,
funciones PL/pgSQL, `INSERT`/`UPDATE`) son transaccionales en PostgreSQL.

La comprobación contra el destino usa `NOT EXISTS`/`EXISTS` y no `NOT IN`, porque `NOT IN`
devuelve vacío si la subconsulta contiene algún `NULL`. Como la restricción `UNIQUE (email)` de
`users` distingue mayúsculas, la comparación se hace con `lower(btrim(email))` para no crear
cuentas que solo difieran en capitalización.

Variables que recibe:

- `archivo_sha256`: hash del CSV calculado antes de la carga.

**Contraseñas (cambio del 14/10/2026).** El origen no trae contraseñas ni hashes. Antes se usaba
una variable `hash_clave_bloqueada`, es decir, **el mismo hash para todas las cuentas**; se
eliminó para no asignar una clave común. Ahora cada cuenta recibe un hash bcrypt **propio**
(`crypt(gen_random_bytes(32), gen_salt('bf', 12))`, formato `$2a$`, que `passlib` acepta) de un
secreto aleatorio que no se guarda: nadie conoce la clave y el acceso se obtiene con la
recuperación de contraseña. `pgcrypto` se instala **dentro del esquema `migracion`** (no en
`public`); el script aborta si ya existía en otro esquema.

**Verificación.** El origen no informa el estado de verificación, así que no puede conservarse:
se inserta `verified = false` (nunca se marca como verificada una cuenta sin evidencia). Tras
restablecer la contraseña, el primer login envía el código de verificación (`LoginService`).
`validar.sql` comprueba ambos puntos (controles 10 y 11).

**Archivo:** [`transformar.sql`](../scripts/migracion/transformar.sql). Al terminar muestra el
`id_ejecucion`, que se usa en `validar.sql` y `rollback.sql`.

#### C. `validar.sql`

Comprobaciones posteriores a la migración. Cada consulta devuelve `control`, `resultado`
(`OK` / `FALLA` / `INFO`) y `detalle`. Se ejecuta con `-v id_ejecucion=<N>` y es de solo lectura.

**Archivo:** [`validar.sql`](../scripts/migracion/validar.sql)

#### D. `rollback.sql`

Deshace **solo** la ejecución indicada (`-v id_ejecucion=<N>`). Los registros se identifican por
el `user_id` guardado en `migracion.usuarios_migrados` en la misma transacción que los insertó;
como esos UUID se generaron durante la migración, no pueden coincidir con usuarios preexistentes.
Aun así, el script comprueba explícitamente que ninguno figure en la línea base.

Antes de borrar recorre **todas** las claves foráneas que apuntan a `public.users` (consultando
`pg_constraint`, sin enumerar tablas a mano) y aborta si alguna fila referencia a un usuario
migrado: eso indica actividad posterior (pedidos, carrito, billetera, códigos de verificación,
etc.) y el borrado selectivo ya no es seguro. En ese caso se aplica la contingencia: restaurar el
respaldo previo (sección 3). El esquema `migracion` se conserva como evidencia; no se elimina con
`DROP SCHEMA ... CASCADE` como parte del rollback.

**Archivo:** [`rollback.sql`](../scripts/migracion/rollback.sql)

### 2.9 Actividades por semana (CE-3)

**Semana 2 — Diseño (entregable v0):**

1. Obtener del responsable del sistema anterior un extracto con datos sintéticos y confirmar
   columnas, codificación, formatos de fecha y zona horaria (*Pendiente*).
2. Cerrar el mapeo origen → `public.users` (tabla 2.4) y las reglas y motivos de rechazo con el
   cliente.
3. Preparar `carga-staging.sql` y ensayar la carga del extracto en una base de pruebas.
4. Definir el formato del reporte de rechazos (`migracion.rechazos`: fila, código, motivo
   principal, todos los motivos y dato original).
5. Incluir en el plan de respaldo (sección 3) el respaldo previo obligatorio a la migración.

**Condiciones que deben cumplirse antes de la Semana 5:**

1. Se recibió el extracto del sistema anterior y se confirmaron columnas, codificación, formatos
   de fecha, zona horaria y volumen (sección 2.11). Si difieren de la sección 2.2, se ajustan los
   scripts y se repite el ensayo de la sección 2.10 con datos sintéticos del nuevo formato.
2. El cliente aprobó el mapeo y las reglas de rechazo (tabla 2.4) y decidió el tratamiento de
   las cuentas con `verified = false`.
3. Se probaron el inicio de sesión y la recuperación de contraseña de una cuenta migrada en un
   entorno de pruebas.
4. Se ejecutó al menos una vez `scripts/restore_rehnimarket.sh <TS> --verify-only` con un
   respaldo reciente y el resultado fue `OK` (sección 3.5).
5. Están acordadas la ventana de mantenimiento, los responsables y la comunicación a los
   usuarios.

**Semana 5 — Ejecución controlada y evidencias.** El procedimiento ejecutable y verificado, con
respaldo, ventana de mantenimiento, `carga-staging.sql` → `transformar.sql` → `validar.sql` →
`rollback.sql` (solo si hace falta) y cierre, está en la **sección 2.12**. La versión anterior
de este bloque tenía errores de sintaxis en bash y se sustituyó por esa sección. La
migración en `rehnimarket` **todavía no se ha ejecutado**.

Evidencias a registrar: el `<TS>` y el manifiesto del respaldo previo; la salida de
`carga-staging.sql` (filas cargadas); el `id_ejecucion`; la salida completa de `validar.sql`; el
reporte de rechazos exportado de `migracion.rechazos`; el hash del archivo de origen; y la
duración de cada paso (`migracion.ejecuciones.inicio`/`fin`). Las pruebas de `rollback.sql` se
hacen solo en copias o bases desechables, nunca sobre la base del proyecto salvo que se cumpla
el criterio de la sección 2.6. `restore_rehnimarket.sh --verify-only` no sirve para esto, porque
destruye su entorno al terminar; se usa una base desechable como la de la sección 2.10.

**Criterios de aceptación de la migración** (todos obligatorios):

1. Controles 1–3 y 5–9 de `validar.sql` en `OK`, ejecutados antes de reabrir la aplicación.
2. Reporte de rechazos (control 4, `INFO`, y la tabla `migracion.rechazos`) revisado y aprobado
   por el cliente.
3. sha256 del archivo de origen igual antes y después.
4. Respaldo previo disponible con su manifiesto y sha256 (sección 3.4, paso 3).
5. Aplicación reabierta y estado `healthy` del servicio `backend` (sección 3.4, paso 6).
6. Evidencias registradas en la columna «Migración real» de la tabla siguiente.

| Evidencia (Semana 5) | Ensayo A: 17 filas (14/10/2026) | Ensayo B: `clientes_legado.csv`, 100 filas (14/10/2026) | Migración real |
|---|---|---|---|
| Filas cargadas en staging | 17 de 17 (staging idéntico al CSV byte a byte) | 100 de 100 | *Pendiente de ejecución* |
| Migrados / rechazados | 4 / 13 (conciliación 17 = 4 + 13) | 72 / 28 (conciliación 100 = 72 + 28) | *Pendiente de ejecución* |
| Controles 1–9 de `validar.sql` | 8 `OK` + 1 `INFO` (control 4) en las ejecuciones 1 y 2 | Ejec. 1, script original: control 6 `FALLA`. Ejec. 2, corregido: 8 `OK` + 1 `INFO` | *Pendiente de ejecución* |
| Prueba de `rollback.sql` | `OK`: borró los 4 migrados y los 2 preexistentes quedaron intactos; 6 condiciones de bloqueo verificadas en copias (2.10) | `OK` en las dos ejecuciones: borró 72 + 72 y los preexistentes quedaron intactos; aborto con dependencia verificado | *Pendiente de ejecución* |
| Duración | `transformar.sql`: 14 ms para 17 filas (ejecución 2; la ejecución 1 no registró la duración por el defecto descrito en 2.10); no extrapolable al volumen real | `transformar.sql`: 18,9 ms (ejec. 1) y 18,2 ms (ejec. 2) para 100 filas; no extrapolable | *Pendiente de ejecución* |
| Respaldo previo y restauración | No aplica al ensayo (base desechable) | No aplica (base desechable) | *Pendiente de ejecución* |
| Aprobación del reporte de rechazos | No aplica (datos sintéticos) | No aplica (datos sintéticos) | *Pendiente* |

### 2.10 Resultados de las pruebas (ensayo del 14/10/2026)

**Fuente de la evidencia.** Los resultados de esta sección provienen del informe de la sesión de
ensayo del 14/10/2026. Las salidas de consola de esa sesión **no están versionadas** en el
repositorio. Se pueden comprobar directamente en los archivos: la revisión Alembic `b8d1c4f7a2e9`
(`alembic heads`), el contenido actual de los cuatro scripts y la corrección con
`clock_timestamp()` en `transformar.sql` y `rollback.sql`. Los conteos, horas y mensajes que
siguen son los observados durante el ensayo.

**Entorno.** Pruebas hechas el 14/10/2026 entre las 19:46 y las 19:49 UTC. Se usó un contenedor
desechable `rehni-migtest-pg` (`postgres:17-alpine`) en una red Docker interna creada para la
prueba (`--internal`, sin puertos publicados), con la base `rehni_migtest` y un usuario y una
contraseña aleatoria propios de la prueba. El esquema se creó con las migraciones Alembic reales
del repositorio (`alembic upgrade head` → revisión `b8d1c4f7a2e9`, 38 tablas), usando la imagen
`rehni-market-backend`. No se conectó con `rehni-postgres` ni con ninguna base con datos reales.
Al terminar se eliminaron el contenedor, su volumen y la red.

**Datos de prueba (sintéticos, dominio `.test`):**

- 2 usuarios preexistentes: `preexistente@rehni.test` (rol `user`) y `Mixto@Rehni.Test`
  (rol `company`, con mayúsculas). Los roles `user` y `company` se insertaron a mano, porque el
  seed de la aplicación no se ejecuta en esa base.
- CSV de 17 filas con: 4 registros válidos (uno con espacios y mayúsculas, otro con fecha
  `DD/MM/YYYY` y teléfono con `+57` y espacios); un correo duplicado con distinta capitalización;
  dos correos que ya existen en el destino (uno de ellos solo coincide sin distinguir
  mayúsculas); una fecha inexistente (`2023-02-30`), una fecha vacía, un formato no reconocido
  (`2023.08.01`) y una fecha futura; nombre vacío; correo vacío; correo sin `@`; teléfono corto;
  un nombre de 66 caracteres (el límite de `users."fullName"` es 50), y un registro con tres
  errores a la vez.

**Procedimiento seguido** (el mismo de la sección 2.9, cambiando solo el contenedor de destino):
`docker cp` del CSV y de `scripts/migracion/` a `/tmp/migracion/` del contenedor de pruebas, y
`psql -v ON_ERROR_STOP=1 -f /tmp/migracion/<script>.sql` con las variables de la sección 2.8. El
hash bcrypt se generó con `passlib` en un contenedor del backend sin red (`--network none`).

| Script | Fecha/hora (UTC) | Resultado observado | Errores y correcciones | Estado |
|---|---|---|---|---|
| [`carga-staging.sql`](../scripts/migracion/carga-staging.sql) | 14/10/2026 19:46:35 | `COPY 17`, `filas_cargadas = 17`. Los valores vacíos quedan como `NULL` y los espacios y mayúsculas se conservan. Al reexportar el staging a CSV, el resultado es idéntico byte a byte al archivo original. El sha256 del archivo es el mismo antes y después. | Ninguno | OK |
| [`transformar.sql`](../scripts/migracion/transformar.sql) | 19:46:50 (ejec. 1) · 19:48:11 (ejec. 2) | `COMMIT`. 4 insertados en `users`: `ana.gomez`, `luis.perez` (normalizado a partir de `  Luis   Pérez  ` / ` LUIS.PEREZ@Rehni.Test `), `dup` (primera ocurrencia) y `carlos.nunez` (`+573001234581`, fecha 01/09/2023). Todos con rol `user`, `verified = false` y hash `$2b$12$…`. 13 rechazos, una fila por registro: el de tres errores tiene `{CORREO_VACIO, TELEFONO_INVALIDO, FECHA_INVALIDA}` y cuenta una sola vez. Ninguna fila aparece a la vez como migrada y como rechazada. Los hashes de los 2 preexistentes no cambian. | **Defecto en la ejecución 1:** `ejecuciones.fin` era igual a `inicio` porque `now()` devuelve la hora de inicio de la transacción, así que no se podía medir la duración. Se corrigió con `clock_timestamp()` (también en `rollback.sql` para `fin_rollback`). Ejecución 2 tras la corrección: duración de 14 ms, mismos conteos. | OK (tras corregir) |
| [`validar.sql`](../scripts/migracion/validar.sql) | 19:47:07 (ejec. 1) · 19:48:11 (ejec. 2) | Ejecución 1: control 1 `OK` (17 = 4 + 13); 2 `OK`; 3 `OK` (2 + 4 = 6); 4 `INFO` (FECHA_INVALIDA 3, CORREO_VACIO 2, YA_EXISTE_DESTINO 2 y 1 de cada uno de los demás motivos); 5 a 8 `OK`; 9 `OK` (hash esperado = obtenido). La ejecución 2 dio el mismo resultado. **Prueba negativa en una copia:** al alterar el teléfono de un preexistente y poner en mayúsculas el correo de un migrado, los controles 6, 8 y 9 dieron `FALLA`, lo esperado. | Ninguno | OK |
| [`rollback.sql`](../scripts/migracion/rollback.sql) | 19:47:48 (ejec. 1) · 19:48:12 (ejec. 2) | Antes de borrar se comprobó que identificaba exactamente los 4 `user_id` de la ejecución, ninguno en la línea base y todos sin cambios. Resultado: `COMMIT`, controles finales `OK`, `users` vuelve a 2 y los 2 preexistentes tienen los mismos hashes que antes de migrar. El estado pasa a `REVERTIDA` y `migracion` se conserva como evidencia. | Corrección de `fin_rollback` (ver arriba). | OK |

**Ejecuciones registradas.** Se mantienen separadas: la ejecución 1 se hizo con el defecto y la
ejecución 2 después de corregirlo.

| Ejecución | Versión de los scripts | Conteos | `fin - inicio` | Defecto | Rollback |
|---|---|---|---|---|---|
| 1 | Original (`fin = now()`) | 17 = 4 + 13 | `00:00:00`: no refleja la duración | **Sí**: `now()` devuelve la hora de inicio de la transacción | `REVERTIDA` (19:47:48) |
| 2 | Corregida (`clock_timestamp()`) | 17 = 4 + 13 | `00:00:00.014401` (14 ms) | No | `REVERTIDA` (19:48:12) |

La ejecución 2 se hizo sobre el mismo staging después de revertir la 1. Así se probó también la
repetición de `transformar.sql` tras un rollback.

**Pruebas negativas.** Se hicieron en **copias aisladas** de la base de pruebas
(`CREATE DATABASE … TEMPLATE rehni_migtest`) o en la propia base desechable, solo para comprobar
el comportamiento defensivo de los scripts.

- `validar.sql` (copia `neg_validar`): se cambió el teléfono de un usuario **preexistente** y se
  puso en mayúsculas el correo de un usuario **migrado**. Resultado: `FALLA` en el control 8 (por
  el preexistente) y en los controles 6 y 9 (por el migrado); los demás no cambiaron.
- Protecciones de los scripts: todas abortaron con `exit=3`, sin borrar ni insertar nada.

| Condición provocada | Dónde | Mensaje obtenido | Estado tras la prueba |
|---|---|---|---|
| Billetera (`wallets`) creada para un usuario migrado | Copia `neg_rb_dep` | `wallets.user_id referencia 1 usuarios migrados: usar la restauración del respaldo.` | `users = 6`, `APLICADA` |
| Usuario migrado modificado (`verified = true`) | Copia `neg_rb_mod` | `1 usuarios migrados cambiaron tras la carga: usar la restauración del respaldo.` | `users = 6`, `APLICADA` |
| `id_ejecucion` inexistente (99) o ya `REVERTIDA` (2) | Base de pruebas | `La ejecución … no existe o no está APLICADA.` | Sin cambios |
| Recargar staging con una ejecución `APLICADA` | Base de pruebas | `El esquema migracion contiene una ejecución APLICADA; no se recarga.` | Staging intacto (17) |
| Repetir `transformar.sql` con una ejecución `APLICADA` | Base de pruebas | `Ya existe una ejecución APLICADA para esta carga.` | `users = 6` |
| Falta el rol `user` (transacción a medias) | Copia `neg_tx` | `No existe el rol user en public.roles.` | Ningún usuario ni ejecución nueva |

**Conciliación final:** origen 17 = migrados 4 + rechazados 13 en las dos ejecuciones, sin
registros contados dos veces. El control 4 dio `INFO` con 13 rechazos en total (3 + 2 + 2 + 6 × 1),
que coincide con el control 1. **Rollback:** borrado selectivo correcto en las dos ejecuciones; la
base de pruebas termina con los 2 usuarios preexistentes sin cambios.

#### Ensayo B: `clientes_legado.csv` de 100 filas y corrección de la normalización de nombres (14/10/2026)

**Origen.** Al preparar `clientes_legado.csv` (raíz del repositorio, 100 clientes sintéticos con
dominio `.test`, SHA-256 `a245d0677197c1f1feba09b75e4a83fe06463efd0f6a1f0a71e4b3de0d65890c`) se
incluyó la fila `CL0003`, cuyo nombre empieza por un tabulador (`\tMaría  José   Ríos`).

**Defecto.** `transformar.sql` normalizaba con `regexp_replace(btrim(nombre), '\s+', ' ', 'g')`.
`btrim()` sin argumentos solo elimina espacios, no tabuladores; después `regexp_replace` convertía
el tabulador inicial en un espacio, que quedaba en el valor insertado.

**Corrección.** Se invirtió el orden: `btrim(regexp_replace(nombre, '\s+', ' ', 'g'))`. Así toda
secuencia de espacios en blanco (`\s`: espacio, tabulador, saltos de línea) se reduce a un espacio
y después se recortan los extremos. Los límites de longitud y las demás reglas no cambian, porque
se evalúan sobre el valor ya normalizado. Solo se modificó `transformar.sql`. El control 6 de
`validar.sql` ya detectaba cualquier valor no canónico (lo demostró la ejecución 1), así que no
necesitó cambios. Los otros tres scripts son idénticos a los del ensayo A.

**Entorno.** Igual que en el ensayo A: contenedor desechable `rehni-migtest-pg`
(`postgres:17-alpine`), red Docker `--internal` sin puertos publicados, base `rehni_migtest`,
esquema Alembic `b8d1c4f7a2e9` (38 tablas), 2 usuarios preexistentes sintéticos
(`preexistente@rehni.test` y `Mixto@Rehni.Test`) y roles `user` y `company` insertados a mano.
Pruebas entre las 20:21 y las 20:22 UTC. El entorno se eliminó al terminar. No hubo conexión con
`rehni-postgres`. La numeración de ejecuciones empieza de nuevo porque es otra base.

| Paso | Hora (UTC) | Resultado observado |
|---|---|---|
| `carga-staging.sql` | 20:21:53 | `COPY 100`, `filas_cargadas = 100` |
| `transformar.sql` **original** (ejec. 1) | 20:21:53 | `COMMIT`; 72 migrados y 28 rechazados. `CL0003` insertado como `[ María José Ríos]`, con espacio inicial |
| `validar.sql` (ejec. 1) | 20:21:54 | Controles 1–3, 5, 7–9 `OK`; 4 `INFO`; **6 `FALLA` (1 registro incumple)**. Defecto reproducido |
| `rollback.sql` (ejec. 1) | 20:22:05 | `COMMIT`; 0 migrados restantes; preexistentes intactos |
| `transformar.sql` **corregido** (ejec. 2) | 20:22:05 | `COMMIT`; 72 migrados y 28 rechazados. `CL0003` → `[María José Ríos]` |
| `validar.sql` (ejec. 2) | 20:22:06 | Controles 1–3 y 5–9 `OK`; 4 `INFO` |
| `rollback.sql` (ejec. 2) | 20:22:19 | La vista previa identificó 72 usuarios (ninguno en la línea base, todos sin cambios); `COMMIT`; 0 restantes |

**Verificaciones adicionales de la ejecución 2:**

- `CL0001` (`  Ana   Gómez  `) → `Ana Gómez`. `CL0002` (`LUIS PÉREZ`) se conserva igual: la regla
  no cambia mayúsculas ni minúsculas (ver la sección 2.11). `CL0034`, con exactamente 50
  caracteres, se migra sin cambios.
- Ningún nombre migrado que ya estuviera en forma canónica cambió (0 casos).
- Las ejecuciones 1 y 2 migraron exactamente las mismas filas y rechazaron las mismas con los
  mismos motivos (diferencia 0 en ambos conjuntos). La corrección solo afecta al valor del nombre.
- Control 4 (`INFO`, 28 en total): FECHA_INVALIDA 7, CORREO_INVALIDO 4, TELEFONO_INVALIDO 4,
  DUPLICADO_ORIGEN 3, CORREO_VACIO 2, NOMBRE_VACIO 2, NOMBRE_EXCEDE_50 2, YA_EXISTE_DESTINO 2,
  CORREO_EXCEDE_50 1, FECHA_FUTURA 1. Coincide con el control 1.
- Los 2 preexistentes tienen, al terminar, el mismo hash de fila que antes de la primera
  migración.
- En una copia (`neg_rb_dep`) con una billetera asociada a un usuario migrado, `rollback.sql`
  abortó (`wallets.user_id referencia 1 usuarios migrados`) y la copia siguió con 74 usuarios y
  la ejecución `APLICADA`.
- SHA-256 de `clientes_legado.csv` igual antes y después del ensayo, también dentro del
  contenedor.

**Clasificación** (ensayos A y B):

- *Ejecutadas y verificadas:* los cuatro scripts con datos sintéticos (17 filas en el ensayo A y
  100 filas de `clientes_legado.csv` en el ensayo B); la corrección de la normalización de nombres; las pruebas negativas de
  `validar.sql`; las seis condiciones de bloqueo anteriores; repetir `transformar.sql` sobre el
  mismo staging después de un rollback (ejecución 2).
- *Fallidas:* la ejecución 1, por el registro de la hora de fin (corregido y vuelto a probar en
  la ejecución 2). Los conteos de la ejecución 1 eran correctos; lo único erróneo era la marca de
  finalización. No hubo errores de sintaxis SQL. Los `FALLA` de las pruebas negativas eran el
  resultado esperado y no son defectos. En el ensayo B, la ejecución 1 con el script original dio
  `FALLA` en el control 6 por el defecto de normalización de nombres; se corrigió y la ejecución 2
  dio el resultado esperado.
- *Pendientes:* el procedimiento completo de la sección 2.9 sobre la base del proyecto (con
  `scripts/backup_rehnimarket.sh` y la ventana de mantenimiento); la restauración del respaldo
  como contingencia (el rollback selectivo no la demuestra: es un mecanismo distinto); el
  comportamiento del `LOCK` con la aplicación en marcha; la alternativa con `\copy`; el inicio de
  sesión y la recuperación de contraseña de una cuenta migrada; la medición con el volumen real.
- *Limitaciones que dependen del sistema anterior o del cliente:* ver la sección 2.11.

#### Ensayo C: copia aislada de la base actual con `clientes_legado.csv` como origen (14/10/2026)

**Separación de fases.** *Extracción del sistema anterior:* no existe un sistema anterior
accesible (no hay base, servicio ni credenciales; `rehnimarket_prev` es la copia vacía que deja
`restore_rehnimarket.sh`). Por decisión del responsable del proyecto, el origen de la migración
es `clientes_legado.csv` (el mismo archivo del ensayo B; SHA-256 sin cambios
`a245d0677197c1f1…`). *Ensayos A y B:* datos sintéticos en una base desechable. *Ensayo C:* el
mismo archivo sobre una **copia completa de la base actual** (`pg_dump` de `rehnimarket`, 26
usuarios: 2 admin, 1 owner, 20 company, 3 user) restaurada en un contenedor `postgres:17-alpine`
desechable sin acceso a la red externa. *Migración en `rehnimarket`:* **no ejecutada**.

**Perfil del origen (recuentos, sin datos personales).** 100 filas, 5 columnas, todas con el
ancho correcto. No hay columna de estado de verificación ni de contraseña/hash: **no puede
conservarse un estado de verificación original porque el origen no lo tiene**. Vacíos: nombre 3,
correo 2, fecha 2, teléfono 2. Correos con formato inválido: 4. Filas con correo repetido: 4.
`codigo` único en las 100 filas.

**Resultados (`validar.sql`, controles 1–11):**

| Control | Resultado |
|---|---|
| 1. Conciliación | OK — origen 100 = migrados 73 + rechazados 27 |
| 2. Exclusión migrados/rechazados | OK — 0 |
| 3. users = línea base + migrados | OK — 26 + 73 = 99 |
| 4. Rechazos por motivo | FECHA_INVALIDA 7, CORREO_INVALIDO 4, DUPLICADO_ORIGEN 4, TELEFONO_INVALIDO 4, CORREO_VACIO 2, NOMBRE_EXCEDE_50 2, NOMBRE_VACIO 2, CORREO_EXCEDE_50 1, FECHA_FUTURA 1 (= 27) |
| 5. Sin emails duplicados en users | OK |
| 6. Reglas de normalización | OK |
| 7. Integridad referencial (rol `user`) | OK |
| 8. Preexistentes sin alterar | OK (además, huella md5 independiente de los 26 usuarios igual antes y después) |
| 9. Checksum normalizados = destino | OK |
| 10. Hash bcrypt único por migrado | OK — 73 hashes distintos, todos `$2a$` |
| 11. Migrados sin verificar | OK — 0 de 73 verificados (el destino queda con 26 verificados y 73 no verificados) |

No hubo `YA_EXISTE_DESTINO`: ningún correo del archivo coincide con los 26 usuarios actuales.
Duración de `transformar.sql`: ~11,5 s (dominada por bcrypt con coste 12).

**Login y recuperación de contraseña** (servicios reales del backend contra la copia, en una red
Docker interna; el envío de correo se sustituyó por una captura, no se envió ningún correo), dos
cuentas migradas:

1. Login con una clave cualquiera → `INVALID_CREDENTIALS` (nadie conoce la clave).
2. `forgot-password` → `reset-password` → OK.
3. Login con la clave nueva → `EMAIL_NOT_VERIFIED` y emisión del código de verificación.
4. `verify-email` → OK; login → OK, token emitido.

**Incidencia bloqueante — dominio `.test`.** Los 73 correos migrados son del dominio `rehni.test`.
Los esquemas de la API (`EmailStr`, librería email-validator) rechazan los dominios de uso especial
(`.test`), así que **por la API ninguna de estas cuentas puede iniciar sesión ni pedir la
recuperación de contraseña** (error 422). Además, un dominio `.test` nunca recibe correo. Los pasos
anteriores solo se completaron saltándose la validación del esquema (`model_construct`), lo que
prueba el mecanismo (hash, reset, verificación) pero **no** que las cuentas sean utilizables.

**Idempotencia y rollback (en una segunda copia limpia):** volver a ejecutar `transformar.sql` o
`carga-staging.sql` con una ejecución `APLICADA` aborta sin duplicar. `rollback.sql` borró los 73 y
dejó `users` idéntico al estado previo (huella independiente) con estado `REVERTIDA`. En la copia
donde se usaron las cuentas de prueba, `rollback.sql` **abortó** como se esperaba ("2 usuarios
migrados cambiaron tras la carga"), sin borrar nada. El entorno aislado y el volcado se eliminaron
al terminar.

#### Ensayo D: `clientes_legado.csv` con dominios de correo comunes (14/10/2026)

**Cambio del archivo de origen.** Para resolver la incidencia `.test` del ensayo C, por decisión
del responsable del proyecto se sustituyó el dominio de los 95 correos `rehni.test` (con sus
variantes de mayúsculas) por `gmail.com` (24), `hotmail.com` (18), `outlook.com` (24) y
`yahoo.com` (29). Solo cambia el dominio; la parte local, los espacios y el uso de mayúsculas se
conservan, y el dominio se elige por la parte local, así que los duplicados siguen siendo
duplicados y los defectos de prueba se mantienen. Los 3 correos sin `@` y los 2 vacíos no se
tocaron (uno de los que no tienen `@` contiene el texto `.test` y se sigue rechazando como
`CORREO_INVALIDO`).

- Original: `backups/clientes_legado.original_rehni-test.csv` (SHA-256 `a245d0677197c1f1…`,
  fuera de Git).
- Nuevo `clientes_legado.csv`: SHA-256 `b29efeac92531725…`.
- **Los datos siguen siendo sintéticos.** Las direcciones `@gmail.com`, `@hotmail.com`, etc.
  pueden pertenecer a personas reales: **no lanzar** recuperación de contraseña, verificación
  ni otros correos a estas cuentas, ni en pruebas ni en producción.

**Validador del backend (`EmailStr`):** acepta 95 de los 98 correos no vacíos. Rechaza los 3 que
no tienen `@`, que la migración ya rechaza.

**Ensayo en una copia aislada de la base actual** (contenedor desechable sin red, eliminado al
terminar): origen 100 = migrados 73 + rechazados 27, con el mismo desglose de motivos que el
ensayo C. **Controles 1–11 de `validar.sql`: todos OK**: 26 preexistentes intactos, 73 hashes
bcrypt distintos y 0 migrados verificados.

**Respaldo previo verificado (14/10/2026 20:55 UTC).** `scripts/backup_rehnimarket.sh` →
`TS = 2026-10-14_20-55`; `sha256sum -c` del volcado: coincide;
`scripts/restore_rehnimarket.sh 2026-10-14_20-55 --verify-only`: PostgreSQL VERIFICADO (38
tablas) y MinIO VERIFICADO (4351 objetos).

**Migración en `rehnimarket`: NO ejecutada.** El intento de ejecutar el paso 2 de la sección
2.12 fue bloqueado por la política de permisos del asistente antes de iniciarse: no se detuvo la
aplicación y no se escribió en la base. La ejecución queda a cargo del responsable con el
procedimiento de la sección 2.12.

### 2.11 Adaptaciones pendientes

La migración real **no está completada**. Pendientes:

- [ ] Obtener el extracto del sistema anterior y confirmar columnas, codificación, formatos de
  fecha, zona horaria y volumen.
- [x] Tratamiento de `verified`: el origen no lo informa → `verified = false`; se verifica en el
  primer login tras restablecer la contraseña (ensayo C).
- [x] Contraseñas: hash bcrypt único por cuenta, sin clave común (ensayo C).
- [x] Inicio de sesión y recuperación: el mecanismo funciona (ensayo C). La incidencia de los
  correos `.test` se resolvió cambiando los dominios del archivo (ensayo D). No enviar correos a
  estas direcciones: los datos son sintéticos.
- [ ] Ejecutar la migración en `rehnimarket` con el procedimiento de la sección 2.12 y registrar
  sus evidencias.
- [ ] Comprobar cómo se comporta la aplicación con el `LOCK TABLE public.users` activo durante la
  carga (no se probó con la aplicación en marcha).
- [ ] Ejecutar el procedimiento completo de la Semana 5 con respaldo previo y ventana de
  mantenimiento.
- [ ] Probar la restauración completa en un entorno aislado (`--verify-only`, sección 3.5).
- [ ] Registrar las evidencias de la ejecución real en la tabla de la sección 2.9.
- [ ] Decidir con el cliente si los nombres se normalizan en mayúsculas y minúsculas (por ejemplo,
  `LUIS PÉREZ`). Hoy la regla solo normaliza espacios.
- [ ] El correo se recorta con `btrim` (solo espacios). Un tabulador en el correo no se elimina:
  el registro se rechaza como `CORREO_INVALIDO` y no se inserta un dato incorrecto. Esto **no se
  probó** en los ensayos; queda por decidir con el cliente si debe normalizarse igual que el nombre.

Detalle y otras adaptaciones:

- Estructura real del sistema anterior (columnas, codificación, formatos de fecha, zona horaria
  y volumen): los scripts asumen las cinco columnas de la sección 2.2.
- Si el sistema anterior contiene también direcciones, pedidos u otras entidades, su mapeo a
  `addresses`, `orders`, etc. requiere un análisis adicional; este plan solo cubre clientes.
- Decisión del cliente sobre `verified = false` y sobre el acceso de las cuentas migradas
  (restablecimiento de contraseña); verificar que el flujo de recuperación de contraseña funciona
  con cuentas no verificadas antes de la Semana 5.
- Las cuentas migradas no tienen billetera ni carrito; se asume que la aplicación los crea cuando
  el usuario los necesita (*pendiente de verificar*).
- El ensayo de la sección 2.10 usó un CSV construido según los supuestos de la sección 2.2. Con el
  primer extracto real hay que repetir las cuatro pruebas y actualizar las reglas si los formatos
  no coinciden.
- La migración no puede darse por completa hasta ejecutar el procedimiento de la Semana 5 con los
  datos reales y obtener los controles 1–9 en `OK` y la aprobación del reporte de rechazos.

### 2.12 Cómo ejecutar la migración en `rehnimarket` (procedimiento verificado)

> **Estado:** procedimiento **verificado el 14/10/2026** en un contenedor PostgreSQL aislado,
> restaurado desde el respaldo `2026-10-14_20-55`, ejecutando estos mismos bloques (ver
> «Verificación del procedimiento» al final). **La migración en `rehnimarket` todavía no se ha
> ejecutado.**

**Cómo usarlo.**

- Los comandos son de **bash**. Si la terminal es fish, abrir antes una sesión bash con `bash` y
  pegar los bloques dentro.
- Pegar **un bloque cada vez**, en el orden de los archivos `.sql`: `carga-staging.sql` →
  `transformar.sql` → `validar.sql` → `rollback.sql` (solo si hace falta).
- No pasar al bloque siguiente si el anterior muestra `ERROR`.
- Todos los bloques deben ejecutarse en **la misma sesión**, porque comparten las variables `PG`,
  `PSQL`, `TS`, `SHA`, `ID` y `FALLAS`.
- No se escribe ninguna credencial: `psql` usa las variables de entorno del propio contenedor.

**Paso 0 — Respaldo previo verificado.** Detiene el backend durante el volcado y lo vuelve a
arrancar. Debe mostrar `La suma coincide` y `VERIFICADO`; si no, **no continuar**.

```bash
# Paso 0. Variables comunes y respaldo previo verificado.
cd ~/Escritorio/Rehni-Market
PG=rehni-postgres
PSQL='psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1'
bash scripts/backup_rehnimarket.sh
TS=$(ls -1t backups/postgres/rehni_market_postgres_*.dump | head -1 \
     | sed -E 's/.*rehni_market_postgres_(.*)\.dump$/\1/')
echo "TS=$TS"
(cd backups/postgres && sha256sum -c "rehni_market_postgres_${TS}.dump.sha256")
bash scripts/restore_rehnimarket.sh "$TS" --verify-only | grep -E "VERIFICADO|OK|ERROR"
```

**Paso 1 — Ventana de mantenimiento.** Detiene la aplicación y copia el CSV y los scripts al
contenedor (`COPY` lee rutas del servidor PostgreSQL). Debe mostrar
`SHA=b29efeac92531725…`; otro valor significa que el archivo cambió.

```bash
# Paso 1. Ventana de mantenimiento y copia de archivos al contenedor.
docker compose stop frontend backend
SHA=$(sha256sum clientes_legado.csv | cut -d' ' -f1)
echo "SHA=$SHA"
docker exec "$PG" mkdir -p /tmp/migracion
docker cp clientes_legado.csv "$PG":/tmp/migracion/clientes_legado.csv
docker cp scripts/migracion/. "$PG":/tmp/migracion/
```

**Paso 2 — `carga-staging.sql`.** Esperado: `COPY 100` y `filas_cargadas = 100`. Si ya hay una
ejecución `APLICADA`, aborta sin tocar nada.

```bash
# Paso 2. carga-staging.sql (esperado: filas_cargadas = 100).
docker exec "$PG" sh -c "$PSQL -f /tmp/migracion/carga-staging.sql"
```

**Paso 3 — `transformar.sql`.** Una única transacción. Esperado: `INSERT 0 27` (rechazos),
`INSERT 0 73` (usuarios), `COMMIT` e `ID=1` (si es la primera ejecución). Si algo falla, no queda
nada insertado. Tarda unos 12 s por el coste de bcrypt.

```bash
# Paso 3. transformar.sql (esperado: COMMIT) y captura del id de la ejecución.
docker exec -e SHA="$SHA" "$PG" sh -c \
    "$PSQL -v archivo_sha256=\"\$SHA\" -f /tmp/migracion/transformar.sql"
ID=$(docker exec "$PG" sh -c "$PSQL -Atc \
    \"SELECT id_ejecucion FROM migracion.ejecuciones WHERE estado = 'APLICADA'\"")
echo "ID=$ID"
```

**Paso 4 — `validar.sql` (solo lectura).** Guarda la salida en
`backups/validar_migracion_<TS>.txt`, que queda fuera de Git, y cuenta los controles en `FALLA`.
Esperado: controles 1–3 y 5–11 en `OK`, control 4 con 27 rechazos,
`CSV sin cambios: OK` y `Controles en FALLA: 0`.

```bash
# Paso 4. validar.sql (solo lectura): guarda la salida y cuenta los controles en FALLA.
docker exec -e ID="$ID" "$PG" sh -c \
    "$PSQL -v id_ejecucion=\"\$ID\" -f /tmp/migracion/validar.sql" \
    | tee "backups/validar_migracion_${TS}.txt"
test "$(sha256sum clientes_legado.csv | cut -d' ' -f1)" = "$SHA" \
    && echo "CSV sin cambios: OK" || echo "CSV sin cambios: FALLA"
FALLAS=$(grep -cE '\|\s*FALLA\s*\|' "backups/validar_migracion_${TS}.txt")
echo "Controles en FALLA: $FALLAS"
```

**Paso 5 — Decisión.** Ejecutar **solo uno** de los dos bloques siguientes, según `FALLAS`
(`echo $FALLAS`).

*5a — Si `FALLAS` es mayor que 0:* rollback selectivo de esta ejecución. Después **no reabrir la
aplicación**. Revisar la salida de `validar.sql` y la comprobación posterior del rollback: si
`Rollback: preexistentes intactos` da `FALLA` o el rollback termina en `ERROR`, restaurar el
respaldo del paso 0 con `bash scripts/restore_rehnimarket.sh "$TS"`.

```bash
# Paso 5a. SOLO si FALLAS > 0: rollback.sql (revierte solo esta ejecución).
docker exec -e ID="$ID" "$PG" sh -c \
    "$PSQL -v id_ejecucion=\"\$ID\" -f /tmp/migracion/rollback.sql"
# Si rollback.sql termina con ERROR, restaurar el respaldo del paso 0:
#   bash scripts/restore_rehnimarket.sh "$TS"
```

*5b — Si `FALLAS` es 0:* exporta el reporte de rechazos (solo fila, código y motivos, sin datos
personales) a `backups/`, reabre la aplicación y borra la copia del CSV en el contenedor.

```bash
# Paso 5b. SOLO si FALLAS = 0: reporte de rechazos (sin datos personales), cierre y limpieza.
docker exec -e ID="$ID" "$PG" sh -c "$PSQL -c \"\\copy (SELECT fila, codigo, motivo_principal, \
    array_to_string(motivos, ',') AS motivos FROM migracion.rechazos WHERE id_ejecucion = \$ID \
    ORDER BY fila) TO STDOUT WITH (FORMAT csv, HEADER)\"" > "backups/rechazos_migracion_${TS}.csv"
wc -l "backups/rechazos_migracion_${TS}.csv"   # esperado: 28 (encabezado + 27)
docker compose start backend frontend
docker exec "$PG" rm -rf /tmp/migracion
```

**Resultado esperado** (si `users` sigue con los mismos 26 usuarios del respaldo):

- Origen 100 = migrados 73 + rechazados 27.
- `users` pasa de 26 a 99.
- Las 73 cuentas nuevas tienen rol `user`, `verified = false` y un hash bcrypt propio.

Si entre tanto se registró alguien con uno de esos correos, aparecerá como `YA_EXISTE_DESTINO`
y las cifras cambiarán, pero la conciliación (control 1) debe seguir en `OK`.

**Después de la migración:**

- Las cuentas migradas entran con «¿Olvidaste tu contraseña?» y verifican el correo en el primer
  inicio de sesión.
- Los correos son sintéticos con dominios reales: no lanzar recuperaciones ni verificaciones de
  prueba contra ellos.
- Registrar en la tabla de evidencias de la sección 2.9:
  - el `TS` del respaldo;
  - el `ID` de la ejecución;
  - `backups/validar_migracion_<TS>.txt`;
  - `backups/rechazos_migracion_<TS>.csv`;
  - el SHA-256 del CSV.

**Verificación del procedimiento (14/10/2026).** Se extrajeron los bloques de esta sección y se
ejecutaron en un contenedor `postgres:17-alpine` sin red, restaurado desde el respaldo
`2026-10-14_20-55` (26 usuarios). Se usó una copia de trabajo del repositorio con `PG` apuntando
a ese contenedor. Se simularon solo `docker compose stop/start` y `backup_rehnimarket.sh`, que
actúan sobre el entorno real; ese respaldo y su `--verify-only` se habían ejecutado y verificado
antes (ensayo D).

- Sintaxis bash (`bash -n`) correcta en los 7 bloques.
- *Rama 5b:* pasos 0 → 1 → 2 → 3 → 4 → 5b. Resultados: `COPY 100`; `INSERT 0 27` / `INSERT 0 73`
  / `COMMIT`; `ID=1`; controles 1–11 en `OK`; `Controles en FALLA: 0`; `CSV sin cambios: OK`;
  reporte de rechazos de 28 líneas; `/tmp/migracion` eliminado. Estado final: 99 usuarios, 73 no
  verificados.
- *Rama 5a:* sobre una base recién restaurada, pasos 0 → 4. Antes del paso 4 se alteró a propósito
  un usuario preexistente. `validar.sql` dio `FALLA` en el control 8 y `FALLAS=1`. `rollback.sql`
  borró solo los 73 migrados (`REVERTIDA`, 26 usuarios). Su comprobación posterior señaló
  correctamente el usuario alterado, que es el caso en que hay que restaurar el respaldo.
- Esta revisión corrigió tres defectos de la versión anterior de esta sección:
  - `TS=<TS>` e `ID=<id_ejecucion>` eran errores de sintaxis en bash (`<` es una redirección).
  - Los pasos 5a y 5b estaban en el mismo bloque, así que al pegarlo entero siempre se ejecutaba
    el rollback.
  - La línea `bash` en medio del bloque abría una subshell durante el pegado.
- El entorno de verificación se eliminó al terminar.

---

## 3. Plan de respaldo (v0)

> **Estado:** procedimiento documentado a partir de la lectura de
> [`scripts/backup_rehnimarket.sh`](../scripts/backup_rehnimarket.sh) y
> [`scripts/restore_rehnimarket.sh`](../scripts/restore_rehnimarket.sh). Hay registro local de un
> respaldo generado (sección 3.5). **La restauración no se ha probado** como parte de este plan.
> Los parámetros de política (RPO/RTO, frecuencia, copias fuera del sitio, cifrado y
> responsables) están **pendientes de acordar**.

**Objetivo y alcance.** Disponer de una copia completa y verificable de los datos de RehniMarket
que permita volver a un punto anterior conocido. En este plan se usa sobre todo como contingencia
de la migración (sección 2.6): el respaldo previo a la Semana 5 es obligatorio. La diferencia con
el rollback selectivo está en la sección 2.6.

### 3.1 Qué se respalda

| Elemento | Ubicación | Método (según `backup_rehnimarket.sh`) | ¿Contiene datos personales? |
|---|---|---|---|
| Base de datos PostgreSQL completa (todos los esquemas, incluido `migracion` si existe) | Contenedor `rehni-postgres`, base `$POSTGRES_DB` | `pg_dump -F c -Z 6` ejecutado dentro del contenedor | Sí (usuarios, correos, teléfonos, direcciones, pedidos) |
| Objetos de MinIO, bucket `uploads` | Contenedor `rehni-minio` | `mc mirror` a un directorio local y empaquetado `tar.gz` | Posiblemente: incluye archivos subidos por usuarios y empresas, como imágenes de perfil (`users."profileImagen"`). *Clasificación pendiente* |

**No se respaldan** con estos scripts: los archivos `.env` ni otros secretos, la configuración de
Docker ni el código (que está en Git). Su resguardo queda *pendiente de definir*.

### 3.2 Objetivos

| RPO | RTO | Justificación (acordada con el cliente) |
|---|---|---|
| *Pendiente.* Con respaldos manuales, el RPO es el tiempo transcurrido desde el último `<TS>` | *Pendiente.* La restauración no se ha cronometrado (sección 3.5) | *Pendiente de acordar.* Dato de referencia: el respaldo registrado el 14/10/2026 tardó unos 49 s (18:01:29–18:02:18 UTC según `backups/backup.log`) |

### 3.3 Política

| Aspecto | Decisión |
|---|---|
| Tipo (completo / incremental / diferencial) | Completo: volcado lógico de toda la base y copia completa del bucket |
| Frecuencia y hora | *Pendiente.* El repositorio no programa el script (no hay cron ni temporizador); hoy se ejecuta a mano. Obligatorio justo antes de la migración (sección 2.9, paso 1) |
| Retención | El script conserva los `KEEP_DAILY` respaldos más recientes de cada tipo (por defecto 7) y **borra los anteriores** en cada ejecución. Es una retención por número de respaldos, no por días |
| Copia 1 — ubicación y medio | Disco local del anfitrión: `backups/` en la raíz del proyecto (variable `BACKUP_DIR`), con permisos `700` y excluido de Git (`.gitignore`) |
| Copia 2 — ubicación y medio | *Pendiente:* no implementada |
| Copia 3 (fuera del sitio) | *Pendiente:* no implementada |
| Cifrado | *Pendiente:* el script no cifra los archivos |
| Responsable (rol) | *Pendiente de confirmar* |

**Ejecución del respaldo.** El script no tiene línea *shebang*, así que se invoca con `bash`
desde la raíz del repositorio:

```bash
bash scripts/backup_rehnimarket.sh             # detiene el backend durante el volcado
bash scripts/backup_rehnimarket.sh --no-stop   # sin detener el backend (menor consistencia)
```

Variables opcionales que lee el script: `BACKUP_DIR`, `PG_CONTAINER`, `MINIO_CONTAINER`,
`BUCKET` y `KEEP_DAILY`.

**Comportamiento comprobado en el código:**

1. Comprueba que existen `rehni-postgres` y `rehni-minio` y que PostgreSQL acepta conexiones.
2. Detiene el servicio `backend` (salvo con `--no-stop`) y lo vuelve a arrancar al terminar.
   Los demás servicios no se detienen.
3. Genera el identificador `<TS>` en UTC con el formato `AAAA-MM-DD_HH-MM`. Dos respaldos en el
   mismo minuto usan el mismo nombre de archivo.
4. Archivos generados en `backups/`:
   - `postgres/rehni_market_postgres_<TS>.dump`, con `.sha256` y `.toc.txt` (índice de
     `pg_restore -l`);
   - `minio/rehni_market_minio_<TS>/` y `minio/rehni_market_minio_<TS>.tar.gz`, con `.sha256`;
   - `rehni_market_backup_<TS>.manifest.txt` (tamaños, tablas con datos, número de objetos y
     SHA-256);
   - `backup.log` (registro acumulado).
5. Verificación incluida: el volcado no está vacío y `pg_restore -l` lo lee. Esto confirma que
   el archivo es legible, **no que la restauración funcione**; para eso está la sección 3.5.

**Precaución para la migración:** la rotación puede borrar el respaldo previo a la migración si
después se generan más de `KEEP_DAILY` respaldos. Ese respaldo debe copiarse fuera de `backups/`
o conservarse con su `<TS>` anotado hasta cerrar la aceptación (sección 2.9).

### 3.4 Procedimiento de restauración

Uso según el propio script: `bash scripts/restore_rehnimarket.sh <TS> [--verify-only] [--minio-purge]`
(`--isolated` es un sinónimo de `--verify-only`). Necesita que existan **los dos** archivos del
`<TS>`: el `.dump` y el `.tar.gz` de MinIO.

1. **Detectar y decidir.** Aplicar la tabla de decisión de la sección 2.6. La restauración
   descarta todos los cambios posteriores al respaldo; la decide el responsable técnico con el
   cliente.
2. **Contener.** Cerrar el acceso de los usuarios: `docker compose stop frontend`. El script de
   restauración detiene y vuelve a arrancar el backend por sí mismo si estaba en marcha.
3. **Elegir el respaldo.** Localizar el `<TS>` (por ejemplo, el del paso 1 de la sección 2.9) y
   revisar su manifiesto:
   `ls backups/postgres/` y `cat backups/rehni_market_backup_<TS>.manifest.txt`. El script
   comprueba el SHA-256 de ambos archivos contra sus `.sha256`. **Si falta un `.sha256`, solo
   avisa y continúa**, así que hay que confirmar que existen antes de empezar.
4. **Respaldar el estado actual.** `bash scripts/backup_rehnimarket.sh` (genera otro `<TS>`).
   Además, la restauración real conserva la base anterior como `<POSTGRES_DB>_prev`. Esa copia
   **se borra en la siguiente restauración real**.
5. **Restaurar.**
   - Primero en un entorno aislado: `bash scripts/restore_rehnimarket.sh <TS> --verify-only`.
     Crea contenedores y red desechables (`rehni-restore-pg`, `rehni-restore-minio`,
     `rehni-restore-net`), restaura en ellos y los destruye al terminar. **No toca la base del
     proyecto.** Precaución: reutiliza las credenciales de los contenedores del proyecto y su red
     no es `--internal`.
   - Si el resultado es `OK`: `bash scripts/restore_rehnimarket.sh <TS>`. El script restaura en
     una base temporal `<POSTGRES_DB>_restore_tmp`. Solo si contiene tablas y `alembic_version`,
     termina las conexiones, renombra la base actual a `<POSTGRES_DB>_prev` y la temporal a
     `<POSTGRES_DB>`. Si algo falla, la base original queda sin cambios.
   - MinIO se restaura con `mc mirror --overwrite` **aunque la parte de PostgreSQL haya
     fallado**. Sin `--minio-purge`, los objetos creados después del respaldo permanecen; con
     `--minio-purge` se eliminan.
   - El script termina con código 0 solo si PostgreSQL y MinIO quedan `RESTAURADO` (o
     `VERIFICADO` en `--verify-only`). Cualquier otro resultado se trata como fallo (sección 2.6).
6. **Verificar.** Las comprobaciones del script son mínimas: al menos una tabla, presencia de
   `alembic_version` y presencia y tamaño de los objetos de MinIO. Hay que añadir:
   - Conteo de filas por tabla, comparado con los valores anotados antes de restaurar (tabla de
     la sección 3.5). Las consultas concretas están *pendientes de definir*.
   - Estado del backend: `docker inspect -f '{{.State.Health.Status}}' rehni-backend` debe
     devolver `healthy`. El *healthcheck* de `docker-compose.yml` consulta `/health/database`.
   - Si la restauración fue la contingencia de una migración, comprobar que `public.users` vuelve
     a su estado previo. Los controles 3 y 8 de `validar.sql` ya no aplican, porque el esquema
     `migracion` queda como estaba en el momento del respaldo.
7. **Reabrir y comunicar.** `docker compose start frontend`. Informar a los usuarios del punto en
   el tiempo al que se volvió y de los datos perdidos.
8. **Registrar.** El script de restauración **no escribe un archivo de log**: su salida se debe
   guardar a mano. Anotar el `<TS>`, la salida completa, la duración y la decisión sobre la base
   `<POSTGRES_DB>_prev`. Esa base no se borra hasta confirmar que la restauración es correcta.

### 3.5 Evidencia de restauración

**Respaldo generado (registro local, no versionado).** Según `backups/backup.log` y
`backups/rehni_market_backup_2026-10-14_18-01.manifest.txt` del entorno local:

| `<TS>` | Resultado del log | Tablas con datos (TOC) | Objetos MinIO | Tamaños | Duración |
|---|---|---|---|---|---|
| `2026-10-14_18-01` | `FIN backup … — OK` | 38 | 4351 | dump 1,6 MB · tar 14 MB | ~49 s |

Este registro demuestra que el respaldo se generó y que el volcado es legible. **No demuestra que
la restauración funcione.**

**Restauración: no probada en este plan.** `docs/docs++/PLAN_MIGRACION_REHNIMARKET.md` menciona
una prueba de restauración anterior con evidencias en `evidencias/backup/`, pero esa carpeta
**no existe en el repositorio**. Ese resultado no se puede verificar y no se toma como evidencia.

| Tabla | Filas en producción | Filas restauradas |
|---|---|---|
| *Pendiente* (`--verify-only` sobre un `<TS>` reciente) | *Pendiente* | *Pendiente* |

Tiempo de restauración medido: *Pendiente.*

### 3.6 Calendario de pruebas

| Prueba | Frecuencia | Responsable |
|---|---|---|
| `restore_rehnimarket.sh <TS> --verify-only` con conteo de filas | Antes de la Semana 5 (obligatoria, sección 2.9) y después con periodicidad *pendiente de acordar* | *Pendiente de confirmar* |
| Revisión del manifiesto y de los SHA-256 del último respaldo | En cada respaldo | *Pendiente de confirmar* |
| Restauración real (sin `--verify-only`) | Solo como contingencia (sección 2.6) | Responsable técnico con aprobación del cliente |

---

## 5. Plan de instalación (v0)

| # | Sección | Contenido |
|---|---|---|
| 1 | Alcance | |
| 2 | Ambientes | |
| 3 | Roles | |
| 4 | Prerrequisitos | *Ver sección 1 (ficha técnica, semana 1)* |
| 5 | Preparación | |
| 6 | Procedimiento | *Ver pasos abajo* |
| 7 | Migración de datos | *Ver sección 2* |
| 8 | Verificación | |
| 9 | Rollback | |
| 10 | Cronograma | *Ver tabla abajo* |

### Procedimiento

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | *Verificar requisitos del servidor* | *`bash scripts/verificar-requisitos.sh`* | *Código de salida 0* |
| 2 | | | |

### Cronograma de la ventana

| Fase | Duración | Acumulado |
|---|---|---|
| | | |

Punto de no retorno:

## 3. Plan de respaldo — Semanas 2 y 6 (CE-4)

<!-- 📝 Qué se respalda, frecuencia, RPO/RTO, regla 3-2-1, herramienta, cifrado, retención,
procedimiento de restauración probado. -->

El contenido v0 de esta sección (alcance, procedimiento de respaldo y de restauración) está en
«3. Plan de respaldo (v0)» del entregable S02. Siguen pendientes para la Semana 6 la regla 3-2-1
(copias 2 y 3), el cifrado, la programación, el RPO/RTO acordado y la prueba de restauración.

## 4. Hosting y dominio — Semana 3 (CE-1)

<!-- 📝 Tipo de hosting elegido y justificación, dominio, registros DNS, reverse proxy, HTTPS,
método de transferencia de archivos. -->

## 5. Plan de instalación y despliegue — Semanas 2 y 4 (CE-1, CE-5)

<!-- 📝 Prerrequisitos, pasos numerados y verificables para instalar en servidor local y en la
nube, versión liberada, costos estimados. Semana 10 (opcional): subsección 5.10 con la
instalación automatizada (cloud-init + Ansible). -->

## 6. Configuración y verificación — Semana 5 (CE-1)

<!-- 📝 Variables de entorno por ambiente (sin valores reales), servicios, healthchecks,
smoke tests. -->

## 7. Seguridad, usuarios y permisos — Semana 6 (CE-1)

<!-- 📝 Matriz de usuarios/roles (sistema operativo y base de datos), políticas de acceso,
firewall, manejo de secretos, resultados de pruebas de privilegios. -->

## 8. Pipeline de despliegue y monitoreo — Semana 7 (CE-1, CE-5)

<!-- 📝 Diagrama del pipeline, procedimiento de rollback, monitores configurados. -->

## 9. Mantenimiento, soporte y capacitación — Semana 8 (CE-5)

<!-- 📝 Plan de mantenimiento, niveles de soporte, plan de capacitación, enlaces a ayudas en
línea. -->

## 10. Aceptación y entrega — Semana 9 (CE-1 a CE-5)

<!-- 📝 Resultado de pruebas de aceptación, resultado del simulacro cruzado, acta de entrega
con niveles de servicio acordados. -->
