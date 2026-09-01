import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ImageOff, Trash2 } from "lucide-react";

import { getFavorites } from "@/features/favorites/api/favoriteService";
import { useFavorites } from "@/features/favorites/context/useFavorites";
import { formatPrice } from "@/shared/utils/formatPrice";
import { EmptyState, ErrorState, Skeleton } from "@/shared/components/ui";
import { buttonClasses } from "@/shared/components/ui/buttonVariants";

import type { Favorite } from "@/features/favorites/types/response";

export default function Favorites() {
  const { toggleFavorite } = useFavorites();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);
      const data = await getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error("Error cargando favoritos:", error);
      setFailed(true);
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
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Favoritos</h1>
      <p className="mt-1 text-sm text-gray-500">Productos que guardaste para más tarde.</p>

      {loading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-card border bg-white">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : failed ? (
        <ErrorState
          className="mt-8"
          title="No pudimos cargar tus favoritos"
          onRetry={loadFavorites}
        />
      ) : favorites.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Heart size={22} />}
          title="Aún no tienes favoritos"
          description="Guarda los productos que te interesan y vuelve a ellos cuando quieras."
          action={
            <Link to="/products" className={buttonClasses({ size: "sm" })}>
              Explorar productos
            </Link>
          }
        />
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="overflow-hidden rounded-card border bg-white"
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
                  <span className="font-bold text-primary">
                    {formatPrice(favorite.product.finalPrice)}
                  </span>

                  <button
                    onClick={() => handleRemove(favorite)}
                    disabled={removingId === favorite.id}
                    className="flex h-9 w-9 items-center justify-center rounded-control text-danger transition hover:bg-danger-bg disabled:opacity-50"
                    title="Quitar de favoritos"
                    aria-label="Quitar de favoritos"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {!favorite.product.isActive && (
                  <p className="mt-2 text-xs text-warning">
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
