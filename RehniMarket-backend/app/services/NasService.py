from minio import Minio
from minio.error import S3Error
from app.Config import config

from datetime import timedelta
from fastapi.responses import StreamingResponse
import logging
import uuid

logger = logging.getLogger(__name__)

MINIO_ENDPOINT = config.MINIO_URL or "minio:9000"

client = Minio(
    MINIO_ENDPOINT,
    access_key=config.MINIO_ROOT_USER,
    secret_key=config.MINIO_ROOT_PASSWORD,
    secure=False
)

bucket = "uploads"

_bucket_ready = False


def ensure_bucket() -> None:
    global _bucket_ready

    if _bucket_ready:
        return

    try:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
        _bucket_ready = True
    except Exception as exc:
        logger.warning("No se pudo verificar/crear el bucket '%s': %s", bucket, exc)


class NasService:

    def __init__(self, client, bucket):
        self.client = client
        self.bucket = bucket

    def upload_file(self, file, PATH: str):
        try:
            if not file:
                return None

            ensure_bucket()

            ext = file.filename.split(".")[-1]

            object_name = (
                f"{PATH}"
                f"{uuid.uuid4()}.{ext}"
            )

            self.client.put_object(
                self.bucket,
                object_name,
                file.file,
                length=-1,
                part_size=10 * 1024 * 1024,
                content_type=file.content_type
            )

            return {
                "success": True,
                "object_name": object_name,
                "path": f"{self.bucket}/{object_name}"
            }

        except S3Error as e:
            return {"success": False, "message": str(e)}

        except Exception as e:
            return {"success": False, "message": str(e)}


    def get_presigned_url(self, object_name: str, expires: int = 3600):
        
        return self.client.presigned_get_object(
            self.bucket,
            object_name,
            expires=timedelta(seconds=3600)
        )

    def delete_file(self, object_name: str) -> bool:

        try:
            self.client.remove_object(
                self.bucket,
                object_name
            )

            return {"success": True}

        except S3Error as e:
            return {"success": False, "message": str(e)}
        
    def download_stream(self, object_name: str):

        response = self.client.get_object(
            self.bucket,
            object_name
        )

        def iterfile():
            for chunk in response.stream(32 * 1024):
                yield chunk

        return StreamingResponse(
            iterfile(),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename={object_name.split('/')[-1]}"
            }
        )


nas_service = NasService(client, bucket)

def get_nas_service():
    return nas_service

MEDIA_BASE_URL = (config.URL_BACKEND or "http://192.168.40.25:8001").rstrip("/")


def build_media_url(path: str) -> str:
    return f"{MEDIA_BASE_URL}/media/proxy?path={path}"
