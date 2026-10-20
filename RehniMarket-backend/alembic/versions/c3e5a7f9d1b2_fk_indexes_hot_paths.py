"""fk indexes hot paths - índices de claves foráneas en rutas calientes

Índices B-tree sobre claves foráneas sin índice que usan las consultas reales
de las rutas más frecuentes (auditoría de rendimiento del 14/10/2026,
docs/rendimiento-capacidad.md). pg_stat_user_tables mostraba lecturas
secuenciales repetidas en esas tablas (p. ej. product_variant_images: 100.109
seq_scan y 0 idx_scan; product_variants: 56.938 seq_scan).

- Catálogo y tarjetas: product_variants.product_id (los índices existentes son
  parciales y no sirven para WHERE product_id = ...), product_variant_images.
  variant_id, product_images.product_id, products.company_id,
  products.catalog_id, reviews.product_id.
- Pedidos y billetera: orders.user_id, orders.company_id, order_items.order_id,
  wallet_transactions.wallet_id.

No toca datos. CREATE INDEX (no CONCURRENTLY) bloquea escrituras en cada tabla
mientras se construye; con los volúmenes actuales (miles de filas) son
milisegundos. Con tablas grandes, crear antes los índices a mano con
CREATE INDEX CONCURRENTLY usando estos mismos nombres: if_not_exists los omite.

Revision ID: c3e5a7f9d1b2
Revises: b8d1c4f7a2e9
Create Date: 2026-10-14 21:30:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = "c3e5a7f9d1b2"
down_revision: Union[str, Sequence[str], None] = "b8d1c4f7a2e9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (tabla, columna). Nombre = convención por defecto de SQLAlchemy para
# index=True en los modelos: ix_<tabla>_<columna>.
_INDEXES = (
    ("product_variants", "product_id"),
    ("product_variant_images", "variant_id"),
    ("product_images", "product_id"),
    ("products", "company_id"),
    ("products", "catalog_id"),
    ("reviews", "product_id"),
    ("orders", "user_id"),
    ("orders", "company_id"),
    ("order_items", "order_id"),
    ("wallet_transactions", "wallet_id"),
)


def upgrade() -> None:
    for table, column in _INDEXES:
        op.create_index(f"ix_{table}_{column}", table, [column], if_not_exists=True)


def downgrade() -> None:
    for table, column in reversed(_INDEXES):
        op.drop_index(f"ix_{table}_{column}", table_name=table, if_exists=True)
