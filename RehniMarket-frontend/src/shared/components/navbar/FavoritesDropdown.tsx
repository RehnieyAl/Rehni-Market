/** Desplegable de favoritos del navbar: productos guardados reales (imagen, nombre y precio) con acceso al detalle,
 * quitar con la lógica de FavoritesProvider y enlace a la página completa de favoritos. */
import { useState } from "react";
import { Heart, X } from "lucide-react";
import { Link } from "react-router-dom";

import { useFavorites } from "@/features/favorites/context/useFavorites";
import ProductThumbnail from "@/shared/components/ProductThumbnail";
import { buttonClasses } from "@/shared/components/ui";
import { formatPrice } from "@/shared/utils/formatPrice";
import NavDropdown from "./NavDropdown";

import type { Favorite } from "@/features/favorites/types/response";

interface FavoritesDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerClassName: string;
}

export default function FavoritesDropdown({ open, onOpenChange, triggerClassName }: FavoritesDropdownProps) {
  const { favorites, favoriteIds, loading, failed, toggleFavorite, refreshFavorites } = useFavorites();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const close = () => onOpenChange(false);
  const count = favoriteIds.size;

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

  let body;
  if (failed && favorites.length === 0) {
    body = (
      <div className="px-4 py-8 text-center text-sm text-ink-muted">
        <p>No pudimos cargar tus favoritos.</p>
        <button type="button" onClick={() => void refreshFavorites()} className="brand-link mt-2 text-sm font-medium">
          Reintentar
        </button>
      </div>
    );
  } else if (loading && favorites.length === 0) {
    body = <p className="px-4 py-8 text-center text-sm text-ink-muted">Cargando favoritos…</p>;
  } else if (favorites.length === 0) {
    body = (
      <div className="px-4 py-8 text-center">
        <p className="text-sm font-medium text-ink">Aún no tienes favoritos</p>
        <p className="mt-1 text-sm text-ink-muted">Guarda productos con el corazón para verlos aquí.</p>
        <Link to="/products" onClick={close} className="brand-link mt-3 inline-block text-sm font-medium">
          Explorar productos
        </Link>
      </div>
    );
  } else {
    body = (
      <ul className="max-h-[min(24rem,60vh)] divide-y divide-hairline overflow-y-auto">
        {favorites.map((favorite) => {
          const { product } = favorite;
          const hasDiscount = product.discountEnabled && product.finalPrice !== product.price;

          return (
            <li key={favorite.id} className="flex items-center gap-3 px-4 py-3">
              <ProductThumbnail src={product.image} />

              <div className="min-w-0 flex-1">
                <Link
                  to={`/products/${product.id}`}
                  onClick={close}
                  className="line-clamp-2 text-sm font-medium text-ink hover:underline"
                >
                  {product.name}
                </Link>
                <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-sm tabular-nums">
                  <span className="font-semibold text-ink">{formatPrice(product.finalPrice)}</span>
                  {hasDiscount && (
                    <span className="text-xs text-ink-muted line-through">
                      <span className="sr-only">Antes </span>
                      {formatPrice(product.price)}
                    </span>
                  )}
                </p>
                {!product.isActive && <p className="text-xs text-warning">Ya no está disponible</p>}
              </div>

              <button
                type="button"
                onClick={() => void handleRemove(favorite)}
                disabled={removingId === favorite.id}
                aria-label={`Quitar ${product.name} de favoritos`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-white/5 hover:text-ink disabled:opacity-50"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <NavDropdown
      id="favorites-menu"
      open={open}
      onOpenChange={onOpenChange}
      triggerLabel="Mis favoritos"
      triggerClassName={triggerClassName}
      trigger={
        <>
          <Heart size={22} aria-hidden="true" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-semibold tabular-nums text-white">
              {count}
            </span>
          )}
        </>
      }
      panelLabel="Favoritos"
      panelClassName="w-[min(24rem,calc(100vw-2rem))]"
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-hairline px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Favoritos</h2>
        {count > 0 && <span className="text-xs tabular-nums text-ink-muted">{count} guardados</span>}
      </div>

      {body}

      {favorites.length > 0 && (
        <div className="border-t border-hairline p-3">
          <Link
            to="/user/dashboard?tab=favorites"
            onClick={close}
            className={buttonClasses({ variant: "outline", size: "sm", className: "w-full" })}
          >
            Ver todos los favoritos
          </Link>
        </div>
      )}
    </NavDropdown>
  );
}
