"""Seeds de demostración: empresas aprobadas (con su cuenta) y sus productos con variantes e imágenes.
Solo se ejecutan a mano o con RUN_SEED=true, y las cuentas solo si SEED_DEMO_PASSWORD está definida."""

import io
import logging
import struct
import unicodedata
import zlib

from sqlalchemy.orm import Session

from app.Config import config
from app.models.ModelCatalogAttribute import CatalogAttribute, CatalogAttributeOption
from app.models.ModelCompany import Company, CompanyCertificateEnum
from app.models.ModelProduct import Product, ProductImage
from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.models.ModelVariant import ProductVariant
from app.models.ModelVariantImage import ProductVariantImage
from app.models.ModelVariantOption import VariantOption
from app.models.ModelAttributeValue import ProductAttributeValue
from app.schemas.schemaAuth.SchemaRegister import check_password_strength
from app.services.variants.combo_key import build_combo_key
from app.utils.Security import hash_password
from app.utils.seed_catalog_data import get_seed_catalog

logger = logging.getLogger(__name__)

# .example (RFC 2606) está reservado y nunca entrega correo, pero el validador de login lo acepta;
# .test, usado antes, es "special-use" y el login rechazaba a todas las empresas demo.
SEED_EMAIL_DOMAIN = "rehnimarket.example"
LEGACY_SEED_EMAIL_DOMAIN = "rehnimarket.test"

_PALETTE = {
    "Negro": (34, 34, 38), "Blanco": (238, 238, 242), "Gris": (140, 140, 148),
    "Plateado": (198, 198, 203), "Azul": (46, 95, 235), "Rojo": (192, 57, 43),
    "Verde": (39, 174, 96), "Amarillo": (241, 196, 15), "Naranja": (230, 126, 34),
    "Rosa": (232, 67, 147), "Morado": (142, 68, 173),
}
_DEFAULT_RGB = (108, 122, 137)


def _seed_password_hash() -> str | None:
    """Hash de SEED_DEMO_PASSWORD, o None si falta o no cumple la política de contraseñas de la app."""
    password = config.SEED_DEMO_PASSWORD

    if not password:
        return None

    try:
        check_password_strength(password)
    except ValueError as error:
        logger.warning("SEED_DEMO_PASSWORD no cumple la política de contraseñas (%s).", error)
        return None

    return hash_password(password)


def _slug(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    out = "".join(ch.lower() if ch.isalnum() else "-" for ch in normalized)
    return "-".join(part for part in out.split("-") if part)


_BACKGROUND_RGB = (244, 244, 247)
# El borde separa del fondo las muestras claras (Blanco, Plateado).
_BORDER_RGB = (196, 196, 204)


def _circle_span(y: int, center: float, radius: float, size: int) -> tuple[int, int] | None:
    dy = y - center
    if abs(dy) > radius:
        return None
    half = (radius * radius - dy * dy) ** 0.5
    return max(0, int(round(center - half))), min(size, int(round(center + half)) + 1)


def _swatch_png(rgb, size: int = 480) -> bytes:
    """Marcador de demostración: fondo claro con un círculo del color de la variante al centro.
    Un lienzo entero del color se veía como una foto vacía o rota (sobre todo Negro y Blanco)."""

    def _chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    background = bytes(_BACKGROUND_RGB)
    border = bytes(_BORDER_RGB)
    swatch = bytes(rgb)
    center = (size - 1) / 2
    radius = size * 0.32
    ring = max(2, size // 120)
    rows = []

    for y in range(size):
        outer = _circle_span(y, center, radius + ring, size)
        inner = _circle_span(y, center, radius, size)
        row = bytearray(background * size)
        if outer:
            row[outer[0] * 3:outer[1] * 3] = border * (outer[1] - outer[0])
        if inner:
            row[inner[0] * 3:inner[1] * 3] = swatch * (inner[1] - inner[0])
        rows.append(b"\x00" + bytes(row))

    signature = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    idat = zlib.compress(b"".join(rows), 9)
    return signature + _chunk(b"IHDR", ihdr) + _chunk(b"IDAT", idat) + _chunk(b"IEND", b"")


def _ensure_media_object(object_name: str, rgb) -> str:
    """Sube el marcador de color a uploads/<object_name> si aún no existe (no reemplaza objetos
    ya subidos, así una base existente conserva sus imágenes).
    Devuelve la ruta con prefijo de bucket, igual que NasService.upload_file."""

    from app.services.NasService import bucket, client

    try:
        client.stat_object(bucket, object_name)
    except Exception:
        payload = _swatch_png(rgb)
        client.put_object(
            bucket,
            object_name,
            io.BytesIO(payload),
            len(payload),
            content_type="image/png",
        )

    return f"{bucket}/{object_name}"


def _role_attribute(db: Session, catalog_id, name: str, role: str) -> CatalogAttribute | None:
    return (
        db.query(CatalogAttribute)
        .filter(
            CatalogAttribute.catalog_id == catalog_id,
            CatalogAttribute.name == name,
            CatalogAttribute.role == role,
        )
        .first()
    )


def _ensure_product_attr_value(db: Session, product_id, attribute_id, value: str):
    exists = (
        db.query(ProductAttributeValue)
        .filter(
            ProductAttributeValue.product_id == product_id,
            ProductAttributeValue.attribute_id == attribute_id,
        )
        .first()
    )
    if not exists:
        db.add(
            ProductAttributeValue(
                product_id=product_id, attribute_id=attribute_id, value=value
            )
        )


def _ensure_product_image(db: Session, product, object_name: str, rgb, is_main: bool):
    url = f"uploads/{object_name}"
    exists = (
        db.query(ProductImage)
        .filter(ProductImage.product_id == product.id, ProductImage.url == url)
        .first()
    )
    if exists:
        return
    _ensure_media_object(object_name, rgb)
    db.add(ProductImage(product_id=product.id, url=url, is_main=is_main))


def _ensure_variant_image(db: Session, variant, object_name: str, rgb):
    url = f"uploads/{object_name}"
    exists = (
        db.query(ProductVariantImage)
        .filter(
            ProductVariantImage.variant_id == variant.id,
            ProductVariantImage.url == url,
        )
        .first()
    )
    if exists:
        return
    _ensure_media_object(object_name, rgb)
    db.add(ProductVariantImage(variant_id=variant.id, url=url, is_main=True))


def _apply_discount(entity, discount):
    if not discount:
        return
    entity.discount_enable = True
    entity.discount_type = discount["type"]
    entity.discount_value = discount["value"]


def _seed_variant(db: Session, product, axis_attrs: dict, combo: dict):
    option_pairs = []
    for axis_name, attribute in axis_attrs.items():
        value = combo.get(axis_name)
        if value is None:
            return
        option = (
            db.query(CatalogAttributeOption)
            .filter(
                CatalogAttributeOption.attribute_id == attribute.id,
                CatalogAttributeOption.value == value,
            )
            .first()
        )
        if option is None:
            return
        option_pairs.append((attribute.id, option.id))

    combo_key = build_combo_key(option_id for _, option_id in option_pairs)
    name = " / ".join(str(combo[axis]) for axis in axis_attrs)

    variant = (
        db.query(ProductVariant)
        .filter(
            ProductVariant.product_id == product.id,
            ProductVariant.sku == combo["sku"],
        )
        .first()
    )

    if variant is None:
        variant = ProductVariant(
            product_id=product.id,
            name=name,
            sku=combo["sku"],
            price=combo["price"],
            stock=combo["stock"],
            combo_key=combo_key,
        )
        _apply_discount(variant, combo.get("discount"))
        db.add(variant)
        db.flush()

    for attribute_id, option_id in option_pairs:
        linked = (
            db.query(VariantOption)
            .filter(
                VariantOption.variant_id == variant.id,
                VariantOption.attribute_id == attribute_id,
            )
            .first()
        )
        if linked is None:
            db.add(
                VariantOption(
                    variant_id=variant.id,
                    attribute_id=attribute_id,
                    option_id=option_id,
                )
            )

    color = combo.get("Color")
    if color:
        _ensure_variant_image(
            db, variant, f"seed/variants/{variant.sku}.png",
            _PALETTE.get(color, _DEFAULT_RGB),
        )


def _seed_product(db: Session, company, data: dict):
    catalog = get_seed_catalog(db, data["catalog"])
    if not catalog:
        return

    variants_data = data.get("variants")
    has_variants = bool(variants_data)

    product = (
        db.query(Product)
        .filter(Product.company_id == company.id, Product.name == data["name"])
        .first()
    )

    if product is None:
        product = Product(
            company_id=company.id,
            catalog_id=catalog.id,
            name=data["name"],
            descripcion=data["descripcion"],
            price=data["price"],
            stock=data.get("stock", 0),
            has_variants=has_variants,
            applies_tax=data.get("applies_tax", True),
            is_active=True,
        )
        _apply_discount(product, data.get("discount"))
        db.add(product)
        db.flush()
    else:
        product.applies_tax = data.get("applies_tax", True)

    slug = _slug(data["name"])
    _ensure_product_image(db, product, f"seed/products/{slug}-1.png", data.get("image", _DEFAULT_RGB), True)
    _ensure_product_image(db, product, f"seed/products/{slug}-2.png", _DEFAULT_RGB, False)

    for spec_name, spec_value in data["specs"].items():
        attribute = _role_attribute(db, catalog.id, spec_name, "product")
        if attribute is not None:
            _ensure_product_attr_value(db, product.id, attribute.id, str(spec_value))

    if has_variants:
        axis_attrs: dict = {}
        for axis_name in variants_data["axes"]:
            attribute = _role_attribute(db, catalog.id, axis_name, "variant")
            if attribute is not None:
                axis_attrs[axis_name] = attribute

        for combo in variants_data["combos"]:
            _seed_variant(db, product, axis_attrs, combo)

        db.flush()
        live = (
            db.query(ProductVariant)
            .filter(
                ProductVariant.product_id == product.id,
                ProductVariant.deleted_at.is_(None),
            )
            .all()
        )
        if live:
            product.price = min(variant.price for variant in live)
            product.stock = sum(variant.stock for variant in live)

    db.flush()


def _demo_companies():
    from app.utils.seed_products import COMPANIES, build_extra_companies

    return COMPANIES + build_extra_companies()


def _find_demo_user(db: Session, email: str) -> Users | None:
    user = db.query(Users).filter(Users.email == email).first()

    if user is None:
        # Bases sembradas con el dominio anterior: se renombra la cuenta en vez de crear
        # otra, que chocaría con el NIT único de la empresa ya existente.
        legacy_email = email.replace(SEED_EMAIL_DOMAIN, LEGACY_SEED_EMAIL_DOMAIN)
        user = db.query(Users).filter(Users.email == legacy_email).first()
        if user is not None:
            user.email = email

    return user


def _ensure_demo_company(db: Session, company_data: dict, company_role, password_hash: str) -> Company:
    user = _find_demo_user(db, company_data["email"])

    if user is None:
        user = Users(
            fullName=company_data["name"],
            email=company_data["email"],
            hashed_password=password_hash,
            tell="3000000000",
            verified=True,
            isActive=True,
            role_id=company_role.id,
        )
        db.add(user)
        db.flush()

    company = db.query(Company).filter(Company.user_id == user.id).first()

    if company is None:
        company = Company(
            user_id=user.id,
            nameCompany=company_data["name"],
            addressCompany=company_data["address"],
            description=company_data["description"],
            CompanyNIT=company_data["nit"],
            CompanyNITDV=company_data["dv"],
            CompanyStatus=True,
            CompanyCertificateStatus=CompanyCertificateEnum.APPROVED,
        )
        db.add(company)
        db.flush()
    elif (
        company.CompanyCertificateStatus == CompanyCertificateEnum.PENDING
        and not company.CompanyCertificate
    ):
        # Empresas demo sembradas antes en revisión sin certificado: nadie podía revisarlas y
        # el login respondía COMPANY_PENDING. Las que subieron un certificado no se tocan.
        company.CompanyCertificateStatus = CompanyCertificateEnum.APPROVED

    return company


def seed_demo_companies(db: Session):
    company_role = db.query(Role).filter(Role.name == "company").first()

    if not company_role:
        return

    # Una clave fija en el código daría a cualquiera acceso a las empresas demo de una base
    # sembrada por error: sin una clave configurada fuera del repositorio no se crea ninguna.
    password_hash = _seed_password_hash()

    if password_hash is None:
        logger.warning("SEED_DEMO_PASSWORD sin definir o débil: no se crean empresas demo.")
        return

    for company_data in _demo_companies():
        _ensure_demo_company(db, company_data, company_role, password_hash)
        db.commit()


def seed_demo_products(db: Session):
    """Productos de las empresas demo ya creadas; una empresa que no existe se omite."""
    for company_data in _demo_companies():
        user = _find_demo_user(db, company_data["email"])
        company = db.query(Company).filter(Company.user_id == user.id).first() if user else None

        if company is None:
            continue

        for product_data in company_data["products"]:
            _seed_product(db, company, product_data)

        db.commit()
