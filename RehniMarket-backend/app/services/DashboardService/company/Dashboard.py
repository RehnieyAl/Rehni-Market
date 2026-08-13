from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.ModelUser import Users
from app.models.ModelProduct import Product
from fastapi import HTTPException
from app.schemas.SchemaDashboard.ShemaCompany import UpdateInformationCompanyRequest
from app.services.NasService import build_media_url



def company_dashboard_me_service(user_id,database: Session):
    user = database.query(Users).filter(Users.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    company = user.company
    role = user.role

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
        "logo": logo,
        "banner": banner,
        "nameCompany": company.nameCompany,
        "addressCompany": company.addressCompany,
        "emailCompany": user.email,
        "CompanyCertificate": company.CompanyCertificate,
        "memberAT": user.created_at,
        "role": role.name,
        "sales": 1247,
        "stars": 4.7,
        "reviews": 856
    }


def company_dashboard_my_profile_service(user_id: str, database: Session):
    user = database.query(Users).filter(Users.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    company = user.company  # relationship por si se me olvida xd

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
        "nameCompany": company.nameCompany,
        "emailCompany": user.email,
        "addressCompany": company.addressCompany,
        "tellCompany": user.tell,
        "memberAT": user.created_at,
        "averageRating": 4.7,
        "totalReviews": 856,
        "completeSales": 1247,
        "sellerLevel": "platino",
        "logo": logo,
        "banner": banner,
    }

def company_dashboard_upgrade_my_profile_service(user_id: str, CompanyRequest:UpdateInformationCompanyRequest,database: Session):
    user = database.query(Users).filter(Users.id == user_id).first()
    search_emails = database.query(Users).filter(Users.email == CompanyRequest.emailCompany)
    print("recibido: ", CompanyRequest.emailCompany )
    if not search_emails:
        raise HTTPException(status_code=400, detail="El correo esta en uso")
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    
    company = user.company  # relationship por si se me olvida xd

    try:

        if CompanyRequest.nameCompany is not None:
            company.nameCompany = CompanyRequest.nameCompany

        if CompanyRequest.emailCompany is not None:
            user.email = CompanyRequest.emailCompany
        
        if CompanyRequest.tellCompany is not None:
            user.tell = CompanyRequest.tellCompany
        
        if CompanyRequest.addressCompany is not None:
            company.addressCompany = CompanyRequest.addressCompany
        
        database.commit()
        database.refresh(user)
        database.refresh(company)

    except Exception as e:
        database.rollback()

        print("ERROR:",e)
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

        query = database.query(Product).filter(Product.company_id == company.id)

        if search: 
            query = query.filter(Product.name.ilike(f"%{search}%"))

        total = query.count()

        products = (query.offset(offset).limit(limit).all())


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
                "is_active": product.is_active
                })
        
        print("PRODUCTOS ENVIADOS:", len(result))

        return {
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": (total + limit - 1) // limit,
        "products": result
        }
        
    except Exception as e:
        print("Error get product", str(e))
        raise HTTPException(status_code=500, detail=str(e))


def company_dasboard_my_stadistic():
    pass