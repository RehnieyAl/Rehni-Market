/** Imagen de un anuncio del Hero: elige la variante móvil o web y llena el marco sin deformarla. */
import { HERO_MOBILE_MEDIA } from "./heroFrame";

interface HeroBannerImageProps {
  src: string;
  mobileSrc?: string | null;
  alt?: string;
  priority?: "high" | "low";
}

export default function HeroBannerImage({ src, mobileSrc, alt = "", priority }: HeroBannerImageProps) {
  return (
    <picture>
      {mobileSrc && <source media={HERO_MOBILE_MEDIA} srcSet={mobileSrc} width={1080} height={450} />}
      <img
        src={src}
        alt={alt}
        width={1600}
        height={300}
        decoding="async"
        fetchPriority={priority}
        loading={priority === "low" ? "lazy" : undefined}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
    </picture>
  );
}
