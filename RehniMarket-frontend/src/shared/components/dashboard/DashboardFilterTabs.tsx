/** Filtros en píldoras de los paneles (estado de pedidos, devoluciones…): un grupo de botones con el activo
 * marcado por aria-pressed, y contador opcional. */
import { cn } from "@/shared/utils/cn";

interface FilterOption<T extends string> {
  id: T;
  label: string;
  count?: number | string;
}

interface DashboardFilterTabsProps<T extends string> {
  label: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function DashboardFilterTabs<T extends string>({
  label,
  options,
  value,
  onChange,
}: DashboardFilterTabsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
              active
                ? "bg-primary text-white"
                : "border border-hairline bg-surface-1 text-ink-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            {option.label}
            {option.count !== undefined && ` (${option.count})`}
          </button>
        );
      })}
    </div>
  );
}
