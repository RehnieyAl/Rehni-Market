
from sqlalchemy.orm import Session

import base64
import json

from datetime import datetime
from decimal import Decimal

from uuid import UUID

from app.repository.admin.companyRepository import (
    get_all_companies,
    get_company_by_id,
    get_company_by_id_orm,
    update_certificate_status,
)

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.schemas.SchemaDashboard.admin.company import (
    AdminCompanyDetailResponse,
    UpdateCompanyStatusResponse,
)

from app.services.NasService import build_media_url


def _media_url(object_name: str | None) -> str | None:
    return build_media_url(f"uploads/{object_name}") if object_name else None

from app.services.email.template.EmailStatusCertificate import (
    EmailCertificateApproved,
    EmailCertificateRejected,
)

from app.services.email.template.EmailStatusCompany import (
    EmailCompanyBlocked,
    EmailCompanyUnblocked,
)

from app.services.commerce.OrderService import (
    cancel_and_refund_company_orders_for_suspension,
)

from app.services.email.OrderEmailService import send_order_status_email

from app.services.DashboardService.admin.DashboarService import (
    register_admin_activity,
)

from app.models.ModelAdminActivity import AdminActivityAction

from app.models.ModelCompany import CompanyCertificateEnum


def get_all_companies_service(
    database: Session,
    limit: int = 10,
    cursor: str | None = None,
    search: str | None = None,
    status: str | None = None,
):

    cursor_status_order = None
    cursor_created_at = None
    cursor_id = None

    if status not in (
        None,
        "pending",
        "rejected",
        "approved",
    ):
        api_error(
            400,
            ErrorCodes.INVALID_STATUS,
            "Estado de certificado inválido.",
        )

    if cursor:
        try:

            decoded_cursor = (
                base64.urlsafe_b64decode(
                    cursor.encode()
                )
                .decode()
            )

            cursor_data = json.loads(
                decoded_cursor
            )

            cursor_status_order = int(
                cursor_data["status_order"]
            )

            cursor_created_at = (
                datetime.fromisoformat(
                    cursor_data["created_at"]
                )
            )

            cursor_id = UUID(
                cursor_data["id"]
            )

        except (
            ValueError,
            KeyError,
            TypeError,
            json.JSONDecodeError,
        ):

            api_error(
                400,
                ErrorCodes.INVALID_DATA,
                "Cursor inválido.",
            )

    companies, has_next = get_all_companies(
        database=database,
        limit=limit,
        cursor_status_order=cursor_status_order,
        cursor_created_at=cursor_created_at,
        cursor_id=cursor_id,
        search=search,
        status=status,
    )

    next_cursor = None

    if has_next and companies:

        last_company = companies[-1]

        if (
            last_company.CompanyCertificateStatus
            == CompanyCertificateEnum.PENDING
        ):

            status_order = 1

        elif (
            last_company.CompanyCertificateStatus
            == CompanyCertificateEnum.REJECTED
        ):

            status_order = 2

        elif (
            last_company.CompanyCertificateStatus
            == CompanyCertificateEnum.APPROVED
        ):

            status_order = 3

        else:

            status_order = 4

        cursor_data = {
            "status_order": status_order,
            "created_at": (
                last_company.created_at.isoformat()
            ),
            "id": str(last_company.id),
        }

        next_cursor = (
            base64.urlsafe_b64encode(
                json.dumps(
                    cursor_data
                ).encode()
            )
            .decode()
        )

    # Serializar aquí (no dejar que FastAPI lea el ORM crudo): los campos de imagen
    # deben salir como URL de /media/proxy, no como object_name interno.
    items = [
        AdminCompanyDetailResponse(
            id=company.id,
            nameCompany=company.nameCompany,
            CompanyNIT=company.CompanyNIT,
            CompanyNITDV=company.CompanyNITDV,
            CompanyLogo=_media_url(company.CompanyLogo),
            CompanyBanner=_media_url(company.CompanyBanner),
            CompanyCertificate=_media_url(company.CompanyCertificate),
            CompanyCertificateStatus=company.CompanyCertificateStatus,
            CompanyStatus=company.CompanyStatus,
            suspensionReason=company.suspension_reason,
            addressCompany=company.addressCompany,
            user_id=company.user_id,
            created_at=company.created_at,
        )
        for company in companies
    ]

    return {
        "items": items,
        "next_cursor": next_cursor,
        "has_next": has_next,
    }


def get_admin_company_service(
    company_id: UUID,
    database: Session,
):

    company = get_company_by_id(
        database=database,
        company_id=company_id,
    )

    if company is None:

        api_error(
            404,
            ErrorCodes.COMPANY_NOT_FOUND,
            "Empresa no encontrada...",
        )

    return company


def update_certificate_status_service(
    company_id: UUID,
    status: str,
    database: Session,
    admin_id: UUID,
):

    try:

        if status not in (
            "pending",
            "approved",
            "rejected",
        ):

            api_error(
                400,
                ErrorCodes.INVALID_STATUS,
                "Estado de certificado inválido.",
            )

        company = update_certificate_status(
            database=database,
            company_id=company_id,
            status=status,
        )

        if company is None:

            api_error(
                404,
                ErrorCodes.COMPANY_NOT_FOUND,
                "Empresa no encontrada...",
            )

        if status == "approved":

            EmailCertificateApproved(
                to_email=company.user.email,
                company_name=company.nameCompany,
            )

            action = (
                AdminActivityAction.COMPANY_APPROVED
            )

        elif status == "rejected":

            EmailCertificateRejected(
                to_email=company.user.email,
                company_name=company.nameCompany,
            )

            action = (
                AdminActivityAction.COMPANY_REJECTED
            )

        else:
            # pending no envía correo ni registra actividad.
            action = None

        if action is not None:

            register_admin_activity(
                database=database,
                admin_id=admin_id,
                action=action,
                target_company_id=company.id,
            )

        database.commit()

        database.refresh(company)

        return {
            "message": (
                "Estado del certificado "
                "actualizado correctamente"
            ),
            "company_id": company.id,
            "certificate_status": (
                company.CompanyCertificateStatus
            ),
        }

    except Exception:

        database.rollback()

        raise


def update_company_status_service(
    company_id: UUID,
    status: bool,
    database: Session,
    admin_id: UUID,
    reason: str | None = None,
):

    try:

        # ORM crudo: hace falta el CompanyStatus anterior para saber si es una suspensión nueva.
        company = get_company_by_id_orm(
            database=database,
            company_id=company_id,
        )

        if company is None:

            api_error(
                404,
                ErrorCodes.COMPANY_NOT_FOUND,
                "Empresa no encontrada...",
            )

        was_active = company.CompanyStatus

        # Suspensión "nueva" solo al pasar true -> false; repetirla sobre una empresa
        # ya suspendida no procesa nada de nuevo.
        is_new_suspension = was_active and not status

        # Motivo obligatorio solo al suspender de verdad, no al desbloquear.
        if is_new_suspension and not (reason and reason.strip()):

            api_error(
                400,
                ErrorCodes.MISSING_REQUIRED_FIELD,
                "El motivo de suspensión es obligatorio.",
            )

        reason_clean = reason.strip() if reason else None

        company.CompanyStatus = status

        if is_new_suspension:
            company.suspension_reason = reason_clean
        elif status:
            company.suspension_reason = None

        refunded_orders = []

        if is_new_suspension:
            refunded_orders = cancel_and_refund_company_orders_for_suspension(
                database=database,
                company=company,
                reason=reason_clean,
            )

        total_refunded = sum(
            (order.total for order in refunded_orders),
            Decimal("0"),
        )

        if status:

            EmailCompanyUnblocked(
                to_email=company.user.email,
                company_name=company.nameCompany,
            )

            action = (
                AdminActivityAction.COMPANY_UNBLOCKED
            )

        else:

            EmailCompanyBlocked(
                to_email=company.user.email,
                company_name=company.nameCompany,
                reason=reason_clean,
            )

            action = (
                AdminActivityAction.COMPANY_BLOCKED
            )

        # register_admin_activity hace el commit que cubre bloqueo + cancelaciones + reembolsos.
        register_admin_activity(
            database=database,
            admin_id=admin_id,
            action=action,
            target_company_id=company.id,
            reason=reason_clean if is_new_suspension else None,
        )

        database.commit()

        database.refresh(company)

        # Correos best-effort tras el commit: un fallo de SMTP no debe deshacer nada.
        for order in refunded_orders:
            database.refresh(order)

            send_order_status_email(
                order,
                reason="Reembolso por suspensión de la empresa vendedora.",
                refunded_amount=order.total,
                company_name=company.nameCompany,
            )

        return UpdateCompanyStatusResponse(
            id=company.id,
            nameCompany=company.nameCompany,
            CompanyNIT=company.CompanyNIT,
            CompanyNITDV=company.CompanyNITDV,
            CompanyLogo=_media_url(company.CompanyLogo),
            CompanyBanner=_media_url(company.CompanyBanner),
            CompanyCertificate=_media_url(company.CompanyCertificate),
            CompanyCertificateStatus=company.CompanyCertificateStatus,
            CompanyStatus=company.CompanyStatus,
            suspensionReason=company.suspension_reason,
            addressCompany=company.addressCompany,
            user_id=company.user_id,
            created_at=company.created_at,
            affectedOrdersCount=len(refunded_orders),
            totalRefunded=total_refunded,
        )

    except Exception:

        database.rollback()

        raise

