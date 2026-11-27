"""Validación de archivos subidos antes de guardarlos en MinIO: extensión, MIME declarado, tamaño
(máx. 5 MiB) y contenido real (firma y marcador de fin). 413 si pesa de más, 415 si el tipo no se
admite y 400 INVALID_FILE si está vacío o dañado."""

from fastapi import UploadFile

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
_CHUNK_BYTES = 64 * 1024

IMAGE_EXTENSIONS = frozenset({"jpg", "jpeg", "png", "webp"})
PDF_EXTENSIONS = frozenset({"pdf"})

_CANONICAL = {"jpg": "jpeg", "jpeg": "jpeg", "png": "png", "webp": "webp", "pdf": "pdf"}
_CONTENT_TYPES = {"jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp", "pdf": "application/pdf"}
# Marcador que todo archivo completo contiene; un archivo truncado lo pierde. Se busca en todo el
# archivo porque fotos de celular y PDF editados pueden traer datos después del fin "oficial".
_END_MARKERS = {"jpeg": b"\xff\xd9", "png": b"IEND\xaeB`\x82", "pdf": b"%%EOF"}


def _detect_format(head: bytes) -> str | None:
    if head.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    if head.startswith(b"%PDF-"):
        return "pdf"
    return None


def _size_and_head(stream) -> tuple[int, bytes]:
    stream.seek(0, 2)
    size = stream.tell()
    stream.seek(0)
    head = stream.read(16)
    stream.seek(0)
    return size, head


def _contains(stream, marker: bytes) -> bool:
    """Busca `marker` leyendo por bloques: el archivo nunca se carga entero en memoria."""
    previous = b""
    stream.seek(0)
    try:
        while chunk := stream.read(_CHUNK_BYTES):
            if marker in previous + chunk:
                return True
            previous = chunk[-len(marker):]
        return False
    finally:
        stream.seek(0)


def _is_complete(file_format: str, stream, head: bytes, size: int) -> bool:
    if file_format == "webp":
        # El tamaño del contenedor RIFF más sus 8 bytes de cabecera es el del archivo (con relleno par).
        return int.from_bytes(head[4:8], "little") + 8 in (size, size - 1)
    return _contains(stream, _END_MARKERS[file_format])


def validate_upload(file: UploadFile, allowed: frozenset[str], label: str) -> None:
    """Rechaza el archivo si no cumple; `label` lo nombra en el mensaje (p. ej. "Certificado")."""
    allowed_names = ", ".join(sorted({_CANONICAL[ext].upper() for ext in allowed}))
    declared = _CANONICAL.get(file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "")

    if declared is None or declared not in {_CANONICAL[ext] for ext in allowed} or file.content_type != _CONTENT_TYPES[declared]:
        api_error(415, ErrorCodes.UNSUPPORTED_FILE_TYPE, f"{label}: solo se admite {allowed_names}.")

    size, head = _size_and_head(file.file)

    if size == 0:
        api_error(400, ErrorCodes.INVALID_FILE, f"{label}: el archivo está vacío.")

    if size > MAX_UPLOAD_BYTES:
        api_error(413, ErrorCodes.FILE_TOO_LARGE, f"{label}: el archivo supera el máximo de 5 MB.")

    if _detect_format(head) != declared:
        api_error(415, ErrorCodes.UNSUPPORTED_FILE_TYPE, f"{label}: el contenido no corresponde a un archivo {declared.upper()}.")

    if not _is_complete(declared, file.file, head, size):
        api_error(400, ErrorCodes.INVALID_FILE, f"{label}: el archivo está dañado o incompleto.")


def validate_uploads(files, allowed: frozenset[str], label: str) -> None:
    for file in files or []:
        if file is not None:
            validate_upload(file, allowed, label)
