from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.repository.UserRepository import get_by_email
from app.utils.Security import verify_password

from app.services.DashboardService.company.Dashboard import apply_certificate_replacement


def update_certificate_with_credentials_service(
    email: str,
    password: str,
    certificate,
    nas,
    database: Session,
):

    user = get_by_email(database, email)

    if not user or not verify_password(password, user.hashed_password):
        api_error(400, ErrorCodes.INVALID_CREDENTIALS, "Correo o contraseña incorrectos.")

    if not user.isActive:
        api_error(
            403,
            ErrorCodes.USER_BLOCKED,
            "Tu cuenta se encuentra bloqueada. Contacta con un administrador.",
        )

    role = user.role.name if user.role else None
    company = user.company

    if role != "company" or company is None:
        api_error(400, ErrorCodes.INVALID_CREDENTIALS, "Correo o contraseña incorrectos.")

    if not company.CompanyStatus:
        api_error(
            403,
            ErrorCodes.COMPANY_SUSPENDED,
            "Tu empresa se encuentra suspendida.",
            extra=(
                {"reason": company.suspension_reason}
                if company.suspension_reason
                else None
            ),
        )

    return apply_certificate_replacement(company, certificate, nas, database)
