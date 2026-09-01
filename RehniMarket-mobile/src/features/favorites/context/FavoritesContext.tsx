import { createContext } from "react";

import type { Favorite } from "@/types/favorite";

export interface FavoritesContextValue {
  favorites: Favorite[];
  favoriteIds: Set<string>;
  loading: boolean;
  count: number;

  isFavorite(productId: string): boolean;
  refresh(): Promise<void>;
  toggleFavorite(productId: string): Promise<void>;
}

export const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);
