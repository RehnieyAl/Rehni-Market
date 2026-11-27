"""Límites de frecuencia en memoria: tope global por IP (middleware) y topes por clave para
operaciones sensibles, como el envío de códigos por correo."""

import time

from collections import defaultdict
from fastapi import Request
from starlette.responses import JSONResponse

from app.core.ErrorCodes import ErrorCodes
from app.Config import config


REQUEST_LIMIT = config.REQUEST_LIMIT
TIME_WINDOW = config.TIME_WINDOW

requests = defaultdict(list)


async def rate_limit_middleware(
    request: Request,
    call_next,
):
    client_ip = (
        request.client.host
        if request.client
        else "unknown"
    )

    current_time = time.time()

    requests[client_ip] = [
        timestamp
        for timestamp in requests[client_ip]
        if current_time - timestamp < TIME_WINDOW
    ]

    if len(requests[client_ip]) >= REQUEST_LIMIT:
        return JSONResponse(
            status_code=429,
            content={
                "detail": {
                    "code": ErrorCodes.RATE_LIMIT_EXCEEDED,
                    "message": "Demasiadas solicitudes. Intenta nuevamente más tarde.",
                }
            },
        )

    requests[client_ip].append(current_time)

    return await call_next(request)

def retry_after_if_limited(key: str, limit: int, window_seconds: int) -> int | None:
    """Registra un intento para `key` (p. ej. "code:reset:correo") y devuelve los segundos que faltan
    si ya se alcanzó `limit` en la ventana; None si el intento se permite. No depende de
    RATE_LIMIT_ENABLED: protege el envío de correos aunque el tope global esté apagado."""

    now = time.time()
    attempts = [stamp for stamp in requests[key] if now - stamp < window_seconds]

    if len(attempts) >= limit:
        requests[key] = attempts
        return max(1, int(window_seconds - (now - attempts[0])) + 1)

    attempts.append(now)
    requests[key] = attempts
    return None
