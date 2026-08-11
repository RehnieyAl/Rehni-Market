from pydantic import BaseModel

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    role: str

class RefreshRequest(BaseModel):
    refresh_token: str