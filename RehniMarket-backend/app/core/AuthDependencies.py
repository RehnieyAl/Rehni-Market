"""Dependencias de autenticación y autorización: validan el JWT de acceso, cargan el usuario y
exigen los roles de cada endpoint protegido (Depends(require_role(...)) en los routers)."""

from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import joinedload

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.core.dbconexion import SessionLocal
from app.models.ModelCompany import CompanyCertificateEnum
from app.models.ModelUser import Users
from app.services.authentication.JWTService import verify_token

# auto_error=False: el esquema solo publica el candado Bearer en Swagger; los 401 los arma
# get_current_user para conservar los códigos y mensajes que ya consumen web y móvil.
bearer_scheme = HTTPBearer(auto_error=False, bearerFormat="JWT")

KNOWN_ROLES = {"admin", "owner", "company", "user"}


@dataclass(frozen=True)
class AuthContext:
    user_id: str
    role: str
    user: Users


def _unauthorized(code: str, message: str):
    api_error(401, code, message)


def _load_user(user_id: str) -> Users | None:
    """Abre, consulta y cierra su propia sesión: la conexión vuelve al pool antes de que el
    endpoint abra la suya con get_db (evita el bloqueo del pool con PgBouncer bajo carga).
    role y company se cargan en la misma consulta porque se leen con la sesión ya cerrada."""
    database = SessionLocal()
    try:
        return (
            database.query(Users)
            .options(joinedload(Users.role), joinedload(Users.company))
            .filter(Users.id == UUID(user_id))
            .first()
        )
    finally:
        database.close()


def _access_token_user_id(request: Request) -> str:
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        _unauthorized(ErrorCodes.UNAUTHORIZED, "Token requerido")

    parts = auth_header.split()

    if len(parts) != 2 or parts[0].lower() != "bearer":
        _unauthorized(ErrorCodes.INVALID_TOKEN, "Formato de autorización inválido")

    payload = verify_token(parts[1])

    if payload == "expired":
        _unauthorized(ErrorCodes.TOKEN_EXPIRED, "Token expirado")

    if not isinstance(payload, dict):
        _unauthorized(ErrorCodes.INVALID_TOKEN, "Token inválido")

    if payload.get("type") != "access":
        _unauthorized(ErrorCodes.INVALID_TOKEN, "Access token requerido")

    if not payload.get("sub") or not payload.get("role"):
        _unauthorized(ErrorCodes.INVALID_TOKEN, "No hay usuario o rol en el token")

    return payload["sub"]


def get_current_user(
    request: Request,
    _credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthContext:
    """Usuario del access token, activo y con un rol conocido. El rol sale de la base de datos,
    no del token, para que un cambio de rol o un bloqueo apliquen sin esperar a que expire."""
    user_id = _access_token_user_id(request)

    try:
        user = _load_user(user_id)
    except SQLAlchemyError:
        # Pool agotado o BD caída no es un token inválido: con 401 el frontend intentaría
        # refrescar o cerraría la sesión de usuarios válidos.
        raise HTTPException(
            status_code=503,
            detail={
                "code": ErrorCodes.DATABASE_ERROR,
                "message": "Servicio temporalmente no disponible. Intenta de nuevo.",
            },
            headers={"Retry-After": "5"},
        )

    if not user:
        _unauthorized(ErrorCodes.INVALID_TOKEN, "Usuario no encontrado")

    if not user.isActive:
        api_error(403, ErrorCodes.USER_BLOCKED, "Tu cuenta se encuentra bloqueada.")

    role = user.role.name if user.role else None

    if role not in KNOWN_ROLES:
        api_error(403, ErrorCodes.FORBIDDEN, "Rol inválido")

    return AuthContext(user_id=user_id, role=role, user=user)


def _ensure_company_can_operate(user: Users, allow_unapproved: bool):
    company = user.company

    if not company:
        return

    if not company.CompanyStatus:
        extra = {"reason": company.suspension_reason} if company.suspension_reason else None
        api_error(403, ErrorCodes.COMPANY_SUSPENDED, "Tu empresa se encuentra suspendida.", extra)

    status = company.CompanyCertificateStatus

    if allow_unapproved or status == CompanyCertificateEnum.APPROVED:
        return

    if status == CompanyCertificateEnum.REJECTED:
        code = ErrorCodes.COMPANY_REJECTED
        message = (
            "Tu empresa fue rechazada. Revisa el motivo; para volver a "
            "operar debe intervenir un administrador."
        )
    elif status == CompanyCertificateEnum.NEEDS_UPDATE:
        code = ErrorCodes.COMPANY_CERTIFICATE_INVALID
        message = "El certificado presentado no es válido. Actualízalo para volver a revisión."
    else:
        code = ErrorCodes.COMPANY_PENDING
        message = "Tu empresa está en revisión."

    extra = {"reason": company.rejection_reason} if company.rejection_reason else None
    api_error(403, code, message, extra)


def require_role(
    *roles: str,
    allow_unapproved_company: bool = False,
    message: str = "No tienes permiso para acceder a este recurso",
):
    """Dependencia que exige uno de `roles` y responde 403 con `message` si no se cumple. Una
    empresa suspendida nunca pasa; una sin certificado aprobado solo con allow_unapproved_company."""
    allowed = frozenset(roles)

    def dependency(current: AuthContext = Depends(get_current_user)) -> AuthContext:
        # El estado de la empresa se valida antes que el rol para que la empresa suspendida o
        # en revisión reciba su motivo y no un FORBIDDEN genérico.
        if current.role == "company":
            _ensure_company_can_operate(current.user, allow_unapproved_company)

        if current.role not in allowed:
            api_error(403, ErrorCodes.FORBIDDEN, message)

        return current

    return dependency
