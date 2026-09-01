export type CategorySort = "popular" | "products" | "az" | "za";

export const CATEGORY_SORT_OPTIONS: { value: CategorySort; label: string }[] = [
  { value: "popular", label: "Más populares" },
  { value: "products", label: "Más productos" },
  { value: "az", label: "Nombre A-Z" },
  { value: "za", label: "Nombre Z-A" },
];
