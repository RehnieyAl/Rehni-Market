from sqlalchemy.orm import Session

from app.models.ModelCompany import Company
from app.schemas.schemaAuth.SchemaRegister import CreateCompanyRequest


def get_company_by_nit(database: Session,nit: str) -> Company | None:

    return (database.query(Company).filter(Company.CompanyNIT == nit).first())


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