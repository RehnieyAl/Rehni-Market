"""backfill products.has_variants for products with existing variants

Revision ID: d1f4a8b2c6e3
Revises: c8e2b5d7f341
Create Date: 2026-08-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1f4a8b2c6e3'
down_revision: Union[str, Sequence[str], None] = 'c8e2b5d7f341'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade data.

    BUG: `products.has_variants` nunca se escribia en el codigo de la
    aplicacion (ni al crear ni al borrar una variante, ver
    app/services/DashboardService/company/Variants.py) - se quedaba en su
    default (False) para siempre, aunque el producto ya tuviera filas
    reales en product_variants. `_has_visible_stock` (ver
    app/services/publicService/Products.py) usa esa bandera para decidir
    si la disponibilidad se evalua con Product.stock o con el stock de
    las variantes, asi que cualquier producto con variantes creado antes
    de corregir ese bug quedo, y sigue quedando, oculto en
    busqueda/categorias/productos del dia cada vez que su stock base es 0
    aunque tenga variantes con stock disponible.

    Esta migracion solo corrige el dato ya inconsistente para productos
    existentes (no toca stock ni ninguna otra columna) - el codigo que
    mantiene la bandera hacia adelante ya se corrigio por separado. No
    aplica a la inversa (has_variants=True sin variantes reales) porque
    esa combinacion no puede darse: nunca se pone en True salvo al crear
    una variante.
    """
    op.execute(
        """
        UPDATE products
        SET has_variants = true
        WHERE has_variants = false
          AND EXISTS (
              SELECT 1 FROM product_variants
              WHERE product_variants.product_id = products.id
          )
        """
    )


def downgrade() -> None:
    """No-op: revertir el dato reintroduciria el bug original."""
    pass
