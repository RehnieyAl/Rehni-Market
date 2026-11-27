"""CRUD de cuentas bancarias de la empresa (una sola predeterminada), con el banco elegido del catálogo.
El dueño es la Company del usuario autenticado; las respuestas solo llevan los últimos dígitos."""

import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelBank import Bank
from app.models.ModelCompany import Company
from app.models.ModelCompanyBankAccount import CompanyBankAccount

from app.repository import CompanyRepository
from app.repository import BankRepository
from app.repository import CompanyBankAccountRepository as repo

from app.schemas.SchemaDashboard.SchemaBankAccount import (
    CreateBankAccountRequest,
    UpdateBankAccountRequest,
    BankAccountResponse,
)
from app.services.DashboardService.admin.BankService import bank_logo_url

logger = logging.getLogger(__name__)


def _get_company_for_user(database: Session, user_id: UUID) -> Company:
    company = CompanyRepository.get_company_by_user_id(database, user_id)

    if not company:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "No se encontró una empresa para este usuario.")

    return company


def _to_response(bank_account: CompanyBankAccount) -> BankAccountResponse:
    return BankAccountResponse(
        id=bank_account.id,
        accountHolder=bank_account.account_holder,
        documentNumber=bank_account.document_number,
        bankId=bank_account.bank_id,
        bankName=bank_account.bank_name,
        bankLogoUrl=bank_logo_url(bank_account.bank),
        accountType=bank_account.account_type.value,
        lastFourDigits=bank_account.account_number[-4:],
        isDefault=bank_account.is_default,
        createdAt=bank_account.created_at,
        updatedAt=bank_account.updated_at,
    )


def _get_selectable_bank(database: Session, bank_id: UUID) -> Bank:
    bank = BankRepository.get_bank(database, bank_id)

    if not bank:
        api_error(404, ErrorCodes.BANK_NOT_FOUND, "El banco seleccionado no existe.")

    if not bank.is_active:
        api_error(400, ErrorCodes.BANK_INACTIVE, "El banco seleccionado no está disponible.")

    return bank


def list_bank_accounts_service(user_id: UUID, database: Session) -> list[BankAccountResponse]:
    company = _get_company_for_user(database, user_id)

    accounts = repo.list_bank_accounts(database, company.id)

    return [_to_response(account) for account in accounts]


def create_bank_account_service(
    user_id: UUID, data: CreateBankAccountRequest, database: Session
) -> BankAccountResponse:
    company = _get_company_for_user(database, user_id)

    try:
        bank = _get_selectable_bank(database, data.bankId)
        repo.lock_company_accounts(database, company.id)
        existing = repo.list_bank_accounts(database, company.id)

        is_default = data.isDefault or len(existing) == 0

        if is_default:
            repo.clear_default(database, company.id)

        bank_account = CompanyBankAccount(
            company_id=company.id,
            account_holder=data.accountHolder,
            document_number=data.documentNumber,
            bank_id=bank.id,
            bank_name=bank.name,
            account_type=data.accountType,
            account_number=data.accountNumber,
            is_default=is_default,
        )

        repo.create_bank_account(database, bank_account)

        database.commit()
        database.refresh(bank_account)

        return _to_response(bank_account)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        logger.exception("Error inesperado")
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


# Campo del schema (camelCase) -> columna del modelo. El banco se trata aparte (catálogo).
_UPDATABLE_FIELDS = {
    "accountHolder": "account_holder",
    "documentNumber": "document_number",
    "accountType": "account_type",
    "accountNumber": "account_number",
}


def update_bank_account_service(
    user_id: UUID, bank_account_id: UUID, data: UpdateBankAccountRequest, database: Session
) -> BankAccountResponse:
    company = _get_company_for_user(database, user_id)

    try:
        bank_account = repo.get_bank_account_owned(database, company.id, bank_account_id)

        if not bank_account:
            api_error(404, ErrorCodes.BANK_ACCOUNT_NOT_FOUND, "Cuenta bancaria no encontrada.")

        for field, column in _UPDATABLE_FIELDS.items():
            value = getattr(data, field)
            if value is not None:
                setattr(bank_account, column, value)

        if data.bankId is not None and data.bankId != bank_account.bank_id:
            bank = _get_selectable_bank(database, data.bankId)
            bank_account.bank_id = bank.id
            bank_account.bank_name = bank.name

        # isDefault=false se ignora: la predeterminada solo cambia al marcar otra.
        if data.isDefault is True:
            repo.lock_company_accounts(database, company.id)
            repo.clear_default(database, company.id)
            bank_account.is_default = True

        database.commit()
        database.refresh(bank_account)

        return _to_response(bank_account)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        logger.exception("Error inesperado")
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def delete_bank_account_service(
    user_id: UUID, bank_account_id: UUID, database: Session
) -> dict:
    company = _get_company_for_user(database, user_id)

    try:
        bank_account = repo.get_bank_account_owned(database, company.id, bank_account_id)

        if not bank_account:
            api_error(404, ErrorCodes.BANK_ACCOUNT_NOT_FOUND, "Cuenta bancaria no encontrada.")

        repo.lock_company_accounts(database, company.id)

        if repo.is_bank_account_referenced_by_payout(database, bank_account.id):
            api_error(
                409,
                ErrorCodes.BANK_ACCOUNT_IN_USE,
                "Esta cuenta ya tiene liquidaciones asociadas y no se puede eliminar.",
            )

        was_default = bank_account.is_default

        repo.delete_bank_account(database, bank_account)
        database.flush()

        if was_default:
            remaining = repo.list_bank_accounts(database, company.id)

            if remaining:
                remaining[0].is_default = True

        database.commit()

        return {"message": "Cuenta bancaria eliminada correctamente."}

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        logger.exception("Error inesperado")
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")
