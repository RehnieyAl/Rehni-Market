from sqlalchemy.orm import Session
from app.models.ModelCatalog import Catalog, SpecificationTemplate
from uuid import UUID

def get_catalogs_service(database: Session):
    catalogs = (database.query(Catalog).order_by(Catalog.name.asc()).all())

    return [{"id": str(catalog.id),"name": catalog.name,}for catalog in catalogs]


def get_specifications_by_catalog_service(catalog_id: UUID,database: Session,):
    
    return (
        database.query(SpecificationTemplate)
        .filter(
            SpecificationTemplate.catalog_id == catalog_id
        )
        .order_by(SpecificationTemplate.name.asc())
        .all()
    )




