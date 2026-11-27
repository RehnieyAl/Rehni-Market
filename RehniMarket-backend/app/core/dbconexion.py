"""Conexión a PostgreSQL: engine y pool únicos de SQLAlchemy, sesiones (get_db, read_session) y Base
de los modelos. Lo usan la app, Alembic (alembic/env.py), las pruebas y los scripts de datos."""

import logging
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.Config import config

logger = logging.getLogger("rehni.db")

# Único engine y pool del proceso. Conexiones máximas hacia PgBouncer:
# (DB_POOL_SIZE + DB_MAX_OVERFLOW) × UVICORN_WORKERS; ver docs/rendimiento-capacidad.md.
engine = create_engine(
    config.URL_DATABASE_POOLED,
    pool_size=config.DB_POOL_SIZE,
    max_overflow=config.DB_MAX_OVERFLOW,
    pool_timeout=config.DB_POOL_TIMEOUT,  # falla rápido si el pool está agotado
    pool_recycle=config.DB_POOL_RECYCLE,
    pool_pre_ping=True,                   # descarta conexiones rotas (p. ej. reinicio de PgBouncer)
    echo=False
)

logger.info(
    "SQLAlchemy pool: size=%s overflow=%s timeout=%ss workers=%s -> máx. %s conexiones del backend",
    config.DB_POOL_SIZE,
    config.DB_MAX_OVERFLOW,
    config.DB_POOL_TIMEOUT,
    config.UVICORN_WORKERS,
    config.DB_MAX_BACKEND_CONNECTIONS,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    """Usar SIEMPRE como Depends(get_db, scope="function"): así la sesión se
    cierra (y la conexión vuelve al pool) en cuanto la respuesta se serializa.
    Con el scope por defecto ("request") FastAPI la cierra después de ENVIAR la
    respuesta, y la conexión queda retenida durante el envío por la red."""
    database = SessionLocal()
    try:
        yield database
    finally:
        database.close()


# Solo lectura (rutas /public), DENTRO del endpoint y en AUTOCOMMIT: get_db retiene la conexión
# hasta serializar la respuesta y, bajo carga, eso bloqueaba el pool. Nunca para escrituras, y los
# servicios deben devolver datos ya cargados (sin relaciones perezosas).
ReadSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine.execution_options(isolation_level="AUTOCOMMIT"),
)


@contextmanager
def read_session():
    """with read_session() as database: return servicio(database, ...)"""
    database = ReadSessionLocal()
    try:
        yield database
    finally:
        database.close()


class Base(DeclarativeBase):
    pass
