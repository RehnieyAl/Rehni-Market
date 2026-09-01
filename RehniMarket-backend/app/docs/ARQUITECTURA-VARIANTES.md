# Arquitectura de variantes y atributos — RehniMarket

Estado tras el Incremento 4 (integración de interfaces Web + Dashboards).
Reemplaza, en el flujo funcional, el modelo anterior en el que **una variante era un color**.

Las estructuras legacy (`ColorVariant`, `SpecificationTemplate`, `ProductSpecification`,
`VariantSpecification`, `products.main_color_id`, `product_variants.color_id`) **siguen
existiendo** en modelo y base de datos por compatibilidad; ver la sección *Legacy*.

## Modelo de datos

```
Catalog
 └─ CatalogAttribute            (por categoría; role = "product" | "variant")
     └─ CatalogAttributeOption  (valores permitidos: "Rojo", "40", "256 GB"…; solo select/color)

Product  ── attribute_values ──► ProductAttributeValue  (atributos role="product": {attribute, value})
   │
   └─ ProductVariant            (unidad comprable: sku, price, stock, discount, combo_key, deleted_at)
        ├─ options ─────────────► VariantOption ──► CatalogAttributeOption   (role="variant")
        ├─ attribute_values ────► VariantAttributeValue                       (valores descriptivos)
        └─ images ──────────────► ProductVariantImage
```

- **`CatalogAttribute.role`**
  - `variant` → eje de variante: cada valor puede tener stock/precio/imágenes
    propios; el comprador elige uno para comprar (Color, Talla, Almacenamiento,
    Plataforma, Edición…).
  - `product` → atributo del producto principal; describe/filtra y **no** genera
    inventario separado (Marca, Modelo, Compatibilidad…).
- **`CatalogAttribute.input_type`**: `select` | `color` | `text` | `number`.
  Solo `select` y `color` admiten `CatalogAttributeOption`.
- **`ProductVariant.combo_key`**: `sha256` determinista de los `option_id`
  ordenados (`app/services/variants/combo_key.py`). Índice único parcial
  `uq_variant_product_combo_active (product_id, combo_key) WHERE deleted_at IS NULL AND combo_key IS NOT NULL`
  → dos variantes vivas del mismo producto no pueden compartir combinación;
  una dada de baja no bloquea recrearla. Índice análogo para `sku`.
- **`ProductVariant.deleted_at`**: soft-delete. Nunca se borra físicamente
  (lo referencia `OrderItem.variant_id` sin `ON DELETE CASCADE`). Una variante
  dada de baja no aparece por defecto en el dashboard, no se puede agregar al
  carrito ni comprar, pero el pedido que la compró sigue resolviendo.
- **Descuentos**: `discount_enable`, `discount_value`, `discount_type`
  (`percent` | `fixed`), `discount_starts_at`, `discount_ends_at` en `products`
  y en `product_variants`. El precio efectivo lo resuelve
  `app/services/pricing.py::resolve_price` (descuento de variante vigente →
  descuento de producto vigente → precio base). El frontend nunca lo recalcula.

## Reglas de negocio

- Una variante debe portar **exactamente una opción por cada eje `role="variant"`**
  del catálogo del producto (`resolver.resolve_option_set`).
- Cada opción debe pertenecer a un atributo `role="variant"` del catálogo del
  producto; una opción `role="product"` no puede usarse como eje.
- Los valores de atributo de producto (`role="product"`) se validan igual:
  pertenecer al catálogo, atributo activo, sin repetir el mismo atributo.
- Disponibilidad pública (`_has_visible_stock`): producto con variantes visible
  si existe al menos una variante **viva** con `stock > 0`.

## API

| Método | Ruta | Notas |
|---|---|---|
| GET | `/public/catalogs/{id}/attributes` | `product_attributes[]` + `variant_attributes[]` con opciones |
| GET | `/public/products/{id}` | `attributes[]` (role=product) + `variants[].options[]` |
| GET | `/company/dashboard/products/{pid}/available-attributes` | atributos del catálogo del producto por rol |
| GET/PUT | `/company/dashboard/products/{pid}/product-attributes` | valores role="product" del producto |
| PUT | `/company/dashboard/products/{pid}/discount` | descuento de producto (tipo + ventana) |
| POST/PATCH | `/company/dashboard/products/{pid}/variants[/{vid}]` | body JSON: `option_ids`, `attribute_values`, `sku`, precio, stock, descuento |
| POST | `.../variants/generate` | genera el producto cartesiano de opciones por eje, marcando las que ya existen |
| DELETE | `.../variants/{vid}` | soft-delete |
| GET/PUT | `.../variants/{vid}/attribute-values` | valores descriptivos de la variante |
| CRUD | `/admin/dashboard/catalogs/{id}/catalog-attributes` y `.../catalog-attribute-options/{id}` | gestión Admin/Owner |

## Carrito / checkout / pedidos

- `CartItem` se identifica por `(cart_id, product_id, variant_id)`.
- La respuesta del carrito incluye `sku`, `options[]` legibles
  (`[{attribute: "Color", value: "Rojo"}, …]`), `basePrice`, `unitPrice`,
  `discountPercentage`.
- `OrderItem.attributes_snapshot` (JSONB) congela la combinación comprada en el
  checkout (`{"Color": "Rojo", "Talla": "40"}`): el pedido conserva qué se
  compró aunque después se elimine la variante o se editen sus opciones.
- El checkout descuenta stock de la variante exacta, recalcula el precio en el
  backend y rechaza variantes soft-deleted.

## Frontend

- **Web — detalle de producto**: un selector por cada eje de `variants[].options[]`
  (swatches para `color`, pills para el resto). La variante se resuelve por
  intersección exacta de opciones. Deshabilitado inteligente: una opción se apaga
  si no hay variante con stock compatible con lo ya elegido.
  (`VariantAttributePicker.tsx`, `utils/variantAxes.ts`).
- **Company Dashboard**: `ProductForm` / `ProductEdit` con `AttributeValueFields`
  (atributos role="product" dinámicos) + `DiscountFields`; `VariantModal` con
  selectores por eje + descuento propio; `GenerateVariantsModal` para la matriz.
- **Admin/Owner**: `AttributesModal` (`admin/.../catalog/Catalogs.tsx`) — define
  atributos (rol, tipo, unidad) y sus opciones por categoría, con activar/desactivar.
- Mobile: pendiente de migración a esta arquitectura.

## Migraciones

Cadena Alembic actual (HEAD = `a1b2c3d4e5f6`) — 10 revisiones lineales:

| Revisión | Qué hace |
|---|---|
| `29fe206320ce` | esquema base (incluye `color_variants`, `specification_templates`, `product_specifications`, `variant_specifications`, `product_variants.color_id`, `products.main_color_id`) |
| `d72ef7fa597e` | `products` (ajustes de tabla) |
| `048871b47f63` | tablas `catalog_attributes`, `catalog_attribute_options` |
| `a90540bebea` | `product_variants`: `sku`, `combo_key`, `deleted_at`, campos de descuento; `products`: campos de descuento; tablas `variant_options`, `product_attribute_values`, `variant_attribute_values`; índices únicos parciales de combinación y sku |
| `b6f8fd31fbe` | backfill: `color_variants` + `product_variants.color_id` → atributo "Color" (role="variant") + `variant_options` + `combo_key`; `specification_templates` + `product_specifications` → atributos (role="product") + `product_attribute_values` |
| `cb6d38ee0bd` | `order_items.attributes_snapshot` (JSONB) |
| `d4e5f6a7b8c9` | anuncios pierden los campos de texto (título, descripción, texto de botón) |
| `e7a1c9d24b30` | tabla `shipping_carriers` + campos de envío en `orders` |
| `f2b7c4e91a05` | `products.applies_tax` (IVA por producto) |
| `a1b2c3d4e5f6` | **HEAD** — extensiones `pg_trgm` / `unaccent`, función `rehni_search_norm`, índice GIN de búsqueda difusa |

Todas reversibles. Los datos existentes se preservan.

> **Nota:** las tres primeras filas de la sección "Migraciones" de este documento
> reflejaban el estado hasta el Incremento 4 (HEAD `cb6d38ee0bd`). La cadena se
> amplió después con `d4e5f6a7b8c9` … `a1b2c3d4e5f6`.

## Legacy (todavía presente)

Estas estructuras **no se han eliminado**; conviven con la arquitectura nueva:

- **`ColorVariant`** (`color_variants`): gestionado desde la pestaña Admin › Colores.
  Referenciado por `products.main_color_id` y `product_variants.color_id`. El flujo
  de variantes ya no lo usa como fuente.
- **`SpecificationTemplate` / `ProductSpecification` / `VariantSpecification`**:
  CRUD Admin de especificaciones todavía disponible (`SpecificationsModal`).
  `variant_specifications` está vacía. Los datos de `product_specifications` ya
  fueron backfilleados a `product_attribute_values`; el dashboard de empresa ya no
  crea especificaciones nuevas.
- **`products.main_color_id`**: escrito solo si el cliente envía `mainColorId`
  (ningún frontend Web lo hace); leído por el detalle de producto y por el color
  de línea del carrito como *fallback*.
- **Campos de compatibilidad en respuestas públicas** (`PublicProductDetailResponse.color`
  y `.specifications`, `PublicProductVariantResponse.color` y `.specifications`,
  `CartItemResponse.color`): se siguen enviando; el frontend Web ya no los consume.

La eliminación definitiva (DROP de tablas/columnas, retirada de modelos y UIs
Admin) es una fase posterior sujeta a decisión de negocio y a la migración de Mobile.
