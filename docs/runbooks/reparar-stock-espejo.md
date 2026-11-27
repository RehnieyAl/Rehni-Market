# Runbook — Reparar el stock espejo de productos con variantes

> Estructura del referente `bc-implantacion` semana 8 (teoría 03: síntoma, verificación, acciones
> con resultado esperado, escalamiento y cierre). **Requiere autorización explícita** antes de
> escribir en producción: [PENDIENTE: quién autoriza y fecha].

## Contexto

`Product.stock` de un producto con variantes es un espejo: la suma del stock de sus variantes vivas.
Hasta la corrección del 23/11/2026 el checkout y la cancelación solo movían `ProductVariant.stock`,
y el padre podía quedar con un valor viejo. El código corregido (`app/services/variants/stock.py`)
mantiene el espejo desde ese despliegue, pero **no repara las filas que ya quedaron desfasadas**.

Diagnóstico de solo lectura por la API pública el 23/11/2026: 1 producto publicado ("telefono
gamer"), padre 10 = variantes 10, **sin desfase visible**. La API no muestra productos inactivos,
borrados ni de empresas suspendidas: el diagnóstico completo es la consulta del paso 2.

## Síntoma

La tarjeta pública muestra unidades (`stock` > 0) de un producto cuyas variantes están en 0, o al
revés; el conteo del catálogo no coincide con lo que se ve en la tarjeta.

## Precondiciones

| # | Condición | Cómo comprobarla |
|---|---|---|
| 1 | El backend con la corrección está desplegado. Si no, cada compra vuelve a desfasar el espejo | `docker compose exec backend grep -c sync_parent_stock app/services/commerce/CheckoutService.py` ≥ 1 |
| 2 | Ventana de bajo tráfico | [PENDIENTE: franja acordada] |
| 3 | Espacio para el respaldo | `df -h /opt/rehnimarket` |

## Acciones

Todas en el servidor: `cd /opt/rehnimarket`. Alias de solo esta sesión:

```bash
psqlp() { docker compose exec -T postgres sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 "$@"' sh "$@"; }
```

### 1. Respaldo completo

```bash
bash scripts/respaldar.sh --no-stop
```

**Resultado esperado:** un `.dump` nuevo en `backups/postgres/` y la línea correspondiente en
`backups/backup.log`. Sin respaldo, no seguir.

### 2. Diagnóstico (solo lectura)

```bash
psqlp -c "
WITH vivas AS (
  SELECT product_id, SUM(stock) AS suma, COUNT(*) AS variantes
  FROM product_variants WHERE deleted_at IS NULL GROUP BY product_id
)
SELECT p.id, p.name, p.is_active, p.deleted_at IS NOT NULL AS borrado,
       p.stock AS padre, COALESCE(v.suma, 0) AS suma_variantes,
       COALESCE(v.suma, 0) - p.stock AS diferencia, COALESCE(v.variantes, 0) AS variantes
FROM products p LEFT JOIN vivas v ON v.product_id = p.id
WHERE p.has_variants AND p.stock IS DISTINCT FROM COALESCE(v.suma, 0)
ORDER BY ABS(COALESCE(v.suma, 0) - p.stock) DESC;"
```

**Resultado esperado:** la lista de productos desfasados. Anotar el número de filas (N). Si N = 0,
no hay nada que reparar: ir a **Cierre**.

### 3. Copia de los valores actuales (para revertir)

```bash
psqlp -c "\copy (SELECT id, stock FROM products WHERE has_variants) TO STDOUT WITH CSV HEADER" \
  > backups/stock-espejo-antes-$(date +%F_%H-%M).csv
wc -l backups/stock-espejo-antes-*.csv
```

**Resultado esperado:** un CSV con una fila por producto con variantes, más el encabezado.

### 4. Reparación en una transacción

```bash
psqlp <<'SQL'
BEGIN;
-- Falla rápido en vez de frenar compras si algo tiene los candados.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- Mismo orden de candados que sync_parent_stock: no se cruza con un checkout en curso.
SELECT count(*) AS bloqueados
FROM (SELECT id FROM products WHERE has_variants ORDER BY id FOR UPDATE) AS candados;

UPDATE products p
SET stock = COALESCE((
  SELECT SUM(v.stock) FROM product_variants v
  WHERE v.product_id = p.id AND v.deleted_at IS NULL
), 0)
WHERE p.has_variants
  AND p.stock IS DISTINCT FROM COALESCE((
    SELECT SUM(v.stock) FROM product_variants v
    WHERE v.product_id = p.id AND v.deleted_at IS NULL
  ), 0);

-- Debe devolver 0 filas antes de confirmar.
SELECT p.id FROM products p
WHERE p.has_variants AND p.stock IS DISTINCT FROM COALESCE((
  SELECT SUM(v.stock) FROM product_variants v
  WHERE v.product_id = p.id AND v.deleted_at IS NULL
), 0);
SQL
```

La transacción queda **abierta a propósito**: el bloque no termina con `COMMIT`. `psql` la cierra
con `ROLLBACK` al salir, así que este primer pase es un ensayo. Confirmar que:

- el `UPDATE` reporta **N** filas (las del paso 2), y
- la consulta final devuelve **0 filas**.

Si ambas se cumplen, repetir el bloque reemplazando la última consulta por `COMMIT;`. Si el
`UPDATE` reporta otro número, no confirmar: volver al paso 2 (pudo haber compras entre medio).

**Resultado esperado:** `UPDATE N` y luego `COMMIT`.

### 5. Verificación posterior

```bash
# El diagnóstico del paso 2 debe devolver 0 filas.
bash scripts/smoke-test.sh
curl -s https://<dominio-api>/public/products?limit=5 | head -c 400
```

**Resultado esperado:** 0 filas desfasadas, humo en verde y tarjetas con el stock de sus variantes.

## Concurrencia y momento

- El paso 4 bloquea las filas de productos con variantes durante milisegundos (afecta a pocas
  filas). Un checkout que llegue en ese instante espera hasta 5 s por el candado y luego sigue; no
  se rechaza ninguna compra válida.
- No hay riesgo de bloqueo mutuo: el checkout corregido toma los candados de los padres en el
  mismo orden (`ORDER BY id`).
- Si un checkout confirma justo antes del `COMMIT`, su propio `sync_parent_stock` recalcula el
  padre con los datos ya confirmados: el resultado final es correcto en cualquier orden.
- Ejecutar **después** del despliegue de la corrección (precondición 1) y en la ventana de bajo
  tráfico (precondición 2).

## Reversión

Solo si la reparación causara un problema que no existía (el valor anterior era el incorrecto):

```bash
psqlp <<'SQL'
BEGIN;
CREATE TEMP TABLE stock_antes (id uuid PRIMARY KEY, stock integer);
\copy stock_antes FROM 'backups/stock-espejo-antes-AAAA-MM-DD_HH-MM.csv' WITH CSV HEADER
UPDATE products p SET stock = a.stock FROM stock_antes a WHERE p.id = a.id;
COMMIT;
SQL
```

`\copy` lee el archivo en el lado del cliente. Con `docker compose exec -T` el cliente corre
dentro del contenedor: copiar antes el CSV con `docker compose cp backups/<archivo>.csv
postgres:/tmp/` y usar `/tmp/<archivo>.csv` en la ruta. Último recurso: restaurar el `.dump` del
paso 1 con `scripts/restore_rehnimarket.sh`, que revierte **toda** la base a ese momento.

## Escalamiento

Si el `UPDATE` no coincide con el diagnóstico dos veces seguidas, o falla por `lock_timeout`
repetidamente: no forzar. Escalar a [PENDIENTE: rol responsable de la base de datos] con la salida
de los pasos 2 y 4.

## Cierre

Registrar en una incidencia de GitHub: fecha y hora, N filas reparadas, nombre del CSV y del `.dump`,
y la salida de la verificación.

Ensayado el 23/11/2026 en la BD QA desechable (`scripts/qa-movil-backend.sh`, 785 productos con
variantes del seed): se provocó un desfase en 4 productos; el diagnóstico devolvió 4, el ensayo sin
`COMMIT` no cambió nada, la reparación reportó `UPDATE 4` y dejó 0 desfases, y la reversión desde el
CSV volvió a los 4 valores anteriores.

Probado en producción por: [PENDIENTE: rol de quien lo ejecuta].
