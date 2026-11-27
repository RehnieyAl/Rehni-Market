"""Archivos de MinIO por el backend: /media/proxy sirve las imágenes públicas y /media/private los
documentos privados (certificados) solo con una URL firmada que caduca."""

from fastapi import APIRouter, HTTPException, Response

from app.services.NasService import client, is_private_object, is_valid_private_signature

router = APIRouter()


def _not_found():
    raise HTTPException(status_code=404, detail="Archivo no encontrado")


def _object_response(object_name: str, cache_control: str) -> Response:
    if ".." in object_name.split("/"):
        _not_found()

    try:
        response = client.get_object("uploads", object_name)
    except Exception:
        _not_found()

    try:
        content = response.read()
        content_type = response.headers.get("Content-Type", "application/octet-stream")
    finally:
        # Devuelve la conexión HTTP al pool del cliente MinIO.
        response.close()
        response.release_conn()

    return Response(
        content=content,
        media_type=content_type,
        headers={
            "Content-Disposition": "inline",
            "Cache-Control": cache_control,
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.get("/media/proxy")
def proxy_file(path: str):
    object_name = path.removeprefix("uploads/")

    # Un certificado por esta ruta pública respondería a cualquiera que tenga el enlace.
    if is_private_object(object_name):
        _not_found()

    # Los objetos se suben con nombre uuid4: una imagen nueva = URL nueva, así que el navegador
    # puede reutilizarla. "private": nada de cachés compartidas.
    return _object_response(object_name, "private, max-age=86400, immutable")


@router.get("/media/private")
def private_file(path: str, expires: int, signature: str):
    object_name = path.removeprefix("uploads/")

    if not is_private_object(object_name) or not is_valid_private_signature(object_name, expires, signature):
        _not_found()

    return _object_response(object_name, "private, no-store")
