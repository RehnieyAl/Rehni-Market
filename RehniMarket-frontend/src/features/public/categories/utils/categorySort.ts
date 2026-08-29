// Único lugar que define los ordenamientos de la barra de filtros de
// Categorías - en un
// archivo aparte porque los componentes de la carpeta solo pueden
// exportar componentes (fast refresh, ver react-refresh/only-export-components).
export type CategorySort = "popular" | "products" | "az" | "za";

export const CATEGORY_SORT_OPTIONS: { value: CategorySort; label: string }[] = [
  { value: "popular", label: "Más populares" },
  { value: "products", label: "Más productos" },
  { value: "az", label: "Nombre A-Z" },
  { value: "za", label: "Nombre Z-A" },
];
