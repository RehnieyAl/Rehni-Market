from pydantic import BaseModel
class ProductStatusRequest(BaseModel):
    is_active: bool
