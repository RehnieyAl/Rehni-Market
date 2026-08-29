import type { ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

type StatTone = "brand" | "success" | "warning" | "danger" | "info" | "neutral";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  // Color del recuadro del icono. Solo estético; por defecto la marca.
  tone?: StatTone;
  // "md" = KPI destacado; "sm" = celda de una grilla densa de métricas.
  size?: "sm" | "md";
  className?: string;
}

const ICON_TONES: Record<StatTone, string> = {
  brand: "bg-brand-50 text-primary",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  neutral: "bg-gray-100 text-gray-600",
};

// Tarjeta de métrica del panel. Una sola estructura para usuario / empresa / admin / owner.
export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = "brand",
  size = "md",
  className,
}: StatCardProps) {
  const compact = size === "sm";

  return (
    <div
      className={cn(
        "rounded-card border border-gray-200 bg-white shadow-card",
        compact ? "p-4" : "p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "font-medium text-gray-500",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {title}
          </p>

          <h3
            className={cn(
              "mt-1.5 font-bold text-gray-900",
              compact ? "text-2xl" : "mt-2 text-2xl sm:text-3xl",
            )}
          >
            {value}
          </h3>

          {subtitle && (
            <p className={cn("text-gray-500", compact ? "mt-1 text-xs" : "mt-2 text-sm")}>
              {subtitle}
            </p>
          )}
        </div>

        {icon && (
          <div className={cn("shrink-0 rounded-control p-3", ICON_TONES[tone])}>{icon}</div>
        )}
      </div>
    </div>
  );
}
