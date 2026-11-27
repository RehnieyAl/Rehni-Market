/** Acceso al contexto de favoritos; falla si se usa fuera de FavoritesProvider. */
import { useContext } from "react";
import { FavoritesContext } from "./FavoritesContext";

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites debe utilizarse dentro de FavoritesProvider");
  }

  return context;
}
