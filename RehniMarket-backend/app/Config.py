from dotenv import load_dotenv
import os
load_dotenv()

class config():
    URL_DATABASE = os.getenv("URL_DATABASE")
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
    REFRESH_TOKEN_DAYS = int(os.getenv("REFRESH_TOKEN_DAYS"))
    GMAIL_USERNAME = os.getenv("GMAIL_USERNAME")
    GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
    URL_FRONTEND = os.getenv("URL_FRONTEND")
    MINIO_URL = os.getenv("MINIO_URL")
    MINIO_ROOT_USER = os.getenv("MINIO_ROOT_USER")
    MINIO_ROOT_PASSWORD = os.getenv("MINIO_ROOT_PASSWORD")
    ADMIN_NAME = os.getenv("USER_NAME_ADMIN")
    ADMIN_DEFAULT = os.getenv("ADMIN_DEFAULT")
    PASSWORD_DEFAULT = os.getenv("PASSWORD_DEFAULT")
    OWNER_NAME = os.getenv("USER_NAME_OWNER")
    OWNER_DEFAULT = os.getenv("OWNER_DEFAULT")
    OWNER_PASSWORD_DEFAULT = os.getenv("OWNER_PASSWORD_DEFAULT")
    RUN_SEED = os.getenv("RUN_SEED", "false").lower() == "true"
    URL_BACKEND = os.getenv("URL_BACKEND")
    RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "false").lower() == "true"
    REQUEST_LIMIT = int(os.getenv("REQUEST_LIMIT", "100"))
    TIME_WINDOW = int(os.getenv("TIME_WINDOW", "60"))

config = config()
