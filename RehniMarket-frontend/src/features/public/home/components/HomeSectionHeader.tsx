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
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent/15 text-accent">
            {icon}
          </span>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-ink sm:text-xl">
              {title}
            </h2>
            {badge && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
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
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition hover:text-primary-hover dark:text-accent dark:hover:text-accent-hover"
        >
          <span className="hidden sm:inline">Ver todas</span>
          <span className="sm:hidden">Ver</span>
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
