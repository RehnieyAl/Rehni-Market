from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.Config import config

engine = create_engine(
    config.URL_DATABASE,
    pool_size=30,          # 50 conexiones fijas listas para usar
    max_overflow=70,      # Permite expandirse hasta 200 conexiones en el pico más alto
    pool_timeout=5,       # Si k6 espera más de 10s por la BD, falla rápido (evita cuello de botella)
    pool_pre_ping=True,    # Verifica que la conexión no esté rota
    echo=False
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    database = SessionLocal()
    try:
        yield database
    finally:
        database.close()

class Base(DeclarativeBase):
    pass
