from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.Connection import get_db

from app.schemas.SchemaDashboard.SchemaBankAccount import (
    CreateBankAccountRequest,
    UpdateBankAccountRequest,
    BankAccountResponse,
)

from app.services.DashboardService.company.BankAccountService import (
    list_bank_accounts_service,
    create_bank_account_service,
    update_bank_account_service,
    delete_bank_account_service,
)

# Router delgado; la lógica vive en BankAccountService.py.
router = APIRouter(prefix="/company/bank-accounts", tags=["company", "bank-accounts"])


@router.get("", response_model=list[BankAccountResponse])
def get_bank_accounts(request: Request, database: Session = Depends(get_db)):
    return list_bank_accounts_service(request.state.user_id, database)


@router.post("", response_model=BankAccountResponse)
def create_bank_account(
    request: Request, data: CreateBankAccountRequest, database: Session = Depends(get_db)
):
    return create_bank_account_service(request.state.user_id, data, database)


@router.patch("/{bank_account_id}", response_model=BankAccountResponse)
def update_bank_account(
    request: Request,
    bank_account_id: UUID,
    data: UpdateBankAccountRequest,
    database: Session = Depends(get_db),
):
    return update_bank_account_service(request.state.user_id, bank_account_id, data, database)


@router.delete("/{bank_account_id}")
def delete_bank_account(
    request: Request, bank_account_id: UUID, database: Session = Depends(get_db)
):
    return delete_bank_account_service(request.state.user_id, bank_account_id, database)
