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


def _validate_target_reference(
    database: Session,
    target_type,
    target_product_id: UUID | None,
    target_catalog_id: UUID | None,
    target_company_id: UUID | None,
) -> None:
    """Confirma que el producto/categoría/empresa del target realmente existan."""

    if target_type == AdvertisementTargetType.PRODUCT:
        if not target_product_id:
            api_error(400, ErrorCodes.VALIDATION_ERROR, "Selecciona un producto para este anuncio.")

        if not database.query(Product.id).filter(Product.id == target_product_id).first():
            api_error(404, ErrorCodes.PRODUCT_NOT_FOUND, "El producto seleccionado no existe.")

    elif target_type == AdvertisementTargetType.CATEGORY:
        if not target_catalog_id:
            api_error(400, ErrorCodes.VALIDATION_ERROR, "Selecciona una categoría para este anuncio.")

        if not database.query(Catalog.id).filter(Catalog.id == target_catalog_id).first():
            api_error(404, ErrorCodes.CATALOG_NOT_FOUND, "La categoría seleccionada no existe.")

    elif target_type == AdvertisementTargetType.COMPANY:
        if not target_company_id:
            api_error(400, ErrorCodes.VALIDATION_ERROR, "Selecciona una empresa para este anuncio.")

        if not database.query(Company.id).filter(Company.id == target_company_id).first():
            api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "La empresa seleccionada no existe.")

    elif target_type in (
        AdvertisementTargetType.PROMOTION,
        AdvertisementTargetType.BLACK_FRIDAY,
        AdvertisementTargetType.CYBER_DAYS,
    ):
        pass

    elif target_type == AdvertisementTargetType.LIQUIDATION:
        pass

    elif target_type == AdvertisementTargetType.NEW_RELEASE:
        pass


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
                desktop_result.get(
                    "message",
                    "No se pudo subir la imagen del anuncio.",
                ),
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
                    mobile_result.get(
                        "message",
                        "No se pudo subir la imagen móvil del anuncio.",
                    ),
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


def update_advertisement_service(
    database: Session,
    advertisement_id: UUID,
    data: UpdateAdvertisementRequest,
    image,
    mobile_image,
    nas,
) -> AdvertisementResponse:

    try:

        advertisement = _get_advertisement_or_404(
            database,
            advertisement_id,
        )

        if data.clear_target:
            advertisement.target_type = None
            advertisement.target_product_id = None
            advertisement.target_catalog_id = None
            advertisement.target_company_id = None
            advertisement.minimum_discount = None
            advertisement.maximum_stock = None
            advertisement.max_age_days = None

        elif data.target_type is not None:
            _validate_target_reference(
                database,
                data.target_type,
                data.target_product_id,
                data.target_catalog_id,
                data.target_company_id,
            )

            advertisement.target_type = data.target_type
            advertisement.target_product_id = data.target_product_id
            advertisement.target_catalog_id = data.target_catalog_id
            advertisement.target_company_id = data.target_company_id
            advertisement.minimum_discount = data.minimum_discount
            advertisement.maximum_stock = data.maximum_stock
            advertisement.max_age_days = data.max_age_days

        if advertisement.target_type is not None:
            resolved_link = resolve_advertisement_destination(
                target_type=advertisement.target_type,
                target_product_id=advertisement.target_product_id,
                target_catalog_id=advertisement.target_catalog_id,
                target_company_id=advertisement.target_company_id,
                minimum_discount=advertisement.minimum_discount,
                maximum_stock=advertisement.maximum_stock,
                max_age_days=advertisement.max_age_days,
            )

            if resolved_link is None:
                api_error(
                    400,
                    ErrorCodes.VALIDATION_ERROR,
                    "Completa la configuración requerida para este tipo de anuncio.",
                )

            advertisement.button_link = resolved_link

        elif data.button_link is not None:
            advertisement.button_link = (
                data.button_link.strip()
                or None
            )

        if data.order is not None:
            advertisement.order = data.order

        if data.is_active is not None:
            advertisement.is_active = data.is_active

        if image:

            previous_image = advertisement.image_url

            desktop_result = nas.upload_file(
                image,
                f"{ADVERTISEMENT_NAS_PATH}desktop/",
            )

            if not desktop_result.get("success"):
                api_error(
                    500,
                    ErrorCodes.INTERNAL_SERVER_ERROR,
                    desktop_result.get(
                        "message",
                        "No se pudo actualizar la imagen desktop.",
                    ),
                )

            advertisement.image_url = (
                desktop_result["path"]
            )

            if previous_image:

                nas.delete_file(
                    previous_image.removeprefix(
                        "uploads/"
                    )
                )


        if mobile_image:

            previous_mobile_image = (
                advertisement.mobile_image_url
            )

            mobile_result = nas.upload_file(
                mobile_image,
                f"{ADVERTISEMENT_NAS_PATH}mobile/",
            )

            if not mobile_result.get("success"):
                api_error(
                    500,
                    ErrorCodes.INTERNAL_SERVER_ERROR,
                    mobile_result.get(
                        "message",
                        "No se pudo actualizar la imagen móvil.",
                    ),
                )

            advertisement.mobile_image_url = (
                mobile_result["path"]
            )

            if previous_mobile_image:

                nas.delete_file(
                    previous_mobile_image.removeprefix(
                        "uploads/"
                    )
                )

        elif data.remove_mobile_image:

            previous_mobile_image = (
                advertisement.mobile_image_url
            )

            if previous_mobile_image:

                nas.delete_file(
                    previous_mobile_image.removeprefix(
                        "uploads/"
                    )
                )

                advertisement.mobile_image_url = None


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