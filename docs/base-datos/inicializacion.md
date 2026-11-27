# Datos iniciales: roles, catálogo y owner

Con `RUN_SEED=false` (producción), el backend **no siembra nada al arrancar**: solo aplica las migraciones. En una
base nueva, los datos iniciales se crean a mano y en este orden:

```text
servicios en marcha → roles (opción 1) → catálogo y transportadoras → owner (opción 2) → verificación (opción 3)
```

Nada de esto se ejecuta solo, ni al arrancar ni al desplegar. Todos los pasos se pueden repetir: no duplican, no
modifican ni borran lo que ya existe.

## 1. El menú

```bash
bash scripts/database/inicializar.sh                    # local, desde la raíz del repositorio
ssh -t rehni-prod bash /opt/rehnimarket/scripts/database/inicializar.sh   # Azure (terminal interactiva)
```

```text
========================================
       REHNIMARKET - DATOS INICIALES
========================================

1. Inicializar roles
2. Crear owner único y activo
3. Verificar roles y owner
0. Salir
```

Requisitos: `postgres` y `backend` en marcha, y la cuenta que lo ejecuta dentro del grupo `docker`. Mientras no se
complete la migración del servidor, en Azure se ejecuta con `sudo -u rehniops -H bash …`
([../instalacion/instalacion-servidor.md](../instalacion/instalacion-servidor.md) §6).

### Opción 1 · Inicializar roles

1. Comprueba que PostgreSQL acepta conexiones y que la base está en la última migración: compara
   `alembic_version` con `alembic heads` del backend.
2. Compara los roles de [`deploy/sql/crear-roles.sql`](../../deploy/sql/crear-roles.sql) con los que define el
   backend (`app/utils/seed_roles.py`): `admin`, `company`, `owner` y `user`. Si no coinciden, no inserta nada.
3. Ejecuta el SQL en una transacción, con `ON CONFLICT (name) DO NOTHING`: un rol que ya existe conserva su `id` y
   sus cuentas.

El rol `owner` es un rol del modelo. La base lo protege con triggers: no se puede borrar ni renombrar.

### Catálogo y transportadoras

```bash
bash scripts/datos-base.sh             # local o en /opt/rehnimarket; resultado: roles 4, catalog 120, shipping_carriers 4
```

Si no se ejecuta, la tienda no tiene categorías para publicar productos ni transportadoras para los envíos. Con las
variables `OWNER_*` del `.env` vacías, que es lo normal en producción, este paso **no** crea ningún owner.

### Opción 2 · Crear owner único y activo

1. Comprueba que existe el rol `owner` y que **no hay ningún owner**, ni siquiera con otro correo. Si ya hay uno, no
   lo toca.
2. Pide el correo, el nombre, el teléfono (10 dígitos) y la clave dos veces, sin mostrarla.
3. Ejecuta [`deploy/sql/crear-owner.sql`](../../deploy/sql/crear-owner.sql) en una transacción:
   - **Validación:** valida con las reglas del registro. El correo se guarda en minúsculas, y la clave debe tener
     de 8 a 72 bytes con mayúscula, minúscula y número.
   - **Contraseña:** calcula un hash bcrypt (`crypt` y `gen_salt('bf', 12)`), que `verify_password` del backend
     acepta. Crea la cuenta activa y verificada.
   - **Creaciones simultáneas:** un `pg_advisory_xact_lock` pone en fila dos ejecuciones a la vez. El índice único
     `uq_users_single_owner` es la garantía final.
4. Comprueba que queda **exactamente un** owner.

La clave llega al contenedor solo por la variable de entorno `OWNER_CLAVE` (`\getenv` en el SQL): no aparece en los
argumentos de psql, en la salida ni en el historial de la terminal. El correo no está escrito en el repositorio: se
escribe al ejecutar el menú.

### Opción 3 · Verificar

Muestra solo los roles, la cantidad de owners, el correo del owner y si está activo y verificado. Nunca muestra
hashes ni claves.

Después, iniciar sesión con el owner en la web: debe abrir el **Panel Propietario**.

## 2. Errores frecuentes

| Mensaje | Causa |
|---|---|
| `el servicio postgres no está en marcha` | `docker compose up -d --wait` (local) o `sudo rehnimarket start` (Azure) |
| `la base no está en la última migración` | El backend aplica las migraciones al arrancar: revisar sus logs |
| `crear-roles.sql no coincide con app/utils/seed_roles.py` | Se añadió un rol en el backend: actualizar el SQL en el mismo cambio |
| `no existe el rol owner` | Falta la opción 1 |
| `ya existe un owner` | Solo se admite uno. Para restablecer su clave o transferirlo: [`deploy/OWNER.md`](../../deploy/OWNER.md) §5 y §6 |
| `El correo ya está registrado` | Para convertir esa cuenta en owner: `crear-owner.sql -v convertir=true` ([`deploy/OWNER.md`](../../deploy/OWNER.md) §3) |
| `La clave debe tener…` o `El teléfono debe tener…` | No se guardó nada; repetir la opción 2 con datos válidos |

## 3. Pruebas

- `RehniMarket-backend/tests/test_crear_owner_sql.py` y `test_single_owner.py` cubren el SQL del owner. Se ejecutan
  en el CI con psql: creación, idempotencia, inicio de sesión por la API, clave desde `OWNER_CLAVE`, límite de 72
  bytes, datos inválidos y conversión de una cuenta.
- El menú se puede probar contra una base desechable del mismo PostgreSQL con `DB_NAME=<base> bash
  scripts/database/inicializar.sh`, después de migrarla con
  `docker compose exec backend sh -c 'URL_DATABASE="${URL_DATABASE%/*}/<base>" uv run --no-sync alembic upgrade head'`.
