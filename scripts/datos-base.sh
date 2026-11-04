#!/usr/bin/env bash
# Carga los DATOS BASE en una instalación nueva (producción), sin datos de demostración.
#
# Por qué existe: los roles (user, company, admin, owner) solo los crea el seed del
# backend (app/utils/seed.py, seed_roles), que corre al arrancar únicamente con
# RUN_SEED=true, y ese seed también carga empresas y productos de demostración
# (seed_companies_and_products). En producción RUN_SEED=false, así que sin este paso
# no hay roles y el registro de usuarios falla.
#
# Llama, dentro del contenedor del backend, a las mismas funciones del seed salvo la de
# demostración: seed_roles, seed_catalog, seed_specifications, seed_catalog_attributes,
# seed_owner (con USER_NAME_OWNER / OWNER_DEFAULT / OWNER_PASSWORD_DEFAULT del .env del
# backend) y seed_shipping_carriers. Todas comprueban si el dato ya existe: se puede
# ejecutar más de una vez.
#
# Uso (en el servidor, con los contenedores en marcha):
#   bash scripts/datos-base.sh
# Variable opcional: BACKEND_CONTAINER (por defecto rehni-backend).

set -euo pipefail

BACKEND="${BACKEND_CONTAINER:-rehni-backend}"

docker inspect "$BACKEND" >/dev/null 2>&1 || { echo "ERROR: el contenedor $BACKEND no existe" >&2; exit 1; }

docker exec -i "$BACKEND" uv run --no-sync python - <<'PY'
from sqlalchemy import text
from app.database.Connection import SessionLocal
from app.utils.seed import (
    seed_roles, seed_catalog, seed_specifications, seed_catalog_attributes,
    seed_owner, seed_shipping_carriers,
)

db = SessionLocal()
try:
    for paso in (seed_roles, seed_catalog, seed_specifications,
                 seed_catalog_attributes, seed_owner, seed_shipping_carriers):
        paso(db)
        print(f"OK  {paso.__name__}")
    for tabla in ("roles", "catalog", "shipping_carriers", "users", "company", "products"):
        try:
            n = db.execute(text(f"SELECT count(*) FROM {tabla}")).scalar()
            print(f"    {tabla}: {n}")
        except Exception:
            db.rollback()
finally:
    db.close()
PY
