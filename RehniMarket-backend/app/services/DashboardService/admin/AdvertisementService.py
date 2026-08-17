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


# =================================================
# ANUNCIOS DINÁMICOS POR REGLAS (ver ALCANCE)
# =================================================

def _validate_target_reference(
    database: Session,
    target_type,
    target_product_id: UUID | None,
    target_catalog_id: UUID | None,
    target_company_id: UUID | None,
) -> None:
    """
    Antes de guardar, confirma que el producto/categoría/empresa
    elegidos en el panel admin realmente existan - un anuncio no debe
    poder apuntar a un id inventado o ya eliminado.
    """

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
        pass  # se valida minimum_discount al resolver el destino (ver abajo)

    elif target_type == AdvertisementTargetType.LIQUIDATION:
        pass  # se valida minimum_discount/maximum_stock al resolver el destino

    elif target_type == AdvertisementTargetType.NEW_RELEASE:
        pass  # se valida max_age_days al resolver el destino


def _resolve_and_require_destination(data) -> str | None:
    """
    Calcula el destino real y, si `target_type` no es None, exige que
    haya quedado una URL válida (ej. PROMOTION sin minimum_discount no
    genera nada útil) - evita guardar un anuncio "dinámico" que en
    realidad no lleva a ningún lado.
    """

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

        # Anuncios dinámicos por reglas (ver ALCANCE): valida que el
        # target elegido exista y calcula el destino real - con
        # target_type=None (anuncio manual clásico) esto no hace nada y
        # se usa button_link tal cual lo escribió el admin.
        _validate_target_reference(
            database,
            data.target_type,
            data.target_product_id,
            data.target_catalog_id,
            data.target_company_id,
        )

        resolved_link = _resolve_and_require_destination(data)

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

        # Anuncios dinámicos por reglas (ver ALCANCE): `clear_target`
        # vuelve el anuncio a manual clásico (mismo motivo que
        # remove_mobile_image de abajo - un PATCH con target_type=None
        # es ambiguo entre "no lo toques" y "bórralo", se necesita una
        # bandera explícita). Si se envía un target_type nuevo, se
        # reemplaza toda la configuración de target junta (no se puede
        # cambiar solo un campo de un target sin reenviar el tipo, mismo
        # criterio que ya usa el formulario para el resto de campos).
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
            # El destino siempre se recalcula (no solo cuando cambió el
            # target en este mismo request) - cubre el caso de un
            # anuncio dinámico ya existente al que solo se le edita el
            # título/imagen, donde el destino calculado debe seguir
            # siendo el mismo.
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
            # Manual clásico (target_type None) - único caso donde
            # button_link lo escribe el admin (ver ALCANCE >
            # compatibilidad con anuncios antiguos).
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