# Arquitectura de variantes y atributos — RehniMarket

Estado tras los Incrementos 1–5 de la evolución del modelo de productos.
Reemplaza el modelo anterior en el que **una variante era un color**.

## Modelo de datos

```
Catalog
 └─ CatalogAttribute            (por categoría; role = "variant" | "spec")
     └─ CatalogAttributeOption  (valores permitidos: "Verde", "40", "256 GB"…)

Product  ── attribute_values ──► ProductAttributeValue  (role="spec": {attribute, value})
   │
   └─ ProductVariant            (unidad comprable: price, stock, discount, combo_key, deleted_at)
        ├─ options ─────────────► VariantOption ──► CatalogAttributeOption   (role="variant")
        ├─ attribute_values ────► VariantAttributeValue                       (role="spec")
        └─ images ──────────────► ProductVariantImage
```

- **`CatalogAttribute.role`**
  - `variant` → eje de variante: cada valor puede tener stock/precio/imágenes
    propios; el comprador elige uno para comprar (Color, Talla, Almacenamiento,
    Plataforma, Edición…).
  - `spec` → descriptivo/filtrable, **no** genera inventario separado
    (Marca, Modelo, Compatibilidad…). Reemplaza a `SpecificationTemplate`.
- **`CatalogAttribute.input_type`**: `option` | `color` | `text` | `number`.
- **`ProductVariant.combo_key`**: `sha256` determinista de los `option_id`
  ordenados (`app/services/variants/combo_key.py`). Índice único parcial
  `uq_variant_product_combo_active (product_id, combo_key) WHERE deleted_at IS NULL`
  → dos variantes vivas del mismo producto no pueden compartir combinación;
  una dada de baja no bloquea recrearla.
- **`ProductVariant.deleted_at`**: soft-delete. Nunca se borra físicamente
  (lo referencia `OrderItem.variant_id` sin `ON DELETE CASCADE`). Una variante
  dada de baja no aparece en el dashboard, no se puede agregar al carrito ni
  comprar, pero el pedido que la compró sigue resolviendo.
- **`Product.main_color_id`**: color de presentación del producto, **independiente**
  del sistema de variantes.

## Reglas de negocio

- Una variante debe portar **exactamente una opción por cada eje `role="variant"`**
  del catálogo del producto (`resolver.resolve_option_set`).
- Cada opción debe pertenecer a un atributo `role="variant"` del catálogo del
  producto; una opción `role="spec"` no puede usarse como eje.
- Las especificaciones (`role="spec"`) se validan igual: pertenecer al catálogo,
  sin repetir el mismo atributo.
- Disponibilidad pública (`_has_visible_stock`): producto con variantes visible
  si existe al menos una variante **viva** con `stock > 0`.

## API

| Método | Ruta | Notas |
|---|---|---|
| GET | `/public/catalogs/{id}/attributes` | ejes de variante + specs de una categoría, con opciones |
| GET | `/public/products/{id}` | `attributes[]` (ejes) + `variants[].option_ids[]` |
| POST | `/company/dashboard/products/{pid}/variants` | body `optionIds` (JSON) + `specifications` `[{attributeId, value}]` |
| POST | `/company/dashboard/products/{pid}/variants/generate` | genera el producto cartesiano de opciones por eje, saltando las que existen |
| PATCH | `.../variants/{vid}` | `optionIds` reemplaza la combinación |
| DELETE | `.../variants/{vid}` | soft-delete |
| GET/POST/PATCH/DELETE | `.../variants/{vid}/specifications` | `attributeId` en vez de `specificationTemplateId` |
| CRUD | `/admin/dashboard/catalogs/{id}/attributes` y `.../catalog-attributes/{id}/options` | gestión Admin/Owner |

## Carrito / checkout / pedidos

- `CartItem` se identifica por `(cart_id, product_id, variant_id)`.
- La respuesta del carrito y del pedido incluyen `attributes[]` legibles
  (`[{name: "Color", value: "Verde"}, {name: "Talla", value: "40"}]`).
- `OrderItem.attributes_snapshot` (JSONB) congela esos pares en el checkout:
  el pedido conserva qué se compró aunque después se elimine la variante o se
  editen sus opciones.
- El checkout descuenta stock de la variante exacta y rechaza variantes
  soft-deleted.

## Frontend

- **Web / Mobile — detalle de producto**: un selector por cada `attribute`
  (swatches para `color`, pills para el resto). Se resuelve la variante por
  intersección exacta de `option_ids`. Deshabilitado inteligente: una opción se
  apaga si no hay variante con stock compatible con lo ya elegido.
  (`VariantAttributePicker.tsx`, `VariantSelector.tsx`).
- **Company Dashboard**: `VariantModal` con selectores dinámicos por eje;
  `GenerateVariantsModal` para crear la matriz de combinaciones.
- **Admin/Owner**: `AttributesModal` — define atributos (rol, tipo) y sus
  opciones por categoría.

## Migraciones

| Revisión | Qué hace |
|---|---|
| `e7a1c4b90f22` | tablas `catalog_attributes`, `catalog_attribute_options`, `variant_options`; columnas `combo_key`, `deleted_at`, `attributes_snapshot` |
| `e7a1c4b90f33` | backfill: colores → atributo "Color"; `variant.color_id` → `variant_option`; templates → `catalog_attributes(role="spec")`; `combo_key` |
| `e7a1c4b90f44` | índice único parcial de combinación (ignora soft-deleted) |
| `e7a1c4b90f55` | `product_attribute_values` / `variant_attribute_values` + backfill; drop de `product_specifications`, `variant_specifications`, `specification_templates` y `product_variants.color_id` |

Todas reversibles. Los datos existentes se preservan: productos, variantes,
stock, precios, descuentos, imágenes, carrito y pedidos siguen operativos, y las
variantes legadas quedan con su eje "Color" migrado.
