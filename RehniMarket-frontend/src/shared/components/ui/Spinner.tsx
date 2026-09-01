import { Loader2 } from "lucide-react";

import { cn } from "@/shared/utils/cn";

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

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
