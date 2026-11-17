"""Un único owner (#54): garantía en la base de datos (índice y triggers) y 403 en la API."""
import threading
import time

import pytest
from sqlalchemy import func, text
from sqlalchemy.exc import DBAPIError, IntegrityError

from app.database.single_owner import OWNER_INDEX_NAME
from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.utils.Security import hash_password
from tests.conftest import auth

CLAVE = "Clave-Segura1"
UPDATE_URL = "/admin/dashboard/user/update-information/{user_id}"
STATUS_URL = "/admin/dashboard/user/update-information/status/{user_id}"


def _role_id(db, name):
    return db.query(Role).filter(Role.name == name).one().id


def _new_user(db, email, role="user"):
    user = Users(
        fullName="Cuenta de prueba",
        email=email,
        hashed_password=hash_password(CLAVE),
        tell="3000000000",
        verified=True,
        role_id=_role_id(db, role),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _owner_count(db):
    db.expire_all()
    return db.query(func.count(Users.id)).join(Role).filter(Role.name == "owner").scalar()


class TestDatabaseGuarantee:

    def test_second_owner_is_rejected_by_the_unique_index(self, db):
        _new_user(db, "owner1@rehni.co", "owner")

        with pytest.raises(IntegrityError) as error:
            _new_user(db, "owner2@rehni.co", "owner")
        db.rollback()

        assert OWNER_INDEX_NAME in str(error.value)
        assert _owner_count(db) == 1

    def test_promoting_a_user_with_sql_is_rejected(self, db):
        _new_user(db, "owner1@rehni.co", "owner")
        user = _new_user(db, "buyer@rehni.co")

        with pytest.raises(IntegrityError):
            db.execute(
                text("UPDATE users SET role_id = :role WHERE id = :id"),
                {"role": _role_id(db, "owner"), "id": user.id},
            )
        db.rollback()

        assert _owner_count(db) == 1

    def test_is_owner_follows_the_role_name(self, db):
        user = _new_user(db, "buyer@rehni.co")
        assert user.is_owner is False

        user.role_id = _role_id(db, "owner")
        db.commit()
        db.refresh(user)
        assert user.is_owner is True

        user.role_id = _role_id(db, "admin")
        db.commit()
        db.refresh(user)
        assert user.is_owner is False

    def test_manual_update_of_is_owner_is_ignored(self, db):
        owner = _new_user(db, "owner1@rehni.co", "owner")

        db.execute(text("UPDATE users SET is_owner = false WHERE id = :id"), {"id": owner.id})
        db.commit()
        db.refresh(owner)

        assert owner.is_owner is True

    def test_orm_cannot_write_is_owner(self, db):
        user = _new_user(db, "buyer@rehni.co")

        with pytest.raises(AttributeError):
            user.is_owner = True

    @pytest.mark.parametrize(
        "statement",
        [
            "DELETE FROM roles WHERE name = 'owner'",
            "UPDATE roles SET name = 'propietario' WHERE name = 'owner'",
            "UPDATE roles SET name = 'owner' WHERE name = 'admin'",
        ],
    )
    def test_owner_role_cannot_be_deleted_or_renamed(self, db, statement):
        with pytest.raises(DBAPIError):
            db.execute(text(statement))
        db.rollback()

        assert db.query(Role).filter(Role.name == "owner").count() == 1
        assert db.query(Role).filter(Role.name == "admin").count() == 1

    def test_two_simultaneous_transactions_cannot_create_two_owners(self, db, engine):
        owner_role = _role_id(db, "owner")
        insert = text(
            "INSERT INTO users (id, \"fullName\", email, hashed_password, tell, verified, \"isActive\", "
            "created_at, role_id) VALUES (gen_random_uuid(), 'Owner', :email, 'x', '3000000000', true, "
            "true, now(), :role)"
        )
        first = engine.connect()
        second = engine.connect()
        outcome = {}

        def second_transaction():
            try:
                with second.begin():
                    second.execute(insert, {"email": "owner2@rehni.co", "role": owner_role})
                outcome["error"] = None
            except IntegrityError as exc:
                outcome["error"] = exc

        try:
            transaction = first.begin()
            first.execute(insert, {"email": "owner1@rehni.co", "role": owner_role})

            worker = threading.Thread(target=second_transaction)
            worker.start()
            time.sleep(0.5)
            assert worker.is_alive(), "la segunda transacción debía esperar a la primera"

            transaction.commit()
            worker.join(timeout=10)
        finally:
            first.close()
            second.close()

        assert isinstance(outcome.get("error"), IntegrityError)
        assert _owner_count(db) == 1


class TestApiNeverAssignsOwner:

    @pytest.mark.parametrize("acting", ["owner", "admin"])
    def test_owner_role_cannot_be_assigned(self, client, tokens, users, db, acting):
        response = client.patch(
            UPDATE_URL.format(user_id=users["user"].id),
            json={"role": "owner"},
            headers=auth(tokens[acting]),
        )

        assert response.status_code == 403
        assert _owner_count(db) == 1

    def test_owner_account_cannot_be_edited(self, client, tokens, users):
        response = client.patch(
            UPDATE_URL.format(user_id=users["owner"].id),
            json={"role": "admin"},
            headers=auth(tokens["admin"]),
        )

        assert response.status_code == 403

    def test_owner_account_cannot_be_blocked(self, client, tokens, users, db):
        response = client.patch(
            STATUS_URL.format(user_id=users["owner"].id),
            headers=auth(tokens["admin"]),
        )

        db.refresh(users["owner"])
        assert response.status_code == 403
        assert users["owner"].isActive is True

    def test_owner_still_changes_other_roles(self, client, tokens, users, db):
        response = client.patch(
            UPDATE_URL.format(user_id=users["user"].id),
            json={"role": "admin"},
            headers=auth(tokens["owner"]),
        )

        assert response.status_code == 200
        assert response.json()["role"] == "admin"
