/** Tarjeta de métrica de los paneles: icono con tono, título, cifra destacada y descripción, sobre fondo oscuro. */
import type { ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

type StatTone = "brand" | "success" | "warning" | "danger" | "info" | "neutral";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  tone?: StatTone;
  size?: "sm" | "md";
  className?: string;
}

const ICON_TONES: Record<StatTone, string> = {
  brand: "bg-secondary/15 text-secondary",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  neutral: "bg-surface-3 text-ink-muted",
};

// Resplandor tenue en la esquina con el color del tono (acento moderado, no un fondo de color).

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
        "relative h-full overflow-hidden rounded-card border border-hairline bg-surface-1",
        compact ? "p-4" : "p-5",
        className,
      )}
    >
      <div className="relative flex items-start gap-4">
        {icon && (
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full",
              compact ? "h-10 w-10" : "h-12 w-12",
              ICON_TONES[tone],
            )}
          >
            {icon}
          </div>
        )}

        <div className="min-w-0">
          <p className={cn("font-medium text-ink-muted", compact ? "text-xs" : "text-sm")}>{title}</p>

          <p
            className={cn(
              "font-semibold tabular-nums text-ink",
              compact ? "mt-1 text-2xl" : "mt-1 text-2xl sm:text-3xl",
            )}
          >
            {value}
          </p>

          {subtitle && (
            <p className={cn("text-ink-muted", compact ? "mt-1 text-xs" : "mt-1 text-sm")}>{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
