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


def get_public_company_profile_service(
    database: Session,
    company_id: UUID,
) -> PublicCompanyProfileResponse:

    company = get_company_by_id(database, company_id)

    if not company or not company.CompanyStatus:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada.")

    is_verified = (
        company.CompanyCertificateStatus == CompanyCertificateEnum.APPROVED
        and company.CompanyStatus
    )

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
    """Reputación de empresa; una sola fuente de verdad para dashboard, "Mi tienda" y perfil público."""

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
    """Productos activos de una empresa, paginados. Filtrado a is_active y _has_visible_stock,
    igual que el resto de superficies públicas."""

    company = get_company_by_id(database, company_id)

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
