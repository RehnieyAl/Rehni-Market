"""Almacenamiento en MinIO: bucket de subidas, carga y borrado, URL públicas (/media/proxy) y firmadas (/media/private)."""
from minio import Minio
from minio.error import S3Error
from app.Config import config
from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from contextvars import ContextVar
import hashlib
import hmac
import time
from urllib.parse import quote
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


    def delete_file(self, object_name: str) -> bool:

        try:
            self.client.remove_object(
                self.bucket,
                object_name
            )

            return {"success": True}

        except S3Error as e:
            return {"success": False, "message": str(e)}
        
def require_stored(result: dict | None, key: str = "path") -> str:
    """Ruta del objeto subido, o 500 FILE_UPLOAD_FAILED si MinIO no lo guardó (sin detalles internos)."""
    if not result or not result.get("success"):
        api_error(500, ErrorCodes.FILE_UPLOAD_FAILED, "No se pudo guardar el archivo. Intenta de nuevo.")
    return result[key]


nas_service = NasService(client, bucket)

def get_nas_service():
    return nas_service

# Sin URL_BACKEND solo tiene sentido el backend local (puerto de docker-compose).
MEDIA_BASE_URL = (config.URL_BACKEND or "http://localhost:8001").rstrip("/")

# Base pública de la petición en curso cuando llega por el proxy (la fija
# public_base_url_middleware). Si no hay, se usa MEDIA_BASE_URL.
request_media_base: ContextVar[str | None] = ContextVar("request_media_base", default=None)


def build_media_url(path: str) -> str:
    base = request_media_base.get() or MEDIA_BASE_URL
    return f"{base}/media/proxy?path={path}"


# Documentos privados (certificados empresariales): /media/proxy no los sirve; solo /media/private con
# una firma HMAC que caduca, emitida en respuestas ya autorizadas (panel admin y de la propia empresa).
PRIVATE_PATH_MARKERS = ("/certificates/",)
PRIVATE_URL_TTL_SECONDS = 30 * 60


def is_private_object(object_name: str) -> bool:
    return any(marker in f"/{object_name}" for marker in PRIVATE_PATH_MARKERS)


def _private_signature(object_name: str, expires: int) -> str:
    message = f"{object_name}:{expires}".encode()
    return hmac.new(config.SECRET_KEY.encode(), message, hashlib.sha256).hexdigest()


def build_private_media_url(object_name: str, ttl_seconds: int = PRIVATE_URL_TTL_SECONDS) -> str:
    base = request_media_base.get() or MEDIA_BASE_URL
    expires = int(time.time()) + ttl_seconds
    signature = _private_signature(object_name, expires)
    return f"{base}/media/private?path={quote(object_name, safe='/')}&expires={expires}&signature={signature}"


def is_valid_private_signature(object_name: str, expires: int, signature: str) -> bool:
    if expires < time.time():
        return False
    return hmac.compare_digest(_private_signature(object_name, expires), signature)
