"""Pruebas del seguimiento de empresas: seguir/dejar de seguir, idempotencia, contador, roles,
empresa no disponible, concurrencia, persistencia en PostgreSQL y la migración b5d7f9a1c3e6."""

import importlib.util
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.models.ModelCompanyFollower import CompanyFollower
from app.services.authentication.JWTService import create_access_token
from app.services.commerce.CompanyFollowService import follow_company_service
from tests.conftest import auth
from tests.factories import make_company, make_user

MIGRATION = Path(__file__).resolve().parents[1] / "alembic/versions/b5d7f9a1c3e6_company_followers.py"


def follows_url(company_id) -> str:
    return f"/company-follows/{company_id}"


def followers_url(company_id) -> str:
    return f"/public/company/{company_id}/followers"


def rows(db, company_id) -> int:
    db.expire_all()
    return db.query(CompanyFollower).filter(CompanyFollower.company_id == company_id).count()


class TestFollowFlow:
    def test_follow_returns_state_and_persists(self, client, tokens, users, company, db):
        response = client.post(follows_url(company.id), headers=auth(tokens["user"]))

        assert response.status_code == 200
        assert response.json() == {
            "company_id": str(company.id),
            "followers_count": 1,
            "is_following": True,
        }
        stored = db.query(CompanyFollower).one()
        assert stored.user_id == users["user"].id
        assert stored.company_id == company.id
        assert stored.created_at is not None

    def test_unfollow_removes_the_row(self, client, tokens, company, db):
        client.post(follows_url(company.id), headers=auth(tokens["user"]))

        response = client.delete(follows_url(company.id), headers=auth(tokens["user"]))

        assert response.status_code == 200
        assert response.json()["is_following"] is False
        assert response.json()["followers_count"] == 0
        assert rows(db, company.id) == 0

    def test_status_reflects_database(self, client, tokens, company):
        before = client.get(follows_url(company.id), headers=auth(tokens["user"])).json()
        client.post(follows_url(company.id), headers=auth(tokens["user"]))
        after = client.get(follows_url(company.id), headers=auth(tokens["user"])).json()

        assert before["is_following"] is False
        assert after == {"company_id": str(company.id), "followers_count": 1, "is_following": True}


class TestIdempotency:
    def test_following_twice_keeps_a_single_row(self, client, tokens, company, db):
        first = client.post(follows_url(company.id), headers=auth(tokens["user"]))
        second = client.post(follows_url(company.id), headers=auth(tokens["user"]))

        assert first.status_code == second.status_code == 200
        assert second.json() == first.json()
        assert rows(db, company.id) == 1

    def test_unfollow_without_following_is_a_noop(self, client, tokens, company):
        response = client.delete(follows_url(company.id), headers=auth(tokens["user"]))

        assert response.status_code == 200
        assert response.json()["followers_count"] == 0

    def test_unique_constraint_rejects_duplicates_at_database_level(self, db, users, company):
        db.add(CompanyFollower(user_id=users["user"].id, company_id=company.id))
        db.commit()
        db.add(CompanyFollower(user_id=users["user"].id, company_id=company.id))

        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()


class TestCounter:
    def test_public_counter_counts_every_buyer(self, client, tokens, company, db):
        _, other_token = make_user(db, "user", "otro@test.local", tell="3000000011")
        client.post(follows_url(company.id), headers=auth(tokens["user"]))
        client.post(follows_url(company.id), headers=auth(other_token))

        public = client.get(followers_url(company.id))

        assert public.status_code == 200
        assert public.json() == {"company_id": str(company.id), "followers_count": 2}

    def test_counter_drops_after_unfollow(self, client, tokens, company, db):
        _, other_token = make_user(db, "user", "otro@test.local", tell="3000000011")
        client.post(follows_url(company.id), headers=auth(tokens["user"]))
        client.post(follows_url(company.id), headers=auth(other_token))
        client.delete(follows_url(company.id), headers=auth(other_token))

        assert client.get(followers_url(company.id)).json()["followers_count"] == 1

    def test_public_counter_needs_no_token_and_exposes_no_followers(self, client, tokens, company):
        client.post(follows_url(company.id), headers=auth(tokens["user"]))

        body = client.get(followers_url(company.id)).json()

        assert set(body) == {"company_id", "followers_count"}


class TestUnavailableCompany:
    def test_unknown_company_returns_404(self, client, tokens):
        missing = uuid.uuid4()

        for response in (
            client.post(follows_url(missing), headers=auth(tokens["user"])),
            client.get(follows_url(missing), headers=auth(tokens["user"])),
            client.delete(follows_url(missing), headers=auth(tokens["user"])),
            client.get(followers_url(missing)),
        ):
            assert response.status_code == 404
            assert response.json()["detail"]["code"] == "COMPANY_NOT_FOUND"

    def test_suspended_company_cannot_be_followed(self, client, tokens, company, db):
        company.CompanyStatus = False
        db.commit()

        response = client.post(follows_url(company.id), headers=auth(tokens["user"]))

        assert response.status_code == 404
        assert rows(db, company.id) == 0
        assert client.get(followers_url(company.id)).status_code == 404

    def test_invalid_company_id_is_rejected(self, client, tokens):
        response = client.post(follows_url("no-es-uuid"), headers=auth(tokens["user"]))

        assert response.status_code == 422


class TestAuthentication:
    def test_missing_token(self, client, company):
        assert client.post(follows_url(company.id)).status_code == 401

    def test_invalid_token(self, client, company):
        response = client.post(follows_url(company.id), headers=auth("token.invalido"))

        assert response.status_code == 401
        assert response.json()["detail"]["code"] == "INVALID_TOKEN"

    def test_blocked_buyer_cannot_follow(self, client, tokens, users, company, db):
        users["user"].isActive = False
        db.commit()

        response = client.post(follows_url(company.id), headers=auth(tokens["user"]))

        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "USER_BLOCKED"
        assert rows(db, company.id) == 0


class TestRoles:
    @pytest.mark.parametrize("role", ["admin", "owner", "company"])
    @pytest.mark.parametrize("method", ["get", "post", "delete"])
    def test_non_buyer_roles_are_forbidden(self, client, tokens, company, db, role, method):
        response = getattr(client, method)(follows_url(company.id), headers=auth(tokens[role]))

        assert response.status_code == 403
        assert response.json()["detail"] == {
            "code": "FORBIDDEN",
            "message": "Solo los compradores pueden seguir empresas.",
        }
        assert rows(db, company.id) == 0

    def test_stale_user_claim_does_not_let_a_company_follow(self, client, users, company, db):
        forged = create_access_token(str(users["company"].id), "user")

        assert client.post(follows_url(company.id), headers=auth(forged)).status_code == 403
        assert rows(db, company.id) == 0


class TestIsolation:
    def test_buyers_do_not_see_each_others_state(self, client, tokens, company, db):
        _, other_token = make_user(db, "user", "otro@test.local", tell="3000000011")
        client.post(follows_url(company.id), headers=auth(tokens["user"]))

        other = client.get(follows_url(company.id), headers=auth(other_token)).json()

        assert other["is_following"] is False
        assert other["followers_count"] == 1

    def test_unfollow_only_affects_the_caller(self, client, tokens, company, db):
        _, other_token = make_user(db, "user", "otro@test.local", tell="3000000011")
        client.post(follows_url(company.id), headers=auth(tokens["user"]))
        client.post(follows_url(company.id), headers=auth(other_token))

        client.delete(follows_url(company.id), headers=auth(other_token))

        mine = client.get(follows_url(company.id), headers=auth(tokens["user"])).json()
        assert mine["is_following"] is True

    def test_a_buyer_can_follow_several_companies(self, client, tokens, company, db):
        second_owner, _ = make_user(db, "company", "co2@test.local", tell="3000000012")
        second = make_company(db, second_owner, "Segunda", "900765432")

        client.post(follows_url(company.id), headers=auth(tokens["user"]))
        client.post(follows_url(second.id), headers=auth(tokens["user"]))

        assert rows(db, company.id) == 1
        assert rows(db, second.id) == 1


class TestConcurrency:
    def test_simultaneous_follows_store_one_row(self, engine, db, users, company):
        Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
        user_id, company_id = users["user"].id, company.id

        def follow_once(_):
            session = Session()
            try:
                return follow_company_service(session, user_id, company_id).followers_count
            finally:
                session.close()

        with ThreadPoolExecutor(max_workers=8) as pool:
            counts = list(pool.map(follow_once, range(16)))

        assert set(counts) == {1}
        assert rows(db, company.id) == 1


class TestMigration:
    @pytest.fixture()
    def migration(self):
        spec = importlib.util.spec_from_file_location("company_followers_migration", MIGRATION)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def test_revision_chains_after_single_owner(self, migration):
        assert migration.revision == "b5d7f9a1c3e6"
        assert migration.down_revision == "d7e3f1a9c5b2"

    def test_upgrade_matches_the_model_and_downgrade_reverts(self, engine, db, migration):
        db.close()
        with engine.begin() as connection:
            connection.execute(text("DROP TABLE company_followers"))
            with Operations.context(MigrationContext.configure(connection)):
                migration.upgrade()

        inspector = inspect(engine)
        assert {c["name"] for c in inspector.get_columns("company_followers")} == {
            "id", "user_id", "company_id", "created_at",
        }
        uniques = inspector.get_unique_constraints("company_followers")
        assert {"name": "uq_company_follower_user_company", "column_names": ["user_id", "company_id"]} in [
            {"name": u["name"], "column_names": u["column_names"]} for u in uniques
        ]
        assert "ix_company_followers_company_id" in {
            i["name"] for i in inspector.get_indexes("company_followers")
        }
        assert {fk["options"].get("ondelete") for fk in inspector.get_foreign_keys("company_followers")} == {
            "CASCADE"
        }

        with engine.begin() as connection:
            with Operations.context(MigrationContext.configure(connection)):
                migration.downgrade()

        assert "company_followers" not in inspect(engine).get_table_names()

        with engine.begin() as connection:
            CompanyFollower.__table__.create(connection)
