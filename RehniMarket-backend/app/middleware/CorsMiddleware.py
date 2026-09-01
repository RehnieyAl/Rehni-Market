from fastapi.middleware.cors import CORSMiddleware
from app.Config import config


def _allowed_origins() -> list[str]:
    dev_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]
    
    origins: list[str] = []
    if config.URL_FRONTEND:
        origins.append(config.URL_FRONTEND.rstrip("/"))
    origins.extend(dev_origins)

    seen = set()
    unique = [o for o in origins if o and not (o in seen or seen.add(o))]
    return unique or ["*"]


def setup_cors(app):
    origins = _allowed_origins()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=origins != ["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
