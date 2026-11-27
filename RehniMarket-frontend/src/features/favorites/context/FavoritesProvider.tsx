/** Favoritos del comprador en sesión: una sola lista cargada de la API para el navbar, la página de favoritos y
 * los corazones de las tarjetas. Al cambiar de usuario se recarga y se descartan respuestas del anterior. */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "@/features/public/auth/context/useAuth";

import { getFavorites, addFavorite, removeFavorite } from "../api/favoriteService";
import { FavoritesContext } from "./FavoritesContext";

import type { Favorite } from "../types/response";

interface Props {
  children: ReactNode;
}

export function FavoritesProvider({ children }: Props) {
  const { role, user } = useAuth();
  const identity = user?.email ?? null;

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  // Los corazones cambian al instante; la lista con los datos del producto llega después de la API.
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const requestRef = useRef(0);

  const loadList = useCallback(async (syncIds: boolean) => {
    const request = ++requestRef.current;

    if (role !== "user") {
      setFavorites([]);
      setFavoriteIds(new Set());
      setFailed(false);
      return;
    }

    try {
      setLoading(true);
      setFailed(false);
      const data = await getFavorites();
      if (request !== requestRef.current) return;
      setFavorites(data);
      if (syncIds) setFavoriteIds(new Set(data.map((favorite) => favorite.product.id)));
    } catch (error) {
      console.error("Error cargando favoritos:", error);
      if (request === requestRef.current) setFailed(true);
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, [role]);

  const refreshFavorites = useCallback(() => loadList(true), [loadList]);

  // identity recarga al cambiar de comprador sin cambiar de rol; diferido como el resto de cargas iniciales.
  useEffect(() => {
    const timeout = setTimeout(() => void refreshFavorites());
    return () => clearTimeout(timeout);
  }, [refreshFavorites, identity]);

  const isFavorite = useCallback((productId: string) => favoriteIds.has(productId), [favoriteIds]);

  const toggleFavorite = async (productId: string) => {
    if (favoriteIds.has(productId)) {
      await removeFavorite(productId);
      // Invalida una recarga en curso (de un agregado anterior) que aún traería este favorito.
      requestRef.current++;
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      setFavorites((prev) => prev.filter((favorite) => favorite.product.id !== productId));
      return;
    }

    await addFavorite(productId);
    setFavoriteIds((prev) => new Set(prev).add(productId));
    void loadList(false);
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, favoriteIds, loading, failed, isFavorite, toggleFavorite, refreshFavorites }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
