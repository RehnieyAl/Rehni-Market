import logging
from contextlib import contextmanager

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


# Sesiones de SOLO LECTURA (rutas /public). FastAPI cierra una dependencia con
# scope="function" DESPUÉS de serializar la respuesta, y en endpoints síncronos
# esa serialización espera un hilo del threadpool. Mientras tanto la sesión
# retiene su conexión: bajo carga, todas las conexiones (del pool de SQLAlchemy
# y, con transacción abierta, las reales de PgBouncer) quedan retenidas por
# respuestas que esperan hilo, mientras todos los hilos esperan una conexión,
# y solo los timeouts rompen el ciclo.
# Por eso read_session() se usa DENTRO del endpoint (mismo hilo, conexión
# devuelta antes de serializar) y en AUTOCOMMIT (cada SELECT termina su
# transacción y PgBouncer libera la conexión real al instante).
# Comparte el pool de `engine`. NUNCA usar para escrituras: no hay atomicidad
# entre sentencias. Los servicios deben devolver datos ya cargados (schemas o
# columnas), no relaciones perezosas: tras cerrar la sesión no se pueden cargar.
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
