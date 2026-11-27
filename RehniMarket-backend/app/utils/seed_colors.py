"""Seed de colores para el color principal del producto (tabla color_variants), con la paleta de
CATALOGS; agrega solo los que falten por nombre. No forma parte de los datos base: se ejecuta a mano."""

from sqlalchemy.orm import Session

from app.models.ModelColor import ColorVariant
from app.utils.seed_catalog_data import COLORS


def seed_colors(db: Session):
    existing = {name.lower() for (name,) in db.query(ColorVariant.name)}

    for name, hex_color in COLORS:
        if name.lower() not in existing:
            db.add(ColorVariant(name=name, hex_color=hex_color))

    db.commit()
