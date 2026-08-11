## main.py: Este codigo sirve para iniciar la
#  aplicacion de FastAPI del backend lubix, configurar las rutas y
#  middlewares necesarios,.
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.database.Connection import SessionLocal
from app.routers import AuthRouters
from app.routers import HealthRouter
from app.routers import CompanyRouter
from app.routers import mediaRouter
from app.routers import publicRouters
from app.routers import AdminCompanyRouters
from app.routers import AdminUserRouters
from app.routers import AdminDashboardRouters
import app.models
from app.middleware.AuthMiddleware import auth_middleware
from app.middleware.RateLimitMiddleware import rate_limit_middleware
from app.middleware.CorsMiddleware import setup_cors
from app.database.Connection import SessionLocal
from app.utils.seed import run_seed
from app.Config import config



# =========================
# LIFESPAN
# =========================
@asynccontextmanager
async def lifespan(app):
    db = SessionLocal()

    if config.RUN_SEED:
        run_seed(db)

    db.close()
    yield

# =========================
# APP
# =========================
app = FastAPI(lifespan=lifespan)

# =========================
# MIDDLEWARE
# =========================
app.middleware("http")(auth_middleware)
app.middleware("http")(rate_limit_middleware)
setup_cors(app)

# =========================
# ROUTERS
# =========================
app.include_router(AuthRouters.router)
app.include_router(HealthRouter.router)
app.include_router(CompanyRouter.router)
app.include_router(mediaRouter.router)
app.include_router(publicRouters.router)

# =========================
# AdminRouter
# =========================
app.include_router(AdminDashboardRouters.router)
app.include_router(AdminCompanyRouters.router)
app.include_router(AdminUserRouters.router)




