from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.ModelCatalog import Catalog, SpecificationTemplate
from app.schemas.SchemaDashboard.SchemaCatalog import (
    CreateSpecificationRequest,
    UpdateSpecificationRequest,
)


def get_specifications_service(
    database: Session,
    catalog_id: UUID,
):

    catalog = database.get(Catalog, catalog_id)

    if not catalog:
        raise HTTPException(
            status_code=404,
            detail="Catálogo no encontrado."
        )

    return (
        database.query(SpecificationTemplate)
        .filter(SpecificationTemplate.catalog_id == catalog_id)
        .order_by(SpecificationTemplate.name.asc())
        .all()
    )


def create_specification_service(
    database: Session,
    catalog_id: UUID,
    data: CreateSpecificationRequest,
):

    catalog = database.get(Catalog, catalog_id)

    if not catalog:
        raise HTTPException(
            status_code=404,
            detail="Catálogo no encontrado."
        )

    exists = (
        database.query(SpecificationTemplate)
        .filter(
            SpecificationTemplate.catalog_id == catalog_id,
            SpecificationTemplate.name.ilike(data.name),
        )
        .first()
    )

    if exists:
        raise HTTPException(
            status_code=409,
            detail="Ya existe una especificación con ese nombre en este catálogo."
        )

    specification = SpecificationTemplate(
        name=data.name.strip().title(),
        type=data.type.strip(),
        required=data.required,
        catalog_id=catalog_id,
    )

    database.add(specification)
    database.commit()
    database.refresh(specification)

    return specification


def update_specification_service(
    database: Session,
    specification_id: UUID,
    data: UpdateSpecificationRequest,
):

    specification = database.get(SpecificationTemplate, specification_id)

    if not specification:
        raise HTTPException(
            status_code=404,
            detail="Especificación no encontrada."
        )

    exists = (
        database.query(SpecificationTemplate)
        .filter(
            SpecificationTemplate.catalog_id == specification.catalog_id,
            SpecificationTemplate.name.ilike(data.name),
            SpecificationTemplate.id != specification_id,
        )
        .first()
    )

    if exists:
        raise HTTPException(
            status_code=409,
            detail="Ya existe otra especificación con ese nombre en este catálogo."
        )

    specification.name = data.name.strip().title()
    specification.type = data.type.strip()
    specification.required = data.required

    database.commit()
    database.refresh(specification)

    return specification


def delete_specification_service(
    database: Session,
    specification_id: UUID,
):

    specification = database.get(SpecificationTemplate, specification_id)

    if not specification:
        raise HTTPException(
            status_code=404,
            detail="Especificación no encontrada."
        )

    if specification.product_specifications:
        raise HTTPException(
            status_code=409,
            detail="No puedes eliminar una especificación que ya está siendo utilizada por productos."
        )

    database.delete(specification)
    database.commit()

    return {
        "message": "Especificación eliminada correctamente."
    }
