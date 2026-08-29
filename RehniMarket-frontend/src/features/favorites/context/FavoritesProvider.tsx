import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "@/features/public/auth/context/useAuth";

import { getFavorites, addFavorite, removeFavorite } from "../api/favoriteService";

import { FavoritesContext } from "./FavoritesContext";

interface Props {
  children: ReactNode;
}

// Centraliza GET /favorites una vez (solo con sesión de comprador) y expone los IDs favoritados
// para que ProductCard/ProductDetail/el tab "Favoritos" compartan el mismo estado y el mismo toggle.
export function FavoritesProvider({ children }: Props) {
  const { role } = useAuth();

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

  // Función definida e invocada dentro del efecto para no disparar react-hooks/set-state-in-effect.
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
  }, [role]);

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
