from uuid import UUID
from pydantic import BaseModel, Field

class CreateCatalogRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)

class UpdateCatalogRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)

class CatalogResponse(BaseModel):
    id: UUID
    name: str
    model_config = {
        "from_attributes": True
    }