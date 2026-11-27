"""Datos base sin los que la app no funciona (roles, catálogo y transportadoras).

No corren solos: se crean a mano con scripts/datos-base.sh o al arrancar con RUN_SEED=true, junto
con los de demostración (app/utils/seed.py, grupo demo).
"""
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import NullPool

from app.Config import config
from app.models.ModelCatalog import Catalog
from app.utils.seed_attributes import seed_catalog_attributes
from app.utils.seed_categories import seed_catalog
from app.utils.seed_roles import seed_roles
from app.utils.seed_shipping import seed_shipping_carriers
from app.utils.seed_specifications import seed_specifications

# Los workers de Uvicorn ejecutan el lifespan a la vez: el advisory lock hace que siembren de
# a uno y que el segundo encuentre todo creado en lugar de chocar con las restricciones UNIQUE.
_LOCK_KEY = 5_301_120


def seed_base_data(db: Session) -> None:
    seed_roles(db)
    # El árbol de catálogo solo se siembra en una base sin categorías: después lo administra el
    # panel (atributos y opciones se renombran y se borran) y volver a sembrarlo desharía esos cambios.
    if db.query(Catalog.id).first() is None:
        seed_catalog(db)
        seed_specifications(db)
        seed_catalog_attributes(db)
    seed_shipping_carriers(db)


def ensure_base_data(engine: Engine | None = None) -> None:
    """Crea los datos base que falten; si ya existen no los duplica ni los modifica."""
    # Conexión directa (URL_DATABASE), no PgBouncer: un advisory lock de sesión necesita que
    # todas las sentencias usen la misma conexión al servidor, y el pool en modo transaction no lo asegura.
    own_engine = engine is None
    engine = engine or create_engine(config.URL_DATABASE, poolclass=NullPool)
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT pg_advisory_lock(:key)"), {"key": _LOCK_KEY})
            connection.commit()
            try:
                with Session(bind=connection) as db:
                    seed_base_data(db)
            finally:
                connection.execute(text("SELECT pg_advisory_unlock(:key)"), {"key": _LOCK_KEY})
                connection.commit()
    finally:
        if own_engine:
            engine.dispose()
