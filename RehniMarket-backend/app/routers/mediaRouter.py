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

        content = response.read()

        content_type = response.headers.get(
            "Content-Type",
            "application/octet-stream",
        )

        return Response(
            content=content,
            media_type=content_type,
            headers={
                "Content-Disposition": "inline",
            },
        )

    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Archivo no encontrado",
        )