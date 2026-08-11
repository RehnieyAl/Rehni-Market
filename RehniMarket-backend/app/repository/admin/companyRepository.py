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

    # =========================
    # BÚSQUEDA
    # =========================

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

    # =========================
    # FILTRO POR ESTADO
    # =========================

    if status in {
        "pending",
        "rejected",
        "approved",
    }:
        query = query.filter(
            Company.CompanyCertificateStatus == status
        )

    # =========================
    # ORDEN DE ESTADOS
    # =========================
    #
    # 1. Pendientes
    # 2. Rechazadas
    # 3. Aprobadas
    #

    status_order = case(
        (
            Company.CompanyCertificateStatus
            == CompanyCertificateEnum.PENDING,
            1,
        ),
        (
            Company.CompanyCertificateStatus
            == CompanyCertificateEnum.REJECTED,
            2,
        ),
        (
            Company.CompanyCertificateStatus
            == CompanyCertificateEnum.APPROVED,
            3,
        ),
        else_=4,
    )

    # =========================
    # PAGINACIÓN POR CURSOR
    # =========================
    #
    # El orden real es:
    #
    # status_order ASC
    # created_at DESC
    # id DESC
    #

    if (
        cursor_status_order is not None
        and cursor_created_at is not None
        and cursor_id is not None
    ):
        query = query.filter(
            or_(
                # Pasar a un estado posterior
                status_order > cursor_status_order,

                # Mismo estado pero registro más antiguo
                and_(
                    status_order == cursor_status_order,
                    Company.created_at < cursor_created_at,
                ),

                # Misma fecha dentro del mismo estado
                and_(
                    status_order == cursor_status_order,
                    Company.created_at == cursor_created_at,
                    Company.id < cursor_id,
                ),
            )
        )

    # =========================
    # CONSULTA
    # =========================

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

    # =========================
    # HAS NEXT
    # =========================

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

    # =========================
    # CERTIFICADO
    # =========================

    certificado = (
        build_media_url(
            f"uploads/{company.CompanyCertificate}"
        )
        if company.CompanyCertificate
        else None
    )

    # =========================
    # LOGO
    # =========================

    logo = (
        build_media_url(
            f"uploads/{company.CompanyLogo}"
        )
        if company.CompanyLogo
        else None
    )

    # =========================
    # BANNER
    # =========================

    banner = (
        build_media_url(
            company.CompanyBanner
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
        addressCompany=company.addressCompany,
        user_id=company.user_id,
        created_at=company.created_at,
    )


def update_certificate_status(
    database: Session,
    company_id: UUID,
    status: str,
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


def get_company_by_user_id_repository(
    database: Session,
    user_id: UUID,
) -> Company | None:

    return (
        database.query(Company)
        .filter(
            Company.user_id == user_id
        )
        .first()
    )