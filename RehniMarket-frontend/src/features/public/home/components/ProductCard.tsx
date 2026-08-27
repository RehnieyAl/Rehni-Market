import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ImageOff, Star } from "lucide-react";

import { formatPrice } from "@/shared/utils/formatPrice";
import { useAuth } from "@/features/public/auth/context/useAuth";
import { useFavorites } from "@/features/favorites/context/useFavorites";
import { useRedirectToLogin } from "@/features/public/auth/hooks/useRedirectToLogin";

import type { PublicProductCard } from "../types/response";

interface ProductCardProps {
  product: PublicProductCard;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { role } = useAuth();
  const redirectToLogin = useRedirectToLogin();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [saving, setSaving] = useState(false);

  // Mismo criterio que canPurchase en ProductDetail.tsx: favoritos es una
  // acción de comprador, así que un visitante sin sesión (role === null)
  // también puede intentarla (y termina en /login conservando esta
  // pantalla) - solo company/admin/owner no ven el botón.
  const canFavorite = role === null || role === "user";
  const isFav = isFavorite(product.id);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (saving) return;

    if (role === null) {
      redirectToLogin();
      return;
    }

    if (role !== "user") return;

    try {
      setSaving(true);
      await toggleFavorite(product.id);
    } catch (error) {
      console.error("Error actualizando favoritos:", error);
    } finally {
      setSaving(false);
    }
  };

  const hasRating = product.review_count > 0 && product.average_rating !== null;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Imagen - alto fijado con padding-bottom porcentual (4:3) en vez de
          aspect-ratio: dentro de un flex-column con flex-basis auto, Chromium
          termina resolviendo aspect-ratio como si fuera cuadrado (ancho =
          alto), ignorando la proporción declarada. El padding porcentual
          (relativo al ancho del propio elemento) no depende de esa
          resolución y es consistente en cualquier contenedor. */}
      <div className="relative w-full shrink-0 bg-white pb-[75%]">
        <div className="absolute inset-0 p-4">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <ImageOff size={32} />
            </div>
          )}
        </div>

        {product.discount_enabled && product.discount_percentage !== null && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-[#B0123E] px-2 py-0.5 text-xs font-bold text-white">
            -{product.discount_percentage}%
          </span>
        )}

        {canFavorite && (
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={saving}
            className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm"
          >
            <Heart
              size={14}
              className={isFav ? "fill-[#6D0F2D] text-[#6D0F2D]" : "text-gray-500"}
            />
          </button>
        )}
      </div>

      {/* Información */}
      <div className="flex flex-1 flex-col px-3.5 pb-3 pt-2.5">
        <p className="text-xs text-gray-500">{product.company_name}</p>

        <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold text-gray-900">
          {product.name}
        </h3>

        {hasRating ? (
          <div className="mt-1 flex items-center gap-1 text-xs">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span className="font-semibold text-gray-900">
              {product.average_rating?.toFixed(1)}
            </span>
            <span className="text-gray-500">({product.review_count})</span>
          </div>
        ) : (
          <p className="mt-1 text-xs text-gray-400">Sin opiniones</p>
        )}

        <div className="mt-1.5 flex-1">
          {product.discount_enabled ? (
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-lg font-bold text-[#6D0F2D]">
                {formatPrice(product.final_price)}
              </span>

              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-[#6D0F2D]">{formatPrice(product.price)}</span>
          )}
        </div>

        <span className="mt-2 flex h-8 items-center justify-center rounded-xl border border-[#6D0F2D] text-xs font-medium text-[#6D0F2D] transition-colors group-hover:bg-[#6D0F2D] group-hover:text-white">
          Ver producto
        </span>
      </div>
    </Link>
  );
}
