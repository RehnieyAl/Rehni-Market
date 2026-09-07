from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile

from app.models.ModelUser import Users
from app.models.ModelProduct import Product
from app.models.ModelCompany import CompanyCertificateEnum
from app.schemas.SchemaDashboard.ShemaCompany import UpdateInformationCompanyRequest
from app.services.NasService import NasService, build_media_url
from app.services.variants.images import product_display_image_url
from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

MAX_CERTIFICATE_FILE_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_CERTIFICATE_CONTENT_TYPES = {"application/pdf"}
ALLOWED_CERTIFICATE_EXTENSIONS = {"pdf"}


def _validate_certificate_file(file: UploadFile) -> None:
    extension = (
        file.filename.rsplit(".", 1)[-1].lower()
        if file.filename and "." in file.filename
        else ""
    )

    if (
        file.content_type not in ALLOWED_CERTIFICATE_CONTENT_TYPES
        or extension not in ALLOWED_CERTIFICATE_EXTENSIONS
    ):
        api_error(
            400,
            ErrorCodes.INVALID_FILE,
            "El certificado debe ser un archivo PDF.",
        )

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size > MAX_CERTIFICATE_FILE_SIZE_BYTES:
        api_error(
            400,
            ErrorCodes.INVALID_FILE,
            "El certificado debe pesar como máximo 5 MB.",
        )



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
        "id": company.id,
        "logo": logo,
        "banner": banner,
        "nameCompany": company.nameCompany,
        "addressCompany": company.addressCompany,
        "description": company.description,
        "certificate_status": company.CompanyCertificateStatus,
        "rejection_reason": company.rejection_reason,
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

    return {
        "id": company.id,
        "nameCompany": company.nameCompany,
        "addressCompany": company.addressCompany,
        "description": company.description,
        "CompanyNIT": company.CompanyNIT,
        "CompanyNITDV": company.CompanyNITDV,
        "CompanyStatus": company.CompanyStatus,
        "suspensionReason": company.suspension_reason,
        "certificateStatus": company.CompanyCertificateStatus,
        "rejectionReason": company.rejection_reason,
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

        if CompanyRequest.addressCompany is not None:
            company.addressCompany = CompanyRequest.addressCompany

        if CompanyRequest.description is not None:
            company.description = CompanyRequest.description

        database.commit()
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

        query = database.query(Product).filter(
            Product.company_id == company.id,
            Product.deleted_at.is_(None),
        )

        if search:
            query = query.filter(Product.name.ilike(f"%{search}%"))

        total = query.count()

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
                "image": product_display_image_url(product),
                "is_active": product.is_active,
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


def company_dashboard_products_summary_service(user_id, database: Session):

    search_user = database.query(Users).filter(Users.id == user_id).first()

    if not search_user or not search_user.company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

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


def apply_certificate_replacement(
    company,
    certificate: UploadFile,
    nas: NasService,
    database: Session,
):
    """Núcleo compartido del reemplazo de certificado (lo usan tanto el flujo con JWT
    `replace_company_certificate_service` como el flujo por credenciales
    `update_certificate_with_credentials_service`).

    Exige `CompanyCertificateStatus == NEEDS_UPDATE` (el admin marcó el certificado como
    inválido). `PENDING`/`APPROVED`/`REJECTED` -> 409 con el código correspondiente; en
    particular `REJECTED` es un rechazo **terminal** de la empresa: no puede resubir por
    sí misma. Valida el PDF, lo sube a MinIO, cambia la referencia, vuelve a PENDING y
    limpia `rejection_reason`, hace un único `commit` y borra el certificado anterior. En
    error: `rollback` + borra el objeto recién subido. Nunca aprueba automáticamente. La
    empresa la resuelve el llamador (token o credenciales), nunca un `company_id`."""

    uploaded = False
    new_object_name = None

    try:
        if company.CompanyCertificateStatus == CompanyCertificateEnum.PENDING:
            api_error(
                409,
                ErrorCodes.COMPANY_PENDING,
                "Tu certificado ya está en revisión. Espera a que el administrador "
                "lo apruebe o lo rechace antes de volver a subirlo.",
            )

        if company.CompanyCertificateStatus == CompanyCertificateEnum.APPROVED:
            api_error(
                409,
                ErrorCodes.COMPANY_APPROVED,
                "Tu certificado ya fue aprobado, no es necesario reemplazarlo.",
            )

        if company.CompanyCertificateStatus == CompanyCertificateEnum.REJECTED:
            api_error(
                409,
                ErrorCodes.COMPANY_REJECTED,
                "Tu empresa fue rechazada. No es posible actualizar el certificado; "
                "contacta con un administrador.",
            )

        _validate_certificate_file(certificate)

        old_certificate = company.CompanyCertificate

        result = nas.upload_file(
            certificate,
            f"companies/{company.CompanyNIT}/certificates/",
        )

        if not result or not result.get("success"):
            api_error(500, ErrorCodes.FILE_UPLOAD_FAILED, "No se pudo subir el certificado")

        new_object_name = result["object_name"]
        uploaded = True

        company.CompanyCertificate = new_object_name
        company.CompanyCertificateStatus = CompanyCertificateEnum.PENDING
        company.rejection_reason = None

        database.commit()
        database.refresh(company)

        if old_certificate:
            nas.delete_file(old_certificate)

        return {
            "message": (
                "Certificado actualizado correctamente. Tu empresa vuelve a quedar "
                "pendiente de revisión."
            ),
            "certificate_url": build_media_url(f"uploads/{company.CompanyCertificate}"),
            "certificate_status": company.CompanyCertificateStatus,
        }

    except HTTPException:
        database.rollback()

        if uploaded and new_object_name:
            nas.delete_file(new_object_name)

        raise

    except Exception:
        database.rollback()

        if uploaded and new_object_name:
            nas.delete_file(new_object_name)

        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor")


def replace_company_certificate_service(
    user_id,
    certificate: UploadFile,
    nas: NasService,
    database: Session,
):
    """Reemplaza el certificado de la empresa autenticada. Solo permitido mientras
    CompanyCertificateStatus == NEEDS_UPDATE. La empresa se resuelve desde el token
    (user.company), nunca desde un company_id recibido en la petición."""

    user = database.query(Users).filter(Users.id == user_id).first()

    if not user:
        api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado")

    company = user.company

    if not company:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada")

    return apply_certificate_replacement(company, certificate, nas, database)