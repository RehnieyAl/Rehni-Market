from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.ModelColor import ColorVariant
from app.schemas.SchemaDashboard.SchemaColor import (
    CreateColorRequest,
    UpdateColorRequest,
)


def get_colors_service(database: Session):

    return (
        database.query(ColorVariant)
        .order_by(ColorVariant.name.asc())
        .all()
    )


def create_color_service(
    database: Session,
    data: CreateColorRequest,
):

    exists = (
        database.query(ColorVariant)
        .filter(ColorVariant.name.ilike(data.name.strip()))
        .first()
    )

    if exists:
        raise HTTPException(
            status_code=409,
            detail="El color ya existe."
        )

    color = ColorVariant(
        name=data.name.strip().title(),
        hex_color=data.hex_color.upper(),
    )

    database.add(color)
    database.commit()
    database.refresh(color)

    return color


def update_color_service(
    database: Session,
    color_id: UUID,
    data: UpdateColorRequest,
):

    color = database.get(ColorVariant, color_id)

    if not color:
        raise HTTPException(
            status_code=404,
            detail="Color no encontrado."
        )

    exists = (
        database.query(ColorVariant)
        .filter(
            ColorVariant.name.ilike(data.name.strip()),
            ColorVariant.id != color_id,
        )
        .first()
    )

    if exists:
        raise HTTPException(
            status_code=409,
            detail="Ya existe otro color con ese nombre."
        )

    color.name = data.name.strip().title()
    color.hex_color = data.hex_color.upper()

    database.commit()
    database.refresh(color)

    return color


def delete_color_service(
    database: Session,
    color_id: UUID,
):

    color = database.get(ColorVariant, color_id)

    if not color:
        raise HTTPException(
            status_code=404,
            detail="Color no encontrado."
        )

    if len(color.variants) > 0:
        raise HTTPException(
            status_code=409,
            detail="No puedes eliminar un color que está siendo utilizado por productos."
        )

    database.delete(color)
    database.commit()

    return {
        "message": "Color eliminado correctamente."
    }