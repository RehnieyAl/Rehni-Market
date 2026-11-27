/** Paginador compacto de los listados de los paneles: Anterior, "Página X de Y" y Siguiente. `inline`
 * lo reparte a lo ancho para el pie de una sección (texto a la izquierda, botones a la derecha). */
import { Button } from "@/shared/components/ui";
import { cn } from "@/shared/utils/cn";

interface DashboardPagerProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  inline?: boolean;
}

export default function DashboardPager({ page, totalPages, onPageChange, inline = false }: DashboardPagerProps) {
  if (totalPages <= 1) return null;

  const status = (
    <span className="text-sm text-ink-muted">
      Página {page} de {totalPages}
    </span>
  );

  return (
    <nav
      aria-label="Paginación"
      className={cn("flex items-center gap-4", inline ? "w-full justify-between" : "mt-6 justify-center")}
    >
      {inline && status}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          Anterior
        </Button>
        {!inline && status}
        <Button
          variant={inline ? "primary" : "outline"}
          size="sm"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </nav>
  );
}
