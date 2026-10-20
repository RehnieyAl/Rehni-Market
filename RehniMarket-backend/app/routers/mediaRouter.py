from fastapi import APIRouter, Response, HTTPException
from app.services.NasService import client

router = APIRouter()


@router.get("/media/proxy")
def proxy_file(path: str):
    try:
        object_name = path.removeprefix("uploads/")

        response = client.get_object(
            "uploads",
            object_name,
        )

        try:
            content = response.read()

            content_type = response.headers.get(
                "Content-Type",
                "application/octet-stream",
            )
        finally:
            # Devuelve la conexión HTTP al pool del cliente MinIO (sin esto
            # cada imagen servida dejaba una conexión sin liberar).
            response.close()
            response.release_conn()

        return Response(
            content=content,
            media_type=content_type,
            headers={
                "Content-Disposition": "inline",
                # Los objetos se suben con nombre uuid4 (NasService.upload_file):
                # una imagen nueva = URL nueva, el contenido de una URL no cambia.
                # El navegador la reutiliza y no vuelve a ocupar un hilo del
                # backend por cada tarjeta. "private": nada de cachés compartidas.
                "Cache-Control": "private, max-age=86400, immutable",
            },
        )

    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Archivo no encontrado",
        )