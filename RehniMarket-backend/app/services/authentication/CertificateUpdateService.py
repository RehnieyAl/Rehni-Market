"""Actualización del certificado empresarial SIN JWT.

Pensado para una página independiente (`/actualizar-certificado`): la empresa se
identifica con correo + contraseña, no con un token. No se emite ningún JWT/refresh,
no se abre sesión y no se guardan las credenciales. Solo se permite cuando el
certificado está en NEEDS_UPDATE (el admin lo marcó como inválido). Un rechazo
terminal de la empresa (REJECTED) devuelve 409 COMPANY_REJECTED.

Reutiliza:
- `verify_password` (mismo hashing que el login)
- `UserRepository.get_by_email`
- `Dashboard.apply_certificate_replacement` (validación de PDF + subida a MinIO +
  cambio de estado + transacción + limpieza), el mismo núcleo del flujo con JWT
  (`PUT /company/certificate`).
"""

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
    """Identifica a la empresa por correo + contraseña y reemplaza su certificado.

    Errores:
    - correo inexistente / contraseña incorrecta / la cuenta no es una empresa
      -> `400 INVALID_CREDENTIALS` (respuesta opaca: no revela si el correo existe).
    - cuenta bloqueada -> `403 USER_BLOCKED`.
    - empresa suspendida -> `403 COMPANY_SUSPENDED`.
    - certificado PENDING -> `409 COMPANY_PENDING`; APPROVED -> `409 COMPANY_APPROVED`;
      REJECTED (rechazo terminal) -> `409 COMPANY_REJECTED` (los aplica
      `apply_certificate_replacement`; solo procede en NEEDS_UPDATE).
    - PDF inválido / > 5 MB -> `400 INVALID_FILE`.
    """

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
        # Una cuenta que no es empresa no tiene certificado que actualizar. Se
        # responde igual que una credencial inválida para no filtrar información.
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
