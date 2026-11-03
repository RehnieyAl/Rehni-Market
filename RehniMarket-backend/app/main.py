import anyio.to_thread
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
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
from app.routers import ShippingCarrierRouter
import app.models
from app.middleware.AuthMiddleware import auth_middleware
from app.middleware.RateLimitMiddleware import rate_limit_middleware
from app.middleware.PublicBaseUrlMiddleware import public_base_url_middleware
from app.middleware.CorsMiddleware import setup_cors
from app.core.ErrorCodes import ErrorCodes
from app.database.Connection import SessionLocal
from app.services.NasService import ensure_bucket
from app.utils.seed import run_seed
from app.Config import config


@asynccontextmanager
async def lifespan(app):
    # Hilos para endpoints síncronos, dependencias y run_in_threadpool.
    # Explícito y acotado: debe ser <= DB_POOL_SIZE + DB_MAX_OVERFLOW (Config.py).
    anyio.to_thread.current_default_thread_limiter().total_tokens = config.THREADPOOL_SIZE

    ensure_bucket()

    if config.RUN_SEED:
        db = SessionLocal()
        try:
            run_seed(db)
        finally:
            db.close()
    yield


app = FastAPI(
    lifespan=lifespan,
    title="RehniMarket API",
    version="2.6.0",
    description="API REST del marketplace RehniMarket",
    docs_url="/docs" if config.DOCS_ENABLED else None,
    redoc_url="/redoc" if config.DOCS_ENABLED else None,
    openapi_url="/openapi.json" if config.DOCS_ENABLED else None,
)


_VALUE_ERROR_PREFIX = "Value error, "


def _validation_message(errors) -> str:
    """Primer error, sin el prefijo que Pydantic antepone a los ValueError
    de nuestros field_validator/model_validator."""
    if not errors:
        return "Datos inválidos."

    message = errors[0]["msg"]

    return message.removeprefix(_VALUE_ERROR_PREFIX)


# ValidationError: modelos construidos a mano (p. ej. as_form en /auth/register-company).
# RequestValidationError: cuerpos JSON, query y path que valida FastAPI.
# Ambos responden con el mismo contrato {code, message} que el resto de la API.
@app.exception_handler(RequestValidationError)
@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(
    request: Request, exc: ValidationError | RequestValidationError
):
    message = _validation_message(exc.errors())

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
app.middleware("http")(public_base_url_middleware)

if config.RATE_LIMIT_ENABLED:
    app.middleware("http")(rate_limit_middleware)

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
app.include_router(ShippingCarrierRouter.router)


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
