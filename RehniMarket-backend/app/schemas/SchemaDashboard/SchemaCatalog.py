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

class CreateSpecificationRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    type: str = Field(default="text", min_length=2, max_length=50)
    required: bool = False

class UpdateSpecificationRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    type: str = Field(default="text", min_length=2, max_length=50)
    required: bool = False

class SpecificationResponse(BaseModel):
    id: UUID
    name: str
    type: str
    required: bool
    catalog_id: UUID
    model_config = {
        "from_attributes": True
    }