from pydantic import BaseModel, EmailStr
class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str

class ChangeEmailRequestOnlyRegistered(BaseModel):
    old_email: EmailStr
    new_email: EmailStr

class ResendVerificationCodeRequest(BaseModel):
    email: EmailStr
