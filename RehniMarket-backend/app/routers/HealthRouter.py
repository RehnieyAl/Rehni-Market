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

    # db_test() nunca lanza: ante un fallo de conexión devuelve
    # {"Base de datos": "ERROR", ...} pero esta vista seguía respondiendo
    # HTTP 200 igual. El healthcheck de Docker solo mira el status code, así
    # que con la BD caída el contenedor se reportaba "healthy" de todas
    # formas. Se responde 503 cuando el chequeo reporta error.
    if result.get("Base de datos") != "OK":
        return JSONResponse(status_code=503, content=result)

    return result

@router.get("/internet")
def healthInternet():
    if check_internet_connection():
        return {"message": "Conexión a Internet exitosa"}
    else:
        return {"message": "No se pudo establecer conexión a Internet"}