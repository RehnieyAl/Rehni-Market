from collections import defaultdict

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.Config import config
from app.database.Connection import Base, get_db
import app.models
from app.models.ModelCatalog import Catalog
from app.models.ModelCatalogAttribute import CatalogAttribute, CatalogAttributeOption
from app.models.ModelCompany import Company, CompanyCertificateEnum
from app.models.ModelProduct import Product
from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.services.authentication.JWTService import create_access_token
from app.utils.Security import hash_password

_SERVER_URL = config.URL_DATABASE.rsplit("/", 1)[0]
TEST_DB_NAME = "rehnimarket_test"
TEST_DB_URL = f"{_SERVER_URL}/{TEST_DB_NAME}"

ROLE_NAMES = ("user", "company", "admin", "owner")


@pytest.fixture(scope="session")
def engine():
    admin_engine = create_engine(
        f"{_SERVER_URL}/postgres", isolation_level="AUTOCOMMIT"
    )
    with admin_engine.connect() as connection:
        exists = connection.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": TEST_DB_NAME},
        ).scalar()
        if not exists:
            connection.execute(text(f'CREATE DATABASE "{TEST_DB_NAME}"'))
    admin_engine.dispose()

    test_engine = create_engine(TEST_DB_URL)

    with test_engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS unaccent"))
        connection.execute(
            text(
                "CREATE OR REPLACE FUNCTION rehni_search_norm(txt text) "
                "RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT "
                "AS $$ SELECT lower(public.unaccent('public.unaccent', txt)) $$"
            )
        )

    yield test_engine
    test_engine.dispose()


@pytest.fixture()
def db(engine):
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = Session()

    for name in ROLE_NAMES:
        session.add(Role(name=name))
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(engine)


@pytest.fixture()
def users(db):
    result = {}
    for name in ROLE_NAMES:
        role = db.query(Role).filter(Role.name == name).first()
        user = Users(
            fullName=f"{name} test",
            email=f"{name}@test.local",
            hashed_password=hash_password("secret123"),
            tell="3000000000",
            verified=True,
            role_id=role.id,
        )
        db.add(user)
        result[name] = user
    db.commit()
    for user in result.values():
        db.refresh(user)
    return result


@pytest.fixture()
def tokens(users):
    return {
        name: create_access_token(str(user.id), name)
        for name, user in users.items()
    }


@pytest.fixture()
def client(db, engine, monkeypatch):
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    monkeypatch.setattr("app.middleware.AuthMiddleware.SessionLocal", Session)
    monkeypatch.setattr(
        "app.middleware.RateLimitMiddleware.requests", defaultdict(list)
    )

    from app.main import app

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def catalog(db):
    catalog = Catalog(name="Calzado")
    db.add(catalog)
    db.commit()
    db.refresh(catalog)
    return catalog


@pytest.fixture()
def company(db, users):
    company = Company(
        nameCompany="Test Co",
        addressCompany="Calle 1",
        CompanyNIT="900123456",
        CompanyNITDV="7",
        user_id=users["company"].id,
        # APPROVED: es la empresa "en funcionamiento normal" que usa el resto de la
        # suite (productos, variantes, pedidos...). Los tests del flujo de
        # certificación mueven el estado explícitamente con los endpoints de admin.
        CompanyCertificateStatus=CompanyCertificateEnum.APPROVED,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@pytest.fixture()
def product(db, company, catalog):
    product = Product(
        name="Zapato",
        price=100,
        descripcion="desc",
        stock=0,
        company_id=company.id,
        catalog_id=catalog.id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@pytest.fixture()
def buyer_wallet(db, users):
    from app.models.ModelWallet import Wallet

    wallet = Wallet(user_id=users["user"].id, balance=1000000)
    db.add(wallet)
    db.commit()
    db.refresh(wallet)
    return wallet


@pytest.fixture()
def address(db, users):
    from app.models.ModelAddress import Address

    address = Address(
        user_id=users["user"].id,
        label="Casa",
        full_name="Comprador Test",
        country="Colombia",
        department="Antioquia",
        city="Medellín",
        address="Calle 10 # 20-30",
        phone="3001234567",
    )
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@pytest.fixture()
def make_attribute(db):
    def _make(catalog_id, name, role="variant", input_type="select", values=()):
        attribute = CatalogAttribute(
            catalog_id=catalog_id, name=name, role=role, input_type=input_type
        )
        db.add(attribute)
        db.flush()
        options = []
        for position, value in enumerate(values):
            option = CatalogAttributeOption(
                attribute_id=attribute.id, value=value, position=position
            )
            db.add(option)
            options.append(option)
        db.commit()
        db.refresh(attribute)
        return attribute, options

    return _make


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
