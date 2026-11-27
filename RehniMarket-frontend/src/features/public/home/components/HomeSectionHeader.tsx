import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface HomeSectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Icono a la izquierda del título (en un cuadro con acento). */
  icon?: ReactNode;
  /** Texto de un badge junto al título (p. ej. "NUEVO"). */
  badge?: string;
  viewAllHref?: string;
}

export default function HomeSectionHeader({
  title,
  subtitle,
  icon,
  badge,
  viewAllHref,
}: HomeSectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-secondary/15 text-secondary">
            {icon}
          </span>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-ink sm:text-xl">
              {title}
            </h2>
            {badge && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-white">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-ink-muted">{subtitle}</p>
          )}
        </div>
      </div>

      {viewAllHref && (
        <Link
          to={viewAllHref}
          className="flex shrink-0 items-center gap-1 text-sm font-medium brand-link"
        >
          <span className="hidden sm:inline">Ver todas</span>
          <span className="sm:hidden">Ver</span>
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
