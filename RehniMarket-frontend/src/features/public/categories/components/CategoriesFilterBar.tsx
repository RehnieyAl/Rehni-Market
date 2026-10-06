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
    <div className="flex flex-col gap-3 rounded-card border border-gray-200 bg-surface-1 p-4 shadow-card sm:flex-row sm:items-center sm:gap-4">
      <Input
        className="flex-1"
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Buscar categoría…"
        aria-label="Buscar categoría"
        leadingIcon={<Search size={16} />}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          className="sm:w-52"
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
          className="sm:w-44"
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
