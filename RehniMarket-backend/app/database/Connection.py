import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.Config import config

logger = logging.getLogger("rehni.db")

# Único engine (y único pool) de la aplicación: endpoints vía get_db,
# auth_middleware, healthcheck y seed lo comparten. Cada proceso uvicorn
# (UVICORN_WORKERS) crea el suyo, así que el máximo de conexiones del backend
# hacia PgBouncer es (DB_POOL_SIZE + DB_MAX_OVERFLOW) × UVICORN_WORKERS.
# Los valores se validan en Config.py; ver docs/rendimiento-capacidad.md.
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


def pool_stats() -> dict:
    """Estado del pool de ESTE proceso (cada worker tiene el suyo)."""
    pool = engine.pool
    return {
        "size": pool.size(),
        "checked_out": pool.checkedout(),
        "checked_in": pool.checkedin(),
        "overflow": pool.overflow(),
        "max_overflow": config.DB_MAX_OVERFLOW,
        "timeout_seconds": config.DB_POOL_TIMEOUT,
    }

class Base(DeclarativeBase):
    pass
