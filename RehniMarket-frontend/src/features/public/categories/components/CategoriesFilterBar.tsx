/** Controles de Explorar categorías: búsqueda por nombre, filtro por categoría y orden. */
import { Search } from "lucide-react";

import { Input, Select } from "@/shared/components/ui";

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
    <div role="search" className="flex flex-col gap-3 md:flex-row md:items-center">
      <Input
        className="min-w-0 flex-1"
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Buscar categoría…"
        aria-label="Buscar categoría"
        leadingIcon={<Search size={16} />}
      />

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:flex">
        <Select
          className="md:w-56"
          aria-label="Filtrar por categoría"
          value={selectedName}
          onChange={(e) => onSelectedNameChange(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categoryNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>

        <Select
          className="md:w-48"
          aria-label="Ordenar categorías"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as CategorySort)}
        >
          {CATEGORY_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
