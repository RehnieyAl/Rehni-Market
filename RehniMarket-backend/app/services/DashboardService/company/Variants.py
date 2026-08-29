from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.models.ModelAttributeValue import VariantAttributeValue
from app.models.ModelCatalogAttribute import CatalogAttribute
from app.models.ModelVariant import ProductVariant
from app.models.ModelVariantImage import ProductVariantImage
from app.repository import ProductArchitectureRepository as repo
from app.repository import VariantRepository as image_repo
from app.schemas.SchemaDashboard.SchemaVariant import (
    CreateVariantRequest,
    UpdateVariantRequest,
    VariantAttributeValuePair,
    VariantDetailResponse,
    VariantImageResponse,
    VariantOptionPair,
    VariantResponse,
)
from app.services.NasService import build_media_url
from app.services.pricing import resolve_price
from app.services.variants import resolver


def _resolve_owned_product(database: Session, user_id, product_id):
    company = repo.get_company_by_user_id(database, user_id)
    if not company:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada")

    product = repo.get_owned_product(database, company.id, product_id)
    if not product:
        api_error(404, ErrorCodes.PRODUCT_NOT_FOUND, "Producto no encontrado")

    return company, product


def _resolve_owned_variant(database: Session, user_id, product_id, variant_id):
    company, product = _resolve_owned_product(database, user_id, product_id)

    variant = repo.get_owned_variant(database, company.id, product_id, variant_id)
    if not variant:
        api_error(404, ErrorCodes.VARIANT_NOT_FOUND, "Variante no encontrada")

    return company, product, variant


def _sync_product_pricing(database: Session, product) -> None:
    """La variante es la unidad vendible; Product.price/stock son un espejo derivado
    que usa el catálogo público para mostrar "desde", filtrar y ordenar. Se toma el
    precio base de la variante viva más barata y la suma de su stock. El descuento del
    producto (PUT /discount) no se toca: es una promoción propia del producto padre."""

    live = repo.list_variants_by_product(database, product.id, include_deleted=False)

    product.has_variants = len(live) > 0

    if not live:
        product.stock = 0
        return

    cheapest = min(
        live, key=lambda variant: resolve_price(None, variant).final_price
    )

    product.price = cheapest.price
    product.stock = sum(variant.stock for variant in live)


def _validate_discount_window(data) -> None:
    starts = getattr(data, "discount_starts_at", None)
    ends = getattr(data, "discount_ends_at", None)
    if starts is not None and ends is not None and ends <= starts:
        api_error(
            400,
            ErrorCodes.VALIDATION_ERROR,
            "La fecha de fin del descuento debe ser posterior a la de inicio.",
        )


def _resolve_attribute_values(database: Session, product, items):
    seen: set = set()
    resolved: list[tuple[CatalogAttribute, str]] = []

    for item in items or []:
        if item.attribute_id in seen:
            api_error(
                409,
                ErrorCodes.PRODUCT_ATTRIBUTE_INVALID,
                "No se puede asignar dos valores al mismo atributo.",
            )
        seen.add(item.attribute_id)

        attribute = database.get(CatalogAttribute, item.attribute_id)
        if not attribute:
            api_error(
                404, ErrorCodes.CATALOG_ATTRIBUTE_NOT_FOUND, "Atributo no encontrado."
            )

        if str(attribute.catalog_id) != str(product.catalog_id):
            api_error(
                409,
                ErrorCodes.CATALOG_ATTRIBUTE_CATALOG_MISMATCH,
                f"'{attribute.name}' no pertenece al catálogo de este producto.",
            )

        if not attribute.is_active:
            api_error(
                409,
                ErrorCodes.CATALOG_ATTRIBUTE_INACTIVE,
                f"El atributo '{attribute.name}' está inactivo.",
            )

        resolved.append((attribute, item.value.strip()))

    return resolved


def _apply_attribute_values(database: Session, variant, resolved) -> None:
    database.query(VariantAttributeValue).filter(
        VariantAttributeValue.variant_id == variant.id
    ).delete(synchronize_session=False)

    for attribute, value in resolved:
        database.add(
            VariantAttributeValue(
                variant_id=variant.id, attribute_id=attribute.id, value=value
            )
        )


def _to_option_pairs(variant) -> list[VariantOptionPair]:
    return [
        VariantOptionPair(
            attribute_id=link.attribute_id,
            attribute_name=link.attribute.name,
            option_id=link.option_id,
            value=link.option.value,
            hex_color=link.option.hex_color,
        )
        for link in sorted(
            variant.options,
            key=lambda link: (link.attribute.position, link.attribute.name),
        )
    ]


def _to_variant_response(product, variant: ProductVariant) -> VariantResponse:
    price = resolve_price(product, variant)
    main_image = next((image for image in variant.images if image.is_main), None)

    return VariantResponse(
        id=variant.id,
        name=variant.name,
        sku=variant.sku,
        price=variant.price,
        stock=variant.stock,
        combo_key=variant.combo_key,
        deleted_at=variant.deleted_at,
        discount_enable=variant.discount_enable,
        discount_value=variant.discount_value,
        discount_type=variant.discount_type,
        discount_starts_at=variant.discount_starts_at,
        discount_ends_at=variant.discount_ends_at,
        effective_price=price.final_price,
        discount_percentage=price.discount_percentage,
        discount_source=price.source,
        product_id=variant.product_id,
        options=_to_option_pairs(variant),
        main_image_url=build_media_url(main_image.url) if main_image else None,
    )


def _to_variant_detail_response(product, variant) -> VariantDetailResponse:
    base = _to_variant_response(product, variant)

    images = [
        VariantImageResponse(
            id=image.id, url=build_media_url(image.url), is_main=image.is_main
        )
        for image in variant.images
    ]

    attribute_values = [
        VariantAttributeValuePair(
            attribute_id=value.attribute_id,
            attribute_name=value.attribute.name,
            value=value.value,
        )
        for value in sorted(
            variant.attribute_values,
            key=lambda value: (value.attribute.position, value.attribute.name),
        )
    ]

    return VariantDetailResponse(
        **base.model_dump(), images=images, attribute_values=attribute_values
    )


def list_variants_service(
    user_id, product_id, database: Session, include_deleted: bool = False
) -> list[VariantResponse]:
    _, product = _resolve_owned_product(database, user_id, product_id)
    variants = repo.list_variants_by_product(
        database, product.id, include_deleted=include_deleted
    )
    return [_to_variant_response(product, variant) for variant in variants]


def get_variant_detail_service(
    user_id, product_id, variant_id, database: Session
) -> VariantDetailResponse:
    _, product, variant = _resolve_owned_variant(
        database, user_id, product_id, variant_id
    )
    return _to_variant_detail_response(product, variant)


def create_variant_service(
    user_id, product_id, data: CreateVariantRequest, database: Session
) -> VariantDetailResponse:
    try:
        _, product = _resolve_owned_product(database, user_id, product_id)

        _validate_discount_window(data)

        options = resolver.resolve_option_set(database, product, data.option_ids)
        combo_key = resolver.combo_key_for_options(options) if options else None

        if combo_key and resolver.find_variant_by_combo(
            database, product.id, combo_key
        ):
            api_error(
                409,
                ErrorCodes.VARIANT_COMBINATION_DUPLICATE,
                "Ya existe una variante con esa combinación.",
            )

        resolved_values = _resolve_attribute_values(
            database, product, data.attribute_values
        )

        variant = ProductVariant(
            name=data.name.strip(),
            sku=data.sku.strip() if data.sku else None,
            price=data.price,
            stock=data.stock,
            product_id=product.id,
            discount_enable=data.discount_enable,
            discount_value=data.discount_value,
            discount_type=data.discount_type,
            discount_starts_at=data.discount_starts_at,
            discount_ends_at=data.discount_ends_at,
        )
        database.add(variant)
        database.flush()

        resolver.apply_options_to_variant(database, variant, options)
        _apply_attribute_values(database, variant, resolved_values)

        database.flush()
        _sync_product_pricing(database, product)

        _commit(database)
        database.refresh(variant)

        return _to_variant_detail_response(product, variant)

    except HTTPException:
        database.rollback()
        raise


def update_variant_service(
    user_id, product_id, variant_id, data: UpdateVariantRequest, database: Session
) -> VariantDetailResponse:
    try:
        _, product, variant = _resolve_owned_variant(
            database, user_id, product_id, variant_id
        )

        if variant.deleted_at is not None:
            api_error(
                409,
                ErrorCodes.VARIANT_ALREADY_DELETED,
                "La variante fue eliminada y no puede editarse.",
            )

        _validate_discount_window(data)

        if data.option_ids is not None:
            options = resolver.resolve_option_set(
                database, product, data.option_ids
            )
            combo_key = (
                resolver.combo_key_for_options(options) if options else None
            )

            if combo_key and resolver.find_variant_by_combo(
                database, product.id, combo_key, exclude_variant_id=variant.id
            ):
                api_error(
                    409,
                    ErrorCodes.VARIANT_COMBINATION_DUPLICATE,
                    "Ya existe una variante con esa combinación.",
                )

            resolver.apply_options_to_variant(database, variant, options)

        if data.attribute_values is not None:
            resolved_values = _resolve_attribute_values(
                database, product, data.attribute_values
            )
            _apply_attribute_values(database, variant, resolved_values)

        for field in (
            "price",
            "stock",
            "discount_enable",
            "discount_value",
            "discount_type",
            "discount_starts_at",
            "discount_ends_at",
        ):
            value = getattr(data, field)
            if value is not None:
                setattr(variant, field, value)

        if data.name is not None:
            variant.name = data.name.strip()

        if data.sku is not None:
            variant.sku = data.sku.strip() or None

        database.flush()
        _sync_product_pricing(database, product)

        _commit(database)
        database.refresh(variant)

        return _to_variant_detail_response(product, variant)

    except HTTPException:
        database.rollback()
        raise


def delete_variant_service(user_id, product_id, variant_id, database: Session):
    try:
        _, product, variant = _resolve_owned_variant(
            database, user_id, product_id, variant_id
        )

        if variant.deleted_at is not None:
            api_error(
                409, ErrorCodes.VARIANT_ALREADY_DELETED, "La variante ya fue eliminada."
            )

        variant.deleted_at = datetime.utcnow()

        database.flush()
        _sync_product_pricing(database, product)

        database.commit()

        return {
            "message": "Variante eliminada correctamente",
            "variant_id": str(variant_id),
        }

    except HTTPException:
        database.rollback()
        raise


def list_variant_attribute_values_service(
    user_id, product_id, variant_id, database: Session
) -> list[VariantAttributeValuePair]:
    _, _, variant = _resolve_owned_variant(
        database, user_id, product_id, variant_id
    )
    return [
        VariantAttributeValuePair(
            attribute_id=value.attribute_id,
            attribute_name=value.attribute.name,
            value=value.value,
        )
        for value in variant.attribute_values
    ]


def set_variant_attribute_values_service(
    user_id, product_id, variant_id, items, database: Session
) -> VariantDetailResponse:
    try:
        _, product, variant = _resolve_owned_variant(
            database, user_id, product_id, variant_id
        )

        if variant.deleted_at is not None:
            api_error(
                409,
                ErrorCodes.VARIANT_ALREADY_DELETED,
                "La variante fue eliminada y no puede editarse.",
            )

        resolved = _resolve_attribute_values(database, product, items)
        _apply_attribute_values(database, variant, resolved)

        database.commit()
        database.refresh(variant)

        return _to_variant_detail_response(product, variant)

    except HTTPException:
        database.rollback()
        raise


def list_variant_images_service(
    user_id, product_id, variant_id, database: Session
) -> list[VariantImageResponse]:
    _, _, variant = _resolve_owned_variant(
        database, user_id, product_id, variant_id
    )
    return [
        VariantImageResponse(
            id=image.id, url=build_media_url(image.url), is_main=image.is_main
        )
        for image in variant.images
    ]


def upload_variant_images_service(
    user_id, product_id, variant_id, imagesVariant, nas, database: Session
) -> VariantDetailResponse:
    try:
        company, product, variant = _resolve_owned_variant(
            database, user_id, product_id, variant_id
        )

        if not imagesVariant:
            api_error(400, ErrorCodes.INVALID_FILE, "Debe enviar al menos una imagen")

        has_main_already = any(image.is_main for image in variant.images)

        for index, file in enumerate(imagesVariant):
            result = nas.upload_file(
                file, f"companies/{company.CompanyNIT}/variants/"
            )
            database.add(
                ProductVariantImage(
                    url=result["path"],
                    is_main=(not has_main_already and index == 0),
                    variant_id=variant.id,
                )
            )

        database.commit()
        database.refresh(variant)

        return _to_variant_detail_response(product, variant)

    except HTTPException:
        database.rollback()
        raise


def delete_variant_image_service(
    user_id, product_id, variant_id, image_id, nas, database: Session
) -> VariantDetailResponse:
    try:
        _, product, variant = _resolve_owned_variant(
            database, user_id, product_id, variant_id
        )

        image = image_repo.get_variant_image_owned(database, variant.id, image_id)
        if not image:
            api_error(404, ErrorCodes.VARIANT_IMAGE_NOT_FOUND, "Imagen no encontrada")

        was_main = image.is_main

        nas.delete_file(image.url.removeprefix("uploads/"))
        database.delete(image)
        database.flush()

        if was_main:
            remaining_images = image_repo.list_variant_images(database, variant.id)
            if remaining_images:
                remaining_images[0].is_main = True

        database.commit()
        database.refresh(variant)

        return _to_variant_detail_response(product, variant)

    except HTTPException:
        database.rollback()
        raise


def set_main_variant_image_service(
    user_id, product_id, variant_id, image_id, database: Session
) -> VariantDetailResponse:
    try:
        _, product, variant = _resolve_owned_variant(
            database, user_id, product_id, variant_id
        )

        image = image_repo.get_variant_image_owned(database, variant.id, image_id)
        if not image:
            api_error(404, ErrorCodes.VARIANT_IMAGE_NOT_FOUND, "Imagen no encontrada")

        image_repo.clear_main_image(database, variant.id)
        image.is_main = True

        database.commit()
        database.refresh(variant)

        return _to_variant_detail_response(product, variant)

    except HTTPException:
        database.rollback()
        raise


def _commit(database: Session) -> None:
    try:
        database.commit()
    except IntegrityError:
        database.rollback()
        api_error(
            409,
            ErrorCodes.VARIANT_COMBINATION_DUPLICATE,
            "Ya existe una variante con esa combinación o SKU.",
        )
