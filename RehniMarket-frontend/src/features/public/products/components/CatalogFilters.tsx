import { Search, X } from "lucide-react";

import { Input, Select } from "@/shared/components/ui";

import type { PublicCatalog } from "../types/response";

const SORT_OPTIONS = [
  { value: "", label: "Relevancia" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
  { value: "discount", label: "Mayor descuento" },
] as const;

interface CatalogFiltersProps {
  catalogs: PublicCatalog[];
  catalog: string;
  onCatalogChange: (value: string) => void;
  selectedCatalog?: PublicCatalog;

  categorySearch: string;
  onCategorySearchChange: (value: string) => void;

  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;

  discountOnly: boolean;
  inStockOnly: boolean;
  onToggle: (key: "discount" | "inStock", checked: boolean) => void;

  sort: string;
  onSortChange: (value: string) => void;
}

const SECTION_LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400";

export default function CatalogFilters({
  catalogs,
  catalog,
  onCatalogChange,
  selectedCatalog,
  categorySearch,
  onCategorySearchChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  discountOnly,
  inStockOnly,
  onToggle,
  sort,
  onSortChange,
}: CatalogFiltersProps) {
  return (
    <div className="divide-y divide-gray-100">
      <div className="pb-4">
        <Select
          label="Categoría"
          value={catalog}
          onChange={(e) => onCatalogChange(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {catalogs.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name} ({option.product_count})
            </option>
          ))}
        </Select>

        {selectedCatalog && (
          <div className="mt-3">
            <label className={SECTION_LABEL}>
              Buscar en {selectedCatalog.name}
            </label>

            <div className="flex h-11 items-center rounded-control border border-gray-300 bg-surface-1 px-3 transition focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
              <Search size={15} className="shrink-0 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => onCategorySearchChange(e.target.value)}
                placeholder={`Ej. ${selectedCatalog.name}…`}
                className="ml-2 min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
              {categorySearch && (
                <button
                  type="button"
                  onClick={() => onCategorySearchChange("")}
                  aria-label="Limpiar búsqueda"
                  className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="py-4">
        <label className={SECTION_LABEL}>Rango de precio</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            placeholder="Mínimo"
          />
          <span className="shrink-0 text-gray-400">–</span>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            placeholder="Máximo"
          />
        </div>
      </div>

      <div className="space-y-3 py-4">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={discountOnly}
            onChange={(e) => onToggle("discount", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-brand-600"
          />
          Solo con descuento
        </label>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onToggle("inStock", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-brand-600"
          />
          Solo disponibles
        </label>
      </div>

      <div className="pt-4">
        <Select
          label="Ordenar por"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
