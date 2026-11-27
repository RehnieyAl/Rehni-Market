"""Envío de correo por SMTP: en segundo plano (send_email) o con resultado conocido (send_email_now).
Cada mensaje sale como multipart/alternative (texto plano + HTML) con Date y Message-ID propios."""

import logging
import re
import smtplib
import threading
from concurrent.futures import ThreadPoolExecutor
from email.message import EmailMessage
from email.utils import formataddr, formatdate, make_msgid
from html.parser import HTMLParser

from app.Config import config

logger = logging.getLogger(__name__)


# SMTP en hilos propios y acotados: varios servicios envían con la transacción abierta, y un SMTP
# lento retenía conexión del pool, de PgBouncer y un hilo. Los fallos de envío solo van al log.
_executor = ThreadPoolExecutor(
    max_workers=config.EMAIL_MAX_WORKERS, thread_name_prefix="email"
)
# Tope de correos pendientes (en cola + enviándose) para no crecer sin límite
# en memoria si el servidor SMTP deja de responder.
_EMAIL_MAX_PENDING = config.EMAIL_MAX_WORKERS * 100
_pending = threading.BoundedSemaphore(_EMAIL_MAX_PENDING)

_BLOCK_TAGS = {"p", "div", "tr", "h1", "h2", "h3", "br", "li", "table"}


class _TextExtractor(HTMLParser):
    """Versión en texto plano del HTML del correo: los filtros antispam penalizan los mensajes
    que solo traen HTML, y algunos clientes muestran únicamente esta parte."""

    def __init__(self):
        super().__init__()
        self._parts: list[str] = []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("style", "head", "title", "script"):
            self._skip += 1
        elif tag in _BLOCK_TAGS:
            self._parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("style", "head", "title", "script"):
            self._skip = max(0, self._skip - 1)
        elif tag in _BLOCK_TAGS or tag == "td":
            self._parts.append("\n" if tag in _BLOCK_TAGS else " ")

    def handle_data(self, data):
        if not self._skip:
            self._parts.append(data)

    def text(self) -> str:
        raw = "".join(self._parts)
        lines = [re.sub(r"[ \t ]+", " ", line).strip() for line in raw.splitlines()]
        return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip() + "\n"


def html_to_text(body_html: str) -> str:
    parser = _TextExtractor()
    parser.feed(body_html)
    parser.close()
    return parser.text()


def _sender_domain() -> str | None:
    address = config.EMAIL_FROM or ""
    return address.rsplit("@", 1)[1].lower() if "@" in address else None


def sender_alignment_warning() -> str | None:
    """Con Gmail/Google como servidor, un From de otro dominio que la cuenta autenticada falla
    DMARC (SPF y DKIM quedan a nombre de la cuenta) y los correos terminan en spam o rechazados."""

    username = (config.SMTP_USERNAME or "").lower()
    sender = _sender_domain()
    if not sender or "@" not in username:
        return None
    if username.rsplit("@", 1)[1] != sender:
        return (
            f"EMAIL_FROM usa el dominio {sender} pero la cuenta SMTP es de otro dominio: "
            "SPF/DKIM no quedarán alineados con el From y DMARC puede fallar."
        )
    return None


def _from_header() -> str:
    if config.EMAIL_FROM_NAME:
        return formataddr((config.EMAIL_FROM_NAME, config.EMAIL_FROM))
    return config.EMAIL_FROM


def _reply_to() -> str | None:
    if not config.EMAIL_REPLY_TO_CONTACT:
        return None
    from app.services.PlatformSettingsService import cached_public_contact

    contact = cached_public_contact()
    return contact.email if contact and contact.email else None


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


def _transmit(msg: EmailMessage) -> None:
    """Entrega `msg` al servidor SMTP; lanza la excepción si no lo acepta."""
    with _open_smtp() as server:
        server.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
        server.send_message(msg)


def _deliver(msg: EmailMessage, to_email: str) -> None:
    try:
        _transmit(msg)
        logger.info("Correo enviado a %s", to_email)
    except Exception:
        logger.exception("Error al enviar correo a %s", to_email)
    finally:
        _pending.release()


def build_message(to_email: str, subject: str, body_html: str) -> EmailMessage:
    msg = EmailMessage()
    msg["From"] = _from_header()
    msg["To"] = to_email
    msg["Subject"] = subject
    msg["Date"] = formatdate(localtime=False, usegmt=True)
    msg["Message-ID"] = make_msgid(domain=_sender_domain())
    # Correo transaccional generado por la plataforma: evita respuestas automáticas en bucle.
    msg["Auto-Submitted"] = "auto-generated"
    reply_to = _reply_to()
    if reply_to:
        msg["Reply-To"] = reply_to

    msg.set_content(html_to_text(body_html), charset="utf-8")
    msg.add_alternative(body_html, subtype="html", charset="utf-8")
    return msg


def send_email(to_email: str, subject: str, body: str):
    msg = build_message(to_email, subject, body)

    if not _pending.acquire(blocking=False):
        logger.error("Error al enviar correo a %s: cola de correo llena (%d)", to_email, _EMAIL_MAX_PENDING)
        return

    try:
        _executor.submit(_deliver, msg, to_email)
    except RuntimeError:  # executor cerrado (apagado del proceso)
        _pending.release()
        logger.error("Error al enviar correo a %s: servicio de correo detenido", to_email)


def send_email_now(to_email: str, subject: str, body: str) -> None:
    """Envía en el hilo actual y lanza si el servidor no acepta el mensaje. Lo usa el registro de
    notificaciones de devoluciones, que guarda el resultado de cada intento."""
    _transmit(build_message(to_email, subject, body))
    logger.info("Correo enviado a %s", to_email)


def submit_background(task, *args) -> bool:
    """Ejecuta `task` en los hilos de correo; False si el servicio está detenido."""
    try:
        _executor.submit(task, *args)
        return True
    except RuntimeError:
        logger.error("Servicio de correo detenido: tarea no programada")
        return False
