from sqlalchemy.orm import Session

from app.models.ModelAdvertisement import Advertisement
from app.schemas.SchemaDashboard.SchemaAdvertisement import AdvertisementResponse
from app.services.NasService import build_media_url


def get_active_advertisements_service(database: Session) -> list[AdvertisementResponse]:

    advertisements = (
        database.query(Advertisement)
        .filter(Advertisement.is_active.is_(True))
        .order_by(Advertisement.order.asc(), Advertisement.created_at.asc())
        .all()
    )

    return [
        AdvertisementResponse(
            id=advertisement.id,

            image_url=build_media_url(advertisement.image_url),

            mobile_image_url=(
                build_media_url(advertisement.mobile_image_url)
                if advertisement.mobile_image_url
                else None
            ),

            button_link=advertisement.button_link,
            is_active=advertisement.is_active,
            order=advertisement.order,
            created_at=advertisement.created_at,

            target_type=advertisement.target_type,
            target_product_id=advertisement.target_product_id,
            target_catalog_id=advertisement.target_catalog_id,
            target_company_id=advertisement.target_company_id,
            minimum_discount=advertisement.minimum_discount,
            maximum_stock=advertisement.maximum_stock,
            max_age_days=advertisement.max_age_days,
        )
        for advertisement in advertisements
    ]
