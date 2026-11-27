/** Logo de un banco del catálogo; si no tiene o no carga, un icono neutro. Lo usan empresa y administración. */
import { useState } from "react";
import { Landmark } from "lucide-react";

import { cn } from "@/shared/utils/cn";

interface BankLogoProps {
  src: string | null | undefined;
  name: string;
  size?: "sm" | "md";
  className?: string;
}

const SIZES = { sm: "h-10 w-10", md: "h-12 w-12" };

export default function BankLogo({ src, name, size = "md", className }: BankLogoProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const usable = src && src !== failedSrc ? src : null;

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-control border border-hairline",
        usable ? "bg-white p-1" : "bg-surface-2 text-ink-muted",
        SIZES[size],
        className,
      )}
    >
      {usable ? (
        <img
          src={usable}
          alt={`Logo de ${name}`}
          width={48}
          height={48}
          loading="lazy"
          onError={() => setFailedSrc(usable)}
          className="h-full w-full object-contain"
        />
      ) : (
        <Landmark size={size === "sm" ? 18 : 22} aria-label={`${name} (sin logo)`} />
      )}
    </span>
  );
}
