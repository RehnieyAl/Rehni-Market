from __future__ import annotations

from app.services.NasService import build_media_url


def _first_image_url(images) -> str | None:
    """Imagen principal de una colección (`is_main`), o la primera si ninguna
    está marcada. Devuelve la URL ya resuelta o None si no hay imágenes."""

    if not images:
        return None

    main = next((image for image in images if image.is_main), None)
    return build_media_url((main or images[0]).url)


def product_display_image_url(product) -> str | None:
    """Fuente única de la imagen inicial / representativa de un producto para
    tarjetas y listados (público y dashboard de empresa).

    Regla:
      1. Primera variante viva (`deleted_at IS NULL`) que tenga imágenes ->
         su imagen principal (o la primera).
      2. Si ninguna variante viva tiene imágenes -> imagen principal del
         producto padre (fallback heredado; nunca colores/legacy).
      3. Si tampoco hay -> None (el front muestra el placeholder de "sin imagen").

    "Primera variante" = orden natural de `product.variants`. La tabla
    `product_variants` no tiene columna de orden/creación, así que se respeta el
    orden en que la relación las entrega, igual que en el resto de la app. El
    detalle público recibe las variantes en ese mismo orden, por lo que la
    tarjeta y el detalle coinciden.
    """

    for variant in product.variants:
        if variant.deleted_at is not None:
            continue

        url = _first_image_url(variant.images)
        if url:
            return url

    return _first_image_url(product.images)
