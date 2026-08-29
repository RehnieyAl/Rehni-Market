from fastapi import HTTPException


def api_error(status_code: int, code: str, message: str, extra: dict | None = None):
    detail = {
        "code": code,
        "message": message,
    }

    # Datos adicionales que el frontend necesita junto al error, p. ej.
    # retry_after (segundos que faltan para poder reenviar el codigo) o
    # los contadores expires_in / resend_available_in en el 400 de
    # EMAIL_NOT_VERIFIED del login.
    if extra:
        detail.update(extra)

    raise HTTPException(
        status_code=status_code,
        detail=detail,
    )
