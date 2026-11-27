/** Favoritos del comprador: tarjetas de los productos guardados con precio, empresa, disponibilidad y la acción de
 * quitarlos. Usa la misma lista de FavoritesProvider que el desplegable del navbar, así ambos quedan sincronizados. */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ImageOff, Trash2 } from "lucide-react";

import { useFavorites } from "@/features/favorites/context/useFavorites";
import { formatPrice } from "@/shared/utils/formatPrice";
import DashboardPageHeader from "@/shared/components/dashboard/DashboardPageHeader";
import { EmptyState, ErrorState, Skeleton } from "@/shared/components/ui";
import { buttonClasses } from "@/shared/components/ui/buttonVariants";

import type { Favorite } from "@/features/favorites/types/response";

export default function Favorites() {
  const { favorites, loading, failed, toggleFavorite, refreshFavorites } = useFavorites();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (favorite: Favorite) => {
    try {
      setRemovingId(favorite.id);
      await toggleFavorite(favorite.product.id);
    } catch (error) {
      console.error("Error eliminando favorito:", error);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon={<Heart size={26} />}
        title="Favoritos"
        description="Productos que guardaste para más tarde."
      />

      {loading && favorites.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-card border border-hairline bg-surface-1">
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
          title="No pudimos cargar tus favoritos"
          onRetry={() => void refreshFavorites()}
        />
      ) : favorites.length === 0 ? (
        <EmptyState
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="group flex flex-col overflow-hidden rounded-card border border-hairline bg-surface-1 transition hover:border-white/15"
            >
              <Link to={`/products/${favorite.product.id}`} className="block">
                {favorite.product.image ? (
                  <img
                    src={favorite.product.image}
                    alt={favorite.product.name}
                    className="aspect-square w-full bg-surface-0 object-contain p-2"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-surface-0 text-ink-muted">
                    <ImageOff size={32} />
                  </div>
                )}
              </Link>

              <div className="p-4">
                <p className="truncate text-xs text-ink-muted">{favorite.product.companyName}</p>

                <Link
                  to={`/products/${favorite.product.id}`}
                  className="mt-0.5 line-clamp-2 font-semibold text-ink hover:text-secondary"
                >
                  {favorite.product.name}
                </Link>

                <div className="mt-2 flex items-center justify-between">
                  <span className="font-semibold tabular-nums text-ink">
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
