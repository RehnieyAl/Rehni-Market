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
    """
    Acepta tanto una lista de dicts como el string JSON que envia el
    formulario (mismo formato en creacion y actualizacion:
    [{specificationTemplateId, value}, ...]).
    """

    if isinstance(technical_spec, str):
        return json.loads(technical_spec) if technical_spec else []

    return technical_spec or []


def _validate_specifications_belong_to_catalog(database: Session, specifications, catalog_id):
    """
    Regla de negocio (ver ALCANCE > punto 4): una specification_template
    seleccionada por la empresa debe pertenecer al mismo catalogo del
    producto. Las specification_templates las administra exclusivamente
    ADMIN/OWNER - la empresa solo selecciona una de las que ya existen
    para ese catalogo y le asigna un valor.

    Tambien rechaza que la misma plantilla aparezca dos veces en el mismo
    envio (un producto no puede tener dos valores para la misma
    especificacion).
    """

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
        # catalog_id es NOT NULL con FK obligatoria (ver esquema real de
        # PostgreSQL) - un producto siempre tiene catalogo.
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
            # Un descuento "activado" con valor 0 (o sin valor) queda
            # invisible para el comprador: _compute_price_fields
            # (app/services/publicService/Products.py) lo trata como sin
            # descuento porque no hay nada que restar. Se rechaza acá para
            # que la empresa reciba el error en el momento de guardar, en
            # vez de guardar en silencio un descuento que nunca se refleja
            # en el storefront público.
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
            # El frontend permite marcar una imagen YA EXISTENTE como
            # principal sin borrarla y volver a subirla. Ownership-scoped
            # igual que el resto de queries de este service.
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
            # Si el producto se quedo sin ninguna imagen marcada como
            # principal (por ejemplo, se elimino la que lo era),
            # promovemos la primera que quede - mismo criterio que
            # create_product_service.
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

            # Se valida contra el catalogo VIGENTE del producto (el que
            # acaba de aplicarse arriba si data.catalogId venia en el
            # patch) - una especificacion que era valida para el catalogo
            # anterior puede dejar de serlo tras el cambio (ver ALCANCE >
            # punto 14, "Cambio de catalogo").
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
    """
    Toggle Activo/Inactivo - accion DISTINTA de eliminar (ver
    delete_product_service y ModelProduct.py > Product.deleted_at):
    reversible en ambos sentidos, no toca deleted_at.

    Un producto con deleted_at != NULL (eliminado) se trata como "no
    encontrado" acá tambien - a proposito, para que este toggle nunca
    pueda reactivar (is_active=True) un producto eliminado. Esta tarea
    NO implementa una funcion de restauracion (ver ALCANCE > punto 18:
    "si no existe, no implementarla acá"), asi que mientras no exista,
    el camino mas seguro es que ningun endpoint pueda deshacer un
    deleted_at de forma implicita.
    """

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
    """
    Soft-delete (mismo patron que Review.is_active, ver
    ReviewService.delete_my_review_service): un producto puede tener
    historial real que otras tablas referencian por FK sin ON DELETE
    CASCADE -a proposito, para no perder ese historial- (OrderItem con
    el detalle de pedidos ya facturados, Review con las reseñas de
    compradores, Favorite con los favoritos guardados, Report con
    reportes historicos; ver ModelOrder.py, ModelReview.py,
    ModelFavorite.py y ModelReport.py). Un DELETE fisico del producto
    rompe esas FK apenas alguna de esas tablas tiene una fila (ver
    "violates foreign key constraint" en Postgres), asi que "eliminar"
    nunca borra la fila: se marca is_active=False + deleted_at=ahora.

    is_active=False por si solo NO significa "eliminado" - tambien lo usa
    el toggle Activo/Inactivo (ver change_product_status_service), que es
    una accion distinta y reversible. deleted_at es lo que distingue
    "eliminado" (con fecha) de "simplemente desactivado" (NULL) - ver
    ModelProduct.py > Product.deleted_at para la tabla completa de
    combinaciones. Los listados/busquedas/detalle publicos ya filtran por
    is_active=True (ver publicService/Products.py y publicService/
    Company.py) y el checkout ya rechaza productos inactivos (ver
    CartService/CheckoutService) - como un producto eliminado siempre
    tiene is_active=False, esos filtros ya alcanzan para que un producto
    eliminado deje de ser visible/comprable sin necesitar chequear
    deleted_at ahi tambien.
    """

    try:
        search_user = (database.query(Users).filter(Users.id == user_id).first())

        if not search_user or not search_user.company:
            api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada")

        product = (database.query(Product).filter(Product.id == product_id,Product.company_id == search_user.company.id).first())

        # Idempotente: un producto ya eliminado (deleted_at != NULL) se
        # trata como "no encontrado" para este endpoint - no se re-marca
        # ni se reintenta nada, evitando cualquier UPDATE/IntegrityError
        # innecesario. OJO: esto es distinto de "esta desactivado" -
        # un producto simplemente desactivado (is_active=False,
        # deleted_at=NULL) SI puede eliminarse normalmente.
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
