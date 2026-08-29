from sqlalchemy.orm import Session
from app.models.ModelUser import Users
from app.models.ModelProduct import Product
from app.models.ModelCompany import CompanyCertificateEnum
from fastapi import HTTPException
from app.schemas.SchemaDashboard.ShemaCompany import UpdateInformationCompanyRequest
from app.services.NasService import build_media_url
from app.services.variants.images import product_display_image_url



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
        # Permite pedir GET /public/company/{id}/rating sin otro endpoint.
        "id": company.id,
        "logo": logo,
        "banner": banner,
        "nameCompany": company.nameCompany,
        "addressCompany": company.addressCompany,
        "description": company.description,
        # is_verified se decide por CompanyCertificateStatus == APPROVED, no por CompanyCertificate.
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

    # Solo datos públicos de la tienda; nombre/correo de la cuenta van por GET /auth/me.
    return {
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

    # Mismas URLs que devuelven el resto de endpoints (GET /company/me, perfil público…):
    # la ruta de /media/proxy, NO una URL presigned con el host interno `minio:9000`
    # que el navegador no puede resolver.
    return {
        "success": True,
        "logo": build_media_url(f"uploads/{company.CompanyLogo}") if company.CompanyLogo else None,
        "banner": build_media_url(f"uploads/{company.CompanyBanner}") if company.CompanyBanner else None
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

        # deleted_at IS NULL: "Mis productos" excluye eliminados, no solo desactivados.
        query = database.query(Product).filter(
            Product.company_id == company.id,
            Product.deleted_at.is_(None),
        )

        if search:
            query = query.filter(Product.name.ilike(f"%{search}%"))

        total = query.count()

        # Orden por más reciente primero; también lo usa "Productos recientes" del Inicio.
        products = (
            query.order_by(Product.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )


        result = []
        

        for product in products:
            result.append({
                "id": str(product.id),
                "name": product.name,
                "description": product.descripcion,
                "category": product.catalog.name if product.catalog else None,
                "price": float(product.price),
                "stock": product.stock,
                # Imagen inicial = primera variante viva con imágenes (ver services/variants/images.py).
                "image": product_display_image_url(product),
                "is_active": product.is_active,
                # None = nunca eliminado; con fecha = eliminado por la empresa (distinto de "Inactivo").
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


# Estadísticas: solo datos calculados sobre Product (no hay ventas/visitas en el modelo).
def company_dashboard_products_summary_service(user_id, database: Session):

    search_user = database.query(Users).filter(Users.id == user_id).first()

    if not search_user or not search_user.company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    # Excluye eliminados: no deben contar como "hidden" ni sumar al total.
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