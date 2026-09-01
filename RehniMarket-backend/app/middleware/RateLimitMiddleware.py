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