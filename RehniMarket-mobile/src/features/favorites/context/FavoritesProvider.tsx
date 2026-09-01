import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { addFavorite, getFavorites, removeFavorite } from "@/api/favoriteService";
import type { Favorite } from "@/types/favorite";

import { FavoritesContext } from "./FavoritesContext";

interface Props {
  children: ReactNode;
}

export function FavoritesProvider({ children }: Props) {
  const { isUser, isLoading: authLoading } = useAuth();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const togglingRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!isUser) {
      setFavorites([]);
      setFavoriteIds(new Set());
      return;
    }

    try {
      setLoading(true);
      const data = await getFavorites();
      setFavorites(data);
      setFavoriteIds(new Set(data.map((favorite) => favorite.product.id)));
    } catch (error) {
      console.error("Error cargando favoritos:", error);
    } finally {
      setLoading(false);
    }
  }, [isUser]);

  useEffect(() => {
    if (authLoading) return;

    if (!isUser) {
      setFavorites([]);
      setFavoriteIds(new Set());
      return;
    }

    refresh();
  }, [authLoading, isUser, refresh]);

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (togglingRef.current.has(productId)) return;
      togglingRef.current.add(productId);

      const wasFavorite = favoriteIds.has(productId);

      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        if (wasFavorite) await removeFavorite(productId);
        else await addFavorite(productId);
        await refresh();
      } catch (error) {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(productId);
          else next.delete(productId);
          return next;
        });
        throw error;
      } finally {
        togglingRef.current.delete(productId);
      }
    },
    [favoriteIds, refresh],
  );

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds],
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteIds,
        loading,
        count: favoriteIds.size,
        isFavorite,
        refresh,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
