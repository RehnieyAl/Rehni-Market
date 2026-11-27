"""Comprobación de la conexión a PostgreSQL (SELECT 1) para el healthcheck público /health/database."""

import logging

from sqlalchemy import text

from app.core.dbconexion import engine

logger = logging.getLogger(__name__)


def db_test():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            return {"Base de datos": "OK"}
    except Exception:
        # Ruta pública: el error de conexión (host, usuario) va al log, no a la respuesta.
        logger.exception("Healthcheck de base de datos fallido")
        return {"Base de datos": "ERROR", "detail": "No se pudo conectar a la base de datos."}
