"""Emisión y verificación de los JWT de acceso y de renovación (PyJWT, HS256)."""
import uuid
from datetime import datetime, timedelta, UTC

import jwt
from jwt import ExpiredSignatureError, InvalidTokenError

from app.Config import config

SECRET_KEY = config.SECRET_KEY
ACCESS_TOKEN_EXPIRE_MINUTES = config.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_DAYS = config.REFRESH_TOKEN_DAYS

# Fijo en el código y nunca tomado del encabezado del token: así no se aceptan "none" ni otro
# algoritmo (confusión de algoritmos). Es el mismo formato que emitía python-jose.
ALGORITHM = "HS256"


def _expires_in(lifetime: timedelta) -> datetime:
    """Momento de expiración del token, como datetime con zona horaria UTC."""
    return datetime.now(UTC) + lifetime


def create_access_token(user_id: str, role: str):
    # PyJWT >= 2.10 exige que "sub" sea texto.
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "exp": _expires_in(timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: str):
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": _expires_in(timedelta(days=REFRESH_TOKEN_DAYS)),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str):
    """Payload si el token es válido, "expired" si venció y None si es inválido por cualquier otra causa."""
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
    except ExpiredSignatureError:
        return "expired"
    except InvalidTokenError:
        return None

    # Un "sub" que no es UUID nunca lo emite el backend; rechazarlo aquí evita que llegue a la
    # consulta de usuarios y termine en un error de base de datos en vez de un 401.
    try:
        uuid.UUID(payload["sub"])
    except (ValueError, TypeError, AttributeError):
        return None

    return payload
