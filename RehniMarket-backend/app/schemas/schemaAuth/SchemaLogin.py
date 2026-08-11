from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class MeProfileResponse(BaseModel):
    email: str
    name: str
    role: str
