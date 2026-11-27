"""Rutas de cuentas bancarias de la empresa para recibir liquidaciones (solo rol company)."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.dbconexion import get_db
from app.core.AuthDependencies import AuthContext, require_role

from app.schemas.SchemaDashboard.SchemaBankAccount import (
    CreateBankAccountRequest,
    UpdateBankAccountRequest,
    BankAccountResponse,
)

from app.schemas.SchemaDashboard.SchemaBank import BankOptionResponse
from app.services.DashboardService.admin.BankService import list_active_banks_service
from app.services.DashboardService.company.BankAccountService import (
    list_bank_accounts_service,
    create_bank_account_service,
    update_bank_account_service,
    delete_bank_account_service,
)

router = APIRouter(prefix="/company/bank-accounts", tags=["company", "bank-accounts"])


@router.get("/banks", response_model=list[BankOptionResponse])
def get_available_banks(
    _current: Annotated[AuthContext, Depends(require_role("company"))],
    database: Session = Depends(get_db, scope="function"),
):
    """Bancos activos del catálogo para elegir al registrar o editar una cuenta."""
    return list_active_banks_service(database)


@router.get("", response_model=list[BankAccountResponse])
def get_bank_accounts(
    current: Annotated[AuthContext, Depends(require_role("company"))],
    database: Session = Depends(get_db, scope="function"),
):
    return list_bank_accounts_service(current.user_id, database)


@router.post("", response_model=BankAccountResponse)
def create_bank_account(
    current: Annotated[AuthContext, Depends(require_role("company"))],
    data: CreateBankAccountRequest,
    database: Session = Depends(get_db, scope="function"),
):
    return create_bank_account_service(current.user_id, data, database)


@router.patch("/{bank_account_id}", response_model=BankAccountResponse)
def update_bank_account(
    current: Annotated[AuthContext, Depends(require_role("company"))],
    bank_account_id: UUID,
    data: UpdateBankAccountRequest,
    database: Session = Depends(get_db, scope="function"),
):
    return update_bank_account_service(current.user_id, bank_account_id, data, database)


@router.delete("/{bank_account_id}")
def delete_bank_account(
    current: Annotated[AuthContext, Depends(require_role("company"))],
    bank_account_id: UUID,
    database: Session = Depends(get_db, scope="function"),
):
    return delete_bank_account_service(current.user_id, bank_account_id, database)
