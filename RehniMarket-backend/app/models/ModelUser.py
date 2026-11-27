"""Modelo de usuario: credenciales, rol, verificación y la marca is_owner que mantiene la base (#54)."""
from sqlalchemy import DDL, String, Boolean, FetchedValue, ForeignKey, DateTime, Index, event, text
from sqlalchemy.orm import relationship, Mapped, mapped_column, validates
from sqlalchemy.dialects.postgresql import UUID

from app.core.dbconexion import Base

import uuid

from datetime import datetime, timezone


# Garantía de un único owner en PostgreSQL; el mismo SQL que la migración d7e3f1a9c5b2, para que
# create_all (pruebas) cree lo mismo.
# is_owner se recalcula en cada INSERT y UPDATE a partir de roles.name, no de un UUID fijo: si el
# rol owner tuviera otro id, la garantía seguiría valiendo. Un UPDATE manual de is_owner se ignora.
USERS_FUNCTION = """
CREATE OR REPLACE FUNCTION rehni_users_set_is_owner() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.is_owner := EXISTS (SELECT 1 FROM roles WHERE id = NEW.role_id AND name = 'owner');
    RETURN NEW;
END
$$
"""

USERS_TRIGGER = """
CREATE TRIGGER users_set_is_owner
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION rehni_users_set_is_owner()
"""

# El índice, y no un conteo en el trigger, es lo que impide dos owners con transacciones
# simultáneas: la segunda espera a la primera y falla con unique_violation, sin depender del
# nivel de aislamiento.
OWNER_INDEX_NAME = "uq_users_single_owner"

# Sin esto, renombrar otro rol a 'owner' daría varios owners con is_owner = false.
ROLES_FUNCTION = """
CREATE OR REPLACE FUNCTION rehni_roles_protect_owner() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.name = 'owner' THEN
            RAISE EXCEPTION 'El rol owner no se puede borrar.' USING ERRCODE = 'check_violation';
        END IF;
        RETURN OLD;
    END IF;
    IF (OLD.name = 'owner') IS DISTINCT FROM (NEW.name = 'owner') THEN
        RAISE EXCEPTION 'El rol owner no se puede renombrar, ni otro rol puede pasar a llamarse owner.'
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END
$$
"""

ROLES_TRIGGER = """
CREATE TRIGGER roles_protect_owner
BEFORE UPDATE OR DELETE ON roles
FOR EACH ROW EXECUTE FUNCTION rehni_roles_protect_owner()
"""

TRIGGER_STATEMENTS = (USERS_FUNCTION, USERS_TRIGGER, ROLES_FUNCTION, ROLES_TRIGGER)


class Users(Base):

    __tablename__ = "users"
    # Índice único parcial: a lo sumo una fila con is_owner = true.
    __table_args__ = (
        Index(OWNER_INDEX_NAME, "is_owner", unique=True, postgresql_where=text("is_owner")),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    fullName: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    tell: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    profileImagen: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    isActive: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roles.id"),
        nullable=False,
    )

    # Solo lectura: la calcula el trigger users_set_is_owner a partir
    # del rol. El ORM nunca la envía (default y actualización en el servidor) y asignarla falla.
    is_owner: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
        server_onupdate=FetchedValue(),
    )

    role: Mapped["Role"] = relationship(
        "Role",
        back_populates="users",
    )

    company: Mapped["Company | None"] = relationship(
        "Company",
        back_populates="user",
    )

    codes: Mapped[list["Codes"]] = relationship(
        "Codes",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    refresh_token: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    admin_activities: Mapped[list["AdminActivity"]] = relationship(
        "AdminActivity",
        foreign_keys="AdminActivity.admin_id",
        back_populates="admin",
        cascade="all, delete-orphan",
    )

    target_activities: Mapped[list["AdminActivity"]] = relationship(
        "AdminActivity",
        foreign_keys="AdminActivity.target_user_id",
        back_populates="target_user",
    )

    cart: Mapped["Cart | None"] = relationship(
        "Cart",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    orders: Mapped[list["Order"]] = relationship(
        "Order",
        back_populates="user",
    )

    favorites: Mapped[list["Favorite"]] = relationship(
        "Favorite",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    reviews: Mapped[list["Review"]] = relationship(
        "Review",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    addresses: Mapped[list["Address"]] = relationship(
        "Address",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    wallet: Mapped["Wallet | None"] = relationship(
        "Wallet",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    @validates("is_owner")
    def _reject_is_owner_write(self, key, value):
        raise AttributeError("is_owner la calcula la base de datos a partir del rol; asigna role_id.")


# create_all (pruebas) crea los mismos triggers que la migración d7e3f1a9c5b2; roles ya existe
# cuando se crea users por la clave foránea.
for _statement in TRIGGER_STATEMENTS:
    event.listen(Users.__table__, "after_create", DDL(_statement))
