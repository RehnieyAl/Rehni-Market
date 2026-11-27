"""Correos de reclamaciones de devolución con registro transaccional: se guardan pendientes en la
misma transacción que la decisión y se envían después del commit, de modo que un fallo SMTP no
revierte un reembolso y cada intento queda registrado."""

import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import or_, update
from sqlalchemy.orm import Session

from app.core.dbconexion import SessionLocal
from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.models.ModelReturnNotification import NotificationStatus, ReturnNotification
from app.models.ModelReturnRequest import ReturnRequest
from app.models.ModelReturnRequestEvent import ReturnRequestEvent
from app.services.email import EmailService

logger = logging.getLogger(__name__)

_session_factory = SessionLocal

# Un envío que quedó "enviándose" (proceso detenido a mitad) se puede reintentar pasado este tiempo.
STALE_SENDING_AFTER = timedelta(minutes=10)


def enqueue(
    database: Session,
    return_request: ReturnRequest,
    *,
    kind: str,
    recipient_role: str,
    recipient_email: str,
    subject_and_html: tuple[str, str],
    message: str | None,
    created_by: UUID | None,
    event: ReturnRequestEvent | None = None,
) -> ReturnNotification:
    """Registra un correo pendiente. No hace commit: se confirma junto con la acción que lo origina."""

    subject, body_html = subject_and_html
    notification = ReturnNotification(
        return_request_id=return_request.id,
        event_id=event.id if event is not None else None,
        kind=kind,
        recipient_role=recipient_role,
        recipient_email=recipient_email,
        subject=subject,
        message=message,
        body_html=body_html,
        status=NotificationStatus.PENDING,
        attempts=0,
        created_by=created_by,
    )
    database.add(notification)
    database.flush()
    return notification


def schedule_dispatch(notification_ids: list[UUID]) -> None:
    """Envía los correos ya confirmados en los hilos de correo, sin bloquear la respuesta HTTP."""

    if notification_ids:
        EmailService.submit_background(dispatch_notifications, list(notification_ids))


def dispatch_notifications(notification_ids: list[UUID]) -> None:
    for notification_id in notification_ids:
        _dispatch_one(notification_id)


def _dispatch_one(notification_id: UUID) -> None:
    session = _session_factory()
    try:
        # Reclamo atómico: solo un proceso pasa PENDING -> SENDING, así un reintento simultáneo no
        # duplica el correo.
        claimed = session.execute(
            update(ReturnNotification)
            .where(
                ReturnNotification.id == notification_id,
                ReturnNotification.status == NotificationStatus.PENDING,
            )
            .values(
                status=NotificationStatus.SENDING,
                attempts=ReturnNotification.attempts + 1,
                updated_at=datetime.now(timezone.utc),
            )
            .execution_options(synchronize_session=False)
        ).rowcount
        session.commit()

        if not claimed:
            return

        notification = session.get(ReturnNotification, notification_id)
        try:
            EmailService.send_email_now(notification.recipient_email, notification.subject, notification.body_html)
            notification.status = NotificationStatus.ACCEPTED
            notification.sent_at = datetime.now(timezone.utc)
            notification.last_error = None
        except Exception as error:
            logger.exception("Error al enviar el correo de devolución %s", notification_id)
            notification.status = NotificationStatus.FAILED
            notification.last_error = f"{type(error).__name__}: {error}"[:500]
        session.commit()
    except Exception:
        session.rollback()
        logger.exception("Error registrando el envío del correo de devolución %s", notification_id)
    finally:
        session.close()


def retry_notification(database: Session, return_id: UUID, notification_id: UUID) -> None:
    """Vuelve a poner en cola un correo fallido (o atascado) de la reclamación y lo envía."""

    stale_before = datetime.now(timezone.utc) - STALE_SENDING_AFTER
    reset = database.execute(
        update(ReturnNotification)
        .where(
            ReturnNotification.id == notification_id,
            ReturnNotification.return_request_id == return_id,
            or_(
                ReturnNotification.status == NotificationStatus.FAILED,
                (ReturnNotification.status == NotificationStatus.SENDING)
                & (ReturnNotification.updated_at < stale_before),
            ),
        )
        .values(status=NotificationStatus.PENDING, updated_at=datetime.now(timezone.utc))
        .execution_options(synchronize_session=False)
    ).rowcount
    database.commit()

    if not reset:
        exists = database.get(ReturnNotification, notification_id)
        if exists is None or exists.return_request_id != return_id:
            api_error(404, ErrorCodes.NOTIFICATION_NOT_FOUND, "Notificación no encontrada.")
        api_error(
            409,
            ErrorCodes.NOTIFICATION_NOT_RETRYABLE,
            "Solo se puede reintentar un correo que falló.",
        )

    schedule_dispatch([notification_id])
