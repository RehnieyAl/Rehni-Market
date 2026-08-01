from datetime import datetime, timedelta
from enum import Enum
import random
import uuid

from sqlalchemy.orm import Session

from app.models.ModelCode import Codes, TypeCode
from app.services.email.template.EmailForgotPassword import EmailForgotPassword
from app.services.email.template.EmailVerify import EmailVerify



CODE_LENGTH = 6
CODE_EXPIRATION_MINUTES = 15


class VerifyCodeStatus(str, Enum):
    VALID = "VALID"
    INVALID = "INVALID"
    EXPIRED = "EXPIRED"



def generate_code(length: int = CODE_LENGTH) -> str:
    return "".join(random.choices("0123456789", k=length))



def send_code(email: str,code: str,code_type: TypeCode,):

    if code_type == TypeCode.RESET_PASSWORD:
        EmailForgotPassword(email,code,code_type)

    elif code_type == TypeCode.VERIFY_EMAIL:
        EmailVerify(email,code,code_type)


def create_code(database: Session,user_id: uuid.UUID,code_type: TypeCode,) -> Codes:

    database.query(Codes).filter(Codes.user_id == user_id,Codes.type == code_type).delete()

    code = generate_code()

    new_code = Codes(
        code=code,
        type=code_type,
        user_id=user_id,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow()+ timedelta(minutes=CODE_EXPIRATION_MINUTES)
    )

    database.add(new_code)
    database.commit()
    database.refresh(new_code)

    return new_code


def create_code_and_send_code(database: Session,user_id: uuid.UUID,email: str,code_type: TypeCode,):
    
    new_code = create_code(
        database,
        user_id,
        code_type
    )

    send_code(email,new_code.code,code_type)

    return {
        "message": "Código enviado correctamente."
    }



def verify_code(database: Session,user_id: uuid.UUID,code: str,code_type: TypeCode,) -> VerifyCodeStatus:

    code_entry = database.query(Codes).filter(Codes.user_id == user_id,Codes.type == code_type,).first()

    if not code_entry:
        return VerifyCodeStatus.INVALID

    if code_entry.code != code:
        return VerifyCodeStatus.INVALID

    if code_entry.expires_at <= datetime.utcnow():

        database.delete(code_entry)
        database.commit()

        return VerifyCodeStatus.EXPIRED

    database.delete(code_entry)
    database.commit()

    return VerifyCodeStatus.VALID