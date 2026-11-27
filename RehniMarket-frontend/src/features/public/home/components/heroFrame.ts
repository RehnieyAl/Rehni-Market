/** Proporciones del Hero ligadas a las plantillas de anuncio; las usan el Home y la vista previa del admin. */

// Móvil 1080 × 450 (12:5) sin recorte. Desde 640 px la plantilla web 1600 × 300 recorta solo los
// laterales fuera de su zona segura de 1200 px; desde 1024 px ocupa todo el ancho del contenedor
// con su proporción 16:3, y el tope de 256 px solo recorta franjas fuera de la zona segura (264 px de alto).
export const HERO_MOBILE_MEDIA = "(max-width: 639px)";

const WIDE_FRAME = "w-full sm:aspect-[4/1] lg:aspect-[16/3] lg:max-h-[256px]";

export const HERO_FRAME = `aspect-[12/5] ${WIDE_FRAME}`;

// Sin arte móvil en todos los anuncios, la imagen web en 12:5 perdería la mitad del ancho: se mantiene 4:1.
export const HERO_FRAME_WEB_ONLY = `aspect-[4/1] ${WIDE_FRAME}`;

export const HERO_WEB_ASPECT = "aspect-[16/3]";
export const HERO_MOBILE_ASPECT = "aspect-[12/5]";
