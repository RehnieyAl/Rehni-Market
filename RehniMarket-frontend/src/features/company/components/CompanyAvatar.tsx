/** Logo de empresa con la plantilla por defecto si no existe o no carga; lo comparten panel y perfil público. */
import { useState } from "react";

import defaultLogo from "@/assets/logo-default.png";
import { cn } from "@/shared/utils/cn";

interface CompanyAvatarProps {
  src?: string | null;
  name: string;
  /** `square`: tarjeta redondeada (perfil público); `circle`: anillo rojo (panel). */
  shape?: "square" | "circle";
  className?: string;
}

const SHAPES = {
  square: "rounded-card border-4 border-surface-1",
  circle: "rounded-full border-2 border-secondary/80 p-1",
};

export default function CompanyAvatar({ src, name, shape = "square", className }: CompanyAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const usable = src && src !== failedSrc ? src : null;

  return (
    <div className={cn("shrink-0 overflow-hidden bg-surface-2 shadow-pop", SHAPES[shape], className)}>
      <img
        src={usable ?? defaultLogo}
        alt={`Logo de ${name}`}
        width={144}
        height={144}
        onError={() => usable && setFailedSrc(usable)}
        className={cn("h-full w-full object-cover", shape === "circle" && "rounded-full")}
      />
    </div>
  );
}
