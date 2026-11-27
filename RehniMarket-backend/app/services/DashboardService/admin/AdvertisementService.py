from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelAdvertisement import Advertisement, AdvertisementTargetType
from app.models.ModelProduct import Product
from app.models.ModelCatalog import Catalog
from app.models.ModelCompany import Company

from app.schemas.SchemaDashboard.SchemaAdvertisement import (
    CreateAdvertisementRequest,
    UpdateAdvertisementRequest,
    AdvertisementResponse,
)

from app.services.NasService import build_media_url
from app.services.DashboardService.admin.AdvertisementTargeting import (
    resolve_advertisement_destination,
)


ADVERTISEMENT_NAS_PATH = "advertisements/"


# Targets que apuntan a un registro: modelo, mensaje si falta el id y error si no existe.
_REFERENCE_TARGETS = {
    AdvertisementTargetType.PRODUCT: (
        Product, "Selecciona un producto para este anuncio.",
        ErrorCodes.PRODUCT_NOT_FOUND, "El producto seleccionado no existe.",
    ),
    AdvertisementTargetType.CATEGORY: (
        Catalog, "Selecciona una categoría para este anuncio.",
        ErrorCodes.CATALOG_NOT_FOUND, "La categoría seleccionada no existe.",
    ),
    AdvertisementTargetType.COMPANY: (
        Company, "Selecciona una empresa para este anuncio.",
        ErrorCodes.COMPANY_NOT_FOUND, "La empresa seleccionada no existe.",
    ),
}


def _validate_target_reference(
    database: Session,
    target_type,
    target_product_id: UUID | None,
    target_catalog_id: UUID | None,
    target_company_id: UUID | None,
) -> None:
    """Confirma que el producto/categoría/empresa del target realmente existan."""
    reference = _REFERENCE_TARGETS.get(target_type)

    if not reference:
        return

    model, missing_message, not_found_code, not_found_message = reference
    target_id = {
        AdvertisementTargetType.PRODUCT: target_product_id,
        AdvertisementTargetType.CATEGORY: target_catalog_id,
        AdvertisementTargetType.COMPANY: target_company_id,
    }[target_type]

    if not target_id:
        api_error(400, ErrorCodes.VALIDATION_ERROR, missing_message)

    if not database.query(model.id).filter(model.id == target_id).first():
        api_error(404, not_found_code, not_found_message)


def _resolve_and_require_destination(data) -> str | None:
    """Calcula el destino real y, si target_type no es None, exige que haya quedado una URL válida."""

    destination = resolve_advertisement_destination(
        target_type=data.target_type,
        target_product_id=data.target_product_id,
        target_catalog_id=data.target_catalog_id,
        target_company_id=data.target_company_id,
        minimum_discount=data.minimum_discount,
        maximum_stock=data.maximum_stock,
        max_age_days=data.max_age_days,
    )

    if data.target_type is not None and destination is None:
        api_error(
            400,
            ErrorCodes.VALIDATION_ERROR,
            "Completa la configuración requerida para este tipo de anuncio.",
        )

    return destination


def _get_advertisement_or_404(
    database: Session,
    advertisement_id: UUID,
) -> Advertisement:

    advertisement = database.get(
        Advertisement,
        advertisement_id,
    )

    if not advertisement:
        api_error(
            404,
            ErrorCodes.ADVERTISEMENT_NOT_FOUND,
            "Anuncio no encontrado.",
        )

    return advertisement


def _to_response(
    advertisement: Advertisement,
) -> AdvertisementResponse:
    return AdvertisementResponse(
        id=advertisement.id,

        image_url=build_media_url(
            advertisement.image_url
        ),

        mobile_image_url=(
            build_media_url(
                advertisement.mobile_image_url
            )
            if advertisement.mobile_image_url
            else None
        ),

        button_link=advertisement.button_link,
        is_active=advertisement.is_active,
        order=advertisement.order,
        created_at=advertisement.created_at,

        target_type=advertisement.target_type,
        target_product_id=advertisement.target_product_id,
        target_catalog_id=advertisement.target_catalog_id,
        target_company_id=advertisement.target_company_id,
        minimum_discount=advertisement.minimum_discount,
        maximum_stock=advertisement.maximum_stock,
        max_age_days=advertisement.max_age_days,
    )


def get_advertisements_service(
    database: Session,
) -> list[AdvertisementResponse]:


    advertisements = (
        database.query(Advertisement)
        .order_by(
            Advertisement.order.asc(),
            Advertisement.created_at.asc(),
        )
        .all()
    )

    return [
        _to_response(advertisement)
        for advertisement in advertisements
    ]


def get_advertisement_service(
    database: Session,
    advertisement_id: UUID,
) -> AdvertisementResponse:

    advertisement = _get_advertisement_or_404(
        database,
        advertisement_id,
    )

    return _to_response(advertisement)


def create_advertisement_service(
    database: Session,
    data: CreateAdvertisementRequest,
    image,
    mobile_image,
    nas,
) -> AdvertisementResponse:


    try:


        if not image:
            api_error(
                400,
                ErrorCodes.ADVERTISEMENT_IMAGE_REQUIRED,
                "La imagen del anuncio es obligatoria.",
            )

        desktop_result = nas.upload_file(
            image,
            f"{ADVERTISEMENT_NAS_PATH}desktop/",
        )

        if not desktop_result.get("success"):
            api_error(
                500,
                ErrorCodes.INTERNAL_SERVER_ERROR,
                "No se pudo subir la imagen del anuncio.",
            )


        mobile_path = None

        if mobile_image:

            mobile_result = nas.upload_file(
                mobile_image,
                f"{ADVERTISEMENT_NAS_PATH}mobile/",
            )

            if not mobile_result.get("success"):
                api_error(
                    500,
                    ErrorCodes.INTERNAL_SERVER_ERROR,
                    "No se pudo subir la imagen móvil del anuncio.",
                )

            mobile_path = mobile_result["path"]

        _validate_target_reference(
            database,
            data.target_type,
            data.target_product_id,
            data.target_catalog_id,
            data.target_company_id,
        )

        resolved_link = _resolve_and_require_destination(data)

        advertisement = Advertisement(
            image_url=desktop_result["path"],

            mobile_image_url=mobile_path,

            button_link=(
                resolved_link
                if data.target_type is not None
                else (data.button_link.strip() if data.button_link else None)
            ),

            order=data.order,

            is_active=data.is_active,

            target_type=data.target_type,
            target_product_id=data.target_product_id,
            target_catalog_id=data.target_catalog_id,
            target_company_id=data.target_company_id,
            minimum_discount=data.minimum_discount,
            maximum_stock=data.maximum_stock,
            max_age_days=data.max_age_days,
        )

        database.add(advertisement)

        database.commit()

        database.refresh(advertisement)

        return _to_response(advertisement)

    except HTTPException:

        database.rollback()

        raise

    except Exception as e:

        database.rollback()

        api_error(
            500,
            ErrorCodes.INTERNAL_SERVER_ERROR,
            str(e),
        )


_TARGET_FIELDS = (
    "target_type",
    "target_product_id",
    "target_catalog_id",
    "target_company_id",
    "minimum_discount",
    "maximum_stock",
    "max_age_days",
)


def _apply_target_update(database: Session, advertisement: Advertisement, data) -> None:
    if data.clear_target:
        for field in _TARGET_FIELDS:
            setattr(advertisement, field, None)
        return

    if data.target_type is None:
        return

    _validate_target_reference(
        database,
        data.target_type,
        data.target_product_id,
        data.target_catalog_id,
        data.target_company_id,
    )
    for field in _TARGET_FIELDS:
        setattr(advertisement, field, getattr(data, field))


def _apply_button_link_update(advertisement: Advertisement, data) -> None:
    """Con target, el enlace se calcula; sin target, se respeta el button_link enviado."""
    if advertisement.target_type is not None:
        resolved_link = resolve_advertisement_destination(
            **{field: getattr(advertisement, field) for field in _TARGET_FIELDS}
        )

        if resolved_link is None:
            api_error(
                400,
                ErrorCodes.VALIDATION_ERROR,
                "Completa la configuración requerida para este tipo de anuncio.",
            )

        advertisement.button_link = resolved_link

    elif data.button_link is not None:
        advertisement.button_link = data.button_link.strip() or None


def _replace_image(nas, advertisement: Advertisement, attribute: str, upload, folder: str, error: str) -> None:
    previous = getattr(advertisement, attribute)
    result = nas.upload_file(upload, f"{ADVERTISEMENT_NAS_PATH}{folder}/")

    if not result.get("success"):
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, error)

    setattr(advertisement, attribute, result["path"])

    if previous:
        nas.delete_file(previous.removeprefix("uploads/"))


def _remove_mobile_image(nas, advertisement: Advertisement) -> None:
    if advertisement.mobile_image_url:
        nas.delete_file(advertisement.mobile_image_url.removeprefix("uploads/"))
        advertisement.mobile_image_url = None


def update_advertisement_service(
    database: Session,
    advertisement_id: UUID,
    data: UpdateAdvertisementRequest,
    image,
    mobile_image,
    nas,
) -> AdvertisementResponse:
    try:
        advertisement = _get_advertisement_or_404(database, advertisement_id)

        _apply_target_update(database, advertisement, data)
        _apply_button_link_update(advertisement, data)

        if data.order is not None:
            advertisement.order = data.order

        if data.is_active is not None:
            advertisement.is_active = data.is_active

        if image:
            _replace_image(nas, advertisement, "image_url", image, "desktop",
                           "No se pudo actualizar la imagen desktop.")

        if mobile_image:
            _replace_image(nas, advertisement, "mobile_image_url", mobile_image, "mobile",
                           "No se pudo actualizar la imagen móvil.")
        elif data.remove_mobile_image:
            _remove_mobile_image(nas, advertisement)

        database.commit()

        database.refresh(advertisement)

        return _to_response(advertisement)

    except HTTPException:

        database.rollback()

        raise

    except Exception as e:

        database.rollback()

        api_error(
            500,
            ErrorCodes.INTERNAL_SERVER_ERROR,
            str(e),
        )


def change_advertisement_status_service(
    database: Session,
    advertisement_id: UUID,
    is_active: bool,
) -> AdvertisementResponse:

    advertisement = _get_advertisement_or_404(
        database,
        advertisement_id,
    )

    advertisement.is_active = is_active

    database.commit()

    database.refresh(advertisement)

    return _to_response(advertisement)


def delete_advertisement_service(
    database: Session,
    advertisement_id: UUID,
    nas,
):

    advertisement = _get_advertisement_or_404(
        database,
        advertisement_id,
    )


    if advertisement.image_url:

        nas.delete_file(
            advertisement.image_url.removeprefix(
                "uploads/"
            )
        )

    if advertisement.mobile_image_url:

        nas.delete_file(
            advertisement.mobile_image_url.removeprefix(
                "uploads/"
            )
        )

    database.delete(advertisement)

    database.commit()

    return {
        "message": "Anuncio eliminado correctamente.",
        "advertisement_id": str(advertisement_id),
    }