import { useLocalSearchParams } from "expo-router";

import { PlaceholderScreen } from "@/components/PlaceholderScreen";

// RUTA MÍNIMA - el listado real filtrado por categoría/búsqueda (con
// filtros, orden, paginación) es su propia fase. Existe solo para que
// CategoryCard y "Ver todos" tengan a dónde navegar desde Home.
export default function ProductsRoute() {
  const { catalogName } = useLocalSearchParams<{ catalogId?: string; catalogName?: string }>();

  return (
    <PlaceholderScreen
      icon="pricetags-outline"
      title="Productos"
      description={
        catalogName
          ? `Productos de "${catalogName}" - próxima fase.`
          : "Listado de productos - próxima fase."
      }
    />
  );
}
