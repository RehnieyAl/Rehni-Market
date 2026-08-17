## main.py: Este codigo sirve para iniciar la
#  aplicacion de FastAPI del backend lubix, configurar las rutas y
#  middlewares necesarios,.
from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
from pydantic import ValidationError
from starlette.responses import JSONResponse
from app.database.Connection import SessionLocal
from app.routers import AuthRouters
from app.routers import HealthRouter
from app.routers import CompanyRouter
from app.routers import mediaRouter
from app.routers import publicRouters
from app.routers import AdminCompanyRouters
from app.routers import AdminUserRouters
from app.routers import AdminDashboardRouters
from app.routers import CartRouter
from app.routers import CheckoutRouter
from app.routers import OrderRouter
from app.routers import FavoriteRouter
from app.routers import AddressRouter
from app.routers import WalletRouter
from app.routers import AdminWalletRouter
from app.routers import ReviewRouter
import app.models
from app.middleware.AuthMiddleware import auth_middleware
from app.middleware.RateLimitMiddleware import rate_limit_middleware
from app.middleware.CorsMiddleware import setup_cors
from app.core.ErrorCodes import ErrorCodes
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
# EXCEPTION HANDLERS
# =========================
# Endpoints que construyen su schema manualmente dentro de un
# classmethod as_form(...) (patron ya usado en CreateUserRequest,
# CreateCompanyRequest y UpdateProductRequest) no pasan por la
# validacion automatica de FastAPI para parametros Body/Form - el
# ValidationError de Pydantic lo lanza el propio classmethod, y sin
# este handler quedaba sin capturar (500 "Internal Server Error" en
# vez de un 422 con el mensaje real de que fallo).
@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    errors = exc.errors()
    message = errors[0]["msg"] if errors else "Datos inválidos."

    return JSONResponse(
        status_code=422,
        content={
            "detail": {
                "code": ErrorCodes.VALIDATION_ERROR,
                "message": message,
            }
        },
    )

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
app.include_router(AdminWalletRouter.router)

# =========================
# COMPRAS (carrito / checkout / pedidos / favoritos / direcciones / wallet)
# =========================
app.include_router(CartRouter.router)
app.include_router(CheckoutRouter.router)
app.include_router(OrderRouter.router)
app.include_router(FavoriteRouter.router)
app.include_router(AddressRouter.router)
app.include_router(WalletRouter.router)
app.include_router(ReviewRouter.router)




