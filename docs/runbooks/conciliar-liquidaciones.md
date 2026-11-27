# Runbook — Conciliar liquidaciones tras el cierre mensual en hora de Bogotá

> Estructura del referente `bc-implantacion` semana 8 (teoría 03, sección 6: síntoma, verificación,
> acciones con resultado esperado, escalamiento y cierre). Todas las consultas son de **solo
> lectura**. Corregir un importe o un enlace en producción **requiere autorización explícita**:
> [PENDIENTE: quién autoriza y fecha].

## Contexto

Hasta la migración `a4c6e8f0b2d4` (orders.payout_id), una liquidación sumaba las ventas `DELIVERED`
cuyo `created_at` caía en `[period_start, period_end + 1 día)` comparado en la zona horaria de la
sesión de PostgreSQL (UTC en el despliegue), y una venta se consideraba pagada si caía en la ventana
de **cualquier** liquidación. Desde esa migración:

- El mes de una venta es el mes calendario de **America/Bogota** (cierre a medianoche de Colombia).
- Cada venta pagada queda enlazada a su liquidación (`orders.payout_id`). Una venta sin enlace se
  liquida en su mes si aún no tiene liquidación o, si ya la tiene, en el **primer mes siguiente sin
  liquidación** (venta rezagada).
- Los reembolsos de devoluciones se reparten con un único plan cronológico por empresa: el importe
  que muestra el listado es el que se genera, sin importar el orden en que se generen los meses.

La migración enlaza las ventas con la **misma regla UTC** con la que se generaron las liquidaciones
existentes: lo ya liquidado sigue liquidado y ningún importe histórico cambia. Si dos liquidaciones
se solapan (H-07), la venta queda en la generada primero.

## Casos que requieren conciliación manual

| Caso | Qué pasó con la regla anterior | Qué pasa ahora |
|---|---|---|
| A. Venta entre las 19:00 y las 24:00 (Bogotá) del último día de un mes ya liquidado | Caía en el mes siguiente (UTC); si ese mes ya estaba liquidado, quedó pagada allí | Si quedó en una ventana, sigue enlazada a esa liquidación. Si no, es rezagada y entra en la siguiente liquidación que se genere |
| B. Venta de un mes liquidado que se entregó **después** de generar su liquidación | No se pagaba nunca: su fecha caía en un periodo ya liquidado | La migración la enlaza a esa liquidación (comportamiento heredado, no se paga). Revisar con la consulta 1 |
| C. Liquidaciones con periodos solapados | La misma venta podía sumar en dos | Queda enlazada solo a la primera; la segunda puede mostrar diferencia en la consulta 1 |
| D. Reembolso descontado por un mes posterior generado antes que uno anterior | El mes anterior mostraba un importe y se generaba otro | Determinista desde la migración; los descuentos ya hechos no se tocan |

## Síntoma

Una empresa reclama una venta no pagada o pagada dos veces, o el neto de una liquidación generada
antes del cambio no coincide con la suma de sus pedidos.

## Verificación

Ejecutar contra la base del entorno (`psql`), en una transacción de solo lectura:

```sql
BEGIN READ ONLY;
```

**1. Ventas enlazadas por liquidación frente a lo que se registró.** `gross_sales` ya es neto de
reembolsos: las ventas de la liquidación son `gross_sales + refunds_amount`.

```sql
SELECT p.id, c."nameCompany", p.period_start, p.period_end, p.payout_status,
       p.gross_sales + p.refunds_amount                        AS ventas_registradas,
       COALESCE(SUM(o.total), 0)                               AS ventas_enlazadas,
       COALESCE(SUM(o.total), 0) - (p.gross_sales + p.refunds_amount) AS diferencia,
       COUNT(o.id) FILTER (WHERE o.updated_at > p.created_at)  AS pedidos_cambiados_despues
FROM company_payouts p
JOIN company c ON c.id = p.company_id
LEFT JOIN orders o ON o.payout_id = p.id
GROUP BY p.id, c."nameCompany"
HAVING COALESCE(SUM(o.total), 0) <> p.gross_sales + p.refunds_amount
    OR COUNT(o.id) FILTER (WHERE o.updated_at > p.created_at) > 0
ORDER BY p.period_start;
```

Resultado esperado: **0 filas**. Una fila con `diferencia > 0` y `pedidos_cambiados_despues > 0`
es el caso B (venta entregada después de liquidar); con periodos solapados, el caso C.

**2. Ventas rezagadas pendientes** (sin liquidar, de un mes que ya tiene liquidación): entrarán en
la siguiente liquidación que se genere para la empresa.

```sql
SELECT c."nameCompany", o.order_number, o.total, o.created_at,
       (o.created_at AT TIME ZONE 'America/Bogota')::date AS fecha_bogota
FROM orders o
JOIN company c ON c.id = o.company_id
WHERE o.status = 'DELIVERED' AND o.payout_id IS NULL
  AND EXISTS (
    SELECT 1 FROM company_payouts p
    WHERE p.company_id = o.company_id
      AND p.period_start = date_trunc('month', o.created_at AT TIME ZONE 'America/Bogota')::date
  )
ORDER BY c."nameCompany", o.created_at;
```

**3. Ventas en la frontera horaria** (su mes en Bogotá y en UTC difieren) y su estado de pago.

```sql
SELECT c."nameCompany", o.order_number, o.total, o.created_at, o.payout_id IS NOT NULL AS liquidada,
       date_trunc('month', o.created_at AT TIME ZONE 'America/Bogota')::date AS mes_bogota,
       date_trunc('month', o.created_at AT TIME ZONE 'UTC')::date            AS mes_utc
FROM orders o
JOIN company c ON c.id = o.company_id
WHERE o.status = 'DELIVERED'
  AND date_trunc('month', o.created_at AT TIME ZONE 'America/Bogota')
   <> date_trunc('month', o.created_at AT TIME ZONE 'UTC')
ORDER BY o.created_at;
```

**4. Reembolsos aprobados aún sin descontar** (se repartirán en las próximas liquidaciones).

```sql
SELECT c."nameCompany", r.id, r.refund_amount, r.resolved_at,
       date_trunc('month', o.created_at AT TIME ZONE 'America/Bogota')::date AS mes_del_pedido
FROM return_requests r
JOIN orders o ON o.id = r.order_id
JOIN company c ON c.id = r.company_id
WHERE r.status = 'APPROVED' AND r.refund_amount IS NOT NULL AND r.payout_adjustment_id IS NULL
ORDER BY c."nameCompany", r.resolved_at;
```

```sql
ROLLBACK;
```

## Acciones

1. Si la consulta 1 devuelve 0 filas: no hay nada que conciliar. **Resultado esperado:** cierre.
2. Por cada fila de la consulta 1, revisar los pedidos con
   `SELECT id, order_number, total, status, created_at, updated_at FROM orders WHERE payout_id = '<id>'`
   y decidir con el owner si la venta del caso B se paga en la siguiente liquidación.
   **Resultado esperado:** decisión registrada con el id del pedido y de la liquidación.
3. Para pagar una venta del caso B (solo con autorización): quitar su enlace
   (`UPDATE orders SET payout_id = NULL WHERE id = '<pedido>'`) en una transacción revisada. Pasa a
   ser rezagada y entra en la siguiente liquidación. **Resultado esperado:** aparece en la consulta 2
   y en el neto del siguiente mes por generar del panel de Liquidaciones.
4. Las ventas de la consulta 2 no requieren acción: se pagan solas en la siguiente liquidación.
   Confirmar en el panel que el mes por generar incluye su importe.
5. No modificar `company_payouts` de liquidaciones pagadas: la diferencia se compensa en una
   liquidación posterior, nunca reescribiendo el histórico.

## Escalamiento

N2 (quien opera la base) ejecuta la verificación. Si una diferencia no corresponde a los casos A–D,
escalar a N3 (desarrollo) con: id de la liquidación, salida de las consultas 1–4 y fecha de la
migración `a4c6e8f0b2d4` en el entorno.

## Cierre

La consulta 1 devuelve 0 filas o cada fila tiene su decisión registrada; las ventas rezagadas de la
consulta 2 aparecen en el siguiente mes por generar. Registrar fecha, responsable y resultado:
[PENDIENTE: registro de la conciliación en producción].

## Ensayo en QA (26/11/2026)

Copia de la base de desarrollo restaurada en `postgres-test` (`rehni_audit`), sin tocar la base de
desarrollo ni producción: `alembic upgrade head` → `downgrade -1` → `upgrade head` sin errores.
1 liquidación histórica (septiembre de 2026, pagada, 17 520 000): 2 pedidos enlazados, importe sin
cambios; consultas 1–3 con 0 filas. La consulta 4 muestra 1 reembolso aprobado de 8 000 000 de un
pedido de septiembre: la liquidación de septiembre se generó antes de existir la compensación de
devoluciones, así que se descontará en la siguiente liquidación de esa empresa (hoy no tiene meses
por generar). Avisar a la empresa antes de que ocurra.
[PENDIENTE: ejecutar la verificación en producción antes y después del despliegue].
