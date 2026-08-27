
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
    UpdateCompanyStatusResponse,
)

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
# ACTUALIZAR ESTADO DE LA EMPRESA (BLOQUEAR/SUSPENDER, DESBLOQUEAR)
# =========================================================
#
# Suspensión de empresa (ver ALCANCE > Suspensión de empresa): al pasar
# CompanyStatus true -> false, además de bloquear la empresa, se cancela
# y reembolsa (RehniCoin) cada pedido suyo que todavía esté en PENDING/
# PAID/PROCESSING (ver OrderService.cancel_and_refund_company_orders_for_
# suspension - SHIPPED/DELIVERED/CANCELLED se dejan intactos a propósito).
# Todo (bloqueo + cancelaciones + reembolsos) es UNA sola transacción:
# register_admin_activity es quien hace el commit real acá abajo (ver
# DashboarService.py/activityRepository.py) - se llama al final, después
# de mutar la empresa y procesar los pedidos, para que su commit cubra
# todo junto. Si algo falla antes de esa línea, nada de esto se guarda
# (ver except más abajo).

def update_company_status_service(
    company_id: UUID,
    status: bool,
    database: Session,
    admin_id: UUID,
    reason: str | None = None,
):

    try:

        # =================================================
        # OBTENER EMPRESA (ORM crudo - hace falta el CompanyStatus
        # ANTERIOR para saber si esto es una suspensión NUEVA)
        # =================================================

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

        # Solo es una suspensión "nueva" al pasar true -> false. Si ya
        # estaba suspendida (false -> false, la operación se repite) NO
        # se vuelve a procesar nada (ver ALCANCE > punto 6) - se deja
        # bloqueada, sin tocar pedidos ni el motivo ya guardado.
        is_new_suspension = was_active and not status

        # =================================================
        # MOTIVO OBLIGATORIO AL SUSPENDER
        # =================================================
        # Se valida solo cuando de verdad se va a suspender (was_active y
        # status=False) - no bloquea el desbloqueo (status=True) ni una
        # llamada repetida sobre una empresa ya suspendida.

        if is_new_suspension and not (reason and reason.strip()):

            api_error(
                400,
                ErrorCodes.MISSING_REQUIRED_FIELD,
                "El motivo de suspensión es obligatorio.",
            )

        reason_clean = reason.strip() if reason else None

        # =================================================
        # ACTUALIZAR ESTADO
        # =================================================

        company.CompanyStatus = status

        if is_new_suspension:
            company.suspension_reason = reason_clean
        elif status:
            # Desbloqueo: el motivo ya no aplica.
            company.suspension_reason = None

        # =================================================
        # CANCELAR + REEMBOLSAR PEDIDOS AFECTADOS (solo en una
        # suspensión nueva)
        # =================================================

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
        # EMPRESA BLOQUEADA/SUSPENDIDA
        # =================================================

        else:

            EmailCompanyBlocked(
                to_email=company.user.email,
                company_name=company.nameCompany,
                reason=reason_clean,
            )

            action = (
                AdminActivityAction.COMPANY_BLOCKED
            )

        # =================================================
        # REGISTRAR ACTIVIDAD (hace el commit de TODO lo anterior -
        # ver docstring de la sección más arriba)
        # =================================================

        register_admin_activity(
            database=database,
            admin_id=admin_id,
            action=action,
            target_company_id=company.id,
            reason=reason_clean if is_new_suspension else None,
        )

        database.commit()

        database.refresh(company)

        # =================================================
        # CORREOS DE PEDIDOS CANCELADOS (después del commit, best-effort
        # - mismo criterio que checkout_service/update_company_order_
        # status_service: si el guardado ya se confirmó, un error de SMTP
        # nunca debe deshacer nada)
        # =================================================

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
            CompanyLogo=company.CompanyLogo,
            CompanyBanner=company.CompanyBanner,
            CompanyCertificate=company.CompanyCertificate,
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

