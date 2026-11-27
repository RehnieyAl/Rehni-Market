"""Validación de archivos (app/utils/FileValidator.py) y su uso en los endpoints reales: formatos,
tamaño, MIME, contenido, archivos vacíos o dañados, autorización, fallos de MinIO y certificados
privados (/media/proxy y /media/private)."""

import io
import time
import uuid

import pytest
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from app.models.ModelProduct import Product
from app.models.ModelUser import Users
from app.services import NasService as nas_module
from app.services.NasService import build_private_media_url, get_nas_service
from app.utils.FileValidator import IMAGE_EXTENSIONS, MAX_UPLOAD_BYTES, PDF_EXTENSIONS, validate_upload
from tests.conftest import auth
from tests.factories import valid_jpeg, valid_pdf, valid_png, valid_webp

CREATE_PRODUCT_URL = "/company/dashboard/create-product"


def _upload(name: str, content: bytes, content_type: str) -> UploadFile:
    return UploadFile(io.BytesIO(content), filename=name, headers=Headers({"content-type": content_type}))


def _error(name, content, content_type, allowed=IMAGE_EXTENSIONS):
    with pytest.raises(HTTPException) as caught:
        validate_upload(_upload(name, content, content_type), allowed, "Archivo")
    return caught.value.status_code, caught.value.detail["code"]


class TestValidator:
    @pytest.mark.parametrize(
        "name, content, content_type",
        [
            ("foto.jpg", valid_jpeg(), "image/jpeg"),
            ("foto.JPEG", valid_jpeg(), "image/jpeg"),
            ("foto.png", valid_png(), "image/png"),
            ("foto.webp", valid_webp(), "image/webp"),
        ],
    )
    def test_valid_images_pass(self, name, content, content_type):
        validate_upload(_upload(name, content, content_type), IMAGE_EXTENSIONS, "Imagen")

    def test_valid_pdf_passes(self):
        validate_upload(_upload("camara.pdf", valid_pdf(), "application/pdf"), PDF_EXTENSIONS, "Certificado")

    def test_file_is_left_ready_to_be_stored(self):
        upload = _upload("foto.png", valid_png(), "image/png")

        validate_upload(upload, IMAGE_EXTENSIONS, "Imagen")

        assert upload.file.tell() == 0

    def test_file_over_the_limit_returns_413(self):
        assert _error("grande.pdf", valid_pdf(padding=MAX_UPLOAD_BYTES), "application/pdf", PDF_EXTENSIONS) == (
            413, "FILE_TOO_LARGE",
        )

    def test_file_exactly_at_the_limit_passes(self):
        content = valid_pdf()
        content = valid_pdf(padding=MAX_UPLOAD_BYTES - len(content))
        assert len(content) == MAX_UPLOAD_BYTES

        validate_upload(_upload("limite.pdf", content, "application/pdf"), PDF_EXTENSIONS, "Certificado")

    @pytest.mark.parametrize(
        "name, content, content_type, allowed",
        [
            ("animacion.gif", b"GIF89a" + b"\x00" * 20, "image/gif", IMAGE_EXTENSIONS),
            ("sin-extension", valid_png(), "image/png", IMAGE_EXTENSIONS),
            ("camara.pdf", valid_pdf(), "application/pdf", IMAGE_EXTENSIONS),
            ("foto.png", valid_png(), "image/png", PDF_EXTENSIONS),
        ],
    )
    def test_format_not_allowed_returns_415(self, name, content, content_type, allowed):
        assert _error(name, content, content_type, allowed) == (415, "UNSUPPORTED_FILE_TYPE")

    def test_wrong_mime_returns_415(self):
        assert _error("foto.png", valid_png(), "image/jpeg") == (415, "UNSUPPORTED_FILE_TYPE")

    @pytest.mark.parametrize(
        "name, content, content_type",
        [
            ("foto.png", valid_pdf(), "image/png"),
            ("foto.jpg", valid_png(), "image/jpeg"),
            ("script.png", b"<?php system($_GET['c']); ?>" + b"IEND\xaeB`\x82", "image/png"),
        ],
    )
    def test_spoofed_extension_returns_415(self, name, content, content_type):
        assert _error(name, content, content_type) == (415, "UNSUPPORTED_FILE_TYPE")

    def test_spoofed_pdf_returns_415(self):
        assert _error("camara.pdf", valid_png(), "application/pdf", PDF_EXTENSIONS) == (415, "UNSUPPORTED_FILE_TYPE")

    def test_empty_file_returns_400(self):
        assert _error("vacio.png", b"", "image/png") == (400, "INVALID_FILE")

    @pytest.mark.parametrize(
        "name, content, content_type, allowed",
        [
            ("cortada.png", valid_png()[:-12], "image/png", IMAGE_EXTENSIONS),
            ("cortada.jpg", valid_jpeg()[:-2], "image/jpeg", IMAGE_EXTENSIONS),
            ("cortada.webp", valid_webp()[:-4], "image/webp", IMAGE_EXTENSIONS),
            ("cortado.pdf", valid_pdf()[:-7], "application/pdf", PDF_EXTENSIONS),
        ],
    )
    def test_corrupt_or_truncated_file_returns_400(self, name, content, content_type, allowed):
        assert _error(name, content, content_type, allowed) == (400, "INVALID_FILE")

    def test_jpeg_with_trailing_metadata_is_accepted(self):
        content = valid_jpeg() + b"SEFT" + b"\x00" * 4096

        validate_upload(_upload("celular.jpg", content, "image/jpeg"), IMAGE_EXTENSIONS, "Imagen")


class _RecordingNas:
    def __init__(self, fail=False):
        self.fail = fail
        self.uploaded = []
        self.deleted = []

    def upload_file(self, file, path: str):
        if self.fail:
            return {"success": False, "message": "detalle interno de MinIO"}
        name = f"{path}{uuid.uuid4()}.bin"
        self.uploaded.append(name)
        return {"success": True, "object_name": name, "path": f"uploads/{name}"}

    def delete_file(self, object_name: str):
        self.deleted.append(object_name)
        return {"success": True}


@pytest.fixture()
def nas(client):
    fake = _RecordingNas()
    client.app.dependency_overrides[get_nas_service] = lambda: fake
    yield fake
    client.app.dependency_overrides.pop(get_nas_service, None)


def _create_product(client, token, catalog, files):
    form = {
        "nameProduct": "Lámpara",
        "catalogId": str(catalog.id),
        "priceProduct": "100",
        "stockProduct": "3",
        "descripcionProduct": "Luz cálida",
        "technicalSpecProduct": "[]",
    }
    return client.post(CREATE_PRODUCT_URL, data=form, files=files, headers=auth(token))


class TestProductImagesEndpoint:
    def test_valid_images_are_stored(self, client, tokens, company, catalog, nas):
        files = [
            ("imagesProduct", ("a.jpg", valid_jpeg(), "image/jpeg")),
            ("imagesProduct", ("b.webp", valid_webp(), "image/webp")),
        ]

        response = _create_product(client, tokens["company"], catalog, files)

        assert response.status_code == 200
        assert len(nas.uploaded) == 2

    @pytest.mark.parametrize(
        "file, status",
        [
            (("a.pdf", valid_pdf(), "application/pdf"), 415),
            (("a.png", valid_pdf(), "image/png"), 415),
            (("a.png", b"", "image/png"), 400),
            (("a.png", valid_png()[:-12], "image/png"), 400),
        ],
    )
    def test_rejected_file_is_never_stored(self, client, tokens, db, company, catalog, nas, file, status):
        files = [("imagesProduct", ("ok.png", valid_png(), "image/png")), ("imagesProduct", file)]

        response = _create_product(client, tokens["company"], catalog, files)

        assert response.status_code == status
        assert nas.uploaded == [], "ningún archivo del lote llega a MinIO"
        assert db.query(Product).count() == 0

    def test_buyer_cannot_upload_product_images(self, client, tokens, catalog, nas):
        response = _create_product(client, tokens["user"], catalog, [("imagesProduct", ("a.png", valid_png(), "image/png"))])

        assert response.status_code == 403
        assert nas.uploaded == []

    def test_without_token_nothing_is_stored(self, client, catalog, nas):
        response = client.post(CREATE_PRODUCT_URL, files=[("imagesProduct", ("a.png", valid_png(), "image/png"))])

        assert response.status_code == 401
        assert nas.uploaded == []

    def test_storage_failure_returns_structured_error_and_rolls_back(self, client, tokens, db, company, catalog):
        client.app.dependency_overrides[get_nas_service] = lambda: _RecordingNas(fail=True)

        response = _create_product(client, tokens["company"], catalog, [("imagesProduct", ("a.png", valid_png(), "image/png"))])

        client.app.dependency_overrides.pop(get_nas_service, None)
        assert response.status_code == 500
        assert response.json()["detail"] == {
            "code": "FILE_UPLOAD_FAILED",
            "message": "No se pudo guardar el archivo. Intenta de nuevo.",
        }
        assert db.query(Product).count() == 0


class TestOtherUploadEndpoints:
    def test_logo_too_large_is_rejected(self, client, tokens, company, nas):
        big_png = valid_png() + b"\x00" * MAX_UPLOAD_BYTES

        response = client.patch(
            "/company/dashboard/patch-media-logo-banner",
            files={"photo_profile": ("logo.png", big_png, "image/png")},
            headers=auth(tokens["company"]),
        )

        assert response.status_code == 413
        assert nas.uploaded == []

    def test_banner_accepts_a_valid_image(self, client, tokens, company, nas):
        response = client.patch(
            "/company/dashboard/patch-media-logo-banner",
            files={"banner_profile": ("banner.webp", valid_webp(), "image/webp")},
            headers=auth(tokens["company"]),
        )

        assert response.status_code == 200
        assert len(nas.uploaded) == 1

    def test_variant_images_reject_pdf(self, client, tokens, company, nas):
        response = client.post(
            f"/company/dashboard/products/{uuid.uuid4()}/variants/{uuid.uuid4()}/images",
            files=[("imagesVariant", ("v.pdf", valid_pdf(), "application/pdf"))],
            headers=auth(tokens["company"]),
        )

        assert response.status_code == 415
        assert nas.uploaded == []

    def test_profile_photo_rejects_spoofed_image(self, client, tokens, nas):
        response = client.patch(
            "/auth/me/photo",
            files={"photo": ("yo.jpg", valid_pdf(), "image/jpeg")},
            headers=auth(tokens["user"]),
        )

        assert response.status_code == 415
        assert nas.uploaded == []

    def test_catalog_image_rejects_unsupported_format(self, client, tokens, nas):
        response = client.post(
            "/admin/dashboard/created-catalogs",
            data={"name": "Mascotas"},
            files={"image": ("gato.gif", b"GIF89a", "image/gif")},
            headers=auth(tokens["admin"]),
        )

        assert response.status_code == 415
        assert nas.uploaded == []

    def test_advertisement_mobile_image_is_validated(self, client, tokens, nas):
        response = client.post(
            "/admin/dashboard/create-advertisement",
            files={
                "image": ("ok.png", valid_png(), "image/png"),
                "mobile_image": ("movil.png", b"", "image/png"),
            },
            headers=auth(tokens["admin"]),
        )

        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "INVALID_FILE"
        assert nas.uploaded == []

    def test_register_company_rejects_image_as_certificate(self, client, db, nas):
        data = {
            "full_name": "Ana Pérez", "email": "ana@example.com", "password": "Secreto123", "tell": "3001234567",
            "company_name": "Tienda Ana SAS", "company_address": "Calle 10 # 20-30",
            "company_nit": "800197268", "company_nit_dv": "4",
        }

        response = client.post(
            "/auth/register-company", data=data, files={"certificate": ("camara.png", valid_png(), "image/png")}
        )

        assert response.status_code == 415
        assert nas.uploaded == []
        assert db.query(Users).filter(Users.email == "ana@example.com").count() == 0

    def test_report_evidence_rejects_spoofed_file(self, client, tokens, product, nas):
        response = client.post(
            "/reports",
            data={"targetType": "product", "targetId": str(product.id), "reason": "Producto falso"},
            files=[("evidences", ("prueba.png", valid_pdf(), "image/png"))],
            headers=auth(tokens["user"]),
        )

        assert response.status_code == 415
        assert nas.uploaded == []


class _FakeObject:
    headers = {"Content-Type": "application/pdf"}

    def read(self):
        return valid_pdf()

    def close(self):
        pass

    def release_conn(self):
        pass


@pytest.fixture()
def minio_reads(monkeypatch):
    requested = []

    def get_object(bucket, object_name):
        requested.append(object_name)
        return _FakeObject()

    monkeypatch.setattr("app.routers.mediaRouter.client.get_object", get_object)
    return requested


CERTIFICATE = "companies/800197268/certificates/abc.pdf"


class TestPrivateCertificates:
    def test_public_proxy_refuses_certificates(self, client, minio_reads):
        response = client.get("/media/proxy", params={"path": f"uploads/{CERTIFICATE}"})

        assert response.status_code == 404
        assert minio_reads == [], "ni siquiera se consulta MinIO"

    def test_public_proxy_still_serves_public_images(self, client, minio_reads):
        response = client.get("/media/proxy", params={"path": "uploads/companies/800197268/products/a.png"})

        assert response.status_code == 200
        assert minio_reads == ["companies/800197268/products/a.png"]

    def test_proxy_rejects_path_traversal(self, client, minio_reads):
        response = client.get("/media/proxy", params={"path": "uploads/../secretos/x"})

        assert response.status_code == 404
        assert minio_reads == []

    def test_signed_url_serves_the_certificate(self, client, minio_reads):
        url = build_private_media_url(CERTIFICATE)

        response = client.get("/media/private" + url.split("/media/private", 1)[1])

        assert response.status_code == 200
        assert response.headers["cache-control"] == "private, no-store"
        assert minio_reads == [CERTIFICATE]

    @pytest.mark.parametrize("tamper", ["signature", "path", "expired"])
    def test_tampered_or_expired_signature_is_rejected(self, client, minio_reads, tamper):
        expires = int(time.time()) + 600
        params = {
            "path": CERTIFICATE,
            "expires": expires,
            "signature": nas_module._private_signature(CERTIFICATE, expires),
        }
        if tamper == "signature":
            params["signature"] = "0" * 64
        elif tamper == "path":
            params["path"] = "companies/900123456/certificates/otro.pdf"
        else:
            params["expires"] = int(time.time()) - 1
            params["signature"] = nas_module._private_signature(CERTIFICATE, params["expires"])

        response = client.get("/media/private", params=params)

        assert response.status_code == 404
        assert minio_reads == []

    def test_private_route_does_not_serve_public_images(self, client, minio_reads):
        image = "companies/800197268/products/a.png"
        expires = int(time.time()) + 600
        params = {"path": image, "expires": expires, "signature": nas_module._private_signature(image, expires)}

        assert client.get("/media/private", params=params).status_code == 404

    def test_admin_gets_a_signed_certificate_url(self, client, tokens, db, company):
        company.CompanyCertificate = CERTIFICATE
        db.commit()

        response = client.get(f"/admin/dashboard/get-company/{company.id}", headers=auth(tokens["admin"]))

        assert response.status_code == 200
        url = response.json()["CompanyCertificate"]
        assert "/media/private?" in url and "signature=" in url
        assert "/media/proxy" not in url
