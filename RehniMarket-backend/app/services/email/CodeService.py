from datetime import datetime, timedelta
from enum import Enum
import math
import random
import uuid

from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelCode import TypeCode

from app.repository.CodeRepository import (
    create_code,
    get_code,
    delete_code,
    delete_user_codes
)

from app.services.email.template.EmailForgotPassword import EmailForgotPassword
from app.services.email.template.EmailRegisterUser import EmailRegisterUser
from app.services.email.template.EmailRegisterCompany import EmailRegisterCompany


CODE_LENGTH = 6

VERIFY_EMAIL_EXPIRATION_MINUTES = 5
RESET_PASSWORD_EXPIRATION_MINUTES = 15

CODE_EXPIRATION_MINUTES = {
    TypeCode.VERIFY_EMAIL: VERIFY_EMAIL_EXPIRATION_MINUTES,
    TypeCode.RESET_PASSWORD: RESET_PASSWORD_EXPIRATION_MINUTES,
    TypeCode.CHANGE_EMAIL: RESET_PASSWORD_EXPIRATION_MINUTES,
}

RESEND_COOLDOWN_SECONDS = 60


class VerifyCodeStatus(str, Enum):
    VALID = "VALID"
    INVALID = "INVALID"
    EXPIRED = "EXPIRED"


def _expiration_minutes(code_type: TypeCode) -> int:
    return CODE_EXPIRATION_MINUTES.get(code_type, RESET_PASSWORD_EXPIRATION_MINUTES)


def generate_code(length: int = CODE_LENGTH) -> str:

    return "".join(random.choices("0123456789", k=length))


def verification_state(code_entry, now: datetime | None = None) -> dict:
    """Segundos que le quedan al codigo antes de expirar y segundos que
    faltan para poder pedir un reenvio. Ambos se calculan en el backend a
    partir de created_at / expires_at reales - el contador del frontend es
    solo informativo. Se redondea hacia arriba para que el contador
    arranque exactamente en 05:00 / 01:00."""

    now = now or datetime.utcnow()

    expires_in = math.ceil((code_entry.expires_at - now).total_seconds())
    resend_available_in = math.ceil(
        RESEND_COOLDOWN_SECONDS - (now - code_entry.created_at).total_seconds()
    )

    return {
        "expires_in": max(0, expires_in),
        "resend_available_in": max(0, resend_available_in),
    }


def send_code(email: str, code: str, code_type: TypeCode, role: str = None, company_name: str = None) -> None:

    expiration_minutes = _expiration_minutes(code_type)

    if code_type == TypeCode.RESET_PASSWORD:
        EmailForgotPassword(email, code, expiration_minutes)

    elif code_type == TypeCode.VERIFY_EMAIL:
        if role == "company":
            EmailRegisterCompany(email, company_name, code, expiration_minutes)
        else:
            EmailRegisterUser(email, code, expiration_minutes)


def create_code_service(database: Session, user_id: uuid.UUID, code_type: TypeCode, now: datetime | None = None):
    """Invalida cualquier codigo previo de ese usuario+tipo y crea uno
    nuevo. Garantiza la regla "como maximo UN codigo activo por cuenta".

    `now` fija el instante de referencia para created_at y expires_at, de
    modo que los contadores derivados (verification_state) arranquen
    exactamente en 05:00 / 01:00 y no en 05:01 por el desfase de milis
    entre una llamada a utcnow() y la siguiente."""

    now = now or datetime.utcnow()

    delete_user_codes(database, user_id, code_type)

    code = generate_code()

    new_code = create_code(
        database,
        user_id,
        code,
        code_type,
        now + timedelta(minutes=_expiration_minutes(code_type)),
        created_at=now,
    )

    return new_code


def create_code_and_send_service(database: Session, user_id: uuid.UUID, email: str, code_type: TypeCode, role: str = None, company_name: str = None):
    """Genera un codigo nuevo y lo envia SIN aplicar cooldown. Se usa para
    los codigos de recuperacion de contrasena (RESET_PASSWORD), cuyo flujo
    no expone un boton de reenvio con cooldown."""

    new_code = create_code_service(database, user_id, code_type)

    send_code(email, new_code.code, code_type, role, company_name)

    return {
        "message": "Código enviado correctamente."
    }


def issue_verification_code(database: Session, user_id: uuid.UUID, email: str, role: str = None, company_name: str = None) -> dict:
    """Garantiza que exista un codigo de verificacion ACTIVO para la
    cuenta. Solo genera y envia uno nuevo si no hay codigo o el actual ya
    expiro. NO aplica cooldown porque no es una solicitud explicita de
    reenvio (la disparan el registro y el login). Devuelve el estado de
    los dos contadores (expiracion del codigo y cooldown de reenvio)."""

    now = datetime.utcnow()

    existing = get_code(database, user_id, TypeCode.VERIFY_EMAIL)

    if existing and existing.expires_at > now:
        return verification_state(existing, now)

    new_code = create_code_service(database, user_id, TypeCode.VERIFY_EMAIL, now=now)

    send_code(email, new_code.code, TypeCode.VERIFY_EMAIL, role, company_name)

    return verification_state(new_code, now)


def resend_verification_code(database: Session, user_id: uuid.UUID, email: str, role: str = None, company_name: str = None) -> dict:
    """Reenvio EXPLICITO (boton "Reenviar codigo"):

    1. Aplica el cooldown de 60 s contra el codigo activo (rechaza con
       429 si aun no paso).
    2. Invalida el codigo anterior y genera uno nuevo.
    3. Establece una expiracion nueva de 5 min.
    4. Envia el nuevo codigo al correo.
    5. Devuelve el estado de ambos contadores reiniciados (05:00 / 01:00).
    """

    now = datetime.utcnow()

    existing = get_code(database, user_id, TypeCode.VERIFY_EMAIL)

    if existing:
        elapsed = (now - existing.created_at).total_seconds()

        if elapsed < RESEND_COOLDOWN_SECONDS:
            retry_after = math.ceil(RESEND_COOLDOWN_SECONDS - elapsed)

            api_error(
                429,
                ErrorCodes.RESEND_COOLDOWN_ACTIVE,
                "Debes esperar antes de solicitar un nuevo código de verificación.",
                extra={"retry_after": retry_after},
            )

    new_code = create_code_service(database, user_id, TypeCode.VERIFY_EMAIL, now=now)

    send_code(email, new_code.code, TypeCode.VERIFY_EMAIL, role, company_name)

    return verification_state(new_code, now)


def verify_code_service(database: Session, user_id: uuid.UUID, code: str, code_type: TypeCode) -> VerifyCodeStatus:
    """Valida el codigo contra la cuenta:

    - codigo activo para esa cuenta+tipo,
    - codigo correcto (comparacion de string exacta, sin normalizar),
    - codigo no expirado (se compara expires_at real contra utcnow).
    """

    code_entry = get_code(database, user_id, code_type)

    if not code_entry:
        return VerifyCodeStatus.INVALID
    if code_entry.code != code:
        return VerifyCodeStatus.INVALID

    if code_entry.expires_at <= datetime.utcnow():
        delete_code(database, code_entry)

        return VerifyCodeStatus.EXPIRED

    delete_code(database, code_entry)

    return VerifyCodeStatus.VALID
