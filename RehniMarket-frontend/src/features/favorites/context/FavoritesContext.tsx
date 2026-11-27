/** Contrato del contexto de favoritos del comprador en sesión. */
import { createContext } from "react";

import type { Favorite } from "../types/response";

export interface FavoritesContextType {
  /** Favoritos con los datos del producto: los muestran el desplegable del navbar y la página de favoritos. */
  favorites: Favorite[];
  favoriteIds: Set<string>;
  loading: boolean;
  failed: boolean;

  isFavorite(productId: string): boolean;
  toggleFavorite(productId: string): Promise<void>;
  refreshFavorites(): Promise<void>;
}

export const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);
