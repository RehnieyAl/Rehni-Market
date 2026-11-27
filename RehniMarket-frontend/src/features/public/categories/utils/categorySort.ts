/** Órdenes de Explorar categorías; "featured" conserva el orden que define el administrador (display_order). */
export type CategorySort = "featured" | "products" | "az" | "za";

export const CATEGORY_SORT_OPTIONS: { value: CategorySort; label: string }[] = [
  { value: "featured", label: "Destacadas" },
  { value: "products", label: "Más productos" },
  { value: "az", label: "Nombre A-Z" },
  { value: "za", label: "Nombre Z-A" },
];
