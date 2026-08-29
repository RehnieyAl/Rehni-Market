from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import json

from app.models.ModelUser import Users
from app.models.ModelProduct import Product, ProductImage
from app.models.ModelCatalog import Catalog, SpecificationTemplate
from app.models.ModelColor import ColorVariant
from app.models.ModelSpecification import ProductSpecification
from app.schemas.SchemaDashboard.SchemaProduct import (
    UpdateProductRequest,
    ProductDetailResponse,
    ProductImageResponse,
    ProductSpecificationResponse,
    ProductColorResponse,
)
from app.services.NasService import build_media_url

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error


def _normalize_specifications(technical_spec):
    """Acepta una lista de dicts o el string JSON del formulario: [{specificationTemplateId, value}, ...]."""

    if isinstance(technical_spec, str):
        return json.loads(technical_spec) if technical_spec else []

    return technical_spec or []


def _validate_specifications_belong_to_catalog(database: Session, specifications, catalog_id):
    """La plantilla elegida debe pertenecer al catálogo del producto y no repetirse en el envío."""

    seen_template_ids = set()

    for specification in specifications:
        template_id = specification.get("specificationTemplateId")
        value = specification.get("value")

        if not template_id or not value:
            api_error(
                400,
                ErrorCodes.VALIDATION_ERROR,
                "Cada especificación requiere una plantilla y un valor.",
            )

        if template_id in seen_template_ids:
            api_error(
                409,
                ErrorCodes.VALIDATION_ERROR,
                "No se puede asignar dos valores a la misma especificación.",
            )

        seen_template_ids.add(template_id)

        template = (
            database.query(SpecificationTemplate)
            .filter(SpecificationTemplate.id == template_id)
            .first()
        )

        if not template:
            api_error(
                404,
                ErrorCodes.SPECIFICATION_TEMPLATE_NOT_FOUND,
                "Especificación no encontrada",
            )

        if str(template.catalog_id) != str(catalog_id):
            api_error(
                409,
                ErrorCodes.SPECIFICATION_TEMPLATE_CATALOG_MISMATCH,
                "La especificación seleccionada no pertenece al catálogo del producto.",
            )


def create_product_service(user_id,nameProduct,catalogId,priceProduct,stockProduct,descripcionProduct,technicalSpecProduct,imagesProduct,nas,database: Session,mainColorId=None):
    try:
        user = (database.query(Users).filter(Users.id == user_id).first())

        if not user:
            api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado")

        company = user.company

        if not company:
            api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada")

        catalog = (database.query(Catalog).filter(Catalog.id == catalogId).first())

        if not catalog:
            api_error(404, ErrorCodes.CATALOG_NOT_FOUND, "Catálogo no encontrado")

        main_color = None

        if mainColorId:
            main_color = (database.query(ColorVariant).filter(ColorVariant.id == mainColorId).first())

            if not main_color:
                api_error(404, ErrorCodes.COLOR_NOT_FOUND, "Color no encontrado")

        technical_spec = _normalize_specifications(technicalSpecProduct)

        if technical_spec:
            _validate_specifications_belong_to_catalog(database, technical_spec, catalog.id)

        new_product = Product(
            name=nameProduct,
            price=priceProduct,
            stock=stockProduct,
            descripcion=descripcionProduct,
            company_id=company.id,
            catalog_id=catalog.id,
            main_color_id=main_color.id if main_color else None
        )

        database.add(new_product)
        database.flush()

        if imagesProduct:

            for index, file in enumerate(imagesProduct):
                result = nas.upload_file(file,f"companies/{company.CompanyNIT}/products/")
                image = ProductImage(url=result["path"],is_main=(index == 0),product_id=new_product.id)
                database.add(image)

        for specification in technical_spec:
            database.add(
                ProductSpecification(
                    value=specification["value"],
                    specification_template_id=specification["specificationTemplateId"],
                    product_id=new_product.id,
                )
            )

        database.commit()
        database.refresh(new_product)

        return {
            "message":"Producto creado correctamente",
            "product_id":str(new_product.id),
            "name":new_product.name,
            "catalog":catalog.name
        }

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, str(e))

def get_product_detail_service(user_id, product_id, database: Session) -> ProductDetailResponse:

    user = database.query(Users).filter(Users.id == user_id).first()

    if not user:
        api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado")

    company = user.company

    if not company:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada")

    product = (
        database.query(Product)
        .filter(Product.id == product_id, Product.company_id == company.id)
        .first()
    )

    if not product:
        api_error(404, ErrorCodes.PRODUCT_NOT_FOUND, "Producto no encontrado")

    images = [
        ProductImageResponse(
            id=image.id,
            url=build_media_url(image.url),
            is_main=image.is_main,
        )
        for image in product.images
    ]

    specifications = [
        ProductSpecificationResponse(
            id=specification.id,
            specification_template_id=specification.specification_template_id,
            value=specification.value,
        )
        for specification in product.specifications
    ]

    main_color = (
        ProductColorResponse(
            id=product.main_color.id,
            name=product.main_color.name,
            hex_color=product.main_color.hex_color,
        )
        if product.main_color
        else None
    )

    return ProductDetailResponse(
        id=product.id,
        name=product.name,
        price=product.price,
        discount_enable=product.discount_enable,
        discount_value=product.discount_value,
        stock=product.stock,
        has_variants=product.has_variants,
        descripcion=product.descripcion,
        is_active=product.is_active,
        created_at=product.created_at,
        deleted_at=product.deleted_at,
        catalog_id=product.catalog_id,
        catalog_name=product.catalog.name,
        main_color_id=product.main_color_id,
        main_color=main_color,
        images=images,
        specifications=specifications,
    )


def update_product_service(
    user_id,
    product_id,
    data: UpdateProductRequest,
    imagesProduct,
    imagesToDeleted,
    nas,
    database: Session,
):
    try:
        user = database.query(Users).filter(Users.id == user_id).first()

        if not user:
            api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado")

        company = user.company

        if not company:
            api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada")

        product = (
            database.query(Product)
            .filter(Product.id == product_id, Product.company_id == company.id)
            .first()
        )

        if not product:
            api_error(404, ErrorCodes.PRODUCT_NOT_FOUND, "Producto no encontrado")

        catalog = product.catalog

        if data.catalogId is not None:
            catalog = database.query(Catalog).filter(Catalog.id == data.catalogId).first()

            if not catalog:
                api_error(404, ErrorCodes.CATALOG_NOT_FOUND, "Catálogo no encontrado")

            product.catalog_id = catalog.id

        if data.clearMainColor:
            product.main_color_id = None
        elif data.mainColorId is not None:
            main_color = (
                database.query(ColorVariant)
                .filter(ColorVariant.id == data.mainColorId)
                .first()
            )

            if not main_color:
                api_error(404, ErrorCodes.COLOR_NOT_FOUND, "Color no encontrado")

            product.main_color_id = main_color.id

        if data.nameProduct is not None:
            product.name = data.nameProduct

        if data.priceProduct is not None:
            product.price = data.priceProduct

        if data.discountEnable is not None:
            product.discount_enable = data.discountEnable

        if data.discountValue is not None:
            product.discount_value = data.discountValue

        if (data.discountEnable is not None or data.discountValue is not None) and product.discount_enable:
            # Un descuento activado con valor 0 sería invisible para el comprador: se rechaza al guardar.
            if not product.discount_value or product.discount_value <= 0:
                api_error(
                    400,
                    ErrorCodes.VALIDATION_ERROR,
                    "Para activar el descuento, el porcentaje de descuento debe ser mayor a 0.",
                )

        if data.stockProduct is not None:
            product.stock = data.stockProduct

        if data.descripcionProduct is not None:
            product.descripcion = data.descripcionProduct

        database.flush()

        if imagesToDeleted:
            images_to_delete = (
                database.query(ProductImage)
                .filter(
                    ProductImage.id.in_(imagesToDeleted),
                    ProductImage.product_id == product.id,
                )
                .all()
            )

            for image in images_to_delete:
                nas.delete_file(image.url.removeprefix("uploads/"))
                database.delete(image)

            database.flush()

        if imagesProduct:
            for file in imagesProduct:
                result = nas.upload_file(file, f"companies/{company.CompanyNIT}/products/")
                new_image = ProductImage(
                    url=result["path"],
                    is_main=False,
                    product_id=product.id,
                )
                database.add(new_image)

            database.flush()

        if data.mainImageId is not None:
            # Marca una imagen ya existente como principal sin volver a subirla.
            new_main_image = (
                database.query(ProductImage)
                .filter(
                    ProductImage.id == data.mainImageId,
                    ProductImage.product_id == product.id,
                )
                .first()
            )

            if not new_main_image:
                api_error(404, ErrorCodes.PRODUCT_IMAGE_NOT_FOUND, "Imagen no encontrada")

            database.query(ProductImage).filter(
                ProductImage.product_id == product.id
            ).update({ProductImage.is_main: False})

            new_main_image.is_main = True

        elif imagesToDeleted or imagesProduct:
            # Si el producto quedó sin imagen principal, se promueve la primera que quede.
            remaining_images = (
                database.query(ProductImage)
                .filter(ProductImage.product_id == product.id)
                .order_by(ProductImage.id)
                .all()
            )

            if remaining_images and not any(image.is_main for image in remaining_images):
                remaining_images[0].is_main = True

        if data.technicalSpecProduct is not None:
            technical_spec = _normalize_specifications(data.technicalSpecProduct)

            # Se valida contra el catálogo vigente del producto (ya aplicado si venía en el patch).
            _validate_specifications_belong_to_catalog(database, technical_spec, product.catalog_id)

            database.query(ProductSpecification).filter(
                ProductSpecification.product_id == product.id
            ).delete()

            for specification in technical_spec:
                database.add(
                    ProductSpecification(
                        value=specification["value"],
                        specification_template_id=specification["specificationTemplateId"],
                        product_id=product.id,
                    )
                )

        database.commit()
        database.refresh(product)

        return {
            "message": "Producto actualizado correctamente",
            "product_id": str(product.id),
            "name": product.name,
            "catalog": catalog.name if catalog else None,
        }

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, str(e))


def change_product_status_service(user_id,product_id,is_active,database: Session):
    """Toggle Activo/Inactivo: reversible, no toca deleted_at. Un producto eliminado
    (deleted_at != NULL) se trata como "no encontrado" para que este toggle no lo reactive."""

    try:
        search_user = database.query(Users).filter(Users.id == user_id).first()

        if not search_user or not search_user.company :
            api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada")

        product = database.query(Product).filter(Product.id == product_id, Product.company_id == search_user.company.id).first()

        if not product or product.deleted_at is not None:
            api_error(404, ErrorCodes.PRODUCT_NOT_FOUND, "Producto no encontrado")

        product.is_active = is_active

        database.commit()
        database.refresh(product)

        return {
            "message": "Estado del producto actualizado correctamente",
            "product_id": str(product.id),
            "is_active": product.is_active,
        }

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, str(e))


def delete_product_service(user_id,product_id,database: Session):
    """Soft-delete: "eliminar" marca is_active=False + deleted_at=ahora, nunca borra la fila
    (OrderItem/Review/Favorite/Report la referencian por FK sin CASCADE). deleted_at con fecha
    distingue "eliminado" de "solo desactivado" (NULL)."""

    try:
        search_user = (database.query(Users).filter(Users.id == user_id).first())

        if not search_user or not search_user.company:
            api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada")

        product = (database.query(Product).filter(Product.id == product_id,Product.company_id == search_user.company.id).first())

        # Idempotente: un producto ya eliminado se trata como "no encontrado".
        # Un producto solo desactivado (deleted_at=NULL) sí puede eliminarse.
        if not product or product.deleted_at is not None:
            api_error(404, ErrorCodes.PRODUCT_NOT_FOUND, "Producto no encontrado")

        product.is_active = False
        product.deleted_at = datetime.utcnow()
        database.commit()

        return {
            "message": "Producto eliminado correctamente",
            "product_id": str(product_id)
        }

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error del servidor")
