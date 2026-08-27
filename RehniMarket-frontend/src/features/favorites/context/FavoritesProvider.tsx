import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "@/features/public/auth/context/useAuth";

import { getFavorites, addFavorite, removeFavorite } from "../api/favoriteService";

import { FavoritesContext } from "./FavoritesContext";

interface Props {
  children: ReactNode;
}

// Diagnóstico (ver ALCANCE > favoritos no persistentes): el backend ya
// guarda/borra correctamente (FavoriteService.py hace commit real) - lo
// que faltaba era que el frontend nunca consultaba GET /favorites al
// cargar, así que ProductCard siempre nacía con un useState(false) propio
// sin importar el estado real. Este provider centraliza esa consulta UNA
// sola vez (mismo patrón que CartProvider.tsx con /cart: solo pide
// GET /favorites cuando hay sesión de comprador) y expone el resultado
// para que cualquier componente (ProductCard, el tab "Favoritos" del
// dashboard) lea y mute el mismo estado - no un useState aislado por
// componente.
//
// Solo se guardan los IDs de producto favoritados (no la lista completa
// con imagen/precio/nombre, ver features/favorites/types/response.ts):
// es lo único que necesita el corazón de ProductCard/ProductDetail para
// saber "¿esto ya es favorito?". La vista "Favoritos" del dashboard sigue
// pidiendo su propia lista completa (ya lo hacía bien, no tenía el bug),
// pero ahora borra a través de este mismo toggleFavorite en vez de llamar
// a removeFavorite por su cuenta, para no tener dos caminos distintos
// mutando el mismo recurso.
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

  // Misma duplicación deliberada que CartProvider.tsx > loadCart: llamar acá
  // directamente a refreshFavorites (referencia externa memoizada con
  // useCallback) dispara react-hooks/set-state-in-effect - una función
  // definida e invocada en el cuerpo del propio efecto sí cumple la regla.
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
