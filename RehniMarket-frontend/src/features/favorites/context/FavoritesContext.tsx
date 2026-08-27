import { createContext } from "react";

export interface FavoritesContextType {
  favoriteIds: Set<string>;
  loading: boolean;

  isFavorite(productId: string): boolean;
  toggleFavorite(productId: string): Promise<void>;
  refreshFavorites(): Promise<void>;
}

export const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);
