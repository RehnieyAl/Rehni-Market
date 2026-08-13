from sqlalchemy.orm import Session

from app.models.ModelAdvertisement import Advertisement
from app.schemas.SchemaDashboard.SchemaAdvertisement import AdvertisementResponse
from app.services.NasService import build_media_url


def get_active_advertisements_service(database: Session) -> list[AdvertisementResponse]:
    """
    Anuncios para el Hero del Home publico: solo activos, en orden de
    prioridad (ver ALCANCE > ESTADO / ORDEN DE ANUNCIOS). Reutiliza el
    mismo schema de respuesta que el dashboard admin (AdvertisementResponse)
    - no hay ningun campo admin-only que ocultar.
    """

    advertisements = (
        database.query(Advertisement)
        .filter(Advertisement.is_active.is_(True))
        .order_by(Advertisement.order.asc(), Advertisement.created_at.asc())
        .all()
    )

    return [
        AdvertisementResponse(
            id=advertisement.id,
            title=advertisement.title,
            description=advertisement.description,

            # Desktop/tablet
            image_url=build_media_url(advertisement.image_url),

            # Mobile (nullable - el fallback a image_url lo resuelve el
            # frontend en el Hero)
            mobile_image_url=(
                build_media_url(advertisement.mobile_image_url)
                if advertisement.mobile_image_url
                else None
            ),

            button_text=advertisement.button_text,
            button_link=advertisement.button_link,
            is_active=advertisement.is_active,
            order=advertisement.order,
            created_at=advertisement.created_at,
        )
        for advertisement in advertisements
    ]
