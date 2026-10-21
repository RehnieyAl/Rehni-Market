from dotenv import load_dotenv
import os
load_dotenv()


def _int_env(name: str, default: int, minimum: int, maximum: int) -> int:
    """Entero de entorno validado al arrancar: un valor fuera de rango detiene
    el backend en lugar de crear un pool o un threadpool sin límites."""
    raw = os.getenv(name)
    try:
        value = int(raw) if raw not in (None, "") else default
    except ValueError:
        raise RuntimeError(f"{name} debe ser un entero (recibido: {raw!r})")
    if not minimum <= value <= maximum:
        raise RuntimeError(f"{name}={value} fuera de rango [{minimum}, {maximum}]")
    return value


class config():
    URL_DATABASE = os.getenv("URL_DATABASE")
    # Cadena de conexión que usa la app para tráfico normal: pasa por PgBouncer
    # (pool en modo transaction) cuando está configurada. Si no está definida
    # (p.ej. en docker-compose.dev.yml, que no tiene PgBouncer), cae a
    # URL_DATABASE y el backend se conecta directo a Postgres, igual que antes.
    # Alembic (alembic/env.py) sigue usando URL_DATABASE a propósito: las
    # migraciones deben ir directo a Postgres, no a través del pool de
    # transacción de PgBouncer.
    URL_DATABASE_POOLED = os.getenv("URL_DATABASE_POOLED") or URL_DATABASE
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
    REFRESH_TOKEN_DAYS = int(os.getenv("REFRESH_TOKEN_DAYS"))
    GMAIL_USERNAME = os.getenv("GMAIL_USERNAME")
    GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
    URL_FRONTEND = os.getenv("URL_FRONTEND")
    MINIO_URL = os.getenv("MINIO_URL")
    MINIO_ROOT_USER = os.getenv("MINIO_ROOT_USER")
    MINIO_ROOT_PASSWORD = os.getenv("MINIO_ROOT_PASSWORD")
    ADMIN_NAME = os.getenv("USER_NAME_ADMIN")
    ADMIN_DEFAULT = os.getenv("ADMIN_DEFAULT")
    PASSWORD_DEFAULT = os.getenv("PASSWORD_DEFAULT")
    OWNER_NAME = os.getenv("USER_NAME_OWNER")
    OWNER_DEFAULT = os.getenv("OWNER_DEFAULT")
    OWNER_PASSWORD_DEFAULT = os.getenv("OWNER_PASSWORD_DEFAULT")
    RUN_SEED = os.getenv("RUN_SEED", "false").lower() == "true"
    URL_BACKEND = os.getenv("URL_BACKEND")
    RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "false").lower() == "true"
    # Swagger (/docs), ReDoc (/redoc) y /openapi.json. En producción, false.
    DOCS_ENABLED = os.getenv("DOCS_ENABLED", "false").lower() == "true"
    # Orígenes extra para CORS, separados por coma (ej. el frontend en HTTPS cuando la
    # API está en otro dominio). URL_FRONTEND se sigue usando también en los correos.
    CORS_EXTRA_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_EXTRA_ORIGINS", "").split(",")
        if origin.strip()
    ]
    REQUEST_LIMIT = int(os.getenv("REQUEST_LIMIT", "100"))
    TIME_WINDOW = int(os.getenv("TIME_WINDOW", "60"))

    # Presupuesto de concurrencia y conexiones (docs/rendimiento-capacidad.md).
    # Los endpoints son síncronos: corren en el threadpool de anyio
    # (THREADPOOL_SIZE hilos por proceso). Una petición puede seguir
    # reteniendo su conexión después de liberar el hilo (serialización y cierre
    # de get_db), por eso el pool debe ser MAYOR que el threadpool.
    UVICORN_WORKERS = _int_env("UVICORN_WORKERS", 1, 1, 16)
    THREADPOOL_SIZE = _int_env("THREADPOOL_SIZE", 40, 4, 200)
    DB_POOL_SIZE = _int_env("DB_POOL_SIZE", 20, 1, 100)
    DB_MAX_OVERFLOW = _int_env("DB_MAX_OVERFLOW", 30, 0, 100)
    DB_POOL_TIMEOUT = _int_env("DB_POOL_TIMEOUT", 5, 1, 30)
    DB_POOL_RECYCLE = _int_env("DB_POOL_RECYCLE", 1800, 60, 86400)
    # Máximo de clientes que PgBouncer acepta (MAX_CLIENT_CONN en compose).
    # Se repite aquí solo para validar el presupuesto al arrancar.
    PGBOUNCER_MAX_CLIENT_CONN = _int_env("PGBOUNCER_MAX_CLIENT_CONN", 200, 1, 100000)
    DB_MAX_BACKEND_CONNECTIONS = (DB_POOL_SIZE + DB_MAX_OVERFLOW) * UVICORN_WORKERS

    if DB_POOL_SIZE + DB_MAX_OVERFLOW < THREADPOOL_SIZE:
        raise RuntimeError(
            "DB_POOL_SIZE + DB_MAX_OVERFLOW debe ser >= THREADPOOL_SIZE: con menos "
            "conexiones que hilos, los hilos esperan conexiones que retienen "
            "peticiones que a su vez esperan un hilo (QueuePool TimeoutError)."
        )
    if DB_MAX_BACKEND_CONNECTIONS > PGBOUNCER_MAX_CLIENT_CONN:
        raise RuntimeError(
            f"(DB_POOL_SIZE + DB_MAX_OVERFLOW) × UVICORN_WORKERS = "
            f"{DB_MAX_BACKEND_CONNECTIONS} supera PGBOUNCER_MAX_CLIENT_CONN="
            f"{PGBOUNCER_MAX_CLIENT_CONN}."
        )

    # Correo saliente: hilos dedicados (no el threadpool de las peticiones)
    # y timeout de socket para que un SMTP lento no bloquee nada.
    EMAIL_MAX_WORKERS = _int_env("EMAIL_MAX_WORKERS", 4, 1, 32)
    SMTP_TIMEOUT = _int_env("SMTP_TIMEOUT", 10, 1, 120)

config = config()
