from sqlalchemy.orm import Session,selectinload
from sqlalchemy import func

from app.models.ModelUser import Users
from app.models.ModelCompany import Company
from app.models.ModelRole import Role


def get_admin_dashboard_statistics_repository(database: Session,):
    users = (database.query(func.count(Users.id)).scalar()or 0)

    active_users = (database.query(func.count(Users.id)).filter(Users.isActive.is_(True)).scalar()or 0)

    blocked_users = (database.query(func.count(Users.id)).filter(Users.isActive.is_(False)).scalar()or 0)

    blocked_companies = (database.query(func.count(Company.id)).filter(Company.CompanyStatus.is_(False)).scalar()or 0)

    administrators = (database.query(func.count(Users.id)).join(Role, Users.role_id == Role.id).filter(Role.name == "admin").scalar()or 0)

    companies = (database.query(func.count(Company.id)).scalar()or 0)

    active_companies = (database.query(func.count(Company.id)).filter(Company.CompanyStatus.is_(True)).scalar()or 0)


    print("========== ADMIN STATISTICS ==========")
    print("Usuarios:", users)
    print("Usuarios activos:", active_users)
    print("Usuarios bloqueados:", blocked_users)
    print("Administradores:", administrators)
    print("Empresas:", companies)
    print("Empresas activas:", active_companies)
    print("Empresas bloqueadas:", blocked_companies)
    print("======================================")

    return {
        "users": users,
        "companies": companies,
        "active_users": active_users,
        "blocked_users": blocked_users,
        "administrators": administrators,
        "active_companies": active_companies,
        "blocked_companies": blocked_companies
    }



def get_recent_users_repository(
    database: Session,
    limit: int = 4,
):
    users = (
        database.query(Users)
        .options(selectinload(Users.role))
        .order_by(
            Users.created_at.desc(),
            Users.id.desc(),
        )
        .limit(limit)
        .all()
    )

    return users
