# Punto de entrada de la app FastAPI: configura routers y middlewares.
from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
from pydantic import ValidationError
from starlette.responses import JSONResponse
from app.database.Connection import SessionLocal
from app.routers import AuthRouters
from app.routers import HealthRouter
from app.routers import CompanyRouter
from app.routers import CompanyProductArchitectureRouters
from app.routers import mediaRouter
from app.routers import publicRouters
from app.routers import AdminCompanyRouters
from app.routers import AdminUserRouters
from app.routers import AdminDashboardRouters
from app.routers import AdminCatalogAttributeRouters
from app.routers import CartRouter
from app.routers import CheckoutRouter
from app.routers import OrderRouter
from app.routers import FavoriteRouter
from app.routers import AddressRouter
from app.routers import WalletRouter
from app.routers import AdminWalletRouter
from app.routers import ReviewRouter
from app.routers import BankAccountRouter
from app.routers import CompanyPayoutRouter
from app.routers import AdminPayoutRouter
from app.routers import ReportRouter
from app.routers import AdminReportRouter
import app.models
from app.middleware.AuthMiddleware import auth_middleware
from app.middleware.RateLimitMiddleware import rate_limit_middleware
from app.middleware.CorsMiddleware import setup_cors
from app.core.ErrorCodes import ErrorCodes
from app.database.Connection import SessionLocal
from app.services.NasService import ensure_bucket
from app.utils.seed import run_seed
from app.Config import config


@asynccontextmanager
async def lifespan(app):
    # El bucket de MinIO se prepara aquí (en el arranque), no al importar
    # NasService: importar no debe hacer I/O de red.
    ensure_bucket()

    db = SessionLocal()

    if config.RUN_SEED:
        run_seed(db)

    db.close()
    yield


app = FastAPI(lifespan=lifespan)


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


app.middleware("http")(auth_middleware)
#app.middleware("http")(rate_limit_middleware)
setup_cors(app)


app.include_router(AuthRouters.router)
app.include_router(HealthRouter.router)
app.include_router(CompanyRouter.router)
app.include_router(CompanyProductArchitectureRouters.router)
app.include_router(mediaRouter.router)
app.include_router(publicRouters.router)


app.include_router(AdminDashboardRouters.router)
app.include_router(AdminCatalogAttributeRouters.router)
app.include_router(AdminCompanyRouters.router)
app.include_router(AdminUserRouters.router)
app.include_router(AdminWalletRouter.router)
app.include_router(AdminPayoutRouter.router)
app.include_router(AdminReportRouter.router)


app.include_router(CartRouter.router)
app.include_router(CheckoutRouter.router)
app.include_router(OrderRouter.router)
app.include_router(FavoriteRouter.router)
app.include_router(AddressRouter.router)
app.include_router(WalletRouter.router)
app.include_router(ReviewRouter.router)
app.include_router(ReportRouter.router)


app.include_router(BankAccountRouter.router)
app.include_router(CompanyPayoutRouter.router)


