import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "@/features/public/auth/context/useAuth";

import { getFavorites, addFavorite, removeFavorite } from "../api/favoriteService";

import { FavoritesContext } from "./FavoritesContext";

interface Props {
  children: ReactNode;
}

export function FavoritesProvider({ children }: Props) {
  const { role, user } = useAuth();
  const identity = user?.email ?? null;

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (role !== "user") {
      setFavoriteIds(new Set());
      return;
    }

    try {
      setLoading(true);
      const favorites = await getFavorites();
      setFavoriteIds(new Set(favorites.map((favorite) => favorite.product.id)));
    } catch (error) {
      console.error("Error cargando favoritos:", error);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    const loadFavorites = async () => {
      if (role !== "user") {
        setFavoriteIds(new Set());
        return;
      }

      try {
        setLoading(true);
        const favorites = await getFavorites();
        setFavoriteIds(new Set(favorites.map((favorite) => favorite.product.id)));
      } catch (error) {
        console.error("Error cargando favoritos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [role, identity]);

  const isFavorite = useCallback((productId: string) => favoriteIds.has(productId), [favoriteIds]);

  const toggleFavorite = async (productId: string) => {
    if (favoriteIds.has(productId)) {
      await removeFavorite(productId);

      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    } else {
      await addFavorite(productId);

      setFavoriteIds((prev) => new Set(prev).add(productId));
    }
  };

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, loading, isFavorite, toggleFavorite, refreshFavorites }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
