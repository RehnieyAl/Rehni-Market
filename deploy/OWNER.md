# Cuenta owner — RehniMarket

El **owner** (propietario) es la cuenta del dueño principal de la plataforma: el único rol que
puede cambiar el rol de otras cuentas (usuario ↔ administrador) y que ve todo el panel de
administración. Hay **uno solo** y se crea **directamente en PostgreSQL**, nunca por la API ni
por el registro de la web.

Todos los comandos se ejecutan en la VM, dentro de la carpeta del proyecto (`cd ~/Rehni-Market`),
con el stack arriba. Los valores entre `<…>` son marcadores: nunca escribas datos reales en el
repositorio.

## 1. Por qué solo hay uno: defensa en profundidad

| Capa | Qué impide | Dónde |
|---|---|---|
| Base de datos | Un segundo owner, aunque se inserte o actualice a mano o con dos transacciones simultáneas. Borrar o renombrar el rol `owner` | Columna `users.is_owner` calculada por trigger a partir de `roles.name`, índice único parcial `uq_users_single_owner` y trigger `roles_protect_owner` (`RehniMarket-backend/app/database/single_owner.py`, migración `d7e3f1a9c5b2`) |
| Backend | Asignar o quitar el rol owner, editar o bloquear la cuenta owner: responde **403** | `RehniMarket-backend/app/services/DashboardService/admin/UserService.py` |
| Frontend | El panel no ofrece el rol «Propietario» ni deja editar o bloquear la cuenta owner | `RehniMarket-frontend/src/features/admin/components/dashboard/user/` |

La base es la garantía real: aunque falle o se salte el backend, PostgreSQL rechaza el segundo owner
con `duplicate key value violates unique constraint "uq_users_single_owner"`. La columna se calcula
por el **nombre** del rol, no por un id fijo, así que la garantía vale aunque el rol cambie de id.

## 2. Requisitos

1. El stack arriba: `docker compose ps` con los cinco servicios en `healthy`.
2. Los roles creados (el backend los crea al arrancar, #53):

```bash
docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT (SELECT count(*) FROM roles), (SELECT count(*) FROM catalog), (SELECT count(*) FROM shipping_carriers);"'
```

Debe mostrar `4|120|4`. Si da `0|0|0`, el backend no arrancó con la versión actual: `git pull` y
`docker compose up -d --build --wait backend`.

## 3. Crear el owner

La clave se escribe sin que se vea (`read -rsp`) y llega a `psql` por una variable de entorno,
así que no queda en el historial de la terminal. Las demás variables tampoco son secretas, pero
van igual por el entorno para no tener problemas con espacios o tildes.

```bash
cd ~/Rehni-Market
read -rsp 'Clave del owner: ' OWNER_CLAVE; echo
export OWNER_CLAVE
export OWNER_CORREO='<correo-del-owner>' OWNER_NOMBRE='<nombre completo>' OWNER_TELEFONO='<10 dígitos>'

docker compose exec -T -e OWNER_CLAVE -e OWNER_CORREO -e OWNER_NOMBRE -e OWNER_TELEFONO postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v clave="$OWNER_CLAVE" -v correo="$OWNER_CORREO" -v nombre="$OWNER_NOMBRE" -v telefono="$OWNER_TELEFONO"' \
  < deploy/sql/crear-owner.sql

unset OWNER_CLAVE OWNER_CORREO OWNER_NOMBRE OWNER_TELEFONO
```

Reglas (las mismas del registro por la web): correo de hasta 50 caracteres; nombre de 3 a 50;
teléfono de 10 dígitos; clave de **8 a 72 bytes** con al menos una mayúscula, una minúscula y un
número. Son bytes, no caracteres: `ñ` o una tilde ocupan 2, así que una clave con muchas tildes
llega antes al límite. bcrypt solo usa los primeros 72 bytes.

Ejemplo de salida correcta:

```
BEGIN
CREATE EXTENSION
DO
INSERT 0 1
COMMIT
          correo          |  rol
--------------------------+-------
 <correo-del-owner>       | owner
(1 row)
```

`INSERT 0 1` indica que se creó. La salida nunca muestra la clave ni su hash. El script hace todo
en una transacción: si algo falla, `psql` se detiene con `ERROR:` y no se guarda nada.

### Convertir en owner una cuenta ya registrada

Si el responsable ya se registró en la web, el script se niega por defecto («El correo ya está
registrado»). Para convertir esa cuenta, agrega `-v convertir=true` al comando de arriba:

```bash
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v convertir=true -v clave="$OWNER_CLAVE" -v correo="$OWNER_CORREO" -v nombre="$OWNER_NOMBRE" -v telefono="$OWNER_TELEFONO"' \
```

La salida muestra `UPDATE 1`. La cuenta queda con el rol owner, verificada, activa y con la clave
que acabas de escribir (la anterior deja de servir).

## 4. Comprobar

```bash
docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT u.email, r.name AS rol, u.verified, u.\"isActive\", u.is_owner FROM users u JOIN roles r ON r.id = u.role_id WHERE u.is_owner;"'
```

Debe devolver **una** fila con `rol = owner`, `verified = t`, `isActive = t` e `is_owner = t`.

Luego, en <https://rehnimarket.duckdns.org>, iniciar sesión con el correo y la clave: el panel
debe abrir como **Panel Propietario**.

## 5. Restablecer la clave del owner

```bash
read -rsp 'Nueva clave del owner: ' OWNER_CLAVE; echo
export OWNER_CLAVE
docker compose exec -T -e OWNER_CLAVE postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -v clave="$OWNER_CLAVE"' <<'SQL'
BEGIN;
UPDATE users SET hashed_password = crypt(:'clave', gen_salt('bf', 12))
 WHERE is_owner
   AND octet_length(:'clave') BETWEEN 8 AND 72
   AND :'clave' ~ '[A-Z]' AND :'clave' ~ '[a-z]' AND :'clave' ~ '[0-9]';
DELETE FROM "refreshToken" WHERE user_id IN (SELECT id FROM users WHERE is_owner);
COMMIT;
SQL
unset OWNER_CLAVE
```

`UPDATE 1`: clave cambiada; además se cierran las sesiones abiertas del owner (`DELETE n`).
`UPDATE 0`: la clave no cumple las reglas de la sección 3 y no se cambió nada.

## 6. Transferir el owner a otra persona

La nueva persona debe estar registrada en la web. En una sola transacción, el owner actual pasa a
administrador y la cuenta nueva pasa a owner; si el correo no existe, no se cambia nada.

```bash
export OWNER_NUEVO='<correo-del-nuevo-owner>'
docker compose exec -T -e OWNER_NUEVO postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -v nuevo="$OWNER_NUEVO"' <<'SQL'
BEGIN;
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin') WHERE is_owner;
UPDATE users
   SET role_id = (SELECT id FROM roles WHERE name = 'owner'), verified = true, "isActive" = true
 WHERE email = :'nuevo';
SELECT count(*) = 1 AS un_solo_owner FROM users WHERE is_owner \gset
\if :un_solo_owner
COMMIT;
\else
\warn 'No hay ninguna cuenta con ese correo: no se cambió nada.'
ROLLBACK;
\endif
SELECT u.email AS correo, r.name AS rol FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name IN ('owner', 'admin') ORDER BY r.name;
SQL
unset OWNER_NUEVO
```

El orden importa: primero se quita el rol al owner actual y después se asigna al nuevo; al revés,
el índice único rechazaría el segundo `UPDATE`.

## 7. Errores frecuentes

| Mensaje | Causa | Qué hacer |
|---|---|---|
| `Ya existe un owner: RehniMarket admite uno solo` | Ya hay un owner | Comprobar con la consulta de la sección 4; para cambiarlo, sección 6 |
| `El correo ya está registrado. Para convertir esa cuenta en owner, agrega -v convertir=true` | El correo es de una cuenta existente | Sección 3, «Convertir en owner una cuenta ya registrada» |
| `No hay ninguna cuenta con ese correo para convertir en owner` | `convertir=true` con un correo que no existe | Quitar `-v convertir=true` para crearla |
| `La clave debe tener entre 8 y 72 bytes (tiene N)` | Clave corta o demasiado larga (en bytes) | Otra clave; las tildes y la `ñ` cuentan 2 bytes |
| `La clave debe tener al menos una mayúscula, una minúscula y un número` | Clave débil | Otra clave |
| `El nombre debe tener entre 3 y 50 caracteres` / `El correo tiene N caracteres; el máximo es 50` | Columnas de 50 caracteres | Acortar |
| `El teléfono debe tener exactamente 10 dígitos` | Formato del teléfono | Solo dígitos, sin espacios ni `+57` |
| `No existe el rol owner: arranca el backend` | La base no tiene los datos base | Sección 2 |
| `Falta -v correo=…` (o nombre, telefono, clave) | Una variable de entorno vacía o mal escrita | Revisar los `export` |
| `duplicate key value violates unique constraint "uq_users_single_owner"` | Se intentó un segundo owner a mano | Es la protección de la base; usar la sección 6 |
| `El rol owner no se puede borrar` / `… renombrar` | `DELETE` o `UPDATE` sobre `roles` | No se hace: el rol owner es parte de los datos base |
| El inicio de sesión falla con la clave correcta | La cuenta no está verificada o activa, o la clave no es la que se escribió | Consulta de la sección 4; restablecer con la sección 5 |
| La API responde 403 «La cuenta owner solo se administra desde la base de datos» | Se intentó editar o bloquear al owner, o asignar el rol owner, desde el panel | Usar este documento |
