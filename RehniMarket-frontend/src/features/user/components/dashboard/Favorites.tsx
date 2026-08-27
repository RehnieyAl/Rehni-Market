import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ImageOff, Trash2 } from "lucide-react";

import ComingSoon from "@/shared/components/dashboard/ComingSoon";
import { getFavorites } from "@/features/favorites/api/favoriteService";
import { useFavorites } from "@/features/favorites/context/useFavorites";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { Favorite } from "@/features/favorites/types/response";

export default function Favorites() {
  const { toggleFavorite } = useFavorites();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error("Error cargando favoritos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadFavorites);
    return () => clearTimeout(timeout);
  }, [loadFavorites]);

  const handleRemove = async (favorite: Favorite) => {
    try {
      setRemovingId(favorite.id);

      // Mismo toggleFavorite que usa el corazón de ProductCard (ver
      // FavoritesProvider.tsx) - no un removeFavorite aparte, para que el
      // estado global se actualice también y cualquier ProductCard de
      // este mismo producto, en otra pantalla, deje de verse marcada sin
      // necesitar recargar.
      await toggleFavorite(favorite.product.id);

      setFavorites((prev) => prev.filter((f) => f.id !== favorite.id));
    } catch (error) {
      console.error("Error eliminando favorito:", error);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Favoritos</h1>

      <p className="mt-2 text-gray-500">
        Productos que guardaste para más tarde.
      </p>

      {loading ? (
        <p className="mt-8 text-gray-500">Cargando favoritos...</p>
      ) : favorites.length === 0 ? (
        <ComingSoon
          icon={<Heart className="h-10 w-10 text-red-700" />}
          title="Aún no tienes productos favoritos."
          action={{ label: "Explorar productos", to: "/products" }}
        />
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="overflow-hidden rounded-2xl border bg-white"
            >
              <Link to={`/products/${favorite.product.id}`} className="block">
                {favorite.product.image ? (
                  <img
                    src={favorite.product.image}
                    alt={favorite.product.name}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-gray-100 text-gray-300">
                    <ImageOff size={32} />
                  </div>
                )}
              </Link>

              <div className="p-4">
                <p className="text-xs text-gray-500">{favorite.product.companyName}</p>

                <Link
                  to={`/products/${favorite.product.id}`}
                  className="line-clamp-1 font-semibold text-gray-900 hover:underline"
                >
                  {favorite.product.name}
                </Link>

                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-[#6D0F2D]">
                    {formatPrice(favorite.product.finalPrice)}
                  </span>

                  <button
                    onClick={() => handleRemove(favorite)}
                    disabled={removingId === favorite.id}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    title="Quitar de favoritos"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {!favorite.product.isActive && (
                  <p className="mt-2 text-xs text-yellow-600">
                    Este producto ya no está disponible.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
