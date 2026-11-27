// Banner de empresa: franja con el mismo marco en el perfil público, la vista previa de "Mi tienda" y
// admin (el recorte que ve la empresa al subirlo es el que ven los demás), o fondo del panel.
import { useState, type ReactNode } from "react";

import defaultBanner from "@/assets/banner-template.png";
import defaultBannerMobile from "@/assets/company-banner-mobile.png";
import { cn } from "@/shared/utils/cn";

/**
 * Franja horizontal compacta (perfil público, vista previa y admin): 5:2 en celulares, 5:1 desde `sm`
 * y 8:1 desde `lg`. Un banner se recorta con object-cover centrado, así que su franja central siempre
 * queda visible.
 */
export const BANNER_FRAME = "aspect-[5/2] sm:aspect-[5/1] lg:aspect-[8/1]";
export const BANNER_SIZE_HINT =
  "Recomendado: 1600 × 420 px (PNG, JPG o WebP). Se muestra como franja: deja textos y logotipos en el centro (zona de 1000 × 200 px).";

interface CompanyBannerProps {
  src?: string | null;
  alt?: string;
  /** Sin imagen: muestra este contenido; si se omite, la plantilla por defecto. */
  placeholder?: ReactNode;
  /** Imagen principal de la página (LCP): se pide con prioridad alta. */
  priority?: boolean;
  /** `cover`: ocupa todo su contenedor (posicionado) como fondo, sin proporción propia. */
  variant?: "strip" | "cover";
  className?: string;
  children?: ReactNode;
}

export default function CompanyBanner({
  src,
  alt = "",
  placeholder,
  priority = false,
  variant = "strip",
  className,
  children,
}: CompanyBannerProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const usable = src && src !== failedSrc ? src : null;
  const showPlaceholder = !usable && placeholder !== undefined;

  return (
    <div
      className={cn(
        "overflow-hidden bg-surface-2",
        variant === "cover" ? "absolute inset-0" : cn("relative w-full", BANNER_FRAME),
        className,
      )}
    >
      {showPlaceholder ? (
        placeholder
      ) : (
        // Un solo <img> con key estable: al llegar la URL personalizada se cambia su src en lugar
        // de remontarlo, y la plantilla móvil (2:1) solo se ofrece cuando no hay banner propio.
        <picture>
          {!usable && <source key="mobile" media="(max-width: 639px)" srcSet={defaultBannerMobile} />}
          <img
            key="banner"
            src={usable ?? defaultBanner}
            alt={alt}
            aria-hidden={alt ? undefined : true}
            fetchPriority={priority ? "high" : undefined}
            width={1600}
            height={420}
            onError={() => usable && setFailedSrc(usable)}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </picture>
      )}
      {children}
    </div>
  );
}
