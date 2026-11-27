"""Configuración del backend leída del entorno y validada al importarse."""
from pathlib import Path

from dotenv import load_dotenv
import os

# Fuera de Docker (uv run, pytest) se lee el .env único de la raíz del repo. En el contenedor
# esa ruta no existe y las variables llegan por env_file; load_dotenv no pisa las ya definidas.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")


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
    # La app pasa por PgBouncer si está definida (si no, va directo a Postgres). Alembic usa
    # URL_DATABASE a propósito: las migraciones no deben ir por el pool en modo transaction.
    URL_DATABASE_POOLED = os.getenv("URL_DATABASE_POOLED") or URL_DATABASE
    SECRET_KEY = os.getenv("SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
    REFRESH_TOKEN_DAYS = int(os.getenv("REFRESH_TOKEN_DAYS"))
    GMAIL_USERNAME = os.getenv("GMAIL_USERNAME")
    GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
    URL_FRONTEND = os.getenv("URL_FRONTEND")
    MINIO_URL = os.getenv("MINIO_URL")
    MINIO_ROOT_USER = os.getenv("MINIO_ROOT_USER")
    MINIO_ROOT_PASSWORD = os.getenv("MINIO_ROOT_PASSWORD")
    OWNER_NAME = os.getenv("USER_NAME_OWNER")
    OWNER_DEFAULT = os.getenv("OWNER_DEFAULT")
    OWNER_PASSWORD_DEFAULT = os.getenv("OWNER_PASSWORD_DEFAULT")
    # Contraseña de las cuentas de empresas demo; sin ella (o si es débil) no se crean.
    SEED_DEMO_PASSWORD = os.getenv("SEED_DEMO_PASSWORD")
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

    # Una petición puede retener su conexión después de liberar el hilo (serialización y cierre de
    # get_db), por eso el pool debe ser MAYOR que el threadpool (THREADPOOL_SIZE hilos por proceso).
    UVICORN_WORKERS = _int_env("UVICORN_WORKERS", 1, 1, 16)
    THREADPOOL_SIZE = _int_env("THREADPOOL_SIZE", 40, 4, 200)
    DB_POOL_SIZE = _int_env("DB_POOL_SIZE", 20, 1, 100)
    DB_MAX_OVERFLOW = _int_env("DB_MAX_OVERFLOW", 30, 0, 100)
    DB_POOL_TIMEOUT = _int_env("DB_POOL_TIMEOUT", 5, 1, 30)
    DB_POOL_RECYCLE = _int_env("DB_POOL_RECYCLE", 1800, 60, 86400)
    # Máximo de clientes que PgBouncer acepta (MAX_CLIENT_CONN en compose, mismo valor por defecto).
    # Se repite aquí solo para validar el presupuesto al arrancar.
    PGBOUNCER_MAX_CLIENT_CONN = _int_env("PGBOUNCER_MAX_CLIENT_CONN", 1200, 1, 100000)
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

    # Servidor SMTP. Sin definir nada = Gmail por 587 con STARTTLS (comportamiento
    # anterior). Se puede cambiar de proveedor o de puerto cuando la red bloquea
    # alguno (Oracle Cloud bloquea el 25 de salida; algunas redes, el 587):
    #   587 + starttls · 465 + ssl · 2525 + starttls (Brevo, SendGrid, Mailgun…)
    SMTP_HOST = os.getenv("SMTP_HOST") or "smtp.gmail.com"
    SMTP_PORT = _int_env("SMTP_PORT", 587, 1, 65535)
    # "starttls" (conexión en claro que se cifra) o "ssl" (TLS desde el inicio, el 465).
    SMTP_SECURITY = (os.getenv("SMTP_SECURITY") or ("ssl" if SMTP_PORT == 465 else "starttls")).lower()
    if SMTP_SECURITY not in ("starttls", "ssl"):
        raise RuntimeError(f"SMTP_SECURITY debe ser 'starttls' o 'ssl' (recibido: {SMTP_SECURITY!r})")
    # Credenciales SMTP; si no se definen, las de Gmail de siempre.
    SMTP_USERNAME = os.getenv("SMTP_USERNAME") or GMAIL_USERNAME
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") or GMAIL_APP_PASSWORD
    # Remitente visible. Hace falta cuando el usuario SMTP no es una dirección de
    # correo (Brevo, SendGrid, OCI Email Delivery); por defecto, SMTP_USERNAME.
    EMAIL_FROM = os.getenv("EMAIL_FROM") or SMTP_USERNAME
    # Nombre visible del remitente ("Rehni Market <cuenta@…>"). Vacío: solo la dirección, como antes.
    EMAIL_FROM_NAME = (os.getenv("EMAIL_FROM_NAME") or "").strip()
    # Reply-To con el correo público de contacto (configurado por el owner). Solo se activa si el
    # proveedor SMTP lo permite para la cuenta remitente; por defecto, desactivado.
    EMAIL_REPLY_TO_CONTACT = os.getenv("EMAIL_REPLY_TO_CONTACT", "false").lower() == "true"

config = config()
