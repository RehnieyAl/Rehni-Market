"""Rutas del catálogo de bancos para administración (admin y owner): listar, registrar y editar con logo."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.AuthDependencies import require_role
from app.core.dbconexion import get_db
from app.schemas.SchemaDashboard.SchemaBank import AdminBankResponse, CreateBankRequest, UpdateBankRequest
from app.services.DashboardService.admin.BankService import (
    create_bank_service,
    list_banks_admin_service,
    update_bank_service,
)
from app.services.NasService import NasService, get_nas_service
from app.utils.FileValidator import IMAGE_EXTENSIONS, validate_uploads

router = APIRouter(
    prefix="/admin/dashboard/banks",
    tags=["admin", "banks"],
    dependencies=[Depends(require_role("admin", "owner"))],
)

ERRORS = {
    401: {"description": "Token ausente, inválido o expirado."},
    403: {"description": "Rol distinto de admin u owner (FORBIDDEN)."},
}


@router.get("", response_model=list[AdminBankResponse], responses=ERRORS)
def list_banks(database: Session = Depends(get_db, scope="function")):
    """Catálogo completo (activos e inactivos) con el número de cuentas de empresa enlazadas."""
    return list_banks_admin_service(database)


@router.post(
    "",
    response_model=AdminBankResponse,
    status_code=201,
    responses={**ERRORS, 409: {"description": "Ya existe un banco con ese nombre (BANK_ALREADY_EXISTS)."}},
)
def create_bank(
    data: Annotated[CreateBankRequest, Depends(CreateBankRequest.as_form)],
    logo: UploadFile | None = File(None),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db, scope="function"),
):
    """Registra un banco (logo opcional: PNG, JPEG o WebP, máximo 5 MB). Enlaza las cuentas registradas
    antes del catálogo cuyo nombre de banco coincide."""
    validate_uploads([logo], IMAGE_EXTENSIONS, "Logo del banco")
    return create_bank_service(database, data, logo, nas)


@router.patch(
    "/{bank_id}",
    response_model=AdminBankResponse,
    responses={
        **ERRORS,
        404: {"description": "Banco inexistente (BANK_NOT_FOUND)."},
        409: {"description": "Ya existe un banco con ese nombre (BANK_ALREADY_EXISTS)."},
    },
)
def update_bank(
    bank_id: UUID,
    data: Annotated[UpdateBankRequest, Depends(UpdateBankRequest.as_form)],
    logo: UploadFile | None = File(None),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db, scope="function"),
):
    """Cambia nombre, estado o logo. No hay borrado: un banco en desuso se desactiva."""
    validate_uploads([logo], IMAGE_EXTENSIONS, "Logo del banco")
    return update_bank_service(database, bank_id, data, logo, nas)
