"""Seed de transportadoras con su URL de rastreo; solo siembra si no hay ninguna (datos base)."""

from sqlalchemy.orm import Session

from app.models.ModelShippingCarrier import ShippingCarrier


def seed_shipping_carriers(db: Session):

    if db.query(ShippingCarrier).first():
        return

    carriers = [
        ("Servientrega", "https://www.servientrega.com/wps/portal/rastreo-envio?guia={tracking}"),
        ("Coordinadora", "https://www.coordinadora.com/rastreo/rastreo-de-guia/?guia={tracking}"),
        ("Interrapidísimo", "https://interrapidisimo.com/sigue-tu-envio/?guia={tracking}"),
        ("Envía", "https://envia.co/rastreo?guia={tracking}"),
    ]

    for name, tracking_url in carriers:
        db.add(ShippingCarrier(name=name, tracking_url=tracking_url, is_active=True))

    db.commit()
