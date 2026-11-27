from fastapi import APIRouter
from starlette.responses import JSONResponse
from app.utils.TestDatabase import db_test
from app.utils.CheckNetwork import check_internet_connection

router = APIRouter(
    prefix=("/health"),
    tags=["health"]
)

@router.get("/database")
def healthDatabase():
    result = db_test()

    # El healthcheck de Docker solo mira el código HTTP: con la BD caída debe ser 503, no 200.
    if result.get("Base de datos") != "OK":
        return JSONResponse(status_code=503, content=result)

    return result

@router.get("/internet")
def healthInternet():
    if check_internet_connection():
        return {"message": "Conexión a Internet exitosa"}
    else:
        return {"message": "No se pudo establecer conexión a Internet"}