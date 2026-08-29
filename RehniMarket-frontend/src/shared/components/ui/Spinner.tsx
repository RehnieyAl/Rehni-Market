import { Loader2 } from "lucide-react";

import { cn } from "@/shared/utils/cn";

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

// Indicador de carga. El giro es feedback esencial, así que se mantiene incluso
// con prefers-reduced-motion (la regla global solo acorta su duración).
export default function Spinner({ size = 18, className, label = "Cargando" }: SpinnerProps) {
  return (
    <Loader2
      size={size}
      role="status"
      aria-label={label}
      className={cn("animate-spin", className)}
    />
  );
}
