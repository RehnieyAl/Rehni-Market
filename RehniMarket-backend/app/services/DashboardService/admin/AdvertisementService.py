from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelAdvertisement import Advertisement

from app.schemas.SchemaDashboard.SchemaAdvertisement import (
    CreateAdvertisementRequest,
    UpdateAdvertisementRequest,
    AdvertisementResponse,
)

from app.services.NasService import build_media_url


ADVERTISEMENT_NAS_PATH = "advertisements/"


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
        title=advertisement.title,
        description=advertisement.description,

        # Desktop
        image_url=build_media_url(
            advertisement.image_url
        ),

        # Mobile
        mobile_image_url=(
            build_media_url(
                advertisement.mobile_image_url
            )
            if advertisement.mobile_image_url
            else None
        ),

        button_text=advertisement.button_text,
        button_link=advertisement.button_link,
        is_active=advertisement.is_active,
        order=advertisement.order,
        created_at=advertisement.created_at,
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

        advertisement = Advertisement(
            title=data.title.strip(),

            description=(
                data.description.strip()
                if data.description
                else None
            ),

            image_url=desktop_result["path"],

            mobile_image_url=mobile_path,

            button_text=(
                data.button_text.strip()
                if data.button_text
                else None
            ),

            button_link=(
                data.button_link.strip()
                if data.button_link
                else None
            ),

            order=data.order,

            is_active=data.is_active,
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


        if data.title is not None:
            advertisement.title = data.title.strip()

        if data.description is not None:
            advertisement.description = (
                data.description.strip()
                or None
            )

        if data.button_text is not None:
            advertisement.button_text = (
                data.button_text.strip()
                or None
            )

        if data.button_link is not None:
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

            # Eliminar imagen anterior
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

            # Eliminar imagen móvil anterior
            if previous_mobile_image:

                nas.delete_file(
                    previous_mobile_image.removeprefix(
                        "uploads/"
                    )
                )

        elif data.remove_mobile_image:

            # Eliminar la imagen móvil actual sin reemplazarla (solo si
            # no se subió una imagen móvil nueva en este mismo request).
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