import threading
import traceback
from concurrent.futures import ThreadPoolExecutor

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.Config import config

GMAIL_USERNAME = config.GMAIL_USERNAME
GMAIL_PASSWORD = config.GMAIL_APP_PASSWORD

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


def _deliver(msg: MIMEMultipart, to_email: str) -> None:
    try:
        with smtplib.SMTP('smtp.gmail.com', 587, timeout=config.SMTP_TIMEOUT) as server:
            server.starttls()
            server.login(GMAIL_USERNAME, GMAIL_PASSWORD)
            server.send_message(msg)
        exitosamente = f"Correo enviado a  {to_email}, exitosamente"
        print(exitosamente )
    except Exception:
        error = f"error al enviar correo a {to_email}, problema de bloqueo de red"
        print(error)
        traceback.print_exc()
    finally:
        _pending.release()


def send_email(to_email: str, subject: str, body: str):
    msg = MIMEMultipart()
    msg['From'] = GMAIL_USERNAME
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'html'))

    if not _pending.acquire(blocking=False):
        print(f"error al enviar correo a {to_email}: cola de correo llena ({_EMAIL_MAX_PENDING})")
        return

    try:
        _executor.submit(_deliver, msg, to_email)
    except RuntimeError:  # executor cerrado (apagado del proceso)
        _pending.release()
        print(f"error al enviar correo a {to_email}: servicio de correo detenido")
