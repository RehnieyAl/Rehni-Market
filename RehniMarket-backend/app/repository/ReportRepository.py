from sqlalchemy.orm import Session, selectinload, aliased
from sqlalchemy import or_
from uuid import UUID

from app.models.ModelReport import Report, ReportTargetType, ReportStatus
from app.models.ModelUser import Users
from app.models.ModelProduct import Product
from app.models.ModelCompany import Company


def create_report(database: Session, report: Report) -> Report:
    database.add(report)
    database.flush()
    return report


def get_report_by_id(database: Session, report_id: UUID) -> Report | None:
    return (
        database.query(Report)
        .options(
            selectinload(Report.reporter),
            selectinload(Report.resolver),
            selectinload(Report.product).selectinload(Product.company),
            selectinload(Report.company),
            selectinload(Report.evidences),
        )
        .filter(Report.id == report_id)
        .first()
    )


def list_reports(
    database: Session,
    page: int,
    limit: int,
    target_type: ReportTargetType | None = None,
    status: ReportStatus | None = None,
    search: str | None = None,
):
    """
    Listado paginado para Admin > Reportes (ver ALCANCE > sección 6).
    `search` busca por nombre de producto, nombre de empresa (la propia,
    en un reporte de empresa, o la dueña del producto, en uno de
    producto) y correo/nombre del usuario reportante - todo con outer
    join para no excluir reportes de un tipo por columnas del otro tipo.
    """

    # Dos alias de Company distintos a propósito: un reporte de PRODUCTO
    # tiene Report.company_id en NULL (ver ModelReport.py > regla de
    # exclusividad) - su empresa dueña solo se alcanza vía
    # Product.company_id, nunca vía Report.company_id. Sin esta segunda
    # ruta, buscar por el nombre de la empresa dueña de un producto
    # reportado no encontraba ese reporte.
    reported_company = aliased(Company)
    product_owner_company = aliased(Company)

    query = (
        database.query(Report)
        .options(
            selectinload(Report.reporter),
            selectinload(Report.product).selectinload(Product.company),
            selectinload(Report.company),
        )
        .outerjoin(Product, Report.product_id == Product.id)
        .outerjoin(reported_company, Report.company_id == reported_company.id)
        .outerjoin(product_owner_company, Product.company_id == product_owner_company.id)
        .outerjoin(Users, Report.reporter_id == Users.id)
    )

    if target_type is not None:
        query = query.filter(Report.target_type == target_type)

    if status is not None:
        query = query.filter(Report.status == status)

    if search and search.strip():
        search_value = f"%{search.strip()}%"

        query = query.filter(
            or_(
                Product.name.ilike(search_value),
                reported_company.nameCompany.ilike(search_value),
                product_owner_company.nameCompany.ilike(search_value),
                Users.fullName.ilike(search_value),
                Users.email.ilike(search_value),
                Report.reason.ilike(search_value),
            )
        )

    total = query.count()

    offset = (page - 1) * limit

    reports = (
        query.order_by(Report.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return reports, total


def update_report_status(
    database: Session,
    report: Report,
    status: ReportStatus,
    admin_response: str | None,
    resolved_by: UUID | None,
    resolved_at,
) -> Report:
    report.status = status
    report.admin_response = admin_response
    report.resolved_by = resolved_by
    report.resolved_at = resolved_at

    database.flush()

    return report
