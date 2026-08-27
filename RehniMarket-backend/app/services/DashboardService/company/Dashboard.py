from sqlalchemy.orm import Session
from app.models.ModelUser import Users
from app.models.ModelProduct import Product
from app.models.ModelCompany import CompanyCertificateEnum
from fastapi import HTTPException
from app.schemas.SchemaDashboard.ShemaCompany import UpdateInformationCompanyRequest
from app.services.NasService import build_media_url



def company_dashboard_me_service(user_id,database: Session):
    user = database.query(Users).filter(Users.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    company = user.company

    logo = (build_media_url(f"uploads/{company.CompanyLogo}")
            if company.CompanyLogo
            else
            None
            )
    banner = (build_media_url(f"uploads/{company.CompanyBanner}")
            if company.CompanyBanner
            else
            None
            )

    return {
        # Necesario para que el frontend pueda pedir la reputacion de la
        # empresa (GET /public/company/{id}/rating, ver ALCANCE >
        # Calificaciones de empresa) sin otro endpoint aparte - antes esta
        # respuesta no exponia el id de la empresa en absoluto.
        "id": company.id,
        "logo": logo,
        "banner": banner,
        "nameCompany": company.nameCompany,
        "addressCompany": company.addressCompany,
        "description": company.description,
        # Estado real de verificacion (antes se usaba
        # company.CompanyCertificate, la ruta del archivo del certificado,
        # que es truthy desde el registro - el badge "verificada" quedaba
        # siempre encendido sin importar si un admin lo habia aprobado o
        # no). Se usa el mismo criterio que LoginService/CompanyService.
        "certificate_status": company.CompanyCertificateStatus,
        "is_verified": company.CompanyCertificateStatus == CompanyCertificateEnum.APPROVED,
        "memberAT": user.created_at,
    }


def company_dashboard_my_profile_service(user_id: str, database: Session):
    user = database.query(Users).filter(Users.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    company = user.company

    logo = (build_media_url(f"uploads/{company.CompanyLogo}")
            if company.CompanyLogo
            else
            None
            )
    banner = (build_media_url(f"uploads/{company.CompanyBanner}")
            if company.CompanyBanner
            else
            None
            )

    # Solo datos PÚBLICOS de la tienda - nombre/correo de la cuenta se
    # consultan con GET /auth/me (ver MeService.py), no aquí.
    return {
        # Ver company_dashboard_me_service: mismo motivo, habilita pedir
        # GET /public/company/{id}/rating desde "Mi tienda".
        "id": company.id,
        "nameCompany": company.nameCompany,
        "addressCompany": company.addressCompany,
        "description": company.description,
        "tellCompany": user.tell,
        "memberAT": user.created_at,
        "logo": logo,
        "banner": banner,
    }

def company_dashboard_upgrade_my_profile_service(user_id: str, CompanyRequest:UpdateInformationCompanyRequest,database: Session):
    user = database.query(Users).filter(Users.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    company = user.company

    try:

        if CompanyRequest.nameCompany is not None:
            company.nameCompany = CompanyRequest.nameCompany

        if CompanyRequest.tellCompany is not None:
            user.tell = CompanyRequest.tellCompany

        if CompanyRequest.addressCompany is not None:
            company.addressCompany = CompanyRequest.addressCompany

        if CompanyRequest.description is not None:
            company.description = CompanyRequest.description

        database.commit()
        database.refresh(user)
        database.refresh(company)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()

        raise HTTPException(status_code=500, detail="En actualizar datos")

    return {
        "messaje": "Perfil actualizado correctamente"
    }

def company_dasboard_upgrade_my_photo_and_banner_profile(
        user_id,
        nas,
        database,
        photo_profile=None,
        banner_profile=None
):
    user = database.query(Users).filter(Users.id == user_id).first()

    if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrada...")
    
    company = user.company
    
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada...")
    
    if photo_profile:
        new_logo = nas.upload_file(photo_profile, f"companies/{company.CompanyNIT}/logo/")
        company.CompanyLogo = new_logo["object_name"]
    
    if banner_profile:
        new_banner = nas.upload_file(banner_profile, f"companies/{company.CompanyNIT}/banner/")
        company.CompanyBanner = new_banner["object_name"]

    database.commit()
    database.refresh(company)
    
    return {
        "success": True,
        "logo": nas.get_presigned_url(company.CompanyLogo) if company.CompanyLogo else None,
        "banner": nas.get_presigned_url(company.CompanyBanner) if company.CompanyBanner else None
    }

def company_dashboard_get_my_products(user_id,search,page,limit,database: Session):

    try:
        search_user = database.query(Users).filter(Users.id == user_id).first()

        if not search_user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        
        company = search_user.company

        if not company:
            raise HTTPException(status_code=401, detail="Empresa no encontrada")

        offset = (page - 1) * limit

        # deleted_at IS NULL: el listado normal de "Mis productos" excluye
        # eliminados (ver ModelProduct.py > Product.deleted_at) - solo
        # is_active=False no alcanza porque tambien lo usa el toggle
        # Activo/Inactivo (ver change_product_status_service), que es
        # reversible y NO debe hacer desaparecer el producto de acá.
        query = database.query(Product).filter(
            Product.company_id == company.id,
            Product.deleted_at.is_(None),
        )

        if search:
            query = query.filter(Product.name.ilike(f"%{search}%"))

        total = query.count()

        # Antes no tenia ORDER BY: el orden entre paginas quedaba
        # indefinido a nivel de PostgreSQL. Se ordena por mas reciente
        # primero - lo necesita ademas "Productos recientes" en el Inicio
        # del dashboard de empresa (ver Home.tsx), que reutiliza este mismo
        # endpoint con limit=10.
        products = (
            query.order_by(Product.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )


        result = []
        

        for product in products:
            main_image=None

            for image in product.images:
                if image.is_main:
                    main_image = build_media_url(image.url)
            
            result.append({
                "id": str(product.id),
                "name": product.name,
                "description": product.descripcion,
                "category": product.catalog.name if product.catalog else None,
                "price": float(product.price),
                "stock": product.stock,
                "image": main_image,
                # Bug de integracion: antes se enviaba el string "Activo"/
                # "Inactivo". El frontend (MyProductResponse.is_active y
                # Products.tsx) siempre trato este campo como boolean, asi
                # que cualquier string no vacio evaluaba a "true" y el
                # badge/los toggles de estado nunca reflejaban el estado
                # real del producto. Se envia el boolean real.
                "is_active": product.is_active,
                # None = nunca eliminado (activo o solo desactivado con
                # el toggle). Con fecha = eliminado por la empresa - ver
                # ModelProduct.py > Product.deleted_at y
                # delete_product_service. Permite al dashboard mostrar
                # "Eliminado" en vez de confundirlo con "Inactivo" (ver
                # ALCANCE > EMPRESA -> ELIMINAR PRODUCTO, punto 17).
                "deleted_at": (
                    product.deleted_at.isoformat()
                    if product.deleted_at
                    else None
                ),
                })

        return {
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": (total + limit - 1) // limit,
        "products": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================
# ESTADÍSTICAS DE PRODUCTOS
# ==============================
# Únicamente datos reales calculados sobre Product (ver ALCANCE > Home >
# ESTADÍSTICAS): no existen ventas/ingresos/visitas/favoritos/reseñas en
# el modelo actual, así que no se inventan aquí. Reemplaza al stub vacío
# `company_dasboard_my_stadistic()` (nunca se llamaba desde ningún router).

def company_dashboard_products_summary_service(user_id, database: Session):

    search_user = database.query(Users).filter(Users.id == user_id).first()

    if not search_user or not search_user.company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    # Mismo criterio que company_dashboard_get_my_products: un producto
    # eliminado (deleted_at != NULL) no debe contarse como "desactivado"
    # (hidden) ni sumar al total de este resumen.
    base_query = database.query(Product).filter(
        Product.company_id == search_user.company.id,
        Product.deleted_at.is_(None),
    )

    total = base_query.count()
    active = base_query.filter(Product.is_active.is_(True)).count()
    hidden = base_query.filter(Product.is_active.is_(False)).count()
    out_of_stock = base_query.filter(Product.stock <= 0).count()

    return {
        "total": total,
        "active": active,
        "hidden": hidden,
        "out_of_stock": out_of_stock,
    }