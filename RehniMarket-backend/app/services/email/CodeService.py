from datetime import datetime, timedelta
from enum import Enum
import random
import uuid

from sqlalchemy.orm import Session

from app.models.ModelCode import TypeCode

from app.repository.CodeRepository import (
    create_code,
    get_code,
    delete_code,
    delete_user_codes
)

from app.services.email.template.EmailForgotPassword import EmailForgotPassword
from app.services.email.template.EmailRegisterUser import EmailRegisterUser
from app.services.email.template.EmailRegisterCompany import EmailRegisterCompany


CODE_LENGTH = 6
CODE_EXPIRATION_MINUTES = 15


class VerifyCodeStatus(str, Enum):
    VALID = "VALID"
    INVALID = "INVALID"
    EXPIRED = "EXPIRED"



def generate_code(length: int = CODE_LENGTH) -> str:

    return "".join(random.choices("0123456789",k=length))



def send_code(email: str,code: str,code_type: TypeCode,role: str = None,company_name: str = None) -> None:


    if code_type == TypeCode.RESET_PASSWORD:
        EmailForgotPassword(email,code,code_type)

    elif code_type == TypeCode.VERIFY_EMAIL:
        if role == "company":
            EmailRegisterCompany(email,company_name,code)
        else:
            EmailRegisterUser(email,code,code_type)


def create_code_service(database: Session,user_id: uuid.UUID,code_type: TypeCode):

    delete_user_codes(database,user_id,code_type)

    code = generate_code()

    new_code = create_code(
        database,
        user_id,
        code,
        code_type,
        datetime.utcnow() + timedelta(
            minutes=CODE_EXPIRATION_MINUTES
        )
    )

    return new_code



def create_code_and_send_service(database: Session,user_id: uuid.UUID,email: str,code_type: TypeCode,role: str = None,company_name: str = None):

    
    new_code = create_code_service( database,user_id,code_type)

    send_code(email,new_code.code,code_type,role,company_name)

    return {
        "message": "Código enviado correctamente."
    }

def verify_code_service(database: Session,user_id: uuid.UUID,code: str,code_type: TypeCode) -> VerifyCodeStatus:

    code_entry = get_code(database,user_id,code_type)

    if not code_entry:
        return VerifyCodeStatus.INVALID
    if code_entry.code != code:
        return VerifyCodeStatus.INVALID

    if code_entry.expires_at <= datetime.utcnow():
        delete_code(database,code_entry)

        return VerifyCodeStatus.EXPIRED

    delete_code(database,code_entry)

    return VerifyCodeStatus.VALID