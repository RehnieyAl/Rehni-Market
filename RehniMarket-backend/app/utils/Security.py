# Security.py es un archivo de utilidad que proporciona funciones para
# el manejo seguro de contraseñas. Utiliza la biblioteca passlib para realizar hashing y 
# verificación de contraseñas.

from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def hash_password(password:str) -> str:
    return pwd_context.hash(password[:72])

def verify_password(plain_password:str, hashed_password:str) -> bool:
    return pwd_context.verify(plain_password[:72],hashed_password)