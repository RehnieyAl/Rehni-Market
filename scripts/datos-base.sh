#!/usr/bin/env bash
# Comprueba los DATOS BASE de una instalación y, si se definen en el .env, crea la cuenta owner.
#
# Obligatorio en una base nueva: con RUN_SEED=false (predeterminado) el backend no siembra nada al
# arrancar. Este script crea los roles, el catálogo y las transportadoras que falten
# (ensure_base_data, app/utils/base_data.py), la cuenta owner si USER_NAME_OWNER / OWNER_DEFAULT /
# OWNER_PASSWORD_DEFAULT tienen valor, y muestra los conteos. Se puede ejecutar más de una vez:
# no duplica ni modifica lo que ya existe.
#
# Uso (en el servidor, con los contenedores en marcha):
#   bash scripts/datos-base.sh
# Variable opcional: BACKEND_CONTAINER (por defecto rehni-backend).

set -euo pipefail

BACKEND="${BACKEND_CONTAINER:-rehni-backend}"

docker inspect "$BACKEND" >/dev/null 2>&1 || { echo "ERROR: el contenedor $BACKEND no existe" >&2; exit 1; }

docker exec -i "$BACKEND" uv run --no-sync python - <<'PY'
from sqlalchemy import text
from app.core.dbconexion import SessionLocal
from app.utils.base_data import ensure_base_data
from app.utils.seed_accounts import seed_owner

ensure_base_data()
print("OK  ensure_base_data")
db = SessionLocal()
try:
    seed_owner(db)
    print("OK  seed_owner")
    for tabla in ("roles", "catalog", "shipping_carriers", "users", "company", "products"):
        try:
            n = db.execute(text(f"SELECT count(*) FROM {tabla}")).scalar()
            print(f"    {tabla}: {n}")
        except Exception:
            db.rollback()
finally:
    db.close()
PY
