from uuid import UUID

from sqlalchemy.orm import Session

from app.models.ModelCompany import Company
from app.schemas.schemaAuth.SchemaRegister import CreateCompanyRequest


def get_company_by_nit(database: Session,nit: str) -> Company | None:

    return (database.query(Company).filter(Company.CompanyNIT == nit).first())


def get_company_by_id(database: Session, company_id: UUID) -> Company | None:

    return (database.query(Company).filter(Company.id == company_id).first())


def get_company_by_user_id(database: Session, user_id: UUID) -> Company | None:
    # Usado por el modulo de liquidaciones (ver BankAccountService.py /
    # PayoutService.py) para resolver la empresa del usuario autenticado -
    # mismo dato que ya se lee via user.company en Dashboard.py, expuesto
    # aca como funcion de repositorio para no depender de tener el ORM de
    # Users ya cargado en el llamador.
    return (database.query(Company).filter(Company.user_id == user_id).first())


def create_company(database: Session,user_id,company: CreateCompanyRequest,certificate_path: str) -> Company:

    new_company = Company(
        user_id=user_id,
        nameCompany=company.company_name,
        addressCompany=company.company_address,
        CompanyNIT=company.company_nit,
        CompanyNITDV=company.company_nit_dv,
        CompanyCertificate=certificate_path
    )

    database.add(new_company)
    database.flush()

    return new_company