#Public
from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session
from app.database.Connection import get_db
from app.services.publicService.Products import get_catalogs_service, get_specifications_by_catalog_service
from app.schemas.SchemaPublic import CatalogResponse, SpecificationResponse
from uuid import UUID

router = APIRouter(
    prefix=("/public"),   
    tags=["public"]
)

@router.get("/catalogs", response_model=list[CatalogResponse])
def get_catalogs(database: Session = Depends(get_db)):
    return get_catalogs_service(database)

@router.get("/catalogs/{catalog_id}/specifications",response_model=list[SpecificationResponse],)
def get_catalog_specifications(catalog_id: UUID,database: Session = Depends(get_db),):
    return get_specifications_by_catalog_service(catalog_id,database,)