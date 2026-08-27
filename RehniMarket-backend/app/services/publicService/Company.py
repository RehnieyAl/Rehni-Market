from uuid import UUID

from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelCompany import CompanyCertificateEnum
from app.models.ModelProduct import Product

from app.repository.CompanyRepository import get_company_by_id
from app.repository import ReviewRepository

from app.schemas.SchemaPublic import (
    PublicCompanyProfileResponse,
    PublicCompanyProductsResponse,
    CompanyRatingResponse,
)

from app.services.NasService import build_media_url
from app.services.publicService.Products import _to_card_responses, _has_visible_stock


# ==========================
# PERFIL PUBLICO DE EMPRESA
# ==========================
# Accesible desde el detalle publico de producto (ver ProductDetail.tsx >
# "Ver perfil de empresa") y directamente en /company/:companyId.


def get_public_company_profile_service(
    database: Session,
    company_id: UUID,
) -> PublicCompanyProfileResponse:

    company = get_company_by_id(database, company_id)

    # Empresa suspendida (ver ALCANCE > BUG 2): mismo código/mensaje que
    # "no existe" - no se distingue "no existe" de "suspendida" en la
    # respuesta pública, para no revelar el estado de la cuenta a
    # cualquier visitante (ver ALCANCE > "no revelar información").
    if not company or not company.CompanyStatus:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada.")

    # "Verificada" para el storefront publico = certificado aprobado y sin
    # suspender. Mismos campos que ya usa LoginService.login_service para
    # bloquear el acceso de una empresa (CompanyCertificateStatus /
    # CompanyStatus), reutilizados aqui solo como lectura.
    is_verified = (
        company.CompanyCertificateStatus == CompanyCertificateEnum.APPROVED
        and company.CompanyStatus
    )

    # CompanyLogo/CompanyBanner se guardan como object_name (sin el bucket
    # "uploads/" incluido) - mismo patron que
    # company_dashboard_me_service/company_dashboard_my_profile_service
    # (ver app/services/DashboardService/company/Dashboard.py).
    logo_url = (
        build_media_url(f"uploads/{company.CompanyLogo}")
        if company.CompanyLogo
        else None
    )

    banner_url = (
        build_media_url(f"uploads/{company.CompanyBanner}")
        if company.CompanyBanner
        else None
    )

    # Mismo criterio de visibilidad por stock que el listado de abajo
    # (get_public_company_products_service) - si no, el contador del
    # encabezado quedaria desincronizado con la cantidad real de productos
    # que se listan (ver ALCANCE > CONSISTENCIA GLOBAL /
    # publicService/Products.py > _has_visible_stock).
    total_products = (
        database.query(Product)
        .filter(
            Product.company_id == company.id,
            Product.is_active.is_(True),
            Product.deleted_at.is_(None),
            _has_visible_stock(),
        )
        .count()
    )

    return PublicCompanyProfileResponse(
        id=company.id,
        name=company.nameCompany,
        description=company.description,
        logo_url=logo_url,
        banner_url=banner_url,
        is_verified=is_verified,
        created_at=company.created_at,
        total_products=total_products,
    )


def get_company_rating_service(database: Session, company_id: UUID) -> CompanyRatingResponse:
    """
    Endpoint REUTILIZABLE de reputación de empresa (ver ALCANCE >
    Calificaciones de empresa, regla 9): se llama con el mismo
    company_id tanto desde el Dashboard Empresa y "Mi tienda" (la propia
    empresa consulta su propio id) como desde el perfil público de
    empresa (cualquiera consulta el id de la URL) - una sola fuente de
    verdad, no se duplica el cálculo en 3 lugares distintos.
    """

    company = get_company_by_id(database, company_id)

    if not company:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada.")

    average_rating, total_reviews = ReviewRepository.get_company_rating(database, company.id)

    return CompanyRatingResponse(
        average_rating=round(average_rating, 1) if average_rating is not None else None,
        total_reviews=total_reviews,
    )


def get_public_company_products_service(
    database: Session,
    company_id: UUID,
    page: int = 1,
    limit: int = 12,
) -> PublicCompanyProductsResponse:
    """
    Productos activos de una empresa, paginados (page/limit) - mismo patron
    de paginacion que company_dashboard_get_my_products, pero publico
    (sin ownership) y filtrado a is_active=True (solo lo "publicado").

    Tambien filtrado por _has_visible_stock() (ver publicService/Products.py)
    - misma regla de visibilidad por stock que el resto de superficies
    publicas (catalogo, destacados, recientes, busqueda), para que un
    producto agotado tampoco aparezca en el perfil publico de su empresa.
    """

    company = get_company_by_id(database, company_id)

    # Mismo criterio que get_public_company_profile_service (ver ALCANCE
    # > BUG 2): una empresa suspendida responde igual que una que no
    # existe.
    if not company or not company.CompanyStatus:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada.")

    offset = (page - 1) * limit

    query = (
        database.query(Product)
        .filter(
            Product.company_id == company.id,
            Product.is_active.is_(True),
            Product.deleted_at.is_(None),
            _has_visible_stock(),
        )
        .order_by(Product.created_at.desc())
    )

    total = query.count()

    products = query.offset(offset).limit(limit).all()

    return PublicCompanyProductsResponse(
        page=page,
        limit=limit,
        total=total,
        total_pages=(total + limit - 1) // limit if total else 0,
        products=_to_card_responses(database, products),
    )
