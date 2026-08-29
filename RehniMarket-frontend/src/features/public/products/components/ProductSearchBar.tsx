import { Search, SlidersHorizontal, X } from "lucide-react";

interface ProductSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onOpenFilters?: () => void;
  showFiltersButton?: boolean;
}

export default function ProductSearchBar({
  value,
  onChange,
  onOpenFilters,
  showFiltersButton = true,
}: ProductSearchBarProps) {
  return (
    <div className="flex w-full items-center gap-3">

      <div className="flex h-12 min-w-0 flex-1 items-center rounded-xl border border-gray-200 bg-white px-4 transition focus-within:border-[#6D0F2D] focus-within:ring-2 focus-within:ring-[#6D0F2D]/10">
        <Search
          size={19}
          className="shrink-0 text-gray-400"
          aria-hidden="true"
        />

        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Buscar productos..."
          className="ml-3 min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Limpiar búsqueda"
            className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showFiltersButton && (
        <button
          type="button"
          onClick={onOpenFilters}
          className="flex h-12 shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-[#6D0F2D]/30 hover:bg-gray-50 hover:text-[#6D0F2D]"
        >
          <SlidersHorizontal size={18} />

          <span className="hidden sm:inline">
            Filtros
          </span>
        </button>
      )}
    </div>
  );
}