import logging
import threading
from concurrent.futures import ThreadPoolExecutor

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.Config import config

logger = logging.getLogger(__name__)


# El envío SMTP corre en hilos propios y acotados, nunca en el hilo de la
# petición: varios servicios llaman a send_email con la transacción todavía
# abierta (p. ej. códigos de verificación antes del commit), y un SMTP lento
# retenía la conexión del pool, la conexión de servidor de PgBouncer y un hilo
# del threadpool. El resultado para el llamador no cambia: antes los fallos de
# envío ya solo se registraban en el log.
_executor = ThreadPoolExecutor(
    max_workers=config.EMAIL_MAX_WORKERS, thread_name_prefix="email"
)
# Tope de correos pendientes (en cola + enviándose) para no crecer sin límite
# en memoria si el servidor SMTP deja de responder.
_EMAIL_MAX_PENDING = config.EMAIL_MAX_WORKERS * 100
_pending = threading.BoundedSemaphore(_EMAIL_MAX_PENDING)


def _open_smtp() -> smtplib.SMTP:
    """Conexión al servidor de config.SMTP_HOST:SMTP_PORT, ya cifrada."""
    if config.SMTP_SECURITY == "ssl":
        return smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORT, timeout=config.SMTP_TIMEOUT)
    server = smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=config.SMTP_TIMEOUT)
    try:
        server.starttls()
    except Exception:
        server.close()
        raise
    return server


def _deliver(msg: MIMEMultipart, to_email: str) -> None:
    try:
        with _open_smtp() as server:
            server.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Correo enviado a %s", to_email)
    except Exception:
        logger.exception("Error al enviar correo a %s", to_email)
    finally:
        _pending.release()


def send_email(to_email: str, subject: str, body: str):
    msg = MIMEMultipart()
    msg['From'] = config.EMAIL_FROM
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'html'))

    if not _pending.acquire(blocking=False):
        logger.error("Error al enviar correo a %s: cola de correo llena (%d)", to_email, _EMAIL_MAX_PENDING)
        return

    try:
        _executor.submit(_deliver, msg, to_email)
    except RuntimeError:  # executor cerrado (apagado del proceso)
        _pending.release()
        logger.error("Error al enviar correo a %s: servicio de correo detenido", to_email)
