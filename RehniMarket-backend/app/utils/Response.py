from starlette.responses import JSONResponse
from app.Config import config

def json_response(status_code: int, detail: str):
    response = JSONResponse(
        status_code=status_code,
        content={"detail": detail},
    )

    response.headers["Access-Control-Allow-Origin"] = config.URL_FRONTEND
    response.headers["Access-Control-Allow-Credentials"] = "true"

    return response