import { Search } from "lucide-react";

import { CATEGORY_SORT_OPTIONS } from "../utils/categorySort";

import type { CategorySort } from "../utils/categorySort";

interface CategoriesFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryNames: string[];
  selectedName: string;
  onSelectedNameChange: (value: string) => void;
  sort: CategorySort;
  onSortChange: (value: CategorySort) => void;
}

// Barra de filtros sobre el grid (ver ALCANCE > rediseño Categorías):
// buscador por nombre + dropdown de categoría (con los nombres reales que
// devuelve el backend, no una lista fija) + ordenamiento. Todo se aplica
// en el cliente (ver CategoriesGrid.tsx) - son pocas categorías, no hace
// falta un endpoint aparte para esto.
export default function CategoriesFilterBar({
  search,
  onSearchChange,
  categoryNames,
  selectedName,
  onSelectedNameChange,
  sort,
  onSortChange,
}: CategoriesFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="relative flex-1">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar categoría..."
          className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#6D0F2D]"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={selectedName}
          onChange={(e) => onSelectedNameChange(e.target.value)}
          className="rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#6D0F2D] sm:w-44"
        >
          <option value="">Todas</option>
          {categoryNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as CategorySort)}
          className="rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#6D0F2D] sm:w-44"
        >
          {CATEGORY_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
