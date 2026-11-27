/** Encabezado de las secciones de los paneles: icono en recuadro rojo, título y, opcionales, descripción y acción. */
import type { ReactNode } from "react";

interface DashboardPageHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function DashboardPageHeader({ icon, title, description, action }: DashboardPageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 lg:flex-nowrap">
      {/* basis-64: en pantallas estrechas la acción baja a su propia línea en vez de apretar el texto. */}
      <div className={`flex min-w-0 flex-1 basis-64 gap-4 ${description ? "items-start" : "items-center"}`}>
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-secondary/15 text-secondary sm:h-14 sm:w-14"
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-ink-muted sm:text-base">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </header>
  );
}
