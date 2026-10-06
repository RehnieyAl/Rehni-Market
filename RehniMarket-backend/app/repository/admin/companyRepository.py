from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, case
from uuid import UUID

from app.models.ModelCompany import (
    Company,
    CompanyCertificateEnum,
)
from app.models.ModelUser import Users
from app.services.NasService import build_media_url
from app.schemas.SchemaDashboard.admin.company import (
    AdminCompanyDetailResponse,
)


def get_all_companies(
    database: Session,
    limit: int = 10,
    cursor_status_order: int | None = None,
    cursor_created_at=None,
    cursor_id: UUID | None = None,
    search: str | None = None,
    status: str | None = None,
):
    query = (
        database.query(Company)
        .join(
            Users,
            Company.user_id == Users.id,
        )
    )

    if search and search.strip():
        search_value = f"%{search.strip()}%"

        query = query.filter(
            or_(
                Users.email.ilike(search_value),
                Users.tell.ilike(search_value),
                Company.CompanyNIT.ilike(search_value),
                Company.nameCompany.ilike(search_value),
            )
        )

    if status in {
        "pending",
        "rejected",
        "needs_update",
        "approved",
    }:
        query = query.filter(
            Company.CompanyCertificateStatus == status
        )

    status_order = case(
        (
            Company.CompanyCertificateStatus
            == CompanyCertificateEnum.PENDING,
            1,
        ),
        (
            Company.CompanyCertificateStatus
            == CompanyCertificateEnum.NEEDS_UPDATE,
            2,
        ),
        (
            Company.CompanyCertificateStatus
            == CompanyCertificateEnum.REJECTED,
            3,
        ),
        (
            Company.CompanyCertificateStatus
            == CompanyCertificateEnum.APPROVED,
            4,
        ),
        else_=5,
    )

    if (
        cursor_status_order is not None
        and cursor_created_at is not None
        and cursor_id is not None
    ):
        query = query.filter(
            or_(
                status_order > cursor_status_order,
                and_(
                    status_order == cursor_status_order,
                    Company.created_at < cursor_created_at,
                ),
                and_(
                    status_order == cursor_status_order,
                    Company.created_at == cursor_created_at,
                    Company.id < cursor_id,
                ),
            )
        )

    companies = (
        query
        .order_by(
            status_order.asc(),
            Company.created_at.desc(),
            Company.id.desc(),
        )
        .limit(limit + 1)
        .all()
    )

    has_next = len(companies) > limit

    if has_next:
        companies = companies[:limit]

    return companies, has_next


def get_company_by_id(
    database: Session,
    company_id: UUID,
) -> AdminCompanyDetailResponse | None:

    company = (
        database.query(Company)
        .filter(
            Company.id == company_id
        )
        .first()
    )

    if company is None:
        return None

    certificado = (
        build_media_url(
            f"uploads/{company.CompanyCertificate}"
        )
        if company.CompanyCertificate
        else None
    )

    logo = (
        build_media_url(
            f"uploads/{company.CompanyLogo}"
        )
        if company.CompanyLogo
        else None
    )

    banner = (
        build_media_url(
            f"uploads/{company.CompanyBanner}"
        )
        if company.CompanyBanner
        else None
    )

    return AdminCompanyDetailResponse(
        id=company.id,
        nameCompany=company.nameCompany,
        CompanyNIT=company.CompanyNIT,
        CompanyNITDV=company.CompanyNITDV,
        CompanyLogo=logo,
        CompanyBanner=banner,
        CompanyCertificate=certificado,
        CompanyCertificateStatus=company.CompanyCertificateStatus,
        CompanyStatus=company.CompanyStatus,
        suspensionReason=company.suspension_reason,
        rejectionReason=company.rejection_reason,
        addressCompany=company.addressCompany,
        user_id=company.user_id,
        created_at=company.created_at,
    )


def get_company_by_id_orm(
    database: Session,
    company_id: UUID,
) -> Company | None:
    """Devuelve el ORM crudo (no el DTO): update_company_status_service necesita leer
    CompanyStatus antes de cambiarlo y mutar suspension_reason en el mismo objeto."""

    return (
        database.query(Company)
        .filter(Company.id == company_id)
        .first()
    )


def update_certificate_status(
    database: Session,
    company_id: UUID,
    status: str,
    reason: str | None = None,
) -> Company | None:

    company = (
        database.query(Company)
        .filter(
            Company.id == company_id
        )
        .first()
    )

    if company is None:
        return None

    company.CompanyCertificateStatus = status

    company.rejection_reason = (
        reason if status in ("rejected", "needs_update") else None
    )

    return company


def update_company_status(
    database: Session,
    company_id: UUID,
    status: bool,
) -> Company | None:

    company = (
        database.query(Company)
        .filter(
            Company.id == company_id
        )
        .first()
    )

    if company is None:
        return None

    company.CompanyStatus = status

    return company