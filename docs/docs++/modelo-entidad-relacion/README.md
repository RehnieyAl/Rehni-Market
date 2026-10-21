# Modelo entidad-relación — RehniMarket

`rehnimarket.dbml` es el modelo entidad-relación de la base de datos PostgreSQL de RehniMarket, escrito en **DBML** (Database Markup Language). Se generó leyendo el esquema real de la base `rehnimarket`, no los modelos del código.

| Contenido | Cantidad |
|---|---|
| Tablas | 37 (sin `alembic_version`) |
| Relaciones (llaves foráneas) | 67, con su regla `ON DELETE` |
| Enums | 11 |
| Grupos de tablas | 6 |

Además de las columnas, incluye los tipos, `pk`, `not null`, `unique`, valores por defecto, índices compuestos y parciales, restricciones `CHECK` y una nota que describe cada tabla.

## Cómo ver el diagrama

1. Abre **[dbdiagram.io/d](https://dbdiagram.io/d)**. No hace falta cuenta para probarlo.
2. Borra el ejemplo del editor de la izquierda.
3. Pega el contenido completo de `rehnimarket.dbml`.
4. El diagrama aparece a la derecha. Usa **Auto-arrange** para ordenarlo.
5. Para exportarlo: **Export → PNG / PDF / SQL (PostgreSQL)**.

Las tablas aparecen agrupadas por color según el dominio:

| Grupo | Tablas |
|---|---|
| `usuarios_y_acceso` | roles, users, event_codes, refreshToken, addresses, admin_activities |
| `empresas_y_finanzas` | company, company_bank_accounts, company_payouts, rehnicoin_movements |
| `catalogo_y_productos` | catalog, atributos, especificaciones, colores, products, product_variants y sus imágenes/valores |
| `compras_y_pedidos` | carts, cart_items, favorites, orders, order_items, shipping_carriers, return_requests, reviews |
| `billetera_rehnicoin` | wallets, wallet_transactions |
| `moderacion_y_marketing` | reports, report_evidences, advertisements |

## Notación de relaciones

| DBML | Significado |
|---|---|
| `>` | muchos a uno (N:1) |
| `-` | uno a uno (1:1), cuando la llave foránea es `unique` (p. ej. `users` ↔ `wallets`, `users` ↔ `company`) |

## Otras herramientas compatibles

- **[dbdocs.io](https://dbdocs.io)**: publica el mismo `.dbml` como documentación navegable (`npx dbdocs build rehnimarket.dbml`).
- **[drawSQL](https://drawsql.app)** y **[ChartDB](https://chartdb.io)**: importan SQL. Exporta primero el SQL desde dbdiagram.io (**Export → PostgreSQL**) y pégalo en la opción de importar.
