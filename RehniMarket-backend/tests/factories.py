"""Factories reutilizables para las suites de contrato (Fase 3).

Crean datos por la API cuando el flujo real importa (carrito → checkout) y
directo en la BD cuando solo hace falta el estado de partida.
"""

from datetime import datetime, timezone
from uuid import UUID

from app.models.ModelCompany import Company, CompanyCertificateEnum
from app.models.ModelCompanyBankAccount import BankAccountTypeEnum, CompanyBankAccount
from app.models.ModelOrder import Order, OrderStatusEnum
from app.models.ModelProduct import Product
from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.models.ModelWallet import Wallet
from app.services.authentication.JWTService import create_access_token
from app.utils.NitValidator import calculate_nit_dv
from app.utils.Security import hash_password
from tests.conftest import auth

# Rutas de los correos transaccionales que disparan los flujos de comercio.
COMMERCE_EMAILS = (
    "app.services.commerce.CheckoutService.send_order_created_email",
    "app.services.commerce.OrderService.send_order_status_email",
    "app.services.PayoutService.send_payout_processed_email",
)

VALID_ADDRESS = {
    "label": "Casa",
    "fullName": "Comprador Test",
    "country": "Colombia",
    "department": "Antioquia",
    "city": "Medellín",
    "address": "Calle 10 # 20-30",
    "phone": "3001234567",
}

VALID_BANK_ACCOUNT = {
    "accountHolder": "Test Co SAS",
    "documentNumber": "900123456",
    "bankName": "Bancolombia",
    "accountType": "savings",
    "accountNumber": "12345678901",
}


def silence_emails(monkeypatch, targets=COMMERCE_EMAILS):
    for target in targets:
        monkeypatch.setattr(target, lambda *a, **k: None)


def make_user(db, role: str, email: str, tell: str = "3000000099") -> tuple[Users, str]:
    """Usuario verificado del rol dado y su access token."""
    role_row = db.query(Role).filter(Role.name == role).first()
    user = Users(
        fullName=f"{role} extra",
        email=email,
        hashed_password=hash_password("secret123"),
        tell=tell,
        verified=True,
        role_id=role_row.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, create_access_token(str(user.id), role)


def make_company(db, owner: Users, name: str, nit: str, **fields) -> Company:
    """Empresa APROBADA con un DV calculado (no arbitrario, ver O-01)."""
    company = Company(
        nameCompany=name,
        addressCompany="Calle 9 # 8-7",
        CompanyNIT=nit,
        CompanyNITDV=str(calculate_nit_dv(nit)),
        user_id=owner.id,
        CompanyCertificateStatus=CompanyCertificateEnum.APPROVED,
        **fields,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def make_bank_account(db, company: Company, is_default: bool = True, **overrides) -> CompanyBankAccount:
    data = {
        "account_holder": "Test Co SAS",
        "document_number": company.CompanyNIT,
        "bank_name": "Bancolombia",
        "account_type": BankAccountTypeEnum.SAVINGS,
        "account_number": "12345678901",
        "is_default": is_default,
        **overrides,
    }
    account = CompanyBankAccount(company_id=company.id, **data)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def wallet_of(db, user_id) -> Wallet | None:
    db.expire_all()
    return db.query(Wallet).filter(Wallet.user_id == user_id).first()


def place_order(
    client,
    token: str,
    db,
    product: Product,
    address,
    quantity: int = 2,
    status: OrderStatusEnum | None = None,
    created_at: datetime | None = None,
) -> dict:
    """Pedido real (carrito → checkout); opcionalmente fuerza estado y fecha."""
    if product.stock < quantity:
        db.query(Product).filter(Product.id == product.id).update({"stock": 50})
        db.commit()

    added = client.post(
        "/cart/add",
        json={"productId": str(product.id), "quantity": quantity},
        headers=auth(token),
    )
    assert added.status_code == 200, added.text

    checkout = client.post("/checkout", json={"addressId": str(address.id)}, headers=auth(token))
    assert checkout.status_code == 200, checkout.text

    order = checkout.json()["orders"][0]

    changes = {}
    if status is not None:
        changes["status"] = status
    if created_at is not None:
        changes["created_at"] = created_at
    if changes:
        db.query(Order).filter(Order.id == UUID(order["id"])).update(changes)
        db.commit()
        db.expire_all()

    return order


def utc(year: int, month: int, day: int, hour: int = 12) -> datetime:
    return datetime(year, month, day, hour, tzinfo=timezone.utc)


def valid_png(size: int = 2) -> bytes:
    """PNG mínimo y completo (firma, IHDR, IDAT e IEND) que pasa FileValidator."""
    import struct
    import zlib

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    idat = zlib.compress((b"\x00" + b"\x80\x40\x20" * size) * size)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


def valid_jpeg() -> bytes:
    """JPEG con marcadores SOI/APP0 y EOI: suficiente para la validación por firma y fin."""
    return b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00" + b"\x00" * 64 + b"\xff\xd9"


def valid_webp() -> bytes:
    payload = b"WEBPVP8 " + (10).to_bytes(4, "little") + b"\x00" * 10
    return b"RIFF" + len(payload).to_bytes(4, "little") + payload


def valid_pdf(padding: int = 0) -> bytes:
    return b"%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n" + b"0" * padding + b"\ntrailer << /Root 1 0 R >>\n%%EOF\n"
