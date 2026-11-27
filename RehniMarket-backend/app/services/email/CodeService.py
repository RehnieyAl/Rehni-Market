"""Códigos de un solo uso (verificación de correo y recuperación de contraseña): emisión, reenvío con
cooldown y topes de frecuencia, validación con límite de intentos y envío del correo tras el commit."""

import math
import secrets
import uuid
from datetime import datetime, timedelta
from enum import Enum

from sqlalchemy import event
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.middleware.RateLimitMiddleware import retry_after_if_limited
from app.models.ModelCode import TypeCode
from app.models.ModelUser import Users
from app.repository.CodeRepository import create_code, delete_code, delete_user_codes, get_code
from app.services.email.template.EmailForgotPassword import EmailForgotPassword
from app.services.email.template.EmailRegisterCompany import EmailRegisterCompany
from app.services.email.template.EmailRegisterUser import EmailRegisterUser

CODE_LENGTH = 6

VERIFY_EMAIL_EXPIRATION_MINUTES = 5
RESET_PASSWORD_EXPIRATION_MINUTES = 15

CODE_EXPIRATION_MINUTES = {
    TypeCode.VERIFY_EMAIL: VERIFY_EMAIL_EXPIRATION_MINUTES,
    TypeCode.RESET_PASSWORD: RESET_PASSWORD_EXPIRATION_MINUTES,
    TypeCode.CHANGE_EMAIL: RESET_PASSWORD_EXPIRATION_MINUTES,
}

# Fuente única del cooldown: el frontend solo muestra el `resend_available_in` que recibe.
RESEND_COOLDOWN_SECONDS = 60
# Intentos fallidos por código: con 6 dígitos y este tope, adivinar uno es inviable.
MAX_FAILED_ATTEMPTS = 5
# Topes por ventana para que nadie use la plataforma para inundar un buzón.
SEND_LIMIT_PER_ADDRESS = 5
SEND_LIMIT_PER_IP = 20
SEND_LIMIT_WINDOW_SECONDS = 3600

_PENDING_SENDS = "pending_code_emails"


class VerifyCodeStatus(str, Enum):
    VALID = "VALID"
    INVALID = "INVALID"
    EXPIRED = "EXPIRED"
    LOCKED = "LOCKED"


def _expiration_minutes(code_type: TypeCode) -> int:
    return CODE_EXPIRATION_MINUTES.get(code_type, RESET_PASSWORD_EXPIRATION_MINUTES)


def generate_code(length: int = CODE_LENGTH) -> str:
    return "".join(secrets.choice("0123456789") for _ in range(length))


def verification_state(code_entry, now: datetime | None = None) -> dict:
    """Segundos de vida del código y segundos para poder reenviarlo, calculados en el backend con los
    datos guardados; se redondea hacia arriba para que los contadores arranquen en 05:00 / 01:00."""

    now = now or datetime.utcnow()

    expires_in = math.ceil((code_entry.expires_at - now).total_seconds())
    resend_available_in = math.ceil(
        RESEND_COOLDOWN_SECONDS - (now - code_entry.created_at).total_seconds()
    )

    return {
        "expires_in": max(0, expires_in),
        "resend_available_in": max(0, resend_available_in),
    }


@event.listens_for(Session, "after_commit")
def _send_pending_codes(session: Session) -> None:
    for send in session.info.pop(_PENDING_SENDS, []):
        send()


@event.listens_for(Session, "after_rollback")
def _discard_pending_codes(session: Session) -> None:
    session.info.pop(_PENDING_SENDS, None)


def _send_after_commit(database: Session, email: str, code: str, code_type: TypeCode, role, company_name) -> None:
    """El correo sale solo si la transacción que guarda el código se confirma: si falla, el código
    anterior sigue vigente y el usuario no recibe uno que nunca existió."""

    database.info.setdefault(_PENDING_SENDS, []).append(
        lambda: send_code(email, code, code_type, role, company_name)
    )


def send_code(email: str, code: str, code_type: TypeCode, role: str = None, company_name: str = None) -> None:
    expiration_minutes = _expiration_minutes(code_type)

    if code_type == TypeCode.RESET_PASSWORD:
        EmailForgotPassword(email, code, expiration_minutes)

    elif code_type == TypeCode.VERIFY_EMAIL:
        if role == "company":
            EmailRegisterCompany(email, company_name, code, expiration_minutes)
        else:
            EmailRegisterUser(email, code, expiration_minutes)


def lock_account(database: Session, user_id: uuid.UUID) -> None:
    """Serializa las emisiones de código de una cuenta: dos reenvíos simultáneos no generan dos
    códigos ni dos correos."""

    database.query(Users.id).filter(Users.id == user_id).with_for_update().first()


def enforce_send_limits(purpose: str, address: str, client_ip: str | None) -> None:
    """Topes por dirección y por IP en la ventana; responde 429 con Retry-After al superarlos."""

    checks = [(f"code:{purpose}:{address}", SEND_LIMIT_PER_ADDRESS)]
    if client_ip:
        checks.append((f"code-ip:{client_ip}", SEND_LIMIT_PER_IP))

    for key, limit in checks:
        retry_after = retry_after_if_limited(key, limit, SEND_LIMIT_WINDOW_SECONDS)
        if retry_after is not None:
            api_error(
                429,
                ErrorCodes.CODE_SEND_LIMIT_EXCEEDED,
                "Solicitaste demasiados códigos. Intenta de nuevo más tarde.",
                extra={"retry_after": retry_after},
            )


def cooldown_remaining(existing, now: datetime) -> int:
    if existing is None:
        return 0
    return max(0, math.ceil(RESEND_COOLDOWN_SECONDS - (now - existing.created_at).total_seconds()))


def reject_if_cooling_down(remaining: int) -> None:
    if remaining > 0:
        api_error(
            429,
            ErrorCodes.RESEND_COOLDOWN_ACTIVE,
            "Debes esperar antes de solicitar un nuevo código.",
            extra={"retry_after": remaining},
        )


def create_code_service(database: Session, user_id: uuid.UUID, code_type: TypeCode, now: datetime | None = None):
    """Invalida los códigos previos de la cuenta y tipo y crea uno nuevo: como máximo uno vigente.
    `now` fija created_at y expires_at para que los contadores derivados arranquen exactos."""

    now = now or datetime.utcnow()

    delete_user_codes(database, user_id, code_type)

    return create_code(
        database,
        user_id,
        generate_code(),
        code_type,
        now + timedelta(minutes=_expiration_minutes(code_type)),
        created_at=now,
    )


def issue_verification_code(database: Session, user_id: uuid.UUID, email: str, role: str = None, company_name: str = None) -> dict:
    """Garantiza un código de verificación vigente (registro y login): solo emite uno nuevo si no hay
    código o el actual expiró, así reintentar el login no envía más correos."""

    lock_account(database, user_id)
    now = datetime.utcnow()

    existing = get_code(database, user_id, TypeCode.VERIFY_EMAIL)

    if existing and existing.expires_at > now:
        return verification_state(existing, now)

    new_code = create_code_service(database, user_id, TypeCode.VERIFY_EMAIL, now=now)
    _send_after_commit(database, email, new_code.code, TypeCode.VERIFY_EMAIL, role, company_name)

    return verification_state(new_code, now)


def resend_verification_code(
    database: Session,
    user_id: uuid.UUID,
    email: str,
    role: str = None,
    company_name: str = None,
    client_ip: str | None = None,
) -> dict:
    """Reenvío explícito ("Reenviar código"): cooldown de 60 s, topes por cuenta e IP, invalida el
    código anterior y emite uno nuevo de 5 minutos."""

    lock_account(database, user_id)
    now = datetime.utcnow()

    reject_if_cooling_down(cooldown_remaining(get_code(database, user_id, TypeCode.VERIFY_EMAIL), now))
    enforce_send_limits("verify", str(user_id), client_ip)

    new_code = create_code_service(database, user_id, TypeCode.VERIFY_EMAIL, now=now)
    _send_after_commit(database, email, new_code.code, TypeCode.VERIFY_EMAIL, role, company_name)

    return verification_state(new_code, now)


def issue_reset_code(database: Session, user_id: uuid.UUID, email: str, now: datetime) -> None:
    """Código de recuperación nuevo (la solicitud inicial y cada reenvío). El cooldown y los topes los
    aplica el llamador antes, sin revelar si la cuenta existe."""

    new_code = create_code_service(database, user_id, TypeCode.RESET_PASSWORD, now=now)
    _send_after_commit(database, email, new_code.code, TypeCode.RESET_PASSWORD, None, None)


def verify_code_service(database: Session, user_id: uuid.UUID, code: str, code_type: TypeCode) -> VerifyCodeStatus:
    """Valida el código vigente de la cuenta. Un acierto lo consume; un fallo suma un intento y al
    llegar a MAX_FAILED_ATTEMPTS el código se invalida. El llamador debe confirmar la transacción
    también en los fallos, para que el contador de intentos persista."""

    code_entry = get_code(database, user_id, code_type, lock=True)

    if not code_entry:
        return VerifyCodeStatus.INVALID

    if code_entry.expires_at <= datetime.utcnow():
        delete_code(database, code_entry)
        return VerifyCodeStatus.EXPIRED

    if not secrets.compare_digest(code_entry.code.encode(), (code or "").encode()):
        code_entry.failed_attempts += 1
        if code_entry.failed_attempts >= MAX_FAILED_ATTEMPTS:
            delete_code(database, code_entry)
            return VerifyCodeStatus.LOCKED
        database.flush()
        return VerifyCodeStatus.INVALID

    delete_code(database, code_entry)

    return VerifyCodeStatus.VALID
