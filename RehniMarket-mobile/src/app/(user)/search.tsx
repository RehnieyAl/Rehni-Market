import { PlaceholderScreen } from "@/components/PlaceholderScreen";

// RUTA MÍNIMA (ver Fase Home > BUSCADOR, "si no existe, crear una ruta
// mínima para poder continuar"). La búsqueda real (input, resultados,
// debounce) es su propia fase.
export default function SearchRoute() {
  return (
    <PlaceholderScreen
      icon="search-outline"
      title="Buscar"
      description="La búsqueda de productos llega en su propia fase."
    />
  );
}
