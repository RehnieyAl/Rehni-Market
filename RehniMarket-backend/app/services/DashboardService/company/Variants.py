import json

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelVariant import ProductVariant
from app.models.ModelVariantImage import ProductVariantImage
from app.models.ModelVariantSpecification import VariantSpecification

from app.repository import VariantRepository as repo

from app.schemas.SchemaDashboard.SchemaVariant import (
    CreateVariantRequest,
    UpdateVariantRequest,
    VariantSpecificationRequest,
    VariantSpecificationUpdateRequest,
    VariantResponse,
    VariantDetailResponse,
    VariantColorResponse,
    VariantImageResponse,
    VariantSpecificationResponse,
)

from app.services.NasService import build_media_url


# ==============================
# HELPERS DE OWNERSHIP
# ==============================
# Validan siempre la cadena completa user_id -> company -> product ->
# variant (ver ALCANCE > OWNERSHIP). Una empresa jamas puede tocar un
# producto o variante de otra empresa.

def _resolve_owned_product(user_id, product_id, database: Session):

    company = repo.get_company_by_user_id(database, user_id)

    if not company:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada")

    product = repo.get_owned_product(database, company.id, product_id)

    if not product:
        api_error(404, ErrorCodes.PRODUCT_NOT_FOUND, "Producto no encontrado")

    return company, product


def _resolve_owned_variant(user_id, product_id, variant_id, database: Session):

    company, product = _resolve_owned_product(user_id, product_id, database)

    variant = repo.get_owned_variant(database, company.id, product_id, variant_id)

    if not variant:
        api_error(404, ErrorCodes.VARIANT_NOT_FOUND, "Variante no encontrada")

    return company, product, variant


# ==============================
# SERIALIZACION
# ==============================

def _to_variant_response(variant: ProductVariant) -> VariantResponse:

    main_image = next((image for image in variant.images if image.is_main), None)

    color = (
        VariantColorResponse(
            id=variant.color.id,
            name=variant.color.name,
            hex_color=variant.color.hex_color,
        )
        if variant.color
        else None
    )

    return VariantResponse(
        id=variant.id,
        name=variant.name,
        price=variant.price,
        discount_enable=variant.discount_enable,
        discount_value=variant.discount_value,
        stock=variant.stock,
        product_id=variant.product_id,
        color=color,
        main_image_url=build_media_url(main_image.url) if main_image else None,
    )


def _to_variant_detail_response(variant: ProductVariant) -> VariantDetailResponse:

    base = _to_variant_response(variant)

    images = [
        VariantImageResponse(
            id=image.id,
            url=build_media_url(image.url),
            is_main=image.is_main,
        )
        for image in variant.images
    ]

    specifications = [
        VariantSpecificationResponse(
            id=specification.id,
            specification_template_id=specification.specification_template_id,
            value=specification.value,
        )
        for specification in variant.specifications
    ]

    return VariantDetailResponse(**base.model_dump(), images=images, specifications=specifications)


# ==============================
# VARIANTES
# ==============================

def list_variants_service(user_id, product_id, database: Session) -> list[VariantResponse]:

    _, product = _resolve_owned_product(user_id, product_id, database)

    variants = repo.list_variants_by_product(database, product.id)

    return [_to_variant_response(variant) for variant in variants]


def get_variant_detail_service(user_id, product_id, variant_id, database: Session) -> VariantDetailResponse:

    _, _, variant = _resolve_owned_variant(user_id, product_id, variant_id, database)

    return _to_variant_detail_response(variant)


def create_variant_service(
    user_id,
    product_id,
    data: CreateVariantRequest,
    imagesVariant,
    nas,
    database: Session,
) -> VariantDetailResponse:

    try:
        company, product = _resolve_owned_product(user_id, product_id, database)

        color = repo.get_color_by_id(database, data.colorId)

        if not color:
            api_error(404, ErrorCodes.COLOR_NOT_FOUND, "Color no encontrado")

        duplicate = repo.find_variant_by_color(database, product.id, color.id)

        if duplicate:
            api_error(
                409,
                ErrorCodes.VARIANT_COLOR_ALREADY_EXISTS,
                "Ya existe una variante de este producto con ese color",
            )

        new_variant = ProductVariant(
            name=data.name,
            price=data.price,
            stock=data.stock,
            product_id=product.id,
            color_id=color.id,
        )

        database.add(new_variant)
        database.flush()

        if data.specifications:
            specifications = json.loads(data.specifications)

            seen_templates = set()

            for specification in specifications:
                template_id = specification["specificationTemplateId"]

                if template_id in seen_templates:
                    api_error(
                        409,
                        ErrorCodes.VARIANT_SPECIFICATION_ALREADY_EXISTS,
                        "No se puede asignar dos valores a la misma especificación",
                    )

                seen_templates.add(template_id)

                template = repo.get_specification_template(database, template_id)

                if not template:
                    api_error(
                        404,
                        ErrorCodes.SPECIFICATION_TEMPLATE_NOT_FOUND,
                        "Especificación no encontrada",
                    )

                # La especificacion debe pertenecer al catalogo del
                # producto - una empresa no puede usar una especificacion
                # de otro catalogo (ver ALCANCE > punto 4).
                if str(template.catalog_id) != str(product.catalog_id):
                    api_error(
                        409,
                        ErrorCodes.SPECIFICATION_TEMPLATE_CATALOG_MISMATCH,
                        "La especificación seleccionada no pertenece al catálogo del producto.",
                    )

                database.add(
                    VariantSpecification(
                        value=specification["value"],
                        specification_template_id=template.id,
                        variant_id=new_variant.id,
                    )
                )

        if imagesVariant:
            for index, file in enumerate(imagesVariant):
                result = nas.upload_file(file, f"companies/{company.CompanyNIT}/variants/")
                database.add(
                    ProductVariantImage(
                        url=result["path"],
                        is_main=(index == 0),
                        variant_id=new_variant.id,
                    )
                )

        database.commit()
        database.refresh(new_variant)

        return _to_variant_detail_response(new_variant)

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        raise HTTPException(status_code=500, detail=str(e))


def update_variant_service(
    user_id,
    product_id,
    variant_id,
    data: UpdateVariantRequest,
    database: Session,
) -> VariantDetailResponse:

    try:
        _, product, variant = _resolve_owned_variant(user_id, product_id, variant_id, database)

        if data.colorId is not None and data.colorId != str(variant.color_id):
            color = repo.get_color_by_id(database, data.colorId)

            if not color:
                api_error(404, ErrorCodes.COLOR_NOT_FOUND, "Color no encontrado")

            duplicate = repo.find_variant_by_color(
                database, product.id, color.id, exclude_variant_id=variant.id
            )

            if duplicate:
                api_error(
                    409,
                    ErrorCodes.VARIANT_COLOR_ALREADY_EXISTS,
                    "Ya existe una variante de este producto con ese color",
                )

            variant.color_id = color.id

        if data.name is not None:
            variant.name = data.name

        if data.price is not None:
            variant.price = data.price

        if data.discountEnable is not None:
            variant.discount_enable = data.discountEnable

        if data.discountValue is not None:
            variant.discount_value = data.discountValue

        if (data.discountEnable is not None or data.discountValue is not None) and variant.discount_enable:
            # Misma regla que update_product_service (ver
            # app/services/DashboardService/company/Products.py): un
            # descuento "activado" con porcentaje 0 queda invisible para el
            # comprador (_compute_price_fields lo trata como sin
            # descuento), asi que se rechaza al guardar en vez de guardarlo
            # en silencio.
            if not variant.discount_value or variant.discount_value <= 0:
                api_error(
                    400,
                    ErrorCodes.VALIDATION_ERROR,
                    "Para activar el descuento, el porcentaje de descuento debe ser mayor a 0.",
                )

        if data.stock is not None:
            variant.stock = data.stock

        database.commit()
        database.refresh(variant)

        return _to_variant_detail_response(variant)

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        raise HTTPException(status_code=500, detail=str(e))


def delete_variant_service(user_id, product_id, variant_id, database: Session):

    try:
        _, _, variant = _resolve_owned_variant(user_id, product_id, variant_id, database)

        database.delete(variant)
        database.commit()

        return {
            "message": "Variante eliminada correctamente",
            "variant_id": str(variant_id),
        }

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ==============================
# IMÁGENES
# ==============================

def list_variant_images_service(user_id, product_id, variant_id, database: Session) -> list[VariantImageResponse]:

    _, _, variant = _resolve_owned_variant(user_id, product_id, variant_id, database)

    return [
        VariantImageResponse(
            id=image.id,
            url=build_media_url(image.url),
            is_main=image.is_main,
        )
        for image in variant.images
    ]


def upload_variant_images_service(
    user_id,
    product_id,
    variant_id,
    imagesVariant,
    nas,
    database: Session,
) -> VariantDetailResponse:

    try:
        company, _, variant = _resolve_owned_variant(user_id, product_id, variant_id, database)

        if not imagesVariant:
            api_error(400, ErrorCodes.INVALID_FILE, "Debe enviar al menos una imagen")

        # Si la variante ya tiene una imagen principal, las nuevas entran
        # como secundarias. Si no tiene ninguna, la primera imagen nueva se
        # promueve automaticamente (mismo criterio que create-product).
        has_main_already = any(image.is_main for image in variant.images)

        for index, file in enumerate(imagesVariant):
            result = nas.upload_file(file, f"companies/{company.CompanyNIT}/variants/")

            database.add(
                ProductVariantImage(
                    url=result["path"],
                    is_main=(not has_main_already and index == 0),
                    variant_id=variant.id,
                )
            )

        database.commit()
        database.refresh(variant)

        return _to_variant_detail_response(variant)

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        raise HTTPException(status_code=500, detail=str(e))


def delete_variant_image_service(
    user_id,
    product_id,
    variant_id,
    image_id,
    nas,
    database: Session,
) -> VariantDetailResponse:

    try:
        _, _, variant = _resolve_owned_variant(user_id, product_id, variant_id, database)

        image = repo.get_variant_image_owned(database, variant.id, image_id)

        if not image:
            api_error(404, ErrorCodes.VARIANT_IMAGE_NOT_FOUND, "Imagen no encontrada")

        was_main = image.is_main

        nas.delete_file(image.url.removeprefix("uploads/"))
        database.delete(image)
        database.flush()

        # Si la imagen eliminada era la principal, promovemos otra que
        # quede - una variante nunca debe quedar sin principal si aun tiene
        # imagenes (mismo criterio que update-my-product).
        if was_main:
            remaining_images = repo.list_variant_images(database, variant.id)

            if remaining_images:
                remaining_images[0].is_main = True

        database.commit()
        database.refresh(variant)

        return _to_variant_detail_response(variant)

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        raise HTTPException(status_code=500, detail=str(e))


def set_main_variant_image_service(
    user_id,
    product_id,
    variant_id,
    image_id,
    database: Session,
) -> VariantDetailResponse:

    try:
        _, _, variant = _resolve_owned_variant(user_id, product_id, variant_id, database)

        image = repo.get_variant_image_owned(database, variant.id, image_id)

        if not image:
            api_error(404, ErrorCodes.VARIANT_IMAGE_NOT_FOUND, "Imagen no encontrada")

        # Una variante solo puede tener una imagen principal: se desmarca
        # la anterior antes de asignar la nueva (ver ALCANCE > IMAGENES).
        repo.clear_main_image(database, variant.id)
        image.is_main = True

        database.commit()
        database.refresh(variant)

        return _to_variant_detail_response(variant)

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ==============================
# ESPECIFICACIONES
# ==============================

def list_variant_specifications_service(
    user_id, product_id, variant_id, database: Session
) -> list[VariantSpecificationResponse]:

    _, _, variant = _resolve_owned_variant(user_id, product_id, variant_id, database)

    return [
        VariantSpecificationResponse(
            id=specification.id,
            specification_template_id=specification.specification_template_id,
            value=specification.value,
        )
        for specification in variant.specifications
    ]


def create_variant_specification_service(
    user_id,
    product_id,
    variant_id,
    data: VariantSpecificationRequest,
    database: Session,
) -> VariantDetailResponse:

    try:
        _, product, variant = _resolve_owned_variant(user_id, product_id, variant_id, database)

        template = repo.get_specification_template(database, data.specificationTemplateId)

        if not template:
            api_error(
                404,
                ErrorCodes.SPECIFICATION_TEMPLATE_NOT_FOUND,
                "Especificación no encontrada",
            )

        # Misma regla que en la creacion de variante: la especificacion
        # debe pertenecer al catalogo del producto.
        if str(template.catalog_id) != str(product.catalog_id):
            api_error(
                409,
                ErrorCodes.SPECIFICATION_TEMPLATE_CATALOG_MISMATCH,
                "La especificación seleccionada no pertenece al catálogo del producto.",
            )

        duplicate = repo.find_variant_specification_by_template(database, variant.id, template.id)

        if duplicate:
            api_error(
                409,
                ErrorCodes.VARIANT_SPECIFICATION_ALREADY_EXISTS,
                "Ya existe un valor para esta especificación en la variante",
            )

        database.add(
            VariantSpecification(
                value=data.value,
                specification_template_id=template.id,
                variant_id=variant.id,
            )
        )

        database.commit()
        database.refresh(variant)

        return _to_variant_detail_response(variant)

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        raise HTTPException(status_code=500, detail=str(e))


def update_variant_specification_service(
    user_id,
    product_id,
    variant_id,
    specification_id,
    data: VariantSpecificationUpdateRequest,
    database: Session,
) -> VariantDetailResponse:

    try:
        _, _, variant = _resolve_owned_variant(user_id, product_id, variant_id, database)

        specification = repo.get_variant_specification_owned(database, variant.id, specification_id)

        if not specification:
            api_error(
                404,
                ErrorCodes.VARIANT_SPECIFICATION_NOT_FOUND,
                "Especificación de variante no encontrada",
            )

        specification.value = data.value

        database.commit()
        database.refresh(variant)

        return _to_variant_detail_response(variant)

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        raise HTTPException(status_code=500, detail=str(e))


def delete_variant_specification_service(
    user_id,
    product_id,
    variant_id,
    specification_id,
    database: Session,
) -> VariantDetailResponse:

    try:
        _, _, variant = _resolve_owned_variant(user_id, product_id, variant_id, database)

        specification = repo.get_variant_specification_owned(database, variant.id, specification_id)

        if not specification:
            api_error(
                404,
                ErrorCodes.VARIANT_SPECIFICATION_NOT_FOUND,
                "Especificación de variante no encontrada",
            )

        database.delete(specification)
        database.commit()
        database.refresh(variant)

        return _to_variant_detail_response(variant)

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        raise HTTPException(status_code=500, detail=str(e))
