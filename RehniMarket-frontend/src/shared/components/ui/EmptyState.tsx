import type { ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  // "card" (borde sólido, sobre fondo blanco) o "plain" (sin card, para dentro de una).
  variant?: "card" | "plain";
}

// Estado vacío / sin resultados / error de carga. Un solo patrón para todo el sitio.
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = "card",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        variant === "card" && "rounded-card border border-gray-200 bg-white shadow-card",
        className,
      )}
    >
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          {icon}
        </div>
      )}

      <p className="text-sm font-semibold text-gray-900">{title}</p>

      {description && (
        <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
