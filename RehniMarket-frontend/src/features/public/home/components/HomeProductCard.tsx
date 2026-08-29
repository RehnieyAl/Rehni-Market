import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ImageOff, ShoppingCart, Star } from "lucide-react";
import axios from "axios";

import { formatPrice } from "@/shared/utils/formatPrice";
import { useAuth } from "@/features/public/auth/context/useAuth";
import { useCart } from "@/features/cart/context/useCart";
import { useFavorites } from "@/features/favorites/context/useFavorites";
import { useRedirectToLogin } from "@/features/public/auth/hooks/useRedirectToLogin";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { PublicProductCard } from "../types/response";

interface HomeProductCardProps {
  product: PublicProductCard;
}

export default function HomeProductCard({ product }: HomeProductCardProps) {
  const { role } = useAuth();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const redirectToLogin = useRedirectToLogin();
  const { showAlert } = useAlert();

  const [savingFavorite, setSavingFavorite] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const isBuyerAction = role === null || role === "user";
  const isFav = isFavorite(product.id);
  const hasRating = product.review_count > 0 && product.average_rating !== null;
  const hasDiscount =
    product.discount_enabled && product.discount_percentage !== null;

  const handleToggleFavorite = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (savingFavorite) return;

    if (role === null) {
      redirectToLogin();
      return;
    }

    if (role !== "user") return;

    try {
      setSavingFavorite(true);
      await toggleFavorite(product.id);
    } catch (error) {
      console.error("Error actualizando favoritos:", error);
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleAddToCart = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (addingToCart) return;

    if (role === null) {
      redirectToLogin();
      return;
    }

    if (role !== "user") return;

    try {
      setAddingToCart(true);
      await addItem(product.id, 1);
      showAlert("success", `"${product.name}" se agregó a tu carrito.`);
    } catch (error) {
      const detail = axios.isAxiosError(error)
        ? error.response?.data?.detail
        : undefined;

      showAlert(
        "error",
        detail?.message ?? "No se pudo agregar el producto al carrito.",
      );
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative w-full shrink-0 bg-white pb-[88%]">
        <div className="absolute inset-0 p-4">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <ImageOff size={32} />
            </div>
          )}
        </div>

        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-lg bg-[#B0123E] px-2 py-0.5 text-[11px] font-bold text-white">
            -{product.discount_percentage}%
          </span>
        )}

        {isBuyerAction && (
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={savingFavorite}
            aria-label={
              isFav ? "Quitar de favoritos" : "Agregar a favoritos"
            }
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm transition hover:text-[#6D0F2D]"
          >
            <Heart
              size={16}
              className={isFav ? "fill-[#6D0F2D] text-[#6D0F2D]" : undefined}
            />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-gray-900">
          {product.name}
        </h3>

        {hasRating && (
          <div className="mt-1.5 flex items-center gap-1 text-xs">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={13}
                  className={
                    index < Math.round(product.average_rating ?? 0)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-gray-200 text-gray-200"
                  }
                />
              ))}
            </div>

            <span className="text-gray-500">({product.review_count})</span>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            {product.discount_enabled ? (
              <>
                <span className="block text-xs text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>

                <span className="text-base font-bold text-[#6D0F2D]">
                  {formatPrice(product.final_price)}
                </span>
              </>
            ) : (
              <span className="text-base font-bold text-[#6D0F2D]">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {isBuyerAction && (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addingToCart}
              aria-label="Agregar al carrito"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6D0F2D] text-white transition hover:bg-[#530A20] disabled:opacity-60"
            >
              <ShoppingCart size={16} />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export function HomeProductCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="w-full bg-gray-100 pb-[88%]" />

      <div className="flex flex-col gap-2 px-4 pb-4 pt-3">
        <div className="h-4 w-4/5 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />

        <div className="mt-2 flex items-end justify-between">
          <div className="h-5 w-1/2 rounded bg-gray-200" />
          <div className="h-9 w-9 rounded-lg bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
