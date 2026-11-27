"""Empresas demo del seed: correos que pasan la validación real del login y estado aprobado.

Regresión: usaban @rehnimarket.test (dominio "special-use") y el login respondía 422 a todas;
además quedaban en revisión sin certificado (COMPANY_PENDING).
"""

import pytest

from app.models.ModelCompany import Company, CompanyCertificateEnum
from app.models.ModelUser import Users
from app.schemas.schemaAuth.SchemaLogin import LoginRequest
from app.utils import seed_demo
from app.utils.seed_demo import LEGACY_SEED_EMAIL_DOMAIN, SEED_COMPANY_PASSWORD, SEED_EMAIL_DOMAIN
from app.utils.seed_products import COMPANIES, build_extra_companies
from app.utils.Security import hash_password

ALL_COMPANIES = COMPANIES + build_extra_companies()


@pytest.mark.parametrize("company", ALL_COMPANIES, ids=lambda c: c["email"])
def test_seed_company_email_passes_login_validation(company):
    assert company["email"].endswith(f"@{SEED_EMAIL_DOMAIN}")
    LoginRequest(email=company["email"], password=SEED_COMPANY_PASSWORD)


@pytest.fixture()
def seed_only_companies(monkeypatch):
    """Siembra solo la cuenta y la empresa: los productos (con imágenes) no son objeto de la prueba."""

    first = {**ALL_COMPANIES[0], "products": []}
    monkeypatch.setattr(seed_demo, "_demo_companies", lambda: [first])
    return first


def test_new_seed_company_is_approved(db, seed_only_companies):
    seed_demo.seed_demo_companies(db)

    user = db.query(Users).filter(Users.email == seed_only_companies["email"]).one()
    company = db.query(Company).filter(Company.user_id == user.id).one()
    assert company.CompanyCertificateStatus == CompanyCertificateEnum.APPROVED


def test_legacy_seed_company_is_renamed_and_approved_without_duplicates(
    db, users, seed_only_companies
):
    legacy_email = seed_only_companies["email"].replace(SEED_EMAIL_DOMAIN, LEGACY_SEED_EMAIL_DOMAIN)
    company_role_id = users["company"].role_id
    legacy_user = Users(
        fullName="Legado", email=legacy_email, hashed_password=hash_password("x"),
        tell="3000000000", verified=True, role_id=company_role_id,
    )
    db.add(legacy_user)
    db.flush()
    db.add(Company(
        user_id=legacy_user.id, nameCompany="Legado", addressCompany="Calle 1",
        CompanyNIT=seed_only_companies["nit"], CompanyNITDV=seed_only_companies["dv"],
        CompanyCertificateStatus=CompanyCertificateEnum.PENDING,
    ))
    db.commit()

    seed_demo.seed_demo_companies(db)

    db.expire_all()
    assert db.query(Users).filter(Users.email == legacy_email).count() == 0
    renamed = db.query(Users).filter(Users.email == seed_only_companies["email"]).one()
    assert renamed.id == legacy_user.id
    companies = db.query(Company).filter(Company.CompanyNIT == seed_only_companies["nit"]).all()
    assert len(companies) == 1
    assert companies[0].CompanyCertificateStatus == CompanyCertificateEnum.APPROVED


def test_seed_does_not_approve_a_company_that_uploaded_a_certificate(
    db, users, seed_only_companies
):
    user = Users(
        fullName="Con certificado", email=seed_only_companies["email"],
        hashed_password=hash_password("x"), tell="3000000000", verified=True,
        role_id=users["company"].role_id,
    )
    db.add(user)
    db.flush()
    db.add(Company(
        user_id=user.id, nameCompany="Con certificado", addressCompany="Calle 1",
        CompanyNIT=seed_only_companies["nit"], CompanyNITDV=seed_only_companies["dv"],
        CompanyCertificate="certificates/real.pdf",
        CompanyCertificateStatus=CompanyCertificateEnum.PENDING,
    ))
    db.commit()

    seed_demo.seed_demo_companies(db)

    db.expire_all()
    company = db.query(Company).filter(Company.user_id == user.id).one()
    assert company.CompanyCertificateStatus == CompanyCertificateEnum.PENDING
