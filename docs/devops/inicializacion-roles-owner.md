# Inicialización de roles, datos base y owner

En producción, con `RUN_SEED=false`, el backend **no siembra nada al arrancar**: aplica las migraciones y nada más.
En una base nueva, los datos base se crean a mano y en este orden, porque cada paso necesita el anterior:

```text
PostgreSQL y backend en marcha → migraciones al día → init roles → init base → init owner → comprobación
```

Ninguno de los tres pasos se ejecuta solo, ni al arrancar ni al desplegar. Todos se pueden repetir: no duplican, no
modifican ni borran lo que ya existe.

> **Estado (2026-11-27).** Probado sobre una base temporal migrada hasta `b6d8f0a2c4e6`:
> - los roles dos veces seguidas, con 4 filas en ambas;
> - el owner sin roles, con datos inválidos, el caso correcto y un segundo owner;
> - el hash, verificado con `verify_password` del backend.
>
> En producción la base está vacía y estos pasos están pendientes.

## 1. Roles: `sudo rehnimarket init roles`

- **Requisitos:** `postgres` y `backend` en marcha, y la base en la última migración del código desplegado. El
  comando compara `alembic_version` con `alembic heads` y se detiene si no coinciden.
- **Qué hace:** ejecuta [`deploy/sql/crear-roles.sql`](../../deploy/sql/crear-roles.sql) en una transacción. Inserta
  `user`, `company`, `admin` y `owner` con `ON CONFLICT (name) DO NOTHING` y falla si al terminar no están los
  cuatro. Un rol que ya existe conserva su `id` y sus cuentas.
- **Por qué hay un rol `owner`:** es un rol del modelo (`app/utils/seed_roles.py`). La base lo protege con
  triggers: no se puede borrar ni renombrar.
- **Resultado esperado:** la lista `admin`, `company`, `owner`, `user`.

## 2. Catálogo y transportadoras: `sudo rehnimarket init base`

Ejecuta `scripts/datos-base.sh`, que llama a `ensure_base_data()` del backend. Crea los roles que falten, el
catálogo (120 categorías con sus especificaciones y atributos) si la tabla está vacía, y las 4 transportadoras si no
hay ninguna. Si no se ejecuta, la tienda no tiene categorías para publicar productos ni transportadoras para los
envíos. Con las variables `OWNER_*` vacías, que es lo normal en producción, **no** crea ningún owner.

Resultado esperado: `roles: 4`, `catalog: 120` y `shipping_carriers: 4`.

## 3. Owner: `ssh -t rehni-prod sudo rehnimarket init owner`

- **Requisitos:** terminal interactiva, rol `owner` existente y ningún owner creado.
- **Qué hace:**
  1. Pide nombre, correo, teléfono y la clave dos veces. La clave no se ve al escribirla.
  2. Envía los datos como JSON por la entrada estándar a [`scripts/ops/crear_owner.py`](../../scripts/ops/crear_owner.py),
     que se ejecuta dentro del contenedor `backend`. La clave no aparece en argumentos, variables de entorno,
     logs ni en el historial.
  3. Valida con las reglas del registro: correo de hasta 50 caracteres (se guarda en minúsculas), nombre de 3 a 50,
     teléfono de 10 dígitos, y clave de 8 a 72 bytes con mayúscula, minúscula y número.
  4. Calcula el hash con `hash_password()` del backend (bcrypt) y crea la cuenta verificada.
- **Resultado esperado:** `owner creado: <correo>` y la línea `<correo> -> owner`.
- **Validación:** iniciar sesión en <https://rehnimarket.duckdns.org>; debe abrir el **Panel Propietario**.

| Error | Causa |
|---|---|
| `no existe el rol owner` | Falta `init roles` |
| `ya existe un owner` | Solo se admite uno. No se crea otro ni se toca el actual; para transferirlo, ver `deploy/OWNER.md` §6 |
| `el correo ya está registrado` | Para convertir una cuenta existente se usa `deploy/sql/crear-owner.sql -v convertir=true` (`deploy/OWNER.md` §3) |
| `la base rechazó la cuenta` | Otro owner o el mismo correo se creó a la vez: el índice único `uq_users_single_owner` lo impide |

No cambia claves ni roles de cuentas existentes. Restablecer la clave o transferir el owner sigue siendo un
procedimiento aparte, en [`deploy/OWNER.md`](../../deploy/OWNER.md).

## 4. Comprobación

```bash
sudo rehnimarket exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT (SELECT count(*) FROM roles), (SELECT count(*) FROM catalog), (SELECT count(*) FROM shipping_carriers), (SELECT count(*) FROM users WHERE is_owner);"'
# 4|120|4|1
```
