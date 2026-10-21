from fastapi import Request

from app.services.NasService import request_media_base


async def public_base_url_middleware(
    request: Request,
    call_next,
):
    # Caddy (api.<dominio>) reenvía con X-Forwarded-Host = host que pidió el cliente.
    # Las URL de imágenes se arman con ese esquema y host (https://api.dominio…), así
    # no hay contenido mixto en HTTPS. Sin el encabezado (app móvil directo al
    # :8000, tests) se usa URL_BACKEND como antes.
    host = request.headers.get("x-forwarded-host")

    if not host:
        return await call_next(request)

    # request.url.scheme ya viene de X-Forwarded-Proto (uvicorn --proxy-headers)
    token = request_media_base.set(f"{request.url.scheme}://{host}")
    try:
        return await call_next(request)
    finally:
        request_media_base.reset(token)
