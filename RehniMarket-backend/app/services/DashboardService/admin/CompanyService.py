
from sqlalchemy.orm import Session

import base64
import json

from datetime import datetime

from uuid import UUID

from app.repository.admin.companyRepository import (
    get_all_companies,
    get_company_by_id,
    update_certificate_status,
    update_company_status,
)

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.services.email.template.EmailStatusCertificate import (
    EmailCertificateApproved,
    EmailCertificateRejected,
)

from app.services.email.template.EmailStatusCompany import (
    EmailCompanyBlocked,
    EmailCompanyUnblocked,
)

from app.services.DashboardService.admin.DashboarService import (
    register_admin_activity,
)

from app.models.ModelAdminActivity import AdminActivityAction

from app.models.ModelCompany import CompanyCertificateEnum


# =========================================================
# OBTENER TODAS LAS EMPRESAS
# =========================================================

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

    # =====================================================
    # VALIDAR FILTRO DE ESTADO
    # =====================================================

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

    # =====================================================
    # DECODIFICAR CURSOR
    # =====================================================

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

    # =====================================================
    # OBTENER EMPRESAS
    # =====================================================

    companies, has_next = get_all_companies(
        database=database,
        limit=limit,
        cursor_status_order=cursor_status_order,
        cursor_created_at=cursor_created_at,
        cursor_id=cursor_id,
        search=search,
        status=status,
    )

    # =====================================================
    # CREAR NEXT CURSOR
    # =====================================================

    next_cursor = None

    if has_next and companies:

        last_company = companies[-1]

        # ================================================
        # DETERMINAR ORDEN DEL ESTADO
        # ================================================

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

        # ================================================
        # DATOS DEL CURSOR
        # ================================================

        cursor_data = {
            "status_order": status_order,
            "created_at": (
                last_company.created_at.isoformat()
            ),
            "id": str(last_company.id),
        }

        # ================================================
        # CODIFICAR CURSOR
        # ================================================

        next_cursor = (
            base64.urlsafe_b64encode(
                json.dumps(
                    cursor_data
                ).encode()
            )
            .decode()
        )

    # =====================================================
    # RESPUESTA
    # =====================================================

    return {
        "items": companies,
        "next_cursor": next_cursor,
        "has_next": has_next,
    }


# =========================================================
# OBTENER EMPRESA POR ID
# =========================================================

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


# =========================================================
# ACTUALIZAR ESTADO DEL CERTIFICADO
# =========================================================

def update_certificate_status_service(
    company_id: UUID,
    status: str,
    database: Session,
    admin_id: UUID,
):

    try:

        # =================================================
        # VALIDAR STATUS
        # =================================================

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

        # =================================================
        # ACTUALIZAR CERTIFICADO
        # =================================================

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

        # =================================================
        # APROBADO
        # =================================================

        if status == "approved":

            EmailCertificateApproved(
                to_email=company.user.email,
                company_name=company.nameCompany,
            )

            action = (
                AdminActivityAction.COMPANY_APPROVED
            )

        # =================================================
        # RECHAZADO
        # =================================================

        elif status == "rejected":

            EmailCertificateRejected(
                to_email=company.user.email,
                company_name=company.nameCompany,
            )

            action = (
                AdminActivityAction.COMPANY_REJECTED
            )

        # =================================================
        # PENDIENTE
        # =================================================

        else:

            # No enviamos correo ni registramos
            # aprobación/rechazo para pending.
            action = None

        # =================================================
        # REGISTRAR ACTIVIDAD
        # =================================================

        if action is not None:

            register_admin_activity(
                database=database,
                admin_id=admin_id,
                action=action,
                target_company_id=company.id,
            )

        # =================================================
        # GUARDAR
        # =================================================

        database.commit()

        database.refresh(company)

        # =================================================
        # RESPUESTA
        # =================================================

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


# =========================================================
# ACTUALIZAR ESTADO DE LA EMPRESA
# =========================================================

def update_company_status_service(
    company_id: UUID,
    status: bool,
    database: Session,
    admin_id: UUID,
):

    try:

        # =================================================
        # ACTUALIZAR ESTADO
        # =================================================

        company = update_company_status(
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

        # =================================================
        # EMPRESA DESBLOQUEADA
        # =================================================

        if status:

            EmailCompanyUnblocked(
                to_email=company.user.email,
                company_name=company.nameCompany,
            )

            action = (
                AdminActivityAction.COMPANY_UNBLOCKED
            )

        # =================================================
        # EMPRESA BLOQUEADA
        # =================================================

        else:

            EmailCompanyBlocked(
                to_email=company.user.email,
                company_name=company.nameCompany,
            )

            action = (
                AdminActivityAction.COMPANY_BLOCKED
            )

        # =================================================
        # REGISTRAR ACTIVIDAD
        # =================================================

        register_admin_activity(
            database=database,
            admin_id=admin_id,
            action=action,
            target_company_id=company.id,
        )

        # =================================================
        # GUARDAR
        # =================================================

        database.commit()

        database.refresh(company)

        return company

    except Exception:

        database.rollback()

        raise

