from uuid import UUID

from pydantic import BaseModel
class CatalogResponse(BaseModel):
    id: UUID
    name: str

    model_config = {
        "from_attributes": True
    }

class SpecificationResponse(BaseModel):
    id: UUID
    name: str
    type: str
    required: bool

    model_config = {
        "from_attributes": True
    }