"""product search: pg_trgm + unaccent para búsqueda tolerante a errores

Habilita la búsqueda difusa de GET /public/products?search=:
  - pg_trgm: funciones similarity()/word_similarity() y operador de trigramas
    para índice GIN.
  - unaccent: normaliza tildes ("audífonos" == "audifonos").
  - rehni_search_norm(text): lower + unaccent. Se marca IMMUTABLE (patrón
    recomendado por la documentación de PostgreSQL para usar unaccent en
    índices) para poder indexarla.
  - ix_products_name_search_trgm: índice GIN de trigramas sobre
    rehni_search_norm(products.name). Es el ÚNICO índice que añade esta
    migración; acelera los `LIKE '%term%'` y las comparaciones de similitud
    del buscador. El resto de consultas del catálogo público filtran por
    company_id / catalog_id / created_at y no lo necesitan.

No toca datos, columnas ni ninguna otra tabla.

Revision ID: a1b2c3d4e5f6
Revises: f2b7c4e91a05
Create Date: 2026-08-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "f2b7c4e91a05"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


SEARCH_NORM_FUNCTION = """
CREATE OR REPLACE FUNCTION rehni_search_norm(txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
    SELECT lower(public.unaccent('public.unaccent', txt))
$$;
"""


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute("CREATE EXTENSION IF NOT EXISTS unaccent")
    op.execute(SEARCH_NORM_FUNCTION)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_products_name_search_trgm "
        "ON products USING gin (rehni_search_norm(name) gin_trgm_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_products_name_search_trgm")
    op.execute("DROP FUNCTION IF EXISTS rehni_search_norm(text)")
    op.execute("DROP EXTENSION IF EXISTS unaccent")
    op.execute("DROP EXTENSION IF EXISTS pg_trgm")
