/** Tarjeta de sección de los paneles: encabezado con icono, título, descripción y acción opcionales, su
 * contenido y un pie opcional (paginación, totales). Las tablas usan bodyClassName="p-0". */
import { useId, type ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

interface DashboardSectionProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  /** Acción del encabezado, p. ej. "Ver todos". */
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function DashboardSection({
  title,
  description,
  icon,
  action,
  children,
  footer,
  className,
  bodyClassName,
}: DashboardSectionProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex min-w-0 flex-col rounded-card border border-hairline bg-surface-1", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-5">
        <div className="min-w-0">
          <h2 id={headingId} className="flex items-center gap-2 text-base font-semibold text-ink">
            {icon && (
              <span aria-hidden="true" className="text-secondary">
                {icon}
              </span>
            )}
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
        </div>
        {action}
      </div>

      <div className={cn("min-w-0 flex-1 p-4 sm:p-5", bodyClassName)}>{children}</div>

      {footer && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-3 sm:px-5">
          {footer}
        </div>
      )}
    </section>
  );
}
